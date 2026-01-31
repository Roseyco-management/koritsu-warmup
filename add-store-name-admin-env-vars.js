const https = require('https');

const VERCEL_TOKEN = process.env.VERCEL_TOKEN || 'WRefq5l6O9Km9DAk6oaLoA7E';

// Project mapping: Vercel project name → Store name
const PROJECT_STORE_MAP = {
  'muslimstore-co': 'Muslim Store',
  'kitty-klub-com': 'Kitty Klub',
  'cat-core.com': 'Cat Core',
  'christianstore-co': 'Christian Store',
  'jesus-better-com': 'Jesus Better',
  'jesus-eternal-com': 'Jesus Eternal',
  'crypto-market-co': 'Crypto Market',
  'duskglow-store': 'Duskglow',
  'clarityskin-store': 'Clarity Skin'
};

// Admin email (same for all projects)
const ADMIN_EMAILS = 'arnis.piekus@roseyco.co.uk';

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

async function addStoreNameAndAdmin(projectName, storeName) {
  console.log(`\n📦 Processing project: ${projectName}`);
  console.log(`   Store Name: "${storeName}"`);

  const envVars = [
    {
      key: 'NEXT_PUBLIC_STORE_NAME',
      value: storeName,
      type: 'plain',
      target: ['production', 'preview', 'development']
    },
    {
      key: 'ADMIN_EMAILS',
      value: ADMIN_EMAILS,
      type: 'encrypted',
      target: ['production', 'preview', 'development']
    }
  ];

  try {
    for (const envVar of envVars) {
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
  console.log('🚀 Starting to add Store Name & Admin Email variables to projects...\n');
  console.log(`📋 Total projects: ${Object.keys(PROJECT_STORE_MAP).length}`);
  console.log(`📧 Admin Email (all projects): ${ADMIN_EMAILS}\n`);

  for (const [projectName, storeName] of Object.entries(PROJECT_STORE_MAP)) {
    await addStoreNameAndAdmin(projectName, storeName);
  }

  console.log('\n✨ All done!');
}

main().catch(console.error);
