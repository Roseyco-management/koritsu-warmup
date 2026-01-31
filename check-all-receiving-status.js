#!/usr/bin/env node

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

async function checkAll() {
  const response = await fetch('https://api.resend.com/domains', {
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}` }
  });
  const data = await response.json();

  console.log('📊 Receiving Status for All Domains\n');
  console.log('Domain                 | Status      | Receiving');
  console.log('-'.repeat(55));

  for (const domainName of DOMAINS) {
    const domain = data.data?.find(d => d.name === domainName);
    if (domain) {
      const status = domain.status.padEnd(11);
      const receiving = domain.capabilities.receiving;
      const icon = receiving === 'enabled' ? '✅' : '❌';
      console.log(`${domainName.padEnd(22)} | ${status} | ${icon} ${receiving}`);
    }
  }
}

checkAll().catch(console.error);
