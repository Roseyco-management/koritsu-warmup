// Send warmup emails via Resend API with proper threading

import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/db';
import { generateMessageId } from './content';
import type { WarmupMessage } from '@/types/database';

if (!process.env.RESEND_API_KEY) {
  throw new Error('Missing RESEND_API_KEY environment variable');
}

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendWarmupEmailParams {
  from: string;
  to: string;
  subject: string;
  body: string;
  threadId: string;
  inReplyTo?: string;
  references?: string;
}

export async function sendWarmupEmail({
  from,
  to,
  subject,
  body,
  threadId,
  inReplyTo,
  references,
}: SendWarmupEmailParams): Promise<{ success: boolean; messageId: string | null; error?: string }> {
  try {
    // Extract domain from sender email
    const domain = from.split('@')[1];
    const messageId = generateMessageId(domain);

    // Build headers for email threading
    const headers: Record<string, string> = {
      'Message-ID': messageId,
    };

    if (inReplyTo) {
      headers['In-Reply-To'] = inReplyTo;
      headers['References'] = references || inReplyTo;
    }

    // Send via Resend
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      text: body,
      headers,
    });

    if (error) {
      console.error('Resend API error:', error);
      return { success: false, messageId: null, error: error.message };
    }

    // Log the message in database
    const { error: dbError } = await supabaseAdmin.from('warmup_messages').insert({
      thread_id: threadId,
      from_email: from,
      to_email: to,
      subject,
      body,
      message_id: messageId,
      in_reply_to: inReplyTo || null,
      direction: 'sent',
      resend_id: data?.id || null,
      status: 'sent',
      sent_at: new Date().toISOString(),
    });

    if (dbError) {
      console.error('Database error logging message:', dbError);
      // Don't fail the send if logging fails
    }

    // Update sender email stats
    const { data: emailData } = await supabaseAdmin
      .from('warmup_emails')
      .select('daily_send_count, total_sent')
      .eq('email', from)
      .single();

    if (emailData) {
      await supabaseAdmin
        .from('warmup_emails')
        .update({
          daily_send_count: (emailData.daily_send_count || 0) + 1,
          total_sent: (emailData.total_sent || 0) + 1,
          last_sent_at: new Date().toISOString(),
        })
        .eq('email', from);
    }

    // Update thread
    const { data: threadData } = await supabaseAdmin
      .from('warmup_threads')
      .select('message_count')
      .eq('id', threadId)
      .single();

    if (threadData) {
      await supabaseAdmin
        .from('warmup_threads')
        .update({
          message_count: (threadData.message_count || 0) + 1,
          last_message_id: messageId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', threadId);
    }

    // Update daily stats
    const today = new Date().toISOString().split('T')[0];
    const senderDomain = from.split('@')[1];

    await supabaseAdmin.rpc('upsert_warmup_stat', {
      p_date: today,
      p_domain: senderDomain,
      p_field: 'emails_sent',
      p_increment: 1,
    }).catch(() => {
      // Fallback if RPC doesn't exist - do a manual upsert
      supabaseAdmin
        .from('warmup_stats')
        .upsert({
          date: today,
          domain: senderDomain,
          emails_sent: 1,
        }, {
          onConflict: 'date,domain',
        });
    });

    return { success: true, messageId };
  } catch (error) {
    console.error('Error sending warmup email:', error);
    return {
      success: false,
      messageId: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Helper to get thread references for proper email threading
export async function getThreadReferences(threadId: string): Promise<{
  inReplyTo: string | null;
  references: string | null;
}> {
  const { data: thread } = await supabaseAdmin
    .from('warmup_threads')
    .select('last_message_id')
    .eq('id', threadId)
    .single();

  if (!thread?.last_message_id) {
    return { inReplyTo: null, references: null };
  }

  // Get all message IDs in the thread for References header
  const { data: messages } = await supabaseAdmin
    .from('warmup_messages')
    .select('message_id')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });

  const messageIds = messages?.map((m) => m.message_id).filter(Boolean) || [];

  return {
    inReplyTo: thread.last_message_id,
    references: messageIds.join(' '),
  };
}
