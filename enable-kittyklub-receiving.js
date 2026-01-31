#!/usr/bin/env node

/**
 * Enable Receiving toggle for kittyklub.co.uk
 */

require('dotenv').config({ path: '.env.local' });

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_VqMqLX2o_HTHcbdfNvXgUeoVZ5wpFZCBf';

async function enableReceiving() {
  // Get domain ID
  const listResponse = await fetch('https://api.resend.com/domains', {
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}` }
  });
  const domains = await listResponse.json();
  const domain = domains.data?.find(d => d.name === 'kittyklub.co.uk');

  if (!domain) {
    console.log('❌ Domain not found');
    return;
  }

  console.log('🌐 kittyklub.co.uk');
  console.log('Domain ID:', domain.id);
  console.log('\nCurrent settings:');
  console.log('  Region:', domain.region || 'not set');
  console.log('  Status:', domain.status);

  // Enable receiving with all settings
  console.log('\n📥 Enabling receiving toggle...');
  const updateResponse = await fetch(`https://api.resend.com/domains/${domain.id}`, {
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

  if (!updateResponse.ok) {
    const error = await updateResponse.json();
    console.log('❌ Error:', JSON.stringify(error, null, 2));
  } else {
    const result = await updateResponse.json();
    console.log('✅ Success!');
    console.log('\nUpdated settings:');
    console.log('  Region:', result.region);
    console.log('  Open Tracking:', result.open_tracking);
    console.log('  Click Tracking:', result.click_tracking);
    console.log('  TLS:', result.tls);
    console.log('\n📝 Note: Refresh the Resend dashboard to see the toggle change to ON');
  }
}

enableReceiving().catch(console.error);
