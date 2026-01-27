# Email Warmup System - Project Handoff

## Executive Summary

**Goal**: Build a custom email warmup system for 5 domains using Resend's API and inbound webhooks.

**Why Custom**: The user has an existing Resend-based email infrastructure with full send/receive capabilities via webhooks. Traditional warmup services (Smartlead, Instantly, Warmbox) require IMAP access to mailboxes, which Resend doesn't provide. Instead of setting up traditional email providers (Google Workspace, Microsoft 365), the user wants to leverage their existing Resend infrastructure with unlimited email aliases.

---

## Current Infrastructure

### Resend Configuration
- **API Key**: Available (user has access)
- **Domains**: 5 domains to warm up (Koritsu domains)
- **Capabilities**:
  - Sending via SMTP and REST API
  - Receiving via inbound webhooks
  - Unlimited aliases per verified domain

### SMTP Credentials (for reference)
```
Host: smtp.resend.com
Port: 465 (or 587, 2465, 2587 for TLS)
User: resend
Password: <RESEND_API_KEY>
```

### Existing Email System Reference
Located at: `/Users/arnispiekus/Work/Github/Ecommerce Template/`

Key components to reference:
1. **Inbound Webhook Handler**: `/apps/customer/app/api/webhooks/resend/inbound/route.ts`
   - Svix signature verification
   - Email content extraction
   - Threading via RFC 2822 headers (Message-ID, In-Reply-To, References)

2. **Email Sending Module**: `/packages/shared-lib/src/emails/send.ts`
   - `sendEmail()` function with threading support
   - Message-ID generation
   - Attachment handling

3. **Database Schema** (Supabase):
   - `support_tickets` - conversation storage
   - `ticket_messages` - individual emails with threading
   - `email_sends` - GDPR compliance logging

---

## What Needs to Be Built

### 1. Database Schema

```sql
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
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Warmup email threads
CREATE TABLE warmup_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_email_id UUID REFERENCES warmup_emails(id),
  to_email_id UUID REFERENCES warmup_emails(id),
  subject TEXT NOT NULL,
  message_count INTEGER DEFAULT 1,
  last_message_id TEXT, -- For threading (Message-ID header)
  status TEXT DEFAULT 'active', -- active, completed
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Individual warmup messages
CREATE TABLE warmup_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES warmup_threads(id),
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  message_id TEXT, -- RFC 2822 Message-ID
  in_reply_to TEXT, -- For threading
  direction TEXT NOT NULL, -- 'sent' or 'received'
  resend_id TEXT, -- Resend's message ID
  status TEXT DEFAULT 'pending', -- pending, sent, delivered, opened, replied
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Warmup schedule configuration
CREATE TABLE warmup_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,
  current_week INTEGER DEFAULT 1,
  daily_limit INTEGER DEFAULT 2,
  is_active BOOLEAN DEFAULT true,
  started_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

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
```

### 2. Warmup Scheduler (Cron Job)

Schedule: Run every 30-60 minutes during business hours (9am-6pm across timezones)

```typescript
// Pseudo-code for warmup scheduler

async function runWarmupCycle() {
  // 1. Get active warmup configs
  const configs = await getActiveWarmupConfigs();

  // 2. For each domain, check daily limits
  for (const config of configs) {
    const todaySent = await getTodaySentCount(config.domain);
    const remaining = config.daily_limit - todaySent;

    if (remaining <= 0) continue;

    // 3. Get random sender from this domain
    const sender = await getRandomEmail(config.domain);

    // 4. Get random recipient from DIFFERENT domain
    const recipient = await getRandomEmail({ excludeDomain: config.domain });

    // 5. Decide: new thread or reply to existing
    const existingThread = await getOpenThread(sender.id, recipient.id);

    if (existingThread && Math.random() > 0.3) {
      // 70% chance to reply to existing thread
      await sendWarmupReply(existingThread);
    } else {
      // 30% chance to start new thread
      await sendNewWarmupEmail(sender, recipient);
    }
  }
}
```

### 3. Warmup Email Content Generator

Generate realistic, non-spammy content:

```typescript
const WARMUP_SUBJECTS = [
  "Quick question about {topic}",
  "Following up on our conversation",
  "Thoughts on {topic}?",
  "Re: {topic} discussion",
  "Can you help with {topic}?",
  "{topic} - your thoughts?",
  "Checking in",
  "Quick update",
];

const WARMUP_BODIES = [
  "Hey,\n\nJust wanted to follow up on {topic}. Let me know your thoughts when you get a chance.\n\nThanks!",
  "Hi there,\n\nI was thinking about {topic} and wanted to get your input. What do you think?\n\nBest,",
  "Hello,\n\nHope you're doing well! Quick question about {topic} - do you have any recommendations?\n\nCheers,",
  // Add 20-30 more variations
];

const TOPICS = [
  "the project timeline",
  "next week's meeting",
  "the quarterly report",
  "the new process",
  "team updates",
  "the upcoming event",
  // Add more generic business topics
];

const REPLY_BODIES = [
  "Thanks for reaching out!\n\n{response}\n\nLet me know if you have any other questions.",
  "Great question!\n\n{response}\n\nHappy to discuss further.",
  "Thanks for the update.\n\n{response}\n\nTalk soon!",
];
```

### 4. Inbound Webhook Handler (for warmup)

Extend existing webhook or create separate endpoint:

```typescript
// POST /api/webhooks/resend/warmup
export async function POST(request: Request) {
  // 1. Verify Svix signature
  // 2. Extract email content

  const { from, to, subject, messageId, inReplyTo } = extractEmailData(payload);

  // 3. Check if this is a warmup email
  const isWarmupEmail = await isFromWarmupPool(from);
  const isToWarmupPool = await isInWarmupPool(to);

  if (!isWarmupEmail || !isToWarmupPool) {
    return; // Not a warmup email
  }

  // 4. Log the received email
  await logWarmupReceived({ from, to, subject, messageId, inReplyTo });

  // 5. Find the thread
  const thread = await findThreadByMessageId(inReplyTo);

  // 6. Schedule a reply (with random delay 1-4 hours)
  const replyDelay = randomBetween(1, 4) * 60 * 60 * 1000; // 1-4 hours in ms
  await scheduleWarmupReply(thread.id, replyDelay);

  // 7. Update stats
  await incrementWarmupStats(to, 'received');

  return Response.json({ success: true });
}
```

### 5. Warmup Dashboard API

```typescript
// GET /api/warmup/stats
// Returns domain statistics, daily progress, reputation estimates

// GET /api/warmup/emails
// Returns list of warmup emails with their stats

// POST /api/warmup/emails
// Add new email alias to warmup pool

// PATCH /api/warmup/config
// Update warmup configuration (daily limits, active status)

// POST /api/warmup/start
// Start warmup for a domain

// POST /api/warmup/pause
// Pause warmup for a domain
```

---

## Warmup Schedule (Recommended)

| Week | Emails/day/alias | Notes |
|------|------------------|-------|
| 1 | 2-3 | Start slow, establish baseline |
| 2 | 5-7 | Gradual increase |
| 3 | 10-12 | Monitor for bounces |
| 4 | 15-18 | Check deliverability |
| 5 | 20-25 | Approaching normal volume |
| 6+ | 25-30 | Maintenance mode |

### Automatic Progression Logic

```typescript
async function updateWarmupLimits() {
  const configs = await getActiveWarmupConfigs();

  for (const config of configs) {
    const daysSinceStart = differenceInDays(new Date(), config.started_at);
    const currentWeek = Math.floor(daysSinceStart / 7) + 1;

    const limits = {
      1: 3,
      2: 7,
      3: 12,
      4: 18,
      5: 25,
      6: 30,
    };

    const newLimit = limits[Math.min(currentWeek, 6)];

    await updateConfig(config.id, {
      current_week: currentWeek,
      daily_limit: newLimit
    });
  }
}
```

---

## Email Alias Setup

For each of the 5 domains, create aliases like:

```
Domain 1 (koritsu-domain1.com):
- hello@koritsu-domain1.com
- support@koritsu-domain1.com
- team@koritsu-domain1.com
- info@koritsu-domain1.com
- contact@koritsu-domain1.com

Domain 2 (koritsu-domain2.com):
- hello@koritsu-domain2.com
- support@koritsu-domain2.com
... etc
```

Total: 5 domains × 5 aliases = 25 email addresses in warmup pool

This creates a network where emails flow between different domains, simulating real business communication.

---

## Key Implementation Notes

### 1. Threading is Critical
Always use proper email threading headers:
- Generate unique `Message-ID` for every email
- Include `In-Reply-To` header when replying
- Include `References` header with full thread chain

### 2. Timing Variation
- Don't send at exact intervals (looks robotic)
- Add random delays: 1-4 hours for replies
- Spread sends throughout the day
- Avoid weekends initially

### 3. Content Variation
- Never send identical content twice
- Vary subject lines, greetings, signatures
- Include occasional typos (looks human)
- Mix short and long emails

### 4. Cross-Domain Priority
- Always send to different domains (not same domain)
- This builds inter-domain reputation
- Simulates real business communication patterns

### 5. Monitor Bounces
- Track bounce rates per domain
- Pause warmup if bounce rate > 5%
- Investigate deliverability issues

---

## Files to Create

```
/Email-Outreach
├── src/
│   ├── db/
│   │   └── schema/
│   │       └── warmup.ts          # Database schema
│   ├── lib/
│   │   ├── warmup/
│   │   │   ├── scheduler.ts       # Main warmup scheduler
│   │   │   ├── content.ts         # Email content generator
│   │   │   ├── sender.ts          # Send warmup emails via Resend
│   │   │   └── stats.ts           # Statistics tracking
│   │   └── resend.ts              # Resend API client
│   ├── api/
│   │   ├── warmup/
│   │   │   ├── route.ts           # Warmup management endpoints
│   │   │   ├── stats/route.ts     # Statistics endpoint
│   │   │   └── emails/route.ts    # Email pool management
│   │   └── webhooks/
│   │       └── resend/
│   │           └── warmup/route.ts # Inbound warmup webhook
│   └── cron/
│       └── warmup.ts              # Cron job handler
├── supabase/
│   └── migrations/
│       └── 001_warmup_tables.sql  # Database migration
└── .env.example                   # Required environment variables
```

---

## Environment Variables Required

```env
# Resend
RESEND_API_KEY=re_xxxxx
RESEND_WEBHOOK_SECRET=whsec_xxxxx

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx

# Warmup Config
WARMUP_ENABLED=true
WARMUP_CRON_SECRET=xxxxx  # To secure cron endpoint
```

---

## Success Criteria

1. **Week 1**: All 5 domains sending 2-3 emails/day/alias without bounces
2. **Week 2**: Increase to 5-7 emails/day/alias, <2% bounce rate
3. **Week 4**: 15+ emails/day/alias, emails landing in inbox (not spam)
4. **Week 6**: Domains ready for cold outreach at 25-30 emails/day/alias

---

## Questions for User Before Starting

1. What are the exact 5 domain names?
2. Is this a new project or adding to existing codebase?
3. Preferred tech stack? (Next.js, Node.js, etc.)
4. Where will cron jobs run? (Vercel, Railway, custom server)
5. Is Supabase already set up or need new project?

---

## Reference Implementation

The existing email system at `/Users/arnispiekus/Work/Github/Ecommerce Template/` contains working examples of:
- Resend API integration
- Inbound webhook handling with Svix verification
- Email threading implementation
- Database schema for email storage

Use this as reference but build a standalone warmup system.
