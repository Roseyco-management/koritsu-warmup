# Koritsu Email Warmup System

Automated email warmup system for 5 Koritsu domains using Resend's API and inbound webhooks.

## Overview

This system warms up email domains by automatically sending and receiving emails between a pool of aliases across different domains. It simulates natural email conversations with proper threading, varied content, and realistic timing patterns.

### Domains Being Warmed Up

1. usekoritsu.com
2. trykoritsu.org
3. koritsuai.com
4. koritsu.org
5. trykoritsu.com

Each domain has 5 email aliases (hello, support, team, info, contact) for a total of 25 email addresses.

## Features

- **Automated warmup scheduler** - Runs every 2 hours during business hours (9am-6pm)
- **Proper email threading** - Uses RFC 2822 headers (Message-ID, In-Reply-To, References)
- **Varied content** - 15+ subject templates, 15+ body templates with randomization
- **Progressive volume** - Starts at 2-3 emails/day, reaches 25-30 by week 6
- **Cross-domain communication** - Always sends to different domains
- **Realistic timing** - Random reply delays of 1-4 hours
- **Statistics tracking** - Daily stats per domain with API access
- **Webhook handling** - Processes incoming emails and schedules replies

## Warmup Schedule

| Week | Emails/day/alias | Total Daily Volume |
|------|------------------|-------------------|
| 1    | 2-3             | 50-75             |
| 2    | 5-7             | 125-175           |
| 3    | 10-12           | 250-300           |
| 4    | 15-18           | 375-450           |
| 5    | 20-25           | 500-625           |
| 6+   | 25-30           | 625-750           |

## Setup

### Prerequisites

- Node.js 20+
- Supabase account
- Resend account with verified domains
- Vercel account (for deployment)

### 1. Supabase Setup

Follow the detailed guide in [SUPABASE_SETUP.md](./docs/SUPABASE_SETUP.md) to:
1. Create a new Supabase project
2. Run the database migration
3. Get your connection credentials

### 2. Resend Setup

1. **Verify all 5 domains in Resend**
   - Go to https://resend.com/domains
   - Add each domain and complete DNS verification
   - Ensure all domains show "Verified" status

2. **Set up inbound webhook**
   - Go to https://resend.com/webhooks
   - Add new webhook endpoint: `https://your-app.vercel.app/api/webhooks/resend/warmup`
   - Subscribe to `email.received` events
   - Save the webhook secret

3. **Get API key**
   - Go to https://resend.com/api-keys
   - Create a new API key with send permissions
   - Copy the API key (starts with `re_`)

### 3. Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in the values:

```env
# Resend
RESEND_API_KEY=re_xxxxx
RESEND_WEBHOOK_SECRET=whsec_xxxxx

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx

# Warmup Config
WARMUP_ENABLED=true
WARMUP_CRON_SECRET=generate-a-random-secret-here

# Domains (comma-separated)
WARMUP_DOMAINS=usekoritsu.com,trykoritsu.org,koritsuai.com,koritsu.org,trykoritsu.com
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Locally

```bash
npm run dev
```

Visit http://localhost:3000 to see the dashboard.

### 6. Deploy to Vercel

Follow [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for deployment instructions.

## API Endpoints

### Statistics

```bash
# Get warmup statistics
GET /api/warmup/stats?domain=usekoritsu.com&days=7

# Response
{
  "success": true,
  "data": {
    "overview": [
      {
        "domain": "usekoritsu.com",
        "current_week": 1,
        "daily_limit": 2,
        "is_active": true,
        "email_count": 5,
        "today_sent": 8,
        "today_received": 6
      }
    ],
    "stats": [...]
  }
}
```

### Configuration

```bash
# Get all configurations
GET /api/warmup/config

# Update configuration
PATCH /api/warmup/config
{
  "domain": "usekoritsu.com",
  "daily_limit": 5,
  "is_active": true
}

# Start warmup for a domain
POST /api/warmup/config
{
  "domain": "usekoritsu.com"
}
```

### Email Pool

```bash
# List all warmup emails
GET /api/warmup/emails?domain=usekoritsu.com

# Add new email
POST /api/warmup/emails
{
  "email": "sales@usekoritsu.com",
  "domain": "usekoritsu.com",
  "alias": "sales"
}

# Update email status
PATCH /api/warmup/emails
{
  "email": "sales@usekoritsu.com",
  "is_active": false
}
```

### Cron (Internal)

```bash
# Manually trigger warmup cycle (requires secret)
POST /api/cron/warmup
Authorization: Bearer YOUR_WARMUP_CRON_SECRET
```

## Architecture

### Core Components

1. **Scheduler** (`src/lib/warmup/scheduler.ts`)
   - Orchestrates warmup cycles
   - Decides between new threads vs replies
   - Respects daily limits
   - Updates weekly progression

2. **Content Generator** (`src/lib/warmup/content.ts`)
   - Generates varied subject lines and bodies
   - Creates realistic email content
   - Adds occasional typos for human appearance
   - Manages Message-ID generation

3. **Sender** (`src/lib/warmup/sender.ts`)
   - Sends emails via Resend API
   - Handles email threading headers
   - Logs messages to database
   - Updates statistics

4. **Webhook Handler** (`src/app/api/webhooks/resend/warmup/route.ts`)
   - Verifies Svix signatures
   - Processes incoming emails
   - Updates recipient stats
   - Maintains thread continuity

5. **Statistics** (`src/lib/warmup/stats.ts`)
   - Tracks daily send/receive counts
   - Monitors bounce and spam rates
   - Provides aggregated reports

### Database Schema

- `warmup_emails` - Email pool with stats (25 records)
- `warmup_threads` - Conversation threads
- `warmup_messages` - Individual emails with threading
- `warmup_config` - Per-domain configuration (5 records)
- `warmup_stats` - Daily statistics per domain

### Cron Schedule

Runs every 2 hours from 9am-6pm (5 times per day):
- 9:00 AM
- 11:00 AM
- 1:00 PM
- 3:00 PM
- 5:00 PM

Each run sends 1-2 emails per domain, staying within daily limits.

## Monitoring

### Check System Status

```bash
# View statistics
curl https://your-app.vercel.app/api/warmup/stats | jq

# Check cron health
curl https://your-app.vercel.app/api/cron/warmup
```

### Vercel Logs

```bash
# View deployment logs
vercel logs --follow

# View specific function logs
vercel logs /api/cron/warmup
```

### Supabase Dashboard

Monitor database activity:
1. Go to your Supabase project
2. Navigate to Table Editor
3. Check `warmup_stats` for daily progress
4. Check `warmup_messages` for sent/received emails

## Best Practices

### Email Content

- ✅ Vary subject lines and bodies
- ✅ Use proper threading headers
- ✅ Include occasional typos
- ✅ Mix short and long emails
- ❌ Don't send identical content twice
- ❌ Don't use promotional language

### Timing

- ✅ Random delays (1-4 hours for replies)
- ✅ Spread throughout business hours
- ✅ 30% new threads, 70% replies
- ❌ Don't send at exact intervals
- ❌ Don't send outside 9am-6pm initially

### Domain Management

- ✅ Always send cross-domain (never same domain)
- ✅ Monitor bounce rates (<5%)
- ✅ Pause if deliverability issues occur
- ✅ Start with low volume, increase gradually
- ❌ Don't rush the warmup process

## Troubleshooting

### No emails being sent

1. Check Vercel Cron is running: Vercel Dashboard → Project → Cron Jobs
2. Verify `WARMUP_ENABLED=true` in environment variables
3. Check `warmup_config` table: `is_active` should be `true`
4. Review logs: `vercel logs /api/cron/warmup`

### High bounce rate

1. Pause warmup immediately
2. Verify all domains are properly verified in Resend
3. Check DNS records (SPF, DKIM, DMARC)
4. Reduce daily limits temporarily
5. Contact Resend support if issues persist

### Webhook not receiving emails

1. Verify webhook URL in Resend dashboard
2. Check webhook secret in environment variables
3. Test webhook: `curl https://your-app.vercel.app/api/webhooks/resend/warmup`
4. Review webhook logs in Resend dashboard

### Database connection issues

1. Verify Supabase credentials in `.env.local`
2. Check Supabase project status
3. Ensure service role key has correct permissions
4. Test connection: Run migration script

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Vercel logs for errors
3. Check Supabase logs for database issues
4. Verify all environment variables are set correctly

## License

Proprietary - Koritsu Internal Use Only
