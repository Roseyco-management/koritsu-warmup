const https = require('https');

const VERCEL_TOKEN = process.env.VERCEL_TOKEN || 'WRefq5l6O9Km9DAk6oaLoA7E';
const TEAM_SLUG = 'rosey-co-team';

// 9 E-commerce projects
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

// Project-level variable keys to remove
const PROJECT_LEVEL_KEYS = [
  'SITE_URL',
  'SHOPIFY_WEBHOOK_SECRET',
  'SHOPIFY_HUB_STORE',
  'SHOPIFY_CLIENT_ID',
  'SHOPIFY_CLIENT_SECRET',
  'SHOPIFY_ADMIN_ACCESS_TOKEN',
  'NEXT_PUBLIC_CLARITY_PROJECT_ID',
  'PAGESPEED_TEST_URL',
  'GOOGLE_ADS_CUSTOMER_ID',
  'META_ACCESS_TOKEN',
  'META_AD_ACCOUNT_ID',
  'META_APP_ID',
  'META_APP_SECRET',
  'KLAVIYO_API_KEY',
  'CRON_SECRET',
  'GOOGLE_REFRESH_TOKEN',
  'GA4_PROPERTY_ID',
  'GSC_PROPERTY',
  'NEXT_PUBLIC_STORE_NAME',
  'NEXT_PUBLIC_STORE_LOGO_URL',
  'GELATO_API_KEY',
  'GELATO_WEBHOOK',
  'PRINTFUL_CLIENT_SECRET',
  'ADMIN_EMAILS',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_APP_URL',
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
];

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.vercel.com',
      path: path,
      method: method,
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
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function getProjectEnvVars(projectName) {
  const response = await makeRequest('GET', `/v10/projects/${encodeURIComponent(projectName)}/env?slug=${TEAM_SLUG}`);
  return response.envs;
}

async function deleteEnvVar(projectName, envVarId) {
  await makeRequest('DELETE', `/v10/projects/${encodeURIComponent(projectName)}/env/${envVarId}?slug=${TEAM_SLUG}`);
}

async function processProject(project) {
  console.log(`📦 Processing project: ${project}`);

  try {
    // Get all env vars for this project
    const envVars = await getProjectEnvVars(project);
    const varsToDelete = envVars.filter(env => PROJECT_LEVEL_KEYS.includes(env.key));

    console.log(`  Found ${varsToDelete.length} project-level variables to remove`);

    let successCount = 0;
    let errorCount = 0;

    for (const envVar of varsToDelete) {
      try {
        await deleteEnvVar(project, envVar.id);
        successCount++;
        console.log(`  ✅ Removed ${envVar.key}`);

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 150));
      } catch (error) {
        errorCount++;
        console.log(`  ⚠️  ${envVar.key}: ${error.message}`);
      }
    }

    console.log(`\n✅ Completed ${project}: ${successCount} removed, ${errorCount} errors\n`);
    return { successCount, errorCount };
  } catch (error) {
    console.error(`❌ Error processing ${project}: ${error.message}\n`);
    return { successCount: 0, errorCount: 0 };
  }
}

async function main() {
  console.log('🔄 Removing project-level environment variables from 9 e-commerce projects...\n');

  let totalSuccess = 0;
  let totalErrors = 0;

  for (const project of PROJECTS) {
    const result = await processProject(project);
    totalSuccess += result.successCount;
    totalErrors += result.errorCount;

    // Wait between projects
    if (PROJECTS.indexOf(project) < PROJECTS.length - 1) {
      console.log('⏳ Waiting 5 seconds before next project...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  console.log('✨ All done!');
  console.log(`\n📊 Summary: ${totalSuccess} variables removed, ${totalErrors} errors across ${PROJECTS.length} projects`);
}

main().catch(console.error);
