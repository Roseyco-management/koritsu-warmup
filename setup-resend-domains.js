#!/usr/bin/env node

/**
 * Comprehensive Resend Domain Setup Script
 *
 * This script will:
 * 1. Add domains to Resend
 * 2. Get DNS records from Resend
 * 3. Configure DNS records in Vercel
 * 4. Set up webhooks in Resend
 * 5. Configure environment variables
 */

require('dotenv').config({ path: '.env.local' });
const { Resend } = require('resend');

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_VqMqLX2o_HTHcbdfNvXgUeoVZ5wpFZCBf';
const VERCEL_TOKEN = process.env.VERCEL_TOKEN; // You need to provide this
const VERCEL_TEAM_ID = 'team_seR1ZrsqHRRmzMEbB4JV0fV8';

const resend = new Resend(RESEND_API_KEY);

// Domains to configure
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

// Webhook endpoint pattern
const getWebhookUrl = (domain) => `https://${domain}/api/webhooks/resend/warmup`;

/**
 * Step 1: Add domain to Resend
 */
async function addDomainToResend(domain) {
  try {
    console.log(`\n📧 Adding ${domain} to Resend...`);

    const { data, error } = await resend.domains.create({
      name: domain,
      region: 'us-east-1', // or 'eu-west-1' depending on your preference
    });

    if (error) {
      if (error.message && error.message.includes('already exists')) {
        console.log(`   ⚠️  Domain already exists in Resend, fetching details...`);
        return await getDomainFromResend(domain);
      }
      throw error;
    }

    console.log(`   ✅ Domain added to Resend`);
    console.log(`   📋 Domain ID: ${data.id}`);
    return data;
  } catch (error) {
    console.error(`   ❌ Error adding domain: ${error.message}`);
    throw error;
  }
}

/**
 * Get domain details from Resend
 */
async function getDomainFromResend(domain) {
  try {
    const { data, error } = await resend.domains.list();

    if (error) throw error;

    const domainData = data.data.find(d => d.name === domain);
    if (!domainData) {
      throw new Error(`Domain ${domain} not found in Resend`);
    }

    return domainData;
  } catch (error) {
    console.error(`   ❌ Error fetching domain: ${error.message}`);
    throw error;
  }
}

/**
 * Step 2: Get DNS records from Resend
 */
async function getDnsRecordsFromResend(domainId) {
  try {
    console.log(`   📋 Fetching DNS records...`);

    const { data, error } = await resend.domains.get(domainId);

    if (error) throw error;

    console.log(`   ✅ DNS records retrieved`);
    return data.records;
  } catch (error) {
    console.error(`   ❌ Error fetching DNS records: ${error.message}`);
    throw error;
  }
}

/**
 * Step 3: Configure DNS records in Vercel
 */
async function configureDnsInVercel(domain, records) {
  if (!VERCEL_TOKEN) {
    console.log(`   ⚠️  VERCEL_TOKEN not set, skipping Vercel DNS configuration`);
    console.log(`   📋 Please add these DNS records manually in Vercel:`);
    records.forEach(record => {
      console.log(`      - Type: ${record.type}, Name: ${record.name || '@'}, Value: ${record.value}`);
      if (record.priority) console.log(`        Priority: ${record.priority}`);
    });
    return;
  }

  try {
    console.log(`   🌐 Configuring DNS records in Vercel...`);

    for (const record of records) {
      const recordData = {
        name: record.name || '',
        type: record.type,
        value: record.value,
        ttl: 60,
      };

      if (record.priority) {
        recordData.mxPriority = record.priority;
      }

      const response = await fetch(
        `https://api.vercel.com/v4/domains/${domain}/records?teamId=${VERCEL_TEAM_ID}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${VERCEL_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(recordData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.log(`      ⚠️  ${record.type} record: ${error.error?.message || 'Failed'}`);
      } else {
        console.log(`      ✅ Added ${record.type} record: ${record.name || '@'}`);
      }
    }

    console.log(`   ✅ DNS configuration complete`);
  } catch (error) {
    console.error(`   ❌ Error configuring DNS: ${error.message}`);
  }
}

/**
 * Step 4: Create webhook in Resend
 */
async function createWebhook(domain) {
  try {
    console.log(`   🔗 Creating webhook...`);

    const webhookUrl = getWebhookUrl(domain);

    const { data, error } = await resend.webhooks.create({
      url: webhookUrl,
      events: ['email.sent', 'email.delivered', 'email.bounced', 'email.complained'],
    });

    if (error) {
      if (error.message && error.message.includes('already exists')) {
        console.log(`      ⚠️  Webhook already exists for this URL`);
        return null;
      }
      throw error;
    }

    console.log(`   ✅ Webhook created`);
    console.log(`      URL: ${webhookUrl}`);
    console.log(`      ID: ${data.id}`);
    return data;
  } catch (error) {
    console.error(`   ❌ Error creating webhook: ${error.message}`);
    return null;
  }
}

/**
 * Main setup function
 */
async function setupDomain(domain) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 Setting up: ${domain}`);
  console.log('='.repeat(60));

  try {
    // Step 1: Add domain to Resend
    const domainData = await addDomainToResend(domain);

    // Step 2: Get DNS records
    const dnsRecords = await getDnsRecordsFromResend(domainData.id);

    // Step 3: Configure DNS in Vercel
    await configureDnsInVercel(domain, dnsRecords);

    // Step 4: Create webhook
    await createWebhook(domain);

    console.log(`\n✅ ${domain} setup complete!`);
    return { domain, success: true };
  } catch (error) {
    console.error(`\n❌ ${domain} setup failed: ${error.message}`);
    return { domain, success: false, error: error.message };
  }
}

/**
 * Setup all domains
 */
async function setupAllDomains() {
  console.log('\n🎯 Resend Domain Setup Script');
  console.log('============================\n');
  console.log(`📧 Resend API Key: ${RESEND_API_KEY.substring(0, 10)}...`);
  console.log(`🌐 Vercel Team ID: ${VERCEL_TEAM_ID}`);
  console.log(`🔑 Vercel Token: ${VERCEL_TOKEN ? '✅ Set' : '❌ Not set (DNS config will be manual)'}`);
  console.log(`\n📋 Domains to configure: ${DOMAINS.length}`);

  const results = [];

  for (const domain of DOMAINS) {
    const result = await setupDomain(domain);
    results.push(result);

    // Small delay between domains to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Summary
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 SETUP SUMMARY');
  console.log('='.repeat(60));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`\n✅ Successful: ${successful.length}/${DOMAINS.length}`);
  successful.forEach(r => console.log(`   - ${r.domain}`));

  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}/${DOMAINS.length}`);
    failed.forEach(r => console.log(`   - ${r.domain}: ${r.error}`));
  }

  console.log('\n\n📝 NEXT STEPS:');
  console.log('==============');
  console.log('1. Verify DNS records in Vercel dashboard');
  console.log('2. Wait for DNS propagation (can take up to 48 hours)');
  console.log('3. Verify domains in Resend dashboard');
  console.log('4. Test webhooks by sending test emails');
  console.log('5. Configure environment variables in Vercel project');
  console.log('\n');
}

// Run the script
if (require.main === module) {
  setupAllDomains()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { setupDomain, setupAllDomains };
