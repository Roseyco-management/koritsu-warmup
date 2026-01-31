#!/usr/bin/env node

/**
 * Configure Vercel Project Environment Variables
 *
 * Sets up all required environment variables for the warmup project
 */

require('dotenv').config({ path: '.env.local' });

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_TEAM_ID = 'team_seR1ZrsqHRRmzMEbB4JV0fV8';
const PROJECT_NAME = process.env.VERCEL_PROJECT_NAME || 'kartsu-warm-up'; // Update this

// Environment variables to configure
const ENV_VARS = {
  RESEND_API_KEY: process.env.RESEND_API_KEY || 're_VqMqLX2o_HTHcbdfNvXgUeoVZ5wpFZCBf',
  RESEND_WEBHOOK_SECRET: process.env.RESEND_WEBHOOK_SECRET || 'whsec_vn19LMwXUdvuwPtETq/EGaOy0jV0mfvMnwYf28uwSC8=',
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://prygimfgifncddnlsmxc.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeWdpbWZnaWZuY2RkbmxzbXhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MzMxNTgsImV4cCI6MjA4NTEwOTE1OH0.Ynyb7mQ8UzK-kAkPqE0rXr86oPgwZdNVe5d8Jy54WVc',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeWdpbWZnaWZuY2RkbmxzbXhjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTUzMzE1OCwiZXhwIjoyMDg1MTA5MTU4fQ.dujnQNHuxC3aHZ408EVhFyUOLHhZkGJkUf5lTWz7tPA',
  WARMUP_ENABLED: 'true',
  WARMUP_CRON_SECRET: process.env.WARMUP_CRON_SECRET || 'IGvlfQQWLxGf4+7bn1qYpaITi+C2ly6Yj0Tl0MHlrUU=',
  WARMUP_DOMAINS: 'usekoritsu.com,trykoritsu.org,koritsuai.com,koritsu.org,trykoritsu.com,kittyklub.co.uk,catcore.co.uk,clarityskin.store,duskglow.store,crypto-store.co,crypto-market.co,jesus-eternal.com,jesus-better.com,christianstore.co,cat-core.com,kitty-klub.com,muslimstore.co',
};

/**
 * Add or update an environment variable
 */
async function setEnvVar(projectName, key, value, target = ['production', 'preview', 'development']) {
  if (!VERCEL_TOKEN) {
    throw new Error('VERCEL_TOKEN environment variable is required');
  }

  try {
    // First, try to update existing variable
    const updateResponse = await fetch(
      `https://api.vercel.com/v9/projects/${projectName}/env/${key}?teamId=${VERCEL_TEAM_ID}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${VERCEL_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value,
          target,
        }),
      }
    );

    if (updateResponse.ok) {
      return { success: true, action: 'updated' };
    }

    // If update fails, try to create new variable
    const createResponse = await fetch(
      `https://api.vercel.com/v10/projects/${projectName}/env?teamId=${VERCEL_TEAM_ID}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${VERCEL_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key,
          value,
          type: key.startsWith('NEXT_PUBLIC_') ? 'plain' : 'encrypted',
          target,
        }),
      }
    );

    const result = await createResponse.json();

    if (!createResponse.ok) {
      throw new Error(result.error?.message || 'Failed to create environment variable');
    }

    return { success: true, action: 'created' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Configure all environment variables
 */
async function configureAllEnvVars() {
  console.log('\n🔧 Vercel Environment Variable Configuration');
  console.log('==========================================\n');

  if (!VERCEL_TOKEN) {
    console.error('❌ ERROR: VERCEL_TOKEN environment variable is required');
    console.log('\n📝 To get your Vercel token:');
    console.log('1. Go to https://vercel.com/account/tokens');
    console.log('2. Create a new token');
    console.log('3. Add it to your .env.local file as VERCEL_TOKEN=your_token_here');
    console.log('4. Run this script again\n');
    process.exit(1);
  }

  console.log(`🔑 Vercel Token: ✅ Set`);
  console.log(`👥 Team ID: ${VERCEL_TEAM_ID}`);
  console.log(`📦 Project Name: ${PROJECT_NAME}`);
  console.log(`📋 Environment Variables: ${Object.keys(ENV_VARS).length}\n`);

  console.log('='.repeat(60));
  console.log('Setting environment variables...');
  console.log('='.repeat(60));

  const results = [];

  for (const [key, value] of Object.entries(ENV_VARS)) {
    process.stdout.write(`\n${key}... `);

    const result = await setEnvVar(PROJECT_NAME, key, value);

    if (result.success) {
      console.log(`✅ ${result.action}`);
      results.push({ key, status: 'success', action: result.action });
    } else {
      console.log(`❌ ${result.error}`);
      results.push({ key, status: 'failed', error: result.error });
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Summary
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 CONFIGURATION SUMMARY');
  console.log('='.repeat(60));

  const successful = results.filter(r => r.status === 'success');
  const failed = results.filter(r => r.status === 'failed');

  console.log(`\n✅ Successful: ${successful.length}/${Object.keys(ENV_VARS).length}`);
  successful.forEach(r => console.log(`   - ${r.key} (${r.action})`));

  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}/${Object.keys(ENV_VARS).length}`);
    failed.forEach(r => console.log(`   - ${r.key}: ${r.error}`));
  }

  console.log('\n\n📝 NEXT STEPS:');
  console.log('=============');
  console.log('1. Verify environment variables in Vercel dashboard');
  console.log(`   https://vercel.com/${VERCEL_TEAM_ID.replace('team_', '')}/${PROJECT_NAME}/settings/environment-variables`);
  console.log('2. Redeploy your project to apply the new environment variables');
  console.log('3. Test the application to ensure everything works\n');
}

// Main execution
if (require.main === module) {
  configureAllEnvVars()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { setEnvVar, configureAllEnvVars };
