const https = require('https');

const VERCEL_TOKEN = process.env.VERCEL_TOKEN || 'WRefq5l6O9Km9DAk6oaLoA7E';

// Mapping: domain -> { vercelProject, apiKey, webhooks }
const PROJECT_RESEND_MAP = {
  'muslimstore.co': {
    vercelProject: 'muslimstore-co',
    apiKey: 're_6hcVdkag_6bdircUFnoTG3bzhPDSHFAVh',
    webhookSecret: 'whsec_YvZTfy5zJOIO/UGXQUeS1HQxMg3Dj/P7',
    inboundWebhookSecret: 'whsec_0xz8O4c5eGPc77upv5RFYn9VAx3W+82x',
    fromEmail: 'team@muslimstore.co'
  },
  'kitty-klub.com': {
    vercelProject: 'kitty-klub-com',
    apiKey: 're_GzWgF8VN_5sUiCsMnUSx5pN2YbyHdQbVP',
    webhookSecret: 'whsec_F4K9cnhA3qKoXSqkaIq79WvUOZ8xs+lk',
    inboundWebhookSecret: 'whsec_cg+GUSeEIGg4OPt5k4xmtm4yfoUPCZDR',
    fromEmail: 'team@kitty-klub.com'
  },
  'cat-core.com': {
    vercelProject: 'cat-core.com',
    apiKey: 're_KmbQe8QQ_NQG9aie85jNbfKphpDzknMwn',
    webhookSecret: 'whsec_s+erANqtu6Nl0gOWqLXgMlPeQicfh4ga',
    inboundWebhookSecret: 'whsec_biAAmRjQwTvEJCwS8nYIOlRZ3WGyVOy7',
    fromEmail: 'team@cat-core.com'
  },
  'christianstore.co': {
    vercelProject: 'christianstore-co',
    apiKey: 're_ULq3DzwK_zLWM3rHpGRwNN3uqUeJTmYQg',
    webhookSecret: 'whsec_4jbQkPUwtJkCQ8klWCJBKd700bM0hokE',
    inboundWebhookSecret: 'whsec_yny7ci/ln2Ep1taUbjBAfQRYHD/UOYG2',
    fromEmail: 'team@christianstore.co'
  },
  'jesus-better.com': {
    vercelProject: 'jesus-better-com',
    apiKey: 're_ehDsUXhY_5hyHyN6kkYnkdXPYR8TvCPHZ',
    webhookSecret: 'whsec_3fAtdypirlyWHroPrRd9gqc4J80zMIAZ',
    inboundWebhookSecret: 'whsec_3dAxMRuPA0xw8cRWu43jDCXml0AIn7dR',
    fromEmail: 'team@jesus-better.com'
  },
  'jesus-eternal.com': {
    vercelProject: 'jesus-eternal-com',
    apiKey: 're_JCamJSfW_3SFwyYmvtqBPKLdVWzdfeYNo',
    webhookSecret: 'whsec_TbEeqPx4dfko8FggbALqUbPVRWJ7MIyh',
    inboundWebhookSecret: 'whsec_LBptkihvzAi9jD/SUouGcLybPCI4iIX6',
    fromEmail: 'team@jesus-eternal.com'
  },
  'crypto-market.co': {
    vercelProject: 'crypto-market-co',
    apiKey: 're_KWLnWu1Y_6iDFmGfxG6DZjrNFzC3nasSY',
    webhookSecret: 'whsec_kk9T/kGw3Iia90eeVeHNawsgiGkFl+Pj',
    inboundWebhookSecret: 'whsec_UIsyLmEeOiF9+nKcp0iAF1awEgypnc5o',
    fromEmail: 'team@crypto-market.co'
  },
  'duskglow.store': {
    vercelProject: 'duskglow-store',
    apiKey: 're_cbcuCa6g_5AcbqpjHCFTkK6GFEFZ5YgQV',
    webhookSecret: 'whsec_DuNlTf94g1ZBMfJC/WLbBVR0hpLNpUS2',
    inboundWebhookSecret: 'whsec_b8kkuBHInqgwrUrOhvAPslSSdapjkHpM',
    fromEmail: 'team@duskglow.store'
  },
  'clarityskin.store': {
    vercelProject: 'clarityskin-store',
    apiKey: 're_a2s2p7ss_4sPfr3fMZJvt1tNbMuh2b61X',
    webhookSecret: 'whsec_cQGttJscFjTfmFY2cdvZLwWKSurnQ1Ht',
    inboundWebhookSecret: 'whsec_r1BsbkU++4dA2ocjpG27uGF0pqxHjzc0',
    fromEmail: 'team@clarityskin.store'
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

async function addResendEnvVars(projectName, resendConfig) {
  console.log(`\n📦 Processing project: ${projectName}`);

  const envVars = [
    {
      key: 'RESEND_API_KEY',
      value: resendConfig.apiKey,
      type: 'encrypted',
      target: ['production', 'preview', 'development']
    },
    {
      key: 'RESEND_FROM_EMAIL',
      value: resendConfig.fromEmail,
      type: 'plain',
      target: ['production', 'preview', 'development']
    },
    {
      key: 'RESEND_WEBHOOK_SECRET',
      value: resendConfig.webhookSecret,
      type: 'encrypted',
      target: ['production', 'preview', 'development']
    },
    {
      key: 'RESEND_INBOUND_WEBHOOK_SECRET',
      value: resendConfig.inboundWebhookSecret,
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
  console.log('🚀 Starting to add Resend environment variables to projects...\n');
  console.log(`📋 Total projects: ${Object.keys(PROJECT_RESEND_MAP).length}`);
  console.log('📧 Variables: RESEND_API_KEY, RESEND_FROM_EMAIL, RESEND_WEBHOOK_SECRET, RESEND_INBOUND_WEBHOOK_SECRET\n');

  for (const [domain, config] of Object.entries(PROJECT_RESEND_MAP)) {
    await addResendEnvVars(config.vercelProject, config);
  }

  console.log('\n✨ All done!');
}

main().catch(console.error);
