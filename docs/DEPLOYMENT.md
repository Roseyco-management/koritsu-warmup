# Deployment Guide - Vercel

This guide walks you through deploying the Koritsu email warmup system to Vercel.

## Prerequisites

- [Vercel account](https://vercel.com/signup) (free tier works)
- [Vercel CLI](https://vercel.com/cli) installed
- Completed Supabase setup
- Resend API key and domains verified

## Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

## Step 2: Login to Vercel

```bash
vercel login
```

Follow the prompts to authenticate.

## Step 3: Prepare for Deployment

### A. Verify all environment variables are ready

Make sure you have all these values:

```env
RESEND_API_KEY=re_xxxxx
RESEND_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx
WARMUP_ENABLED=true
WARMUP_CRON_SECRET=generate-random-secret-here
WARMUP_DOMAINS=usekoritsu.com,trykoritsu.org,koritsuai.com,koritsu.org,trykoritsu.com
```

### B. Generate a cron secret

```bash
# Generate a random secret for cron authentication
openssl rand -base64 32
# or
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Save this as your `WARMUP_CRON_SECRET`.

## Step 4: Deploy to Vercel

### Initial Deployment

```bash
cd /path/to/kartsu_warm_up
vercel
```

You'll be prompted:

1. **Set up and deploy**: Choose `Yes`
2. **Which scope**: Choose your account or team
3. **Link to existing project**: Choose `No`
4. **Project name**: `koritsu-warmup` (or your preferred name)
5. **Directory**: Press enter (current directory)
6. **Override settings**: Choose `No`

Vercel will build and deploy your project. You'll get a deployment URL like:
```
https://koritsu-warmup-xxxxx.vercel.app
```

## Step 5: Add Environment Variables

### Option A: Using Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Select your project (`koritsu-warmup`)
3. Go to **Settings** → **Environment Variables**
4. Add each variable:
   - Name: `RESEND_API_KEY`
   - Value: Your Resend API key
   - Environments: ✅ Production, ✅ Preview, ✅ Development
   - Click **Save**
5. Repeat for all environment variables

### Option B: Using Vercel CLI

```bash
# Resend
vercel env add RESEND_API_KEY production
# Paste your value when prompted

vercel env add RESEND_WEBHOOK_SECRET production

# Supabase
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production

# Warmup Config
vercel env add WARMUP_ENABLED production
vercel env add WARMUP_CRON_SECRET production
vercel env add WARMUP_DOMAINS production
```

## Step 6: Redeploy with Environment Variables

After adding environment variables, redeploy:

```bash
vercel --prod
```

## Step 7: Configure Resend Webhook

Now that you have a deployment URL, configure the Resend webhook:

1. Go to https://resend.com/webhooks
2. Click **Add Webhook**
3. **Endpoint URL**: `https://your-app.vercel.app/api/webhooks/resend/warmup`
   - Replace `your-app.vercel.app` with your actual Vercel URL
4. **Events**: Check ✅ `email.received`
5. Click **Create Webhook**
6. Copy the **Webhook Secret** (starts with `whsec_`)
7. Add it to Vercel environment variables:
   ```bash
   vercel env add RESEND_WEBHOOK_SECRET production
   # Paste the webhook secret
   ```
8. Redeploy: `vercel --prod`

## Step 8: Verify Cron Job Setup

### Check Cron Configuration

1. Go to Vercel Dashboard → Your Project
2. Navigate to **Cron Jobs** tab
3. You should see one cron job:
   - **Path**: `/api/cron/warmup`
   - **Schedule**: `0 9-18/2 * * *` (every 2 hours, 9am-6pm)

### Test Cron Endpoint

```bash
curl -X POST https://your-app.vercel.app/api/cron/warmup \
  -H "Authorization: Bearer YOUR_WARMUP_CRON_SECRET"
```

Expected response:
```json
{
  "success": true,
  "emailsSent": 5,
  "errors": [],
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

## Step 9: Monitor First Run

### View Logs

```bash
# Follow logs in real-time
vercel logs --follow

# Filter for warmup cron logs
vercel logs --follow | grep "Warmup Cron"
```

### Check Statistics

```bash
curl https://your-app.vercel.app/api/warmup/stats | jq
```

You should see:
- Overview of all 5 domains
- Current week: 1
- Daily limit: 2
- Emails sent today

## Step 10: Domain Configuration (Optional)

### Add Custom Domain

If you want to use a custom domain:

1. Go to Project Settings → **Domains**
2. Add your domain (e.g., `warmup.koritsu.com`)
3. Configure DNS records as shown
4. Update Resend webhook URL to use custom domain

## Verification Checklist

After deployment, verify:

- [ ] All environment variables are set
- [ ] Cron job appears in Vercel dashboard
- [ ] Webhook endpoint responds to GET request
- [ ] Manual cron trigger sends emails
- [ ] Statistics API returns data
- [ ] Database has initial 25 emails and 5 configs
- [ ] Resend webhook is configured and active

## Troubleshooting

### Cron job not running

1. Check Vercel Dashboard → Cron Jobs tab
2. Verify `vercel.json` exists in project root
3. Check cron job logs: `vercel logs /api/cron/warmup`
4. Ensure `WARMUP_ENABLED=true`

### "Unauthorized" error on cron endpoint

1. Verify `WARMUP_CRON_SECRET` is set in environment variables
2. Check the Authorization header includes "Bearer " prefix
3. Ensure you redeployed after adding the secret

### Webhook not receiving emails

1. Test webhook: Send an email to one of your warmup addresses
2. Check Resend Dashboard → Webhooks → Logs
3. Verify webhook URL is correct (uses your Vercel deployment URL)
4. Check webhook secret matches environment variable

### "Missing Supabase credentials" error

1. Verify all 3 Supabase env vars are set
2. Check for typos in variable names
3. Ensure service role key (not anon key) is used for `SUPABASE_SERVICE_ROLE_KEY`
4. Redeploy after adding variables

### No emails being sent

1. Check daily limits: `SELECT * FROM warmup_config;`
2. Verify email pool: `SELECT * FROM warmup_emails WHERE is_active = true;`
3. Check today's stats: `SELECT * FROM warmup_stats WHERE date = CURRENT_DATE;`
4. Review cron logs for errors

## Monitoring & Maintenance

### Daily Monitoring

```bash
# Check today's progress
curl https://your-app.vercel.app/api/warmup/stats | jq '.data.overview'

# View recent logs
vercel logs --since 1h
```

### Weekly Review

1. Check bounce rates (<5%)
2. Review spam reports (should be 0)
3. Verify daily volume is increasing
4. Monitor reputation scores

### Monthly Tasks

1. Review overall deliverability
2. Adjust daily limits if needed
3. Add more email aliases if necessary
4. Check Vercel usage (ensure within limits)

## Scaling Considerations

### Free Tier Limits

Vercel Free tier includes:
- 100 GB bandwidth/month
- 100 serverless function executions/day
- 12 cron jobs

This is sufficient for the warmup system (5 cron runs/day, low traffic).

### If You Need More

Upgrade to Vercel Pro ($20/month) for:
- Unlimited cron jobs
- More bandwidth
- Priority support

## Rollback

If you need to rollback a deployment:

```bash
# List recent deployments
vercel ls

# Promote a previous deployment
vercel promote <deployment-url>
```

## Next Steps

After successful deployment:
1. Monitor the first 24 hours closely
2. Check daily stats to verify emails are being sent
3. Test webhook by sending an email to a warmup address
4. Review Resend dashboard for deliverability metrics
5. Adjust daily limits after first week if needed

## Support

If you encounter issues:
1. Check Vercel logs first
2. Review environment variables
3. Test each endpoint individually
4. Check Supabase and Resend dashboards
5. Refer to troubleshooting section in main README
