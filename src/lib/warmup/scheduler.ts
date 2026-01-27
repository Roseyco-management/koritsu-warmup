// Main warmup scheduler - orchestrates the warmup process

import { supabaseAdmin } from '@/lib/db';
import { sendWarmupEmail, getThreadReferences } from './sender';
import { generateWarmupEmail, generateWarmupReply } from './content';
import { getTodaySentCount } from './stats';
import type { WarmupEmail, WarmupConfig, WarmupThread } from '@/types/database';

interface WarmupCycleResult {
  success: boolean;
  emailsSent: number;
  errors: string[];
}

export async function runWarmupCycle(): Promise<WarmupCycleResult> {
  const errors: string[] = [];
  let emailsSent = 0;

  try {
    // 1. Get active warmup configs
    const { data: configs, error: configError } = await supabaseAdmin
      .from('warmup_config')
      .select('*')
      .eq('is_active', true);

    if (configError) {
      throw new Error(`Failed to fetch configs: ${configError.message}`);
    }

    if (!configs || configs.length === 0) {
      return { success: true, emailsSent: 0, errors: ['No active warmup configs'] };
    }

    // 2. For each domain, check daily limits and send emails
    for (const config of configs) {
      try {
        const todaySent = await getTodaySentCount(config.domain);
        const remaining = config.daily_limit - todaySent;

        if (remaining <= 0) {
          console.log(`Domain ${config.domain} has reached daily limit`);
          continue;
        }

        // Send 1-2 emails per cycle (will run multiple times per day)
        const toSend = Math.min(remaining, Math.random() > 0.5 ? 2 : 1);

        for (let i = 0; i < toSend; i++) {
          const result = await sendSingleWarmupEmail(config);
          if (result.success) {
            emailsSent++;
          } else {
            errors.push(`${config.domain}: ${result.error}`);
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${config.domain}: ${message}`);
      }
    }

    return {
      success: true,
      emailsSent,
      errors,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      emailsSent,
      errors: [message],
    };
  }
}

async function sendSingleWarmupEmail(
  config: WarmupConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    // 3. Get random sender from this domain
    const sender = await getRandomEmail(config.domain);
    if (!sender) {
      return { success: false, error: 'No active emails for domain' };
    }

    // 4. Get random recipient from DIFFERENT domain
    const recipient = await getRandomEmail(undefined, config.domain);
    if (!recipient) {
      return { success: false, error: 'No recipient available' };
    }

    // 5. Decide: new thread or reply to existing
    const existingThread = await getOpenThread(sender.id, recipient.id);

    if (existingThread && Math.random() > 0.3) {
      // 70% chance to reply to existing thread
      return await sendWarmupReplyEmail(existingThread, sender, recipient);
    } else {
      // 30% chance to start new thread
      return await sendNewWarmupThread(sender, recipient);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

async function getRandomEmail(
  domain?: string,
  excludeDomain?: string
): Promise<WarmupEmail | null> {
  let query = supabaseAdmin
    .from('warmup_emails')
    .select('*')
    .eq('is_active', true);

  if (domain) {
    query = query.eq('domain', domain);
  }

  if (excludeDomain) {
    query = query.neq('domain', excludeDomain);
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    return null;
  }

  // Return random email
  return data[Math.floor(Math.random() * data.length)];
}

async function getOpenThread(
  fromEmailId: string,
  toEmailId: string
): Promise<WarmupThread | null> {
  const { data, error } = await supabaseAdmin
    .from('warmup_threads')
    .select('*')
    .eq('status', 'active')
    .or(`from_email_id.eq.${fromEmailId},to_email_id.eq.${fromEmailId}`)
    .or(`from_email_id.eq.${toEmailId},to_email_id.eq.${toEmailId}`)
    .lt('message_count', 5) // Don't let threads get too long
    .order('updated_at', { ascending: true })
    .limit(1);

  if (error || !data || data.length === 0) {
    return null;
  }

  return data[0];
}

async function sendNewWarmupThread(
  sender: WarmupEmail,
  recipient: WarmupEmail
): Promise<{ success: boolean; error?: string }> {
  const { subject, body } = generateWarmupEmail();

  // Create thread in database
  const { data: thread, error: threadError } = await supabaseAdmin
    .from('warmup_threads')
    .insert({
      from_email_id: sender.id,
      to_email_id: recipient.id,
      subject,
    })
    .select()
    .single();

  if (threadError || !thread) {
    return { success: false, error: 'Failed to create thread' };
  }

  // Send email
  const result = await sendWarmupEmail({
    from: sender.email,
    to: recipient.email,
    subject,
    body,
    threadId: thread.id,
  });

  return result;
}

async function sendWarmupReplyEmail(
  thread: WarmupThread,
  sender: WarmupEmail,
  recipient: WarmupEmail
): Promise<{ success: boolean; error?: string }> {
  const { body } = generateWarmupReply();

  // Get threading headers
  const { inReplyTo, references } = await getThreadReferences(thread.id);

  // Send reply
  const result = await sendWarmupEmail({
    from: sender.email,
    to: recipient.email,
    subject: `Re: ${thread.subject}`,
    body,
    threadId: thread.id,
    inReplyTo: inReplyTo || undefined,
    references: references || undefined,
  });

  // Mark thread as completed if it has enough messages
  if (thread.message_count >= 4) {
    await supabaseAdmin
      .from('warmup_threads')
      .update({ status: 'completed' })
      .eq('id', thread.id);
  }

  return result;
}

// Update warmup limits based on week progression
export async function updateWarmupLimits(): Promise<void> {
  const { data: configs, error } = await supabaseAdmin
    .from('warmup_config')
    .select('*')
    .eq('is_active', true);

  if (error || !configs) {
    console.error('Failed to fetch configs for limit update:', error);
    return;
  }

  const limits: Record<number, number> = {
    1: 3,
    2: 7,
    3: 12,
    4: 18,
    5: 25,
    6: 30,
  };

  for (const config of configs) {
    const startDate = new Date(config.started_at);
    const now = new Date();
    const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const currentWeek = Math.floor(daysSinceStart / 7) + 1;
    const newLimit = limits[Math.min(currentWeek, 6)] || 30;

    if (config.current_week !== currentWeek || config.daily_limit !== newLimit) {
      await supabaseAdmin
        .from('warmup_config')
        .update({
          current_week: currentWeek,
          daily_limit: newLimit,
        })
        .eq('id', config.id);

      console.log(`Updated ${config.domain}: Week ${currentWeek}, Limit ${newLimit}`);
    }
  }
}
