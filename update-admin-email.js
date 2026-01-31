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

const NEW_ADMIN_EMAIL = 'Team@roseyco.co.uk';

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

async function updateAdminEmail(projectName) {
  console.log(`\n📦 Processing project: ${projectName}`);
  console.log(`   New email: ${NEW_ADMIN_EMAIL}`);

  try {
    console.log(`  ➕ Updating ADMIN_EMAILS...`);
    await makeRequest('POST', `/v10/projects/${encodeURIComponent(projectName)}/env?upsert=true`, {
      key: 'ADMIN_EMAILS',
      value: NEW_ADMIN_EMAIL,
      type: 'encrypted',
      target: ['production', 'preview', 'development']
    });
    console.log(`  ✅ ADMIN_EMAILS updated successfully`);
    console.log(`✅ Completed ${projectName}`);
  } catch (error) {
    console.error(`❌ Error processing ${projectName}: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 Starting to update ADMIN_EMAILS for all projects...\n');
  console.log(`📋 Total projects: ${PROJECTS.length}`);
  console.log(`📧 New admin email: ${NEW_ADMIN_EMAIL}\n`);

  for (const project of PROJECTS) {
    await updateAdminEmail(project);
  }

  console.log('\n✨ All done!');
}

main().catch(console.error);
