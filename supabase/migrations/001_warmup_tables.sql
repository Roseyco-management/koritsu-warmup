-- Email Warmup System Database Schema
-- Created for Koritsu domains warmup

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Warmup email pool
CREATE TABLE warmup_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  domain TEXT NOT NULL,
  alias TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  daily_send_count INTEGER DEFAULT 0,
  daily_receive_count INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  total_received INTEGER DEFAULT 0,
  reputation_score INTEGER DEFAULT 0, -- 0-100
  last_sent_at TIMESTAMPTZ,
  last_received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast domain lookups
CREATE INDEX idx_warmup_emails_domain ON warmup_emails(domain);
CREATE INDEX idx_warmup_emails_active ON warmup_emails(is_active) WHERE is_active = true;

-- Warmup email threads
CREATE TABLE warmup_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_email_id UUID REFERENCES warmup_emails(id) ON DELETE CASCADE,
  to_email_id UUID REFERENCES warmup_emails(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message_count INTEGER DEFAULT 1,
  last_message_id TEXT, -- For threading (Message-ID header)
  status TEXT DEFAULT 'active', -- active, completed
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for finding active threads
CREATE INDEX idx_warmup_threads_status ON warmup_threads(status);
CREATE INDEX idx_warmup_threads_emails ON warmup_threads(from_email_id, to_email_id);

-- Individual warmup messages
CREATE TABLE warmup_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES warmup_threads(id) ON DELETE CASCADE,
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  message_id TEXT UNIQUE, -- RFC 2822 Message-ID
  in_reply_to TEXT, -- For threading
  direction TEXT NOT NULL, -- 'sent' or 'received'
  resend_id TEXT, -- Resend's message ID
  status TEXT DEFAULT 'pending', -- pending, sent, delivered, opened, replied
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for thread lookups and message ID searches
CREATE INDEX idx_warmup_messages_thread ON warmup_messages(thread_id);
CREATE INDEX idx_warmup_messages_message_id ON warmup_messages(message_id);
CREATE INDEX idx_warmup_messages_in_reply_to ON warmup_messages(in_reply_to);
CREATE INDEX idx_warmup_messages_direction ON warmup_messages(direction);

-- Warmup schedule configuration
CREATE TABLE warmup_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL UNIQUE,
  current_week INTEGER DEFAULT 1,
  daily_limit INTEGER DEFAULT 2,
  is_active BOOLEAN DEFAULT true,
  started_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for active configs
CREATE INDEX idx_warmup_config_active ON warmup_config(is_active) WHERE is_active = true;

-- Daily statistics
CREATE TABLE warmup_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  domain TEXT NOT NULL,
  emails_sent INTEGER DEFAULT 0,
  emails_received INTEGER DEFAULT 0,
  emails_replied INTEGER DEFAULT 0,
  bounce_count INTEGER DEFAULT 0,
  spam_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(date, domain)
);

-- Index for date-based queries
CREATE INDEX idx_warmup_stats_date ON warmup_stats(date DESC);
CREATE INDEX idx_warmup_stats_domain ON warmup_stats(domain);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_warmup_emails_updated_at
  BEFORE UPDATE ON warmup_emails
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_warmup_threads_updated_at
  BEFORE UPDATE ON warmup_threads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_warmup_config_updated_at
  BEFORE UPDATE ON warmup_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to reset daily counters (run daily)
CREATE OR REPLACE FUNCTION reset_daily_warmup_counters()
RETURNS void AS $$
BEGIN
  UPDATE warmup_emails
  SET daily_send_count = 0,
      daily_receive_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Initial data: Koritsu domains configuration
INSERT INTO warmup_config (domain, current_week, daily_limit, is_active) VALUES
  ('usekoritsu.com', 1, 2, true),
  ('trykoritsu.org', 1, 2, true),
  ('koritsuai.com', 1, 2, true),
  ('koritsu.org', 1, 2, true),
  ('trykoritsu.com', 1, 2, true);

-- Initial data: Email aliases (5 per domain = 25 total)
INSERT INTO warmup_emails (email, domain, alias) VALUES
  -- usekoritsu.com
  ('hello@usekoritsu.com', 'usekoritsu.com', 'hello'),
  ('support@usekoritsu.com', 'usekoritsu.com', 'support'),
  ('team@usekoritsu.com', 'usekoritsu.com', 'team'),
  ('info@usekoritsu.com', 'usekoritsu.com', 'info'),
  ('contact@usekoritsu.com', 'usekoritsu.com', 'contact'),

  -- trykoritsu.org
  ('hello@trykoritsu.org', 'trykoritsu.org', 'hello'),
  ('support@trykoritsu.org', 'trykoritsu.org', 'support'),
  ('team@trykoritsu.org', 'trykoritsu.org', 'team'),
  ('info@trykoritsu.org', 'trykoritsu.org', 'info'),
  ('contact@trykoritsu.org', 'trykoritsu.org', 'contact'),

  -- koritsuai.com
  ('hello@koritsuai.com', 'koritsuai.com', 'hello'),
  ('support@koritsuai.com', 'koritsuai.com', 'support'),
  ('team@koritsuai.com', 'koritsuai.com', 'team'),
  ('info@koritsuai.com', 'koritsuai.com', 'info'),
  ('contact@koritsuai.com', 'koritsuai.com', 'contact'),

  -- koritsu.org
  ('hello@koritsu.org', 'koritsu.org', 'hello'),
  ('support@koritsu.org', 'koritsu.org', 'support'),
  ('team@koritsu.org', 'koritsu.org', 'team'),
  ('info@koritsu.org', 'koritsu.org', 'info'),
  ('contact@koritsu.org', 'koritsu.org', 'contact'),

  -- trykoritsu.com
  ('hello@trykoritsu.com', 'trykoritsu.com', 'hello'),
  ('support@trykoritsu.com', 'trykoritsu.com', 'support'),
  ('team@trykoritsu.com', 'trykoritsu.com', 'team'),
  ('info@trykoritsu.com', 'trykoritsu.com', 'info'),
  ('contact@trykoritsu.com', 'trykoritsu.com', 'contact');
