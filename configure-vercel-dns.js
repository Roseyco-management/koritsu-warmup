#!/usr/bin/env node

/**
 * Direct Vercel DNS Configuration for Resend
 *
 * This script adds the standard Resend DNS records to each domain in Vercel.
 * Note: You'll need to get the actual DKIM keys from Resend dashboard after adding domains there.
 */

require('dotenv').config({ path: '.env.local' });

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

/**
 * Standard Resend DNS records (DKIM will be unique per domain)
 */
function getStandardResendRecords(domain) {
  return [
    // MX record for inbound email (Resend uses AWS SES)
    {
      type: 'MX',
      name: '',
      value: 'feedback-smtp.us-east-1.amazonses.com.',
      mxPriority: 10,
      comment: 'Resend inbound email',
    },
    // SPF record
    {
      type: 'TXT',
      name: '',
      value: 'v=spf1 include:amazonses.com ~all',
      comment: 'Resend SPF record',
    },
    // DMARC record
    {
      type: 'TXT',
      name: '_dmarc',
      value: 'v=DMARC1; p=none;',
      comment: 'Resend DMARC policy',
    },
    // Note: DKIM record (resend._domainkey) must be added manually
    // after getting the unique key from Resend dashboard
  ];
}

/**
 * Add DNS record to Vercel
 */
async function addDnsRecord(domain, record) {
  if (!VERCEL_TOKEN) {
    throw new Error('VERCEL_TOKEN environment variable is required');
  }

  try {
    const response = await fetch(
      `https://api.vercel.com/v4/domains/${domain}/records?teamId=${VERCEL_TEAM_ID}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${VERCEL_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: record.name || '',
          type: record.type,
          value: record.value,
          ttl: 60,
          ...(record.mxPriority && { mxPriority: record.mxPriority }),
          ...(record.comment && { comment: record.comment }),
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      // Check if record already exists
      if (result.error?.message?.includes('already exists') ||
          result.error?.message?.includes('duplicate')) {
        return { success: true, exists: true };
      }
      throw new Error(result.error?.message || 'Failed to add record');
    }

    return { success: true, exists: false, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Configure DNS for a single domain
 */
async function configureDomainDns(domain) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🌐 Configuring DNS for: ${domain}`);
  console.log('='.repeat(60));

  const records = getStandardResendRecords(domain);
  const results = [];

  for (const record of records) {
    const recordLabel = `${record.type} ${record.name || '@'}`;
    process.stdout.write(`   ${recordLabel}... `);

    const result = await addDnsRecord(domain, record);

    if (result.success) {
      if (result.exists) {
        console.log('⚠️  Already exists');
      } else {
        console.log('✅ Added');
      }
      results.push({ ...record, status: 'success' });
    } else {
      console.log(`❌ Failed: ${result.error}`);
      results.push({ ...record, status: 'failed', error: result.error });
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return results;
}

/**
 * Main function
 */
async function main() {
  console.log('\n🚀 Vercel DNS Configuration for Resend');
  console.log('=====================================\n');

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
  console.log(`📋 Domains: ${DOMAINS.length}\n`);

  const allResults = {};

  for (const domain of DOMAINS) {
    const results = await configureDomainDns(domain);
    allResults[domain] = results;

    // Delay between domains
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 CONFIGURATION SUMMARY');
  console.log('='.repeat(60));

  for (const [domain, results] of Object.entries(allResults)) {
    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'failed').length;
    console.log(`\n${domain}: ${successful} successful, ${failed} failed`);

    const failedRecords = results.filter(r => r.status === 'failed');
    if (failedRecords.length > 0) {
      failedRecords.forEach(r => {
        console.log(`   ❌ ${r.type} ${r.name || '@'}: ${r.error}`);
      });
    }
  }

  console.log('\n\n⚠️  IMPORTANT NEXT STEPS:');
  console.log('========================');
  console.log('1. Add each domain in Resend dashboard: https://resend.com/domains');
  console.log('2. Get the DKIM key for each domain from Resend');
  console.log('3. Add the DKIM TXT record (resend._domainkey) for each domain in Vercel');
  console.log('4. Verify each domain in Resend dashboard');
  console.log('5. Set up webhooks in Resend pointing to:');
  console.log('   https://{domain}/api/webhooks/resend/warmup');
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

module.exports = { configureDomainDns, addDnsRecord };
