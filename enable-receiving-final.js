#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_VqMqLX2o_HTHcbdfNvXgUeoVZ5wpFZCBf';
const DOMAIN_ID = '710d9f7a-3e82-4ee1-9eb4-6cba35856ce9'; // kittyklub.co.uk

async function enableReceiving() {
  console.log('📥 Enabling receiving for kittyklub.co.uk (now verified)\n');

  const response = await fetch(`https://api.resend.com/domains/${DOMAIN_ID}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      region: 'us-east-1',
      open_tracking: true,
      click_tracking: true,
      tls: 'enforced',
    }),
  });

  console.log('Status:', response.status);
  const result = await response.json();
  console.log('Response:', JSON.stringify(result, null, 2));

  // Check status again
  console.log('\n✓ Checking updated status...');
  await new Promise(r => setTimeout(r, 2000));

  const checkResponse = await fetch('https://api.resend.com/domains', {
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}` }
  });
  const domains = await checkResponse.json();
  const domain = domains.data?.find(d => d.name === 'kittyklub.co.uk');

  console.log('\nFinal status:');
  console.log('  Status:', domain.status);
  console.log('  Receiving:', domain.capabilities.receiving);
}

enableReceiving().catch(console.error);
