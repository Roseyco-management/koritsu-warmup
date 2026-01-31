#!/usr/bin/env node

/**
 * Trigger domain verification in Resend
 * This forces Resend to re-check DNS records
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

// Get domain details
async function getDomain(domainId) {
  try {
    const response = await fetch(`https://api.resend.com/domains/${domainId}`, {
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get domain');
    }

    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
}

// Get all domains and find by name
async function getDomainByName(domainName) {
  try {
    const response = await fetch('https://api.resend.com/domains', {
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
    });
    const data = await response.json();
    return data.data?.find(d => d.name === domainName);
  } catch (error) {
    return null;
  }
}

// Trigger verification by updating domain
async function triggerVerification(domainId) {
  try {
    // Get current domain settings
    const domain = await getDomain(domainId);

    if (domain.error) {
      return { success: false, error: domain.error };
    }

    // Update domain with verification request
    const response = await fetch(`https://api.resend.com/domains/${domainId}/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Verification endpoint might not exist, try updating domain to trigger check
      const updateResponse = await fetch(`https://api.resend.com/domains/${domainId}`, {
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

      if (!updateResponse.ok) {
        const error = await updateResponse.json();
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Check DNS records status
async function checkDnsStatus(domainId) {
  const domain = await getDomain(domainId);

  if (domain.error) {
    return { error: domain.error };
  }

  const status = {
    verified: domain.status === 'verified',
    dkim: 'not_started',
    spf: 'not_started',
    mx: 'not_started',
  };

  if (domain.records) {
    domain.records.forEach(record => {
      if (record.record === 'DKIM' || record.name?.includes('._domainkey')) {
        status.dkim = record.status || 'not_started';
      }
      if (record.record === 'SPF') {
        status.spf = record.status || 'not_started';
      }
      if (record.record === 'MX') {
        status.mx = record.status || 'not_started';
      }
    });
  }

  return status;
}

async function processDomain(domainName) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🌐 ${domainName}`);
  console.log('='.repeat(60));

  // Get domain ID
  process.stdout.write('   Getting domain... ');
  const domain = await getDomainByName(domainName);

  if (!domain) {
    console.log('❌ Not found');
    return { domain: domainName, success: false, error: 'Not found' };
  }
  console.log(`✅ ${domain.id}`);

  // Check current status
  process.stdout.write('   Checking DNS status... ');
  const status = await checkDnsStatus(domain.id);

  if (status.error) {
    console.log(`❌ ${status.error}`);
  } else {
    console.log('✅');
    console.log(`      Overall: ${status.verified ? '✅ Verified' : '⚠️  Not verified'}`);
    console.log(`      DKIM: ${status.dkim}`);
    console.log(`      SPF: ${status.spf}`);
    console.log(`      MX: ${status.mx}`);
  }

  // Trigger verification
  process.stdout.write('   Triggering verification check... ');
  const result = await triggerVerification(domain.id);

  if (result.success) {
    console.log('✅');
  } else {
    console.log(`⚠️  ${result.error || 'May need manual verification'}`);
  }

  // Wait and check again
  await new Promise(r => setTimeout(r, 2000));

  process.stdout.write('   Re-checking status... ');
  const newStatus = await checkDnsStatus(domain.id);

  if (newStatus.error) {
    console.log(`❌ ${newStatus.error}`);
  } else {
    console.log('✅');
    console.log(`      Overall: ${newStatus.verified ? '✅ Verified' : '⚠️  Not verified'}`);
    console.log(`      DKIM: ${newStatus.dkim}`);
    console.log(`      SPF: ${newStatus.spf}`);
    console.log(`      MX: ${newStatus.mx}`);
  }

  return {
    domain: domainName,
    domainId: domain.id,
    before: status,
    after: newStatus,
    success: true,
  };
}

async function main() {
  console.log('\n🔍 Triggering Domain Verification');
  console.log('==================================\n');
  console.log('This will:');
  console.log('  1. Check current DNS record status');
  console.log('  2. Trigger Resend to re-check DNS records');
  console.log('  3. Verify all settings are enabled\n');

  const results = [];

  for (const domain of DOMAINS) {
    const result = await processDomain(domain);
    results.push(result);
    await new Promise(r => setTimeout(r, 1000));
  }

  // Summary
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('='.repeat(60));

  const verified = results.filter(r => r.after?.verified);
  const notVerified = results.filter(r => !r.after?.verified && r.success);

  if (verified.length > 0) {
    console.log(`\n✅ Verified: ${verified.length}/${DOMAINS.length}`);
    verified.forEach(r => console.log(`   - ${r.domain}`));
  }

  if (notVerified.length > 0) {
    console.log(`\n⚠️  Not yet verified: ${notVerified.length}/${DOMAINS.length}`);
    notVerified.forEach(r => {
      console.log(`   - ${r.domain}:`);
      console.log(`     DKIM: ${r.after.dkim}, SPF: ${r.after.spf}, MX: ${r.after.mx}`);
    });
  }

  console.log('\n\n📝 WHAT TO DO NEXT:');
  console.log('==================');

  if (notVerified.length > 0) {
    console.log('\n⏱️  DNS records are added but not propagated yet.');
    console.log('\nOption 1 - Wait for DNS propagation (recommended):');
    console.log('  • Wait 5-30 minutes for DNS to propagate');
    console.log('  • Then run this script again');
    console.log('  • Or click "Verify" button in Resend dashboard');

    console.log('\nOption 2 - Check DNS manually:');
    console.log('  • Run: dig MX send.kittyklub.co.uk');
    console.log('  • Run: dig TXT send.kittyklub.co.uk');
    console.log('  • Run: dig TXT resend._domainkey.kittyklub.co.uk');

    console.log('\nOption 3 - Manual verification in Resend:');
    console.log('  • Go to: https://resend.com/domains');
    console.log('  • Click each domain');
    console.log('  • Click "Verify" button');
    console.log('  • Wait a moment and refresh page');
  } else {
    console.log('\n✅ All domains are verified!');
    console.log('   You can now send emails with click tracking enabled.');
  }

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
