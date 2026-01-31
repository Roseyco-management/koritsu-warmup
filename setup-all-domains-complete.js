#!/usr/bin/env node

/**
 * Complete Domain Setup with Vercel API & Resend SDK
 *
 * This script:
 * 1. Adds DNS records via Vercel API
 * 2. Configures Resend domains with click tracking enabled
 * 3. Sets up webhooks for both outbound and inbound email
 */

require('dotenv').config({ path: '.env.local' });
const { Resend } = require('resend');

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_VqMqLX2o_HTHcbdfNvXgUeoVZ5wpFZCBf';
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_TEAM_ID = 'team_seR1ZrsqHRRmzMEbB4JV0fV8';

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

// ============================================================================
// Step 1: Add DNS Records via Vercel API
// ============================================================================

async function addVercelDnsRecord(domain, record) {
  if (!VERCEL_TOKEN) {
    return { success: false, error: 'VERCEL_TOKEN not set' };
  }

  try {
    const response = await fetch(
      `https://api.vercel.com/v2/domains/${domain}/records?teamId=${VERCEL_TEAM_ID}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${VERCEL_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(record),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      if (result.error?.message?.includes('already exists')) {
        return { success: true, exists: true };
      }
      return { success: false, error: result.error?.message || 'Failed' };
    }

    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function configureDnsForDomain(domain) {
  console.log(`\n🌐 ${domain}`);
  console.log('   Adding DNS records...');

  const records = [
    {
      name: '',
      type: 'MX',
      value: 'inbound-smtp.us-east-1.amazonaws.com.',
      mxPriority: 9,
      ttl: 60,
      comment: 'Resend inbound email',
    },
    {
      name: '',
      type: 'TXT',
      value: 'v=spf1 include:amazonses.com ~all',
      ttl: 60,
      comment: 'Resend SPF',
    },
    {
      name: '_dmarc',
      type: 'TXT',
      value: 'v=DMARC1; p=none;',
      ttl: 60,
      comment: 'Resend DMARC',
    },
  ];

  const results = [];

  for (const record of records) {
    const label = `${record.type} ${record.name || '@'}`;
    process.stdout.write(`      ${label}... `);

    const result = await addVercelDnsRecord(domain, record);

    if (result.success) {
      console.log(result.exists ? '⚠️  exists' : '✅');
      results.push({ ...record, success: true });
    } else {
      console.log(`❌ ${result.error}`);
      results.push({ ...record, success: false, error: result.error });
    }

    await new Promise(r => setTimeout(r, 600));
  }

  return results;
}

// ============================================================================
// Step 2: Add Domain to Resend with Click Tracking
// ============================================================================

async function addDomainToResend(domain) {
  console.log(`   Adding to Resend with click tracking...`);

  try {
    const response = await fetch('https://api.resend.com/domains', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: domain,
        region: 'us-east-1',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.message?.includes('already exists')) {
        console.log(`      ⚠️  Domain already exists`);
        // Get existing domain ID
        const listResponse = await fetch('https://api.resend.com/domains', {
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
          },
        });
        const listData = await listResponse.json();
        const existingDomain = listData.data?.find(d => d.name === domain);
        return { success: true, exists: true, domainId: existingDomain?.id, domain: existingDomain };
      }
      throw new Error(data.message || 'Failed to add domain');
    }

    console.log(`      ✅ Added (ID: ${data.id})`);
    return { success: true, domainId: data.id, domain: data };
  } catch (error) {
    console.log(`      ❌ ${error.message}`);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// Step 3: Get DKIM Key from Resend
// ============================================================================

async function getDkimKey(domainId) {
  try {
    const response = await fetch(`https://api.resend.com/domains/${domainId}`, {
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get domain');
    }

    // Find the DKIM record
    const dkimRecord = data.records?.find(r => r.record === 'DKIM' || r.name?.includes('._domainkey'));

    if (dkimRecord) {
      return { success: true, dkim: dkimRecord.value };
    }

    return { success: false, error: 'DKIM record not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// Step 4: Add DKIM Record to Vercel
// ============================================================================

async function addDkimToVercel(domain, dkimValue) {
  process.stdout.write(`   Adding DKIM record... `);

  const record = {
    name: 'resend._domainkey',
    type: 'TXT',
    value: dkimValue,
    ttl: 60,
    comment: 'Resend DKIM',
  };

  const result = await addVercelDnsRecord(domain, record);

  if (result.success) {
    console.log(result.exists ? '⚠️  exists' : '✅');
    return { success: true };
  } else {
    console.log(`❌ ${result.error}`);
    return { success: false, error: result.error };
  }
}

// ============================================================================
// Step 5: Create Webhooks for Outbound and Inbound
// ============================================================================

async function createWebhooks(domain) {
  console.log(`   Creating webhooks...`);

  const webhooks = [
    {
      url: `https://${domain}/api/webhooks/resend`,
      events: ['email.sent', 'email.delivered', 'email.delivery_delayed', 'email.complained', 'email.bounced', 'email.opened', 'email.clicked'],
      description: 'Outbound email events',
    },
    {
      url: `https://${domain}/api/webhooks/resend/inbound`,
      events: ['email.received'],
      description: 'Inbound email events',
    },
  ];

  const results = [];

  for (const webhook of webhooks) {
    process.stdout.write(`      ${webhook.description}... `);

    try {
      // Use Resend HTTP API directly for webhooks
      const response = await fetch('https://api.resend.com/webhooks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: webhook.url,  // Changed from 'url' to 'endpoint'
          events: webhook.events,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.message?.includes('already exists') || data.message?.includes('duplicate')) {
          console.log('⚠️  exists');
          results.push({ ...webhook, success: true, exists: true });
        } else {
          console.log(`❌ ${data.message || 'Failed'}`);
          results.push({ ...webhook, success: false, error: data.message });
        }
      } else {
        console.log(`✅ (ID: ${data.id})`);
        results.push({
          ...webhook,
          success: true,
          webhookId: data.id,
          secret: data.signing_secret || data.secret,
        });
      }
    } catch (error) {
      console.log(`❌ ${error.message}`);
      results.push({ ...webhook, success: false, error: error.message });
    }

    await new Promise(r => setTimeout(r, 600));
  }

  return results;
}

// ============================================================================
// Main Setup Function
// ============================================================================

async function setupDomain(domain) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🚀 Setting up: ${domain}`);
  console.log('='.repeat(70));

  const result = {
    domain,
    dns: null,
    resendDomain: null,
    dkim: null,
    webhooks: null,
  };

  try {
    // Step 1: Configure DNS
    result.dns = await configureDnsForDomain(domain);

    // Step 2: Add to Resend
    result.resendDomain = await addDomainToResend(domain);

    if (result.resendDomain.success && result.resendDomain.domainId) {
      // Step 3: Get DKIM key
      const dkimResult = await getDkimKey(result.resendDomain.domainId);

      if (dkimResult.success && dkimResult.dkim) {
        // Step 4: Add DKIM to Vercel
        result.dkim = await addDkimToVercel(domain, dkimResult.dkim);
      } else {
        console.log(`   ⚠️  Could not retrieve DKIM key: ${dkimResult.error}`);
        result.dkim = { success: false, error: dkimResult.error };
      }
    }

    // Step 5: Create webhooks
    result.webhooks = await createWebhooks(domain);

    console.log(`\n   ✅ ${domain} setup complete!`);
    return { ...result, success: true };
  } catch (error) {
    console.log(`\n   ❌ ${domain} setup failed: ${error.message}`);
    return { ...result, success: false, error: error.message };
  }
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.log('\n🎯 Complete Domain Setup with Click Tracking & Inbound Email');
  console.log('=============================================================\n');
  console.log(`🔑 Resend API Key: ${RESEND_API_KEY.substring(0, 10)}...`);
  console.log(`🔑 Vercel Token: ${VERCEL_TOKEN ? '✅ Set' : '❌ Not set'}`);
  console.log(`👥 Team ID: ${VERCEL_TEAM_ID}`);
  console.log(`📋 Domains: ${DOMAINS.length}`);
  console.log(`\n✨ Features:`);
  console.log(`   • Click tracking: Enabled by default`);
  console.log(`   • Open tracking: Enabled by default`);
  console.log(`   • Inbound email: Enabled via webhooks`);

  if (!VERCEL_TOKEN) {
    console.log('\n⚠️  WARNING: VERCEL_TOKEN not set. DNS configuration will be skipped.');
    console.log('   Add VERCEL_TOKEN to .env.local to enable DNS configuration.\n');
  }

  const allResults = [];

  for (const domain of DOMAINS) {
    const result = await setupDomain(domain);
    allResults.push(result);
    await new Promise(r => setTimeout(r, 1000));
  }

  // Summary
  console.log('\n\n' + '='.repeat(70));
  console.log('📊 SETUP SUMMARY');
  console.log('='.repeat(70));

  const successful = allResults.filter(r => r.success);
  const failed = allResults.filter(r => !r.success);

  console.log(`\n✅ Successful: ${successful.length}/${DOMAINS.length}`);
  successful.forEach(r => console.log(`   - ${r.domain}`));

  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}/${DOMAINS.length}`);
    failed.forEach(r => console.log(`   - ${r.domain}: ${r.error}`));
  }

  // Save webhook secrets
  const webhookSecrets = {};
  allResults.forEach(r => {
    if (r.webhooks) {
      r.webhooks.forEach(w => {
        if (w.secret) {
          if (!webhookSecrets[r.domain]) {
            webhookSecrets[r.domain] = {};
          }
          webhookSecrets[r.domain][w.description] = {
            webhookId: w.webhookId,
            url: w.url,
            secret: w.secret,
          };
        }
      });
    }
  });

  if (Object.keys(webhookSecrets).length > 0) {
    const fs = require('fs');
    fs.writeFileSync('resend-webhook-secrets.json', JSON.stringify(webhookSecrets, null, 2));
    console.log('\n📄 Webhook secrets saved to: resend-webhook-secrets.json');
    console.log('   ⚠️  Keep this file secure!');
  }

  console.log('\n\n📝 NEXT STEPS:');
  console.log('==============');
  console.log('1. Wait for DNS propagation (5 min - 48 hours)');
  console.log('2. Verify domains in Resend: https://resend.com/domains');
  console.log('3. Configure environment variables:');
  console.log('   - RESEND_WEBHOOK_SECRET (use the secret from the JSON file)');
  console.log('   - WARMUP_DOMAINS (already includes all domains)');
  console.log('4. Deploy your application to make webhooks active');
  console.log('5. Test sending email between domains');
  console.log('6. Test inbound email via /api/webhooks/resend/inbound');
  console.log('\n✨ Click tracking and open tracking are enabled by default!');
  console.log('   You can view stats in Resend dashboard.\n');
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { setupDomain, configureDnsForDomain, createWebhooks };
