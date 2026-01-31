#!/usr/bin/env node

/**
 * Resend Webhook Configuration Script
 *
 * Sets up webhooks for all domains to point to their warmup endpoints
 */

require('dotenv').config({ path: '.env.local' });
const { Resend } = require('resend');

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_VqMqLX2o_HTHcbdfNvXgUeoVZ5wpFZCBf';
const resend = new Resend(RESEND_API_KEY);

const DOMAINS = [
  'kittyklub.co.uk',
  'catcore.co.uk',
  'clarityskin.store',
  'duskglow.store',
  'crypto-store.co',
  'crypto-market.co',
  'jesus-eternal.com',
  'jesus-better.com',
  'christianstore.co',
  'cat-core.com',
  'kitty-klub.com',
  'muslimstore.co',
];

// Webhook events to subscribe to
const WEBHOOK_EVENTS = [
  'email.sent',
  'email.delivered',
  'email.delivery_delayed',
  'email.complained',
  'email.bounced',
  'email.opened',
  'email.clicked',
];

/**
 * Create a webhook for a domain
 */
async function createWebhook(domain) {
  const webhookUrl = `https://${domain}/api/webhooks/resend/warmup`;

  try {
    console.log(`\n📧 ${domain}`);
    console.log(`   Creating webhook: ${webhookUrl}`);

    const { data, error } = await resend.webhooks.create({
      url: webhookUrl,
      events: WEBHOOK_EVENTS,
    });

    if (error) {
      if (error.message && error.message.includes('already exists')) {
        console.log(`   ⚠️  Webhook already exists for this URL`);
        return { domain, status: 'exists', url: webhookUrl };
      }
      throw error;
    }

    console.log(`   ✅ Webhook created`);
    console.log(`   🆔 ID: ${data.id}`);
    console.log(`   🔑 Secret: ${data.secret?.substring(0, 15)}...`);

    return {
      domain,
      status: 'created',
      webhookId: data.id,
      secret: data.secret,
      url: webhookUrl,
    };
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    return {
      domain,
      status: 'failed',
      error: error.message,
      url: webhookUrl,
    };
  }
}

/**
 * List existing webhooks
 */
async function listWebhooks() {
  try {
    console.log('\n📋 Fetching existing webhooks...');
    const { data, error } = await resend.webhooks.list();

    if (error) throw error;

    if (!data || !data.data || data.data.length === 0) {
      console.log('   No existing webhooks found');
      return [];
    }

    console.log(`\n   Found ${data.data.length} existing webhook(s):`);
    data.data.forEach(webhook => {
      console.log(`   - ${webhook.id}: ${webhook.endpoint}`);
      console.log(`     Events: ${webhook.events.join(', ')}`);
    });

    return data.data;
  } catch (error) {
    console.error(`   ❌ Error fetching webhooks: ${error.message}`);
    return [];
  }
}

/**
 * Main function
 */
async function main() {
  console.log('\n🎯 Resend Webhook Setup');
  console.log('======================\n');
  console.log(`🔑 API Key: ${RESEND_API_KEY.substring(0, 10)}...`);
  console.log(`📋 Domains: ${DOMAINS.length}`);
  console.log(`🎫 Events: ${WEBHOOK_EVENTS.join(', ')}\n`);

  // List existing webhooks
  await listWebhooks();

  console.log('\n' + '='.repeat(60));
  console.log('Creating webhooks for domains...');
  console.log('='.repeat(60));

  const results = [];

  for (const domain of DOMAINS) {
    const result = await createWebhook(domain);
    results.push(result);

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 WEBHOOK SETUP SUMMARY');
  console.log('='.repeat(60));

  const created = results.filter(r => r.status === 'created');
  const exists = results.filter(r => r.status === 'exists');
  const failed = results.filter(r => r.status === 'failed');

  console.log(`\n✅ Created: ${created.length}`);
  created.forEach(r => console.log(`   - ${r.domain} (ID: ${r.webhookId})`));

  if (exists.length > 0) {
    console.log(`\n⚠️  Already Exists: ${exists.length}`);
    exists.forEach(r => console.log(`   - ${r.domain}`));
  }

  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}`);
    failed.forEach(r => console.log(`   - ${r.domain}: ${r.error}`));
  }

  // Save webhook secrets to file
  const secretsFile = 'resend-webhook-secrets.json';
  const secrets = {};
  results.forEach(r => {
    if (r.secret) {
      secrets[r.domain] = {
        webhookId: r.webhookId,
        secret: r.secret,
        url: r.url,
      };
    }
  });

  if (Object.keys(secrets).length > 0) {
    const fs = require('fs');
    fs.writeFileSync(secretsFile, JSON.stringify(secrets, null, 2));
    console.log(`\n📄 Webhook secrets saved to: ${secretsFile}`);
    console.log('   ⚠️  Keep this file secure! Add it to .gitignore');
  }

  console.log('\n\n📝 NEXT STEPS:');
  console.log('=============');
  console.log('1. Verify webhooks in Resend dashboard: https://resend.com/webhooks');
  console.log('2. Add webhook secrets to your Vercel project environment variables');
  console.log('3. Test webhooks by sending test emails');
  console.log('4. Monitor webhook deliveries in Resend dashboard');
  console.log('\n');
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createWebhook, listWebhooks };
