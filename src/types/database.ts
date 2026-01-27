// Database types for Supabase

export interface WarmupEmail {
  id: string;
  email: string;
  domain: string;
  alias: string;
  is_active: boolean;
  daily_send_count: number;
  daily_receive_count: number;
  total_sent: number;
  total_received: number;
  reputation_score: number;
  last_sent_at: string | null;
  last_received_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WarmupThread {
  id: string;
  from_email_id: string;
  to_email_id: string;
  subject: string;
  message_count: number;
  last_message_id: string | null;
  status: 'active' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface WarmupMessage {
  id: string;
  thread_id: string;
  from_email: string;
  to_email: string;
  subject: string;
  body: string;
  message_id: string | null;
  in_reply_to: string | null;
  direction: 'sent' | 'received';
  resend_id: string | null;
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'replied';
  sent_at: string | null;
  created_at: string;
}

export interface WarmupConfig {
  id: string;
  domain: string;
  current_week: number;
  daily_limit: number;
  is_active: boolean;
  started_at: string;
  updated_at: string;
}

export interface WarmupStats {
  id: string;
  date: string;
  domain: string;
  emails_sent: number;
  emails_received: number;
  emails_replied: number;
  bounce_count: number;
  spam_count: number;
  created_at: string;
}

// Insert types (without generated fields)
export type WarmupEmailInsert = Omit<
  WarmupEmail,
  'id' | 'created_at' | 'updated_at' | 'is_active' | 'daily_send_count' | 'daily_receive_count' | 'total_sent' | 'total_received' | 'reputation_score' | 'last_sent_at' | 'last_received_at'
>;

export type WarmupThreadInsert = Omit<
  WarmupThread,
  'id' | 'created_at' | 'updated_at' | 'message_count' | 'last_message_id' | 'status'
>;

export type WarmupMessageInsert = Omit<WarmupMessage, 'id' | 'created_at'>;

export type WarmupConfigInsert = Omit<
  WarmupConfig,
  'id' | 'created_at' | 'updated_at' | 'current_week' | 'daily_limit' | 'is_active' | 'started_at'
>;

export type WarmupStatsInsert = Omit<WarmupStats, 'id' | 'created_at'>;
