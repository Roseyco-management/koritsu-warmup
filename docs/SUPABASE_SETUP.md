# Supabase Setup Guide

This guide walks you through setting up Supabase for the Koritsu email warmup system.

## Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Sign in or create an account
3. Click "New Project"
4. Fill in the details:
   - **Name**: `koritsu-warmup` (or your preferred name)
   - **Database Password**: Generate a strong password (save it securely)
   - **Region**: Choose closest to your target audience (e.g., `us-east-1`)
   - **Plan**: Free tier is sufficient to start
5. Click "Create new project"
6. Wait 2-3 minutes for the project to be provisioned

## Step 2: Get Connection Credentials

Once your project is ready:

1. Go to **Project Settings** (gear icon in sidebar)
2. Navigate to **API** section
3. Copy the following values:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   ```

   - **Project URL**: This is your `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public**: This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role**: This is your `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep this secret!)

## Step 3: Run Database Migration

You have two options to run the migration:

### Option A: Using Supabase SQL Editor (Recommended)

1. In your Supabase dashboard, go to **SQL Editor** (in the sidebar)
2. Click **New query**
3. Open the migration file on your local machine:
   ```bash
   cat supabase/migrations/001_warmup_tables.sql
   ```
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** (or press `Cmd/Ctrl + Enter`)
7. Verify the tables were created:
   - Go to **Table Editor** in the sidebar
   - You should see 5 new tables: `warmup_emails`, `warmup_threads`, `warmup_messages`, `warmup_config`, `warmup_stats`

### Option B: Using Supabase CLI

If you prefer using the CLI:

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

   Find your project ref in: Settings → General → Reference ID

4. Push the migration:
   ```bash
   supabase db push
   ```

## Step 4: Verify Initial Data

After running the migration, verify the initial data was inserted:

### Check Warmup Config

1. Go to **Table Editor** → `warmup_config`
2. You should see 5 rows, one for each domain:
   - usekoritsu.com
   - trykoritsu.org
   - koritsuai.com
   - koritsu.org
   - trykoritsu.com

### Check Warmup Emails

1. Go to **Table Editor** → `warmup_emails`
2. You should see 25 rows (5 aliases × 5 domains):
   - hello@usekoritsu.com
   - support@usekoritsu.com
   - team@usekoritsu.com
   - info@usekoritsu.com
   - contact@usekoritsu.com
   - (... and same for other 4 domains)

## Step 5: Configure Row Level Security (Optional)

By default, we're using the service role key which bypasses RLS. If you want to add RLS policies:

1. Go to **Authentication** → **Policies**
2. For each table, create policies as needed

For this internal warmup system, RLS is optional since:
- The service role key is only used server-side
- There's no public user authentication
- All requests are internal

## Step 6: Set Up Database Backups (Recommended)

1. Go to **Database** → **Backups**
2. The free tier includes daily backups
3. For production, consider upgrading to more frequent backups

## Step 7: Add Environment Variables to Vercel

When deploying, add these to your Vercel project:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Paste your URL when prompted

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Paste your anon key when prompted

vercel env add SUPABASE_SERVICE_ROLE_KEY
# Paste your service role key when prompted
```

## Troubleshooting

### Migration fails with "permission denied"

- Make sure you're using the service role key, not the anon key
- Check that your database password is correct
- Verify you're connected to the right project

### Tables not visible in Table Editor

- Refresh the page
- Check the SQL Editor for error messages
- Verify the migration completed successfully

### Initial data not inserted

- The migration includes INSERT statements at the end
- If they failed, you can run them manually:
  1. Go to SQL Editor
  2. Copy the INSERT statements from the migration file
  3. Run them separately

### Connection timeout errors

- Check your internet connection
- Verify the Supabase project is active (not paused)
- Free tier projects pause after 1 week of inactivity

## Database Schema Overview

### warmup_emails
Stores the email pool (25 emails)
- Tracks send/receive counts
- Reputation scores
- Active status

### warmup_threads
Email conversation threads
- Links sender and recipient
- Tracks message count
- Status (active/completed)

### warmup_messages
Individual emails
- Full email content
- Threading headers (Message-ID, In-Reply-To)
- Direction (sent/received)
- Status tracking

### warmup_config
Per-domain configuration
- Current week
- Daily send limits
- Active status

### warmup_stats
Daily statistics
- Emails sent/received
- Bounce counts
- Spam reports

## Monitoring Queries

Useful SQL queries for monitoring:

### Daily Progress
```sql
SELECT
  date,
  domain,
  emails_sent,
  emails_received
FROM warmup_stats
ORDER BY date DESC, domain
LIMIT 20;
```

### Active Threads
```sql
SELECT
  t.subject,
  t.message_count,
  e1.email as from_email,
  e2.email as to_email
FROM warmup_threads t
JOIN warmup_emails e1 ON t.from_email_id = e1.id
JOIN warmup_emails e2 ON t.to_email_id = e2.id
WHERE t.status = 'active'
ORDER BY t.updated_at DESC;
```

### Email Pool Status
```sql
SELECT
  domain,
  COUNT(*) as total_emails,
  SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_emails,
  AVG(reputation_score) as avg_reputation
FROM warmup_emails
GROUP BY domain;
```

## Next Steps

After completing Supabase setup:
1. Copy your credentials to `.env.local`
2. Continue with Resend setup in the main README
3. Test the connection by running `npm run dev`
4. Deploy to Vercel
