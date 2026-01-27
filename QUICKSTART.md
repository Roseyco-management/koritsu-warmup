# Quick Start Guide

Get your warmup system running in 15 minutes.

## Prerequisites

- ✅ Resend account with API key: `re_VqMqLX2o_HTHcbdfNvXgUeoVZ5wpFZCBf`
- ✅ All 5 Koritsu domains verified in Resend
- ⏳ Supabase project (we'll create this)
- ⏳ Vercel account (free tier)

## Step 1: Supabase (5 minutes)

1. Go to https://supabase.com and create a new project
   - Name: `koritsu-warmup`
   - Choose region: `us-east-1` or closest to you
   - Generate strong password

2. Once ready, go to **SQL Editor** → **New Query**

3. Copy and paste the entire contents of `supabase/migrations/001_warmup_tables.sql`

4. Click **Run** to create tables

5. Get your credentials from **Settings** → **API**:
   - Project URL
   - anon public key
   - service_role key (secret!)

## Step 2: Local Setup (2 minutes)

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Edit .env.local with your credentials
# - Add Resend API key: re_VqMqLX2o_HTHcbdfNvXgUeoVZ5wpFZCBf
# - Add Supabase credentials from Step 1
# - Generate random secret for WARMUP_CRON_SECRET:
#   openssl rand -base64 32

# Test locally
npm run dev
```

Visit http://localhost:3000 - you should see the dashboard.

## Step 3: Deploy to Vercel (5 minutes)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Add environment variables
vercel env add RESEND_API_KEY production
vercel env add RESEND_WEBHOOK_SECRET production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add WARMUP_ENABLED production
vercel env add WARMUP_CRON_SECRET production
vercel env add WARMUP_DOMAINS production

# Redeploy with env vars
vercel --prod
```

Copy your deployment URL (e.g., `https://koritsu-warmup-xxxxx.vercel.app`)

## Step 4: Configure Resend Webhook (3 minutes)

1. Go to https://resend.com/webhooks
2. Add webhook:
   - URL: `https://your-vercel-url.vercel.app/api/webhooks/resend/warmup`
   - Events: Check `email.received`
3. Copy webhook secret (starts with `whsec_`)
4. Add to Vercel:
   ```bash
   vercel env add RESEND_WEBHOOK_SECRET production
   # Paste the webhook secret
   vercel --prod
   ```

## Step 5: Verify (2 minutes)

### Check cron is set up
```bash
curl https://your-vercel-url.vercel.app/api/cron/warmup
# Should return: {"status":"ok",...}
```

### Manually trigger warmup
```bash
curl -X POST https://your-vercel-url.vercel.app/api/cron/warmup \
  -H "Authorization: Bearer YOUR_WARMUP_CRON_SECRET"
# Should send some emails
```

### Check stats
```bash
curl https://your-vercel-url.vercel.app/api/warmup/stats | jq
# Should show 5 domains with stats
```

## Done! 🎉

Your warmup system is now running. It will automatically:
- Send emails every 2 hours (9am-6pm)
- Start with 2-3 emails/day per domain
- Increase to 25-30 emails/day by week 6
- Respond to incoming emails with 1-4 hour delays

## What to Monitor

### Daily
- Check stats: `curl https://your-url/api/warmup/stats | jq '.data.overview'`
- View Vercel logs: `vercel logs --follow`

### Weekly
- Bounce rates should be <5%
- Daily volume should increase according to schedule
- All domains should show activity

## Troubleshooting

**No emails being sent**
- Check Vercel Dashboard → Cron Jobs (should show `/api/cron/warmup`)
- Verify `WARMUP_ENABLED=true` in environment variables
- Check logs: `vercel logs /api/cron/warmup`

**Webhook not working**
- Test: Send email to `hello@usekoritsu.com`
- Check Resend Dashboard → Webhooks → Logs
- Verify webhook URL matches your Vercel deployment

**Database errors**
- Verify all 3 Supabase credentials are set
- Check Supabase Dashboard → Table Editor (should see 5 tables)
- Run migration again if tables are missing

## Next Steps

1. Monitor first 24 hours
2. Check Resend dashboard for deliverability
3. Review weekly progression
4. Adjust settings if needed via API

## Full Documentation

- Detailed setup: [README.md](./README.md)
- Supabase guide: [docs/SUPABASE_SETUP.md](./docs/SUPABASE_SETUP.md)
- Deployment guide: [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)
