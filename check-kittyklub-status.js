#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_VqMqLX2o_HTHcbdfNvXgUeoVZ5wpFZCBf';

async function checkStatus() {
  const response = await fetch('https://api.resend.com/domains', {
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}` }
  });
  const domains = await response.json();
  const domain = domains.data?.find(d => d.name === 'kittyklub.co.uk');

  if (!domain) {
    console.log('❌ Domain not found');
    return;
  }

  console.log('🌐 kittyklub.co.uk - Full Status\n');
  console.log(JSON.stringify(domain, null, 2));
}

checkStatus().catch(console.error);
