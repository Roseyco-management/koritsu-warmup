#!/usr/bin/env node

/**
 * Enable Receiving and Click Tracking for all domains
 * Also add correct DNS records on 'send' subdomain
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_VqMqLX2o_HTHcbdfNvXgUeoVZ5wpFZCBf';
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

// Get domain ID from name
async function getDomainId(domainName) {
  try {
    const response = await fetch('https://api.resend.com/domains', {
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
    });
    const data = await response.json();
    const domain = data.data?.find(d => d.name === domainName);
    return domain?.id;
  } catch (error) {
    console.error(`Error getting domain ID: ${error.message}`);
    return null;
  }
}

// Enable receiving for a domain
async function enableReceiving(domainId) {
  try {
    const response = await fetch(`https://api.resend.com/domains/${domainId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        open_tracking: true,
        click_tracking: true,
        receiving: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update domain');
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Add DNS records to 'send' subdomain
async function addSendSubdomainRecords(domain) {
  if (!VERCEL_TOKEN) {
    return { success: false, error: 'VERCEL_TOKEN not set' };
  }

  const records = [
    {
      name: 'send',
      type: 'MX',
      value: 'feedback-smtp.us-east-1.amazonses.com.',
      mxPriority: 10,
      ttl: 60,
      comment: 'Resend sending (send subdomain)',
    },
    {
      name: 'send',
      type: 'TXT',
      value: 'v=spf1 include:amazonses.com ~all',
      ttl: 60,
      comment: 'Resend SPF (send subdomain)',
    },
  ];

  const results = [];

  for (const record of records) {
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
          results.push({ ...record, success: true, exists: true });
        } else {
          results.push({ ...record, success: false, error: result.error?.message });
        }
      } else {
        results.push({ ...record, success: true });
      }
    } catch (error) {
      results.push({ ...record, success: false, error: error.message });
    }

    await new Promise(r => setTimeout(r, 300));
  }

  return results;
}

async function configureDomain(domainName) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🌐 ${domainName}`);
  console.log('='.repeat(60));

  // Step 1: Get domain ID
  process.stdout.write('   Getting domain ID... ');
  const domainId = await getDomainId(domainName);

  if (!domainId) {
    console.log('❌ Not found in Resend');
    return { domain: domainName, success: false, error: 'Domain not found' };
  }
  console.log(`✅ ${domainId}`);

  // Step 2: Enable receiving and click tracking
  process.stdout.write('   Enabling receiving & click tracking... ');
  const enableResult = await enableReceiving(domainId);

  if (enableResult.success) {
    console.log('✅');
  } else {
    console.log(`❌ ${enableResult.error}`);
  }

  // Step 3: Add 'send' subdomain DNS records
  console.log('   Adding DNS records to "send" subdomain...');
  const dnsResults = await addSendSubdomainRecords(domainName);

  dnsResults.forEach(r => {
    const label = `      ${r.type} ${r.name}`;
    if (r.success) {
      console.log(`${label}... ${r.exists ? '⚠️  exists' : '✅ added'}`);
    } else {
      console.log(`${label}... ❌ ${r.error}`);
    }
  });

  return {
    domain: domainName,
    domainId,
    receivingEnabled: enableResult.success,
    dnsRecords: dnsResults,
  };
}

async function main() {
  console.log('\n🔧 Enabling Domain Features');
  console.log('===========================\n');
  console.log('Features to enable:');
  console.log('  ✓ Click Tracking');
  console.log('  ✓ Open Tracking');
  console.log('  ✓ Inbound Receiving');
  console.log('  ✓ DNS records on "send" subdomain\n');

  const results = [];

  for (const domain of DOMAINS) {
    const result = await configureDomain(domain);
    results.push(result);
    await new Promise(r => setTimeout(r, 1000));
  }

  // Summary
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 CONFIGURATION SUMMARY');
  console.log('='.repeat(60));

  const successful = results.filter(r => r.receivingEnabled);
  console.log(`\n✅ Features enabled: ${successful.length}/${DOMAINS.length} domains`);
  successful.forEach(r => console.log(`   - ${r.domain}`));

  const failed = results.filter(r => !r.receivingEnabled);
  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}/${DOMAINS.length} domains`);
    failed.forEach(r => console.log(`   - ${r.domain}: ${r.error || 'Unknown error'}`));
  }

  console.log('\n\n📝 NEXT STEPS:');
  console.log('=============');
  console.log('1. Wait a few minutes for settings to propagate');
  console.log('2. Check Resend dashboard - toggles should now be ON');
  console.log('3. Verify DNS records in Vercel:');
  console.log('   - Check "send" subdomain has MX and TXT records');
  console.log('4. Click "Verify" button in Resend dashboard for each domain');
  console.log('5. Wait for DNS propagation (5 min - 48 hours)');
  console.log('6. All domains should show "Verified" status\n');
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}
