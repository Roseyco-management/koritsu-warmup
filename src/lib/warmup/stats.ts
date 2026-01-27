// Statistics tracking for warmup system

import { supabaseAdmin } from '@/lib/db';
import type { WarmupStats } from '@/types/database';

export async function getTodaySentCount(domain: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabaseAdmin
    .from('warmup_stats')
    .select('emails_sent')
    .eq('domain', domain)
    .eq('date', today)
    .single();

  if (error || !data) {
    return 0;
  }

  return data.emails_sent;
}

export async function incrementWarmupStat(
  domain: string,
  field: 'emails_sent' | 'emails_received' | 'emails_replied' | 'bounce_count' | 'spam_count'
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  // Upsert the stat
  const { data: existing } = await supabaseAdmin
    .from('warmup_stats')
    .select('*')
    .eq('domain', domain)
    .eq('date', today)
    .single();

  if (existing) {
    // Update existing record
    await supabaseAdmin
      .from('warmup_stats')
      .update({
        [field]: (existing[field] || 0) + 1,
      })
      .eq('id', existing.id);
  } else {
    // Insert new record
    await supabaseAdmin.from('warmup_stats').insert({
      date: today,
      domain,
      [field]: 1,
    });
  }
}

export async function getWarmupStats(
  domain?: string,
  days: number = 7
): Promise<WarmupStats[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split('T')[0];

  let query = supabaseAdmin
    .from('warmup_stats')
    .select('*')
    .gte('date', startDateStr)
    .order('date', { ascending: false });

  if (domain) {
    query = query.eq('domain', domain);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching warmup stats:', error);
    return [];
  }

  return data || [];
}

export async function getDomainOverview() {
  // Get all active configs
  const { data: configs } = await supabaseAdmin
    .from('warmup_config')
    .select('*')
    .eq('is_active', true);

  if (!configs) {
    return [];
  }

  // Get email counts per domain
  const { data: emailCounts } = await supabaseAdmin
    .from('warmup_emails')
    .select('domain, is_active')
    .eq('is_active', true);

  const domainEmailCount = emailCounts?.reduce((acc, email) => {
    acc[email.domain] = (acc[email.domain] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Get today's stats for each domain
  const today = new Date().toISOString().split('T')[0];
  const { data: todayStats } = await supabaseAdmin
    .from('warmup_stats')
    .select('*')
    .eq('date', today);

  const todayStatsByDomain = todayStats?.reduce((acc, stat) => {
    acc[stat.domain] = stat;
    return acc;
  }, {} as Record<string, WarmupStats>) || {};

  // Combine all data
  return configs.map((config) => ({
    domain: config.domain,
    current_week: config.current_week,
    daily_limit: config.daily_limit,
    is_active: config.is_active,
    email_count: domainEmailCount[config.domain] || 0,
    today_sent: todayStatsByDomain[config.domain]?.emails_sent || 0,
    today_received: todayStatsByDomain[config.domain]?.emails_received || 0,
    today_replied: todayStatsByDomain[config.domain]?.emails_replied || 0,
  }));
}

export async function resetDailyCounters(): Promise<void> {
  const { error } = await supabaseAdmin.from('warmup_emails').update({
    daily_send_count: 0,
    daily_receive_count: 0,
  }).neq('id', '00000000-0000-0000-0000-000000000000'); // Update all records

  if (error) {
    console.error('Error resetting daily counters:', error);
  }
}
