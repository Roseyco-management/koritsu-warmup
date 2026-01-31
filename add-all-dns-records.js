#!/usr/bin/env node

/**
 * Add All DNS Records to Vercel via Direct API Calls
 *
 * Adds MX, SPF, DMARC, and DKIM records for all 12 domains
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_TEAM_ID = 'team_seR1ZrsqHRRmzMEbB4JV0fV8';

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

// Load DKIM keys
const dkimKeys = JSON.parse(fs.readFileSync('dkim-keys.json', 'utf8'));

async function addDnsRecord(domain, record) {
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
      if (result.error?.message?.includes('already exists') ||
          result.error?.message?.includes('duplicate')) {
        return { success: true, exists: true };
      }
      return { success: false, error: result.error?.message || 'Failed' };
    }

    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function addDomainRecords(domain) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🌐 ${domain}`);
  console.log('='.repeat(60));

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

  // Add DKIM if available
  if (dkimKeys[domain]) {
    records.push({
      name: 'resend._domainkey',
      type: 'TXT',
      value: dkimKeys[domain],
      ttl: 60,
      comment: 'Resend DKIM',
    });
  }

  const results = [];

  for (const record of records) {
    const label = `${record.type} ${record.name || '@'}`;
    process.stdout.write(`   ${label}... `);

    const result = await addDnsRecord(domain, record);

    if (result.success) {
      if (result.exists) {
        console.log('⚠️  exists');
      } else {
        console.log('✅ added');
      }
      results.push({ ...record, status: 'success' });
    } else {
      console.log(`❌ ${result.error}`);
      results.push({ ...record, status: 'failed', error: result.error });
    }

    await new Promise(r => setTimeout(r, 300));
  }

  return results;
}

async function main() {
  console.log('\n📋 Adding DNS Records via Vercel API');
  console.log('====================================\n');

  if (!VERCEL_TOKEN) {
    console.error('❌ ERROR: VERCEL_TOKEN environment variable is required\n');
    console.log('To get your Vercel token:');
    console.log('1. Go to https://vercel.com/account/tokens');
    console.log('2. Create a new token');
    console.log('3. Add to .env.local: VERCEL_TOKEN=your_token_here\n');
    process.exit(1);
  }

  console.log(`🔑 Vercel Token: ✅ Set`);
  console.log(`👥 Team ID: ${VERCEL_TEAM_ID}`);
  console.log(`📋 Domains: ${DOMAINS.length}\n`);

  const allResults = {};

  for (const domain of DOMAINS) {
    const results = await addDomainRecords(domain);
    allResults[domain] = results;
    await new Promise(r => setTimeout(r, 500));
  }

  // Summary
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 DNS CONFIGURATION SUMMARY');
  console.log('='.repeat(60));

  let totalSuccess = 0;
  let totalFailed = 0;

  for (const [domain, results] of Object.entries(allResults)) {
    const success = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'failed').length;
    totalSuccess += success;
    totalFailed += failed;

    const status = failed === 0 ? '✅' : '⚠️ ';
    console.log(`\n${status} ${domain}: ${success} added, ${failed} failed`);

    if (failed > 0) {
      results.filter(r => r.status === 'failed').forEach(r => {
        console.log(`     ❌ ${r.type} ${r.name || '@'}: ${r.error}`);
      });
    }
  }

  console.log(`\n\n📊 Total: ${totalSuccess} successful, ${totalFailed} failed`);

  console.log('\n\n📝 NEXT STEPS:');
  console.log('=============');
  console.log('1. Wait for DNS propagation (5 min - 48 hours)');
  console.log('2. Verify domains in Resend: https://resend.com/domains');
  console.log('3. Check DNS records:');
  console.log('   dig MX kittyklub.co.uk');
  console.log('   dig TXT resend._domainkey.kittyklub.co.uk');
  console.log('4. Deploy your application');
  console.log('5. Test email sending and receiving\n');
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { addDnsRecord, addDomainRecords };
