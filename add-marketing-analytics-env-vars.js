const https = require('https');

const VERCEL_TOKEN = process.env.VERCEL_TOKEN || 'WRefq5l6O9Km9DAk6oaLoA7E';

// Project identifiers
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

// Marketing and Analytics environment variables (blank/empty for now)
const ENV_VARS = [
  // Marketing (project accounts)
  {
    key: 'KLAVIYO_API_KEY',
    value: '',
    type: 'encrypted',
    target: ['production', 'preview', 'development']
  },
  {
    key: 'META_APP_SECRET',
    value: '',
    type: 'encrypted',
    target: ['production', 'preview', 'development']
  },
  {
    key: 'META_APP_ID',
    value: '',
    type: 'encrypted',
    target: ['production', 'preview', 'development']
  },
  {
    key: 'META_AD_ACCOUNT_ID',
    value: '',
    type: 'encrypted',
    target: ['production', 'preview', 'development']
  },
  {
    key: 'META_ACCESS_TOKEN',
    value: '',
    type: 'encrypted',
    target: ['production', 'preview', 'development']
  },
  // Analytics (project-level)
  {
    key: 'NEXT_PUBLIC_CLARITY_PROJECT_ID',
    value: '',
    type: 'plain',
    target: ['production', 'preview', 'development']
  },
  {
    key: 'GSC_PROPERTY',
    value: '',
    type: 'encrypted',
    target: ['production', 'preview', 'development']
  },
  {
    key: 'GA4_PROPERTY_ID',
    value: '',
    type: 'encrypted',
    target: ['production', 'preview', 'development']
  },
  {
    key: 'GOOGLE_REFRESH_TOKEN',
    value: '',
    type: 'encrypted',
    target: ['production', 'preview', 'development']
  },
  {
    key: 'GOOGLE_ADS_CUSTOMER_ID',
    value: '',
    type: 'encrypted',
    target: ['production', 'preview', 'development']
  }
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

async function addEnvVars(projectName) {
  console.log(`\n📦 Processing project: ${projectName}`);

  try {
    for (const envVar of ENV_VARS) {
      try {
        console.log(`  ➕ Adding ${envVar.key}...`);
        await makeRequest('POST', `/v10/projects/${encodeURIComponent(projectName)}/env?upsert=true`, {
          key: envVar.key,
          value: envVar.value,
          type: envVar.type,
          target: envVar.target
        });
        console.log(`  ✅ ${envVar.key} added successfully`);
      } catch (error) {
        console.log(`  ⚠️  ${envVar.key}: ${error.message}`);
      }
    }

    console.log(`✅ Completed ${projectName}`);
  } catch (error) {
    console.error(`❌ Error processing ${projectName}: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 Starting to add Marketing & Analytics environment variables to projects...\n');
  console.log(`📋 Total projects: ${PROJECTS.length}`);
  console.log('🔑 Adding 10 variables (all blank/empty for now)\n');
  console.log('📝 Marketing: KLAVIYO_API_KEY, META_* (5 vars)');
  console.log('📊 Analytics: CLARITY, GSC, GA4, GOOGLE_* (5 vars)\n');

  for (const project of PROJECTS) {
    await addEnvVars(project);
  }

  console.log('\n✨ All done!');
  console.log('\n📝 Note: All values are blank. Fill them in later for each project.');
}

main().catch(console.error);
