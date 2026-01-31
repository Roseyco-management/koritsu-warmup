#!/usr/bin/env node

/**
 * Create Resend Webhooks with Proper Rate Limiting
 *
 * Creates webhooks for outbound and inbound email for all domains
 */

require('dotenv').config({ path: '.env.local' });

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_VqMqLX2o_HTHcbdfNvXgUeoVZ5wpFZCBf';

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

async function createWebhook(endpoint, events, description) {
  try {
    const response = await fetch('https://api.resend.com/webhooks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint,
        events,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message || 'Failed', data };
    }

    return {
      success: true,
      webhookId: data.id,
      secret: data.signing_secret || data.secret,
      endpoint: data.endpoint,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('\n🔗 Creating Resend Webhooks');
  console.log('============================\n');
  console.log(`📋 Domains: ${DOMAINS.length}`);
  console.log(`🔑 API Key: ${RESEND_API_KEY.substring(0, 10)}...`);
  console.log(`\n⏱️  Rate limit: 2 requests/second (using 1 second delays)\n`);

  const allResults = [];

  for (const domain of DOMAINS) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🌐 ${domain}`);
    console.log('='.repeat(60));

    // Webhook 1: Outbound emails
    console.log(`   Creating outbound webhook...`);
    const outboundResult = await createWebhook(
      `https://${domain}/api/webhooks/resend`,
      ['email.sent', 'email.delivered', 'email.delivery_delayed', 'email.complained', 'email.bounced', 'email.opened', 'email.clicked'],
      'Outbound'
    );

    if (outboundResult.success) {
      console.log(`      ✅ Created (ID: ${outboundResult.webhookId})`);
      console.log(`      🔑 Secret: ${outboundResult.secret?.substring(0, 20)}...`);
    } else {
      console.log(`      ❌ Failed: ${outboundResult.error}`);
    }

    allResults.push({ domain, type: 'outbound', ...outboundResult });

    // Wait 1 second to respect rate limit
    await new Promise(r => setTimeout(r, 1000));

    // Webhook 2: Inbound emails
    console.log(`   Creating inbound webhook...`);
    const inboundResult = await createWebhook(
      `https://${domain}/api/webhooks/resend/inbound`,
      ['email.received'],
      'Inbound'
    );

    if (inboundResult.success) {
      console.log(`      ✅ Created (ID: ${inboundResult.webhookId})`);
      console.log(`      🔑 Secret: ${inboundResult.secret?.substring(0, 20)}...`);
    } else {
      console.log(`      ❌ Failed: ${inboundResult.error}`);
    }

    allResults.push({ domain, type: 'inbound', ...inboundResult });

    // Wait 1 second before next domain
    await new Promise(r => setTimeout(r, 1000));
  }

  // Summary
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 WEBHOOK CREATION SUMMARY');
  console.log('='.repeat(60));

  const successful = allResults.filter(r => r.success);
  const failed = allResults.filter(r => !r.success);

  console.log(`\n✅ Successful: ${successful.length}/${allResults.length}`);

  // Save secrets
  const secrets = {};
  allResults.forEach(r => {
    if (r.success && r.secret) {
      if (!secrets[r.domain]) secrets[r.domain] = {};
      secrets[r.domain][r.type] = {
        webhookId: r.webhookId,
        endpoint: r.endpoint,
        secret: r.secret,
      };
    }
  });

  if (Object.keys(secrets).length > 0) {
    const fs = require('fs');
    fs.writeFileSync('resend-webhook-secrets.json', JSON.stringify(secrets, null, 2));
    console.log('\n📄 Webhook secrets saved to: resend-webhook-secrets.json');
    console.log('   ⚠️  Keep this file secure! Add to .gitignore');
  }

  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}/${allResults.length}`);
    failed.forEach(r => {
      console.log(`   - ${r.domain} (${r.type}): ${r.error}`);
    });
  }

  console.log('\n\n📝 NEXT STEPS:');
  console.log('==============');
  console.log('1. Add webhook secrets to environment variables');
  console.log('2. Deploy your application');
  console.log('3. Test webhooks by sending emails');
  console.log('4. Monitor webhook deliveries in Resend dashboard\n');
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}
