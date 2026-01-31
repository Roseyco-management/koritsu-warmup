const https = require('https');

const VERCEL_TOKEN = process.env.VERCEL_TOKEN || 'WRefq5l6O9Km9DAk6oaLoA7E';

const PROJECTS = [
  'muslimstore-co',
  'kitty-klub-com',
  'cat-core.com',
  'christianstore-co',
  'jesus-better-com',
  'jesus-eternal-com',
  'crypto-market-co',
  'duskglow-store',
  'clarityskin-store'
];

const EXPECTED_VARS = [
  // Supabase
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  // Stripe
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  // Resend
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
  'RESEND_WEBHOOK_SECRET',
  'RESEND_INBOUND_WEBHOOK_SECRET',
  // Project Identity
  'NEXT_PUBLIC_STORE_NAME',
  'ADMIN_EMAILS',
  // Deployment
  'NEXT_PUBLIC_APP_URL',
  'SITE_URL',
  'NEXT_PUBLIC_STORE_LOGO_URL',
  'PAGESPEED_TEST_URL',
  // Google Services
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_MAPS_API_KEY',
  'GOOGLE_REFRESH_TOKEN',
  'GOOGLE_ADS_CUSTOMER_ID',
  'GOOGLE_ADS_DEVELOPER_TOKEN',
  'GOOGLE_ADS_LOGIN_CUSTOMER_ID',
  // Marketing
  'KLAVIYO_API_KEY',
  'META_APP_SECRET',
  'META_APP_ID',
  'META_AD_ACCOUNT_ID',
  'META_ACCESS_TOKEN',
  // Analytics
  'NEXT_PUBLIC_CLARITY_PROJECT_ID',
  'GSC_PROPERTY',
  'GA4_PROPERTY_ID',
  // Third-party
  'CJ_API_KEY',
  'EXCHANGERATE_API_KEY',
  'GELATO_STORE_ID',
  'PRINTFUL_CLIENT_ID',
  // Performance
  'PAGESPEED_API_KEY',
  'NODE_ENV'
];

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.vercel.com',
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${parsed.error?.message || data}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function verifyProject(projectName) {
  console.log(`\n📦 Verifying: ${projectName}`);

  try {
    const result = await makeRequest(`/v10/projects/${encodeURIComponent(projectName)}/env`);
    const envKeys = result.envs.map(env => env.key);

    const missing = EXPECTED_VARS.filter(varName => !envKeys.includes(varName));
    const extra = envKeys.filter(key => !EXPECTED_VARS.includes(key));

    if (missing.length === 0 && extra.length === 0) {
      console.log(`   ✅ All ${EXPECTED_VARS.length} expected variables present`);
      return { project: projectName, status: 'complete', missing: [], extra: [] };
    } else {
      if (missing.length > 0) {
        console.log(`   ⚠️  Missing ${missing.length} variables: ${missing.join(', ')}`);
      }
      if (extra.length > 0) {
        console.log(`   ℹ️  Extra ${extra.length} variables: ${extra.join(', ')}`);
      }
      return { project: projectName, status: 'incomplete', missing, extra };
    }
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return { project: projectName, status: 'error', error: error.message };
  }
}

async function main() {
  console.log('🔍 Verifying Environment Variables Across All Projects');
  console.log('=======================================================');
  console.log(`Expected variables per project: ${EXPECTED_VARS.length}`);

  const results = [];

  for (const project of PROJECTS) {
    const result = await verifyProject(project);
    results.push(result);
  }

  console.log('\n\n📊 Summary Report');
  console.log('=======================================================');

  const complete = results.filter(r => r.status === 'complete');
  const incomplete = results.filter(r => r.status === 'incomplete');
  const errors = results.filter(r => r.status === 'error');

  console.log(`✅ Complete: ${complete.length}/${PROJECTS.length}`);
  console.log(`⚠️  Incomplete: ${incomplete.length}/${PROJECTS.length}`);
  console.log(`❌ Errors: ${errors.length}/${PROJECTS.length}`);

  if (incomplete.length > 0) {
    console.log('\nIncomplete Projects:');
    incomplete.forEach(r => {
      console.log(`  - ${r.project}: Missing ${r.missing.length} variables`);
    });
  }

  if (errors.length > 0) {
    console.log('\nProjects with Errors:');
    errors.forEach(r => {
      console.log(`  - ${r.project}: ${r.error}`);
    });
  }

  console.log('\n=======================================================');

  if (complete.length === PROJECTS.length) {
    console.log('✨ All projects verified successfully!');
  } else {
    console.log('⚠️  Some projects need attention. Review the report above.');
  }
}

main().catch(console.error);
