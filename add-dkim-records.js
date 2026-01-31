#!/usr/bin/env node

/**
 * Add DKIM Records to Vercel
 *
 * After running setup-resend-domains.js, you'll get DKIM keys for each domain.
 * Create a dkim-keys.json file with the keys and run this script.
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_TEAM_ID = 'team_seR1ZrsqHRRmzMEbB4JV0fV8';

/**
 * Add DKIM TXT record to Vercel
 */
async function addDkimRecord(domain, dkimValue) {
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
          name: 'resend._domainkey',
          type: 'TXT',
          value: dkimValue,
          ttl: 60,
          comment: 'Resend DKIM signature key',
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      if (result.error?.message?.includes('already exists')) {
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
 * Main function
 */
async function main() {
  console.log('\n🔑 Adding DKIM Records to Vercel');
  console.log('================================\n');

  if (!VERCEL_TOKEN) {
    console.error('❌ ERROR: VERCEL_TOKEN environment variable is required\n');
    process.exit(1);
  }

  // Check for DKIM keys file
  if (!fs.existsSync('dkim-keys.json')) {
    console.error('❌ ERROR: dkim-keys.json file not found\n');
    console.log('📝 Create dkim-keys.json with the following format:\n');
    console.log('{');
    console.log('  "kittyklub.co.uk": "p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQ...",');
    console.log('  "catcore.co.uk": "p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQ...",');
    console.log('  ...');
    console.log('}\n');
    console.log('Get the DKIM keys by running: node setup-resend-domains.js\n');
    process.exit(1);
  }

  const dkimKeys = JSON.parse(fs.readFileSync('dkim-keys.json', 'utf8'));

  console.log(`🔑 Vercel Token: ✅ Set`);
  console.log(`👥 Team ID: ${VERCEL_TEAM_ID}`);
  console.log(`📋 Domains: ${Object.keys(dkimKeys).length}\n`);

  console.log('='.repeat(60));
  console.log('Adding DKIM records...');
  console.log('='.repeat(60));

  const results = [];

  for (const [domain, dkimValue] of Object.entries(dkimKeys)) {
    process.stdout.write(`\n${domain}... `);

    const result = await addDkimRecord(domain, dkimValue);

    if (result.success) {
      if (result.exists) {
        console.log('⚠️  Already exists');
      } else {
        console.log('✅ Added');
      }
      results.push({ domain, status: 'success' });
    } else {
      console.log(`❌ Failed: ${result.error}`);
      results.push({ domain, status: 'failed', error: result.error });
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Summary
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 DKIM CONFIGURATION SUMMARY');
  console.log('='.repeat(60));

  const successful = results.filter(r => r.status === 'success');
  const failed = results.filter(r => r.status === 'failed');

  console.log(`\n✅ Successful: ${successful.length}/${Object.keys(dkimKeys).length}`);
  successful.forEach(r => console.log(`   - ${r.domain}`));

  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}/${Object.keys(dkimKeys).length}`);
    failed.forEach(r => console.log(`   - ${r.domain}: ${r.error}`));
  }

  console.log('\n\n📝 NEXT STEPS:');
  console.log('=============');
  console.log('1. Wait for DNS propagation (5 minutes - 48 hours)');
  console.log('2. Verify domains in Resend dashboard: https://resend.com/domains');
  console.log('3. Check DNS records:');
  console.log('   dig TXT resend._domainkey.kittyklub.co.uk');
  console.log('4. Test email sending between domains\n');
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { addDkimRecord };
