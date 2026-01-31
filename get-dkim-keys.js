#!/usr/bin/env node

/**
 * Get DKIM keys from Resend for all domains
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

async function main() {
  console.log('\n📋 Getting DKIM keys from Resend\n');

  // Get all domains
  const response = await fetch('https://api.resend.com/domains', {
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
  });

  const data = await response.json();
  const dkimKeys = {};

  for (const domain of DOMAINS) {
    const domainData = data.data.find(d => d.name === domain);

    if (!domainData) {
      console.log(`❌ ${domain}: Not found in Resend`);
      continue;
    }

    // Get domain details including DNS records
    const detailResponse = await fetch(`https://api.resend.com/domains/${domainData.id}`, {
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
    });

    const detailData = await detailResponse.json();

    // Find DKIM record
    const dkimRecord = detailData.records?.find(r =>
      r.record === 'DKIM' || r.name?.includes('._domainkey')
    );

    if (dkimRecord) {
      dkimKeys[domain] = dkimRecord.value;
      console.log(`✅ ${domain}: ${dkimRecord.value.substring(0, 50)}...`);
    } else {
      console.log(`⚠️  ${domain}: DKIM key not found`);
    }

    await new Promise(r => setTimeout(r, 600));
  }

  // Save to file
  const fs = require('fs');
  fs.writeFileSync('dkim-keys.json', JSON.stringify(dkimKeys, null, 2));
  console.log(`\n📄 DKIM keys saved to: dkim-keys.json\n`);
}

main().catch(console.error);
