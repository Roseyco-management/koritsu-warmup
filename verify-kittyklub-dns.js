#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_VqMqLX2o_HTHcbdfNvXgUeoVZ5wpFZCBf';
const DOMAIN_ID = '710d9f7a-3e82-4ee1-9eb4-6cba35856ce9'; // kittyklub.co.uk

async function tryVerify() {
  console.log('🔍 Attempting to trigger DNS verification for kittyklub.co.uk\n');

  // Try verify endpoint (POST)
  console.log('Trying: POST /domains/{id}/verify');
  let response = await fetch(`https://api.resend.com/domains/${DOMAIN_ID}/verify`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  console.log('Status:', response.status, response.statusText);
  const result = await response.json();
  console.log('Response:', JSON.stringify(result, null, 2));
}

tryVerify().catch(console.error);
