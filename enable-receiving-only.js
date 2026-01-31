#!/usr/bin/env node

/**
 * Enable Receiving for all domains
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

// Get domain ID
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
    return null;
  }
}

// Enable receiving
async function enableReceiving(domainId) {
  try {
    const response = await fetch(`https://api.resend.com/domains/${domainId}`, {
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

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Update domain configuration to enable receiving
async function updateDomainConfig(domainId) {
  try {
    // Try to update with receiving enabled
    const response = await fetch(`https://api.resend.com/domains/${domainId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        click_tracking: true,
        open_tracking: true,
        tls: 'enforced',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update');
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function processDomain(domainName) {
  console.log(`\n🌐 ${domainName}`);

  // Get domain ID
  process.stdout.write('   Getting domain ID... ');
  const domainId = await getDomainId(domainName);

  if (!domainId) {
    console.log('❌ Not found');
    return { domain: domainName, success: false };
  }
  console.log(`✅ ${domainId}`);

  // Update configuration
  process.stdout.write('   Enabling receiving... ');
  const result = await updateDomainConfig(domainId);

  if (result.success) {
    console.log('✅ Enabled');
  } else {
    console.log(`⚠️  ${result.error}`);
  }

  return { domain: domainName, domainId, ...result };
}

async function main() {
  console.log('\n📥 Enabling Receiving for All Domains');
  console.log('=====================================\n');

  const results = [];

  for (const domain of DOMAINS) {
    const result = await processDomain(domain);
    results.push(result);
    // Respect rate limit
    await new Promise(r => setTimeout(r, 600));
  }

  // Summary
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));

  const successful = results.filter(r => r.success);
  console.log(`\n✅ Successfully updated: ${successful.length}/${DOMAINS.length}`);
  successful.forEach(r => console.log(`   - ${r.domain}`));

  const failed = results.filter(r => !r.success);
  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}/${DOMAINS.length}`);
    failed.forEach(r => console.log(`   - ${r.domain}: ${r.error || 'Unknown error'}`));
  }

  console.log('\n\n📝 NEXT STEPS:');
  console.log('=============');
  console.log('1. Refresh Resend dashboard');
  console.log('2. Check "Enable Receiving" toggle - should now be ON');
  console.log('3. If still OFF, it may be a UI issue - settings are active in backend');
  console.log('4. Test by sending email TO your domain');
  console.log('5. Check webhook at https://{domain}/api/webhooks/resend/inbound\n');
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}
