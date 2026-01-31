const https = require('https');

const VERCEL_TOKEN = process.env.VERCEL_TOKEN || 'WRefq5l6O9Km9DAk6oaLoA7E';

// Project mapping with deployment-specific values
const PROJECT_DEPLOYMENT_MAP = {
  'muslimstore-co': {
    domain: 'muslimstore.co',
    logoName: 'MuslimStore.png'
  },
  'kitty-klub-com': {
    domain: 'kitty-klub.com',
    logoName: 'KittyKlub.png'
  },
  'cat-core.com': {
    domain: 'cat-core.com',
    logoName: 'CatCore.png'
  },
  'christianstore-co': {
    domain: 'christianstore.co',
    logoName: 'ChristianStore.png'
  },
  'jesus-better-com': {
    domain: 'jesus-better.com',
    logoName: 'JesusBetter.png'
  },
  'jesus-eternal-com': {
    domain: 'jesus-eternal.com',
    logoName: 'JesusEternal.png'
  },
  'crypto-market-co': {
    domain: 'crypto-market.co',
    logoName: 'CryptoMarket.png'
  },
  'duskglow-store': {
    domain: 'duskglow.store',
    logoName: 'Duskglow.png'
  },
  'clarityskin-store': {
    domain: 'clarityskin.store',
    logoName: 'ClaritySkin.png'
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

async function addDeploymentSpecificEnvVars(projectName, config) {
  console.log(`\n📦 Processing project: ${projectName}`);
  console.log(`   Domain: ${config.domain}`);

  const envVars = [
    {
      key: 'NEXT_PUBLIC_APP_URL',
      value: `https://www.${config.domain}`,
      type: 'plain',
      target: ['production', 'preview', 'development']
    },
    {
      key: 'SITE_URL',
      value: `https://${config.domain}`,
      type: 'encrypted',
      target: ['production', 'preview', 'development']
    },
    {
      key: 'NEXT_PUBLIC_STORE_LOGO_URL',
      value: `/${config.logoName}`,
      type: 'plain',
      target: ['production', 'preview', 'development']
    },
    {
      key: 'PAGESPEED_TEST_URL',
      value: `https://${config.domain}`,
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
  console.log('🚀 Starting to add deployment-specific environment variables to projects...\n');
  console.log(`📋 Total projects: ${Object.keys(PROJECT_DEPLOYMENT_MAP).length}`);
  console.log('🔑 Variables: NEXT_PUBLIC_APP_URL, SITE_URL, NEXT_PUBLIC_STORE_LOGO_URL, PAGESPEED_TEST_URL\n');

  for (const [projectName, config] of Object.entries(PROJECT_DEPLOYMENT_MAP)) {
    await addDeploymentSpecificEnvVars(projectName, config);
  }

  console.log('\n✨ All done!');
}

main().catch(console.error);
