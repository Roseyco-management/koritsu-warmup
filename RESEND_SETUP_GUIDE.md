# Resend Domain Setup Guide

Complete guide for setting up 12 domains with Resend for email warmup functionality.

## Domains to Configure

- kittyklub.co.uk
- catcore.co.uk
- clarityskin.store
- duskglow.store
- crypto-store.co
- crypto-market.co
- jesus-eternal.com
- jesus-better.com
- christianstore.co
- cat-core.com
- kitty-klub.com
- muslimstore.co

## Prerequisites

1. **Resend Account**: https://resend.com
2. **Vercel Account**: https://vercel.com with access to team `team_seR1ZrsqHRRmzMEbB4JV0fV8`
3. **Vercel API Token**: Create at https://vercel.com/account/tokens
4. **Resend API Key**: `re_VqMqLX2o_HTHcbdfNvXgUeoVZ5wpFZCBf` (already configured)

## Setup Steps

### Step 1: Prepare Environment

Add your Vercel token to `.env.local`:

```bash
VERCEL_TOKEN=your_vercel_token_here
```

### Step 2: Configure DNS Records in Vercel

Run the DNS configuration script:

```bash
node configure-vercel-dns.js
```

This will add the following DNS records to each domain:
- **MX Record**: `feedback-smtp.us-east-1.amazonses.com` (priority 10)
- **SPF TXT Record**: `v=spf1 include:amazonses.com ~all`
- **DMARC TXT Record**: `v=DMARC1; p=none;`

**Note**: DKIM records must be added manually after getting them from Resend (Step 4).

### Step 3: Add Domains to Resend

Run the complete Resend domain setup script:

```bash
node setup-resend-domains.js
```

This script will:
1. Add each domain to Resend
2. Fetch the DNS records (including DKIM keys)
3. Display the DKIM keys for manual addition to Vercel
4. Create webhooks for each domain

**Alternative Manual Method**:
1. Go to https://resend.com/domains
2. Click "Add Domain"
3. Enter each domain name
4. Follow the verification instructions

### Step 4: Add DKIM Records to Vercel

For each domain, you'll get a DKIM key from Resend that looks like:

```
Name: resend._domainkey
Type: TXT
Value: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQ...
```

Add these manually via Vercel API or dashboard:

**Via Vercel Dashboard**:
1. Go to https://vercel.com/rosey-co-team/~/domains
2. Select the domain
3. Click "DNS Records"
4. Add TXT record with name `resend._domainkey` and the value from Resend

**Via API** (if you have the DKIM keys):
```bash
# You can modify configure-vercel-dns.js to include the DKIM keys
```

### Step 5: Set Up Webhooks

Run the webhook setup script:

```bash
node setup-resend-webhooks.js
```

This will:
1. Create webhooks for each domain pointing to `https://{domain}/api/webhooks/resend/warmup`
2. Subscribe to events: `email.sent`, `email.delivered`, `email.bounced`, `email.complained`, etc.
3. Save webhook secrets to `resend-webhook-secrets.json`

**Manual Method**:
1. Go to https://resend.com/webhooks
2. Click "Add Webhook"
3. Enter webhook URL: `https://{domain}/api/webhooks/resend/warmup`
4. Select all events
5. Save the webhook secret

### Step 6: Verify Domains in Resend

1. Go to https://resend.com/domains
2. For each domain, click "Verify"
3. Wait for DNS propagation (can take up to 48 hours)
4. Check verification status

### Step 7: Configure Environment Variables in Vercel Project

You need to set up these environment variables in your Vercel project:

```env
RESEND_API_KEY=re_VqMqLX2o_HTHcbdfNvXgUeoVZ5wpFZCBf
RESEND_WEBHOOK_SECRET=whsec_vn19LMwXUdvuwPtETq/EGaOy0jV0mfvMnwYf28uwSC8=
NEXT_PUBLIC_SUPABASE_URL=https://prygimfgifncddnlsmxc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
WARMUP_ENABLED=true
WARMUP_CRON_SECRET=IGvlfQQWLxGf4+7bn1qYpaITi+C2ly6Yj0Tl0MHlrUU=
```

**Via Vercel Dashboard**:
1. Go to https://vercel.com/rosey-co-team
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable for Production, Preview, and Development

**Via Vercel CLI**:
```bash
vercel env add RESEND_API_KEY production
vercel env add RESEND_WEBHOOK_SECRET production
# ... etc for each variable
```

### Step 8: Update WARMUP_DOMAINS

Add the new domains to your `WARMUP_DOMAINS` environment variable:

```env
WARMUP_DOMAINS=usekoritsu.com,trykoritsu.org,koritsuai.com,koritsu.org,trykoritsu.com,kittyklub.co.uk,catcore.co.uk,clarityskin.store,duskglow.store,crypto-store.co,crypto-market.co,jesus-eternal.com,jesus-better.com,christianstore.co,cat-core.com,kitty-klub.com,muslimstore.co
```

## Testing

### Test DNS Configuration

```bash
# Check MX records
dig MX kittyklub.co.uk

# Check TXT records (SPF, DMARC, DKIM)
dig TXT kittyklub.co.uk
dig TXT _dmarc.kittyklub.co.uk
dig TXT resend._domainkey.kittyklub.co.uk
```

### Test Webhook

Send a test email using the test script:

```bash
# Modify test-bluepillar-receive.js to use one of your new domains
node test-bluepillar-receive.js
```

Or create a simple test:

```javascript
const { Resend } = require('resend');
const resend = new Resend('re_VqMqLX2o_HTHcbdfNvXgUeoVZ5wpFZCBf');

resend.emails.send({
  from: 'warmup@kittyklub.co.uk',
  to: 'warmup@catcore.co.uk',
  subject: 'Test Email',
  text: 'Testing email delivery',
});
```

### Monitor Webhooks

1. Go to https://resend.com/webhooks
2. Click on a webhook
3. View delivery logs and status

## Troubleshooting

### Domain Verification Fails

- Wait for DNS propagation (up to 48 hours)
- Check DNS records are correctly configured
- Use `dig` or online DNS lookup tools to verify
- Check Vercel DNS dashboard for record status

### Webhooks Not Working

- Verify webhook URL is accessible
- Check webhook secret matches in environment variables
- Review webhook delivery logs in Resend dashboard
- Check application logs in Vercel

### Emails Not Sending

- Verify domain is verified in Resend
- Check DNS records are correct and propagated
- Review Resend sending logs
- Check for bounces or complaints

## DNS Record Reference

For each domain, you need these records:

| Type | Name | Value | Priority | Purpose |
|------|------|-------|----------|---------|
| MX | @ | feedback-smtp.us-east-1.amazonses.com. | 10 | Inbound email |
| TXT | @ | v=spf1 include:amazonses.com ~all | - | SPF |
| TXT | _dmarc | v=DMARC1; p=none; | - | DMARC policy |
| TXT | resend._domainkey | p=MIGfMA... (unique per domain) | - | DKIM signature |

## Webhook URLs

Each domain will have a webhook at:
```
https://kittyklub.co.uk/api/webhooks/resend/warmup
https://catcore.co.uk/api/webhooks/resend/warmup
https://clarityskin.store/api/webhooks/resend/warmup
... etc
```

## Security Notes

1. **Keep webhook secrets secure**: Store in environment variables, never commit to git
2. **Verify webhook signatures**: The application should validate Svix signatures
3. **Monitor webhook activity**: Check Resend dashboard regularly
4. **Rotate secrets periodically**: Update webhook secrets every 90 days

## Maintenance

- Monitor domain verification status monthly
- Check DNS record TTLs and update if needed
- Review webhook delivery success rates
- Update DKIM keys if domains are re-verified

## Support

- Resend Documentation: https://resend.com/docs
- Resend Support: https://resend.com/support
- Vercel Documentation: https://vercel.com/docs
- Vercel Support: https://vercel.com/support
