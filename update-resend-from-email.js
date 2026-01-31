const https = require('https');

const VERCEL_TOKEN = process.env.VERCEL_TOKEN || 'WRefq5l6O9Km9DAk6oaLoA7E';

// Project mapping with updated from email format
const PROJECT_EMAIL_MAP = {
  'muslimstore-co': {
    domain: 'muslimstore.co',
    fromEmail: 'team+muslimstore@muslimstore.co'
  },
  'kitty-klub-com': {
    domain: 'kitty-klub.com',
    fromEmail: 'team+kitty-klub@kitty-klub.com'
  },
  'cat-core.com': {
    domain: 'cat-core.com',
    fromEmail: 'team+cat-core@cat-core.com'
  },
  'christianstore-co': {
    domain: 'christianstore.co',
    fromEmail: 'team+christianstore@christianstore.co'
  },
  'jesus-better-com': {
    domain: 'jesus-better.com',
    fromEmail: 'team+jesus-better@jesus-better.com'
  },
  'jesus-eternal-com': {
    domain: 'jesus-eternal.com',
    fromEmail: 'team+jesus-eternal@jesus-eternal.com'
  },
  'crypto-market-co': {
    domain: 'crypto-market.co',
    fromEmail: 'team+crypto-market@crypto-market.co'
  },
  'duskglow-store': {
    domain: 'duskglow.store',
    fromEmail: 'team+duskglow@duskglow.store'
  },
  'clarityskin-store': {
    domain: 'clarityskin.store',
    fromEmail: 'team+clarityskin@clarityskin.store'
  }
};

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

async function updateResendFromEmail(projectName, config) {
  console.log(`\n📦 Processing project: ${projectName}`);
  console.log(`   New email: ${config.fromEmail}`);

  try {
    console.log(`  ➕ Updating RESEND_FROM_EMAIL...`);
    await makeRequest('POST', `/v10/projects/${encodeURIComponent(projectName)}/env?upsert=true`, {
      key: 'RESEND_FROM_EMAIL',
      value: config.fromEmail,
      type: 'plain',
      target: ['production', 'preview', 'development']
    });
    console.log(`  ✅ RESEND_FROM_EMAIL updated successfully`);
    console.log(`✅ Completed ${projectName}`);
  } catch (error) {
    console.error(`❌ Error processing ${projectName}: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 Starting to update RESEND_FROM_EMAIL for all projects...\n');
  console.log(`📋 Total projects: ${Object.keys(PROJECT_EMAIL_MAP).length}`);
  console.log('📧 New format: team+domainname@domain.com\n');

  for (const [projectName, config] of Object.entries(PROJECT_EMAIL_MAP)) {
    await updateResendFromEmail(projectName, config);
  }

  console.log('\n✨ All done!');
}

main().catch(console.error);
