const https = require('https');

const VERCEL_TOKEN = process.env.VERCEL_TOKEN || 'WRefq5l6O9Km9DAk6oaLoA7E';

// Project mapping: Vercel project name → Supabase credentials
const PROJECT_SUPABASE_MAP = {
  'muslimstore-co': {
    url: 'https://tjkxehyzhjwdiolienbc.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqa3hlaHl6aGp3ZGlvbGllbmJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MDE5MDcsImV4cCI6MjA4NTE3NzkwN30.KO6Lmk6CFufCZU6YFDEPGNhT_gnttLs2fkeDZfAeuD0'
  },
  'kitty-klub-com': {
    url: 'https://dgnhcdfwqszxjzpmemvr.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnbmhjZGZ3cXN6eGp6cG1lbXZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MDE5MTEsImV4cCI6MjA4NTE3NzkxMX0.6Lz_AEHOfGvHGgCXeIGqgdV5thW_Z-kcrVMNFnj_r94'
  },
  'cat-core.com': {
    url: 'https://mxaseouyqmefogpcjvgd.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14YXNlb3V5cW1lZm9ncGNqdmdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MDE5MTUsImV4cCI6MjA4NTE3NzkxNX0.D016JhxVxFsovTHJC0pnVH6RcxRWVqxuK-dZuL3b6A4'
  },
  'christianstore-co': {
    url: 'https://udqsfwushzlowzruzdsd.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkcXNmd3VzaHpsb3d6cnV6ZHNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MDE5MTksImV4cCI6MjA4NTE3NzkxOX0.rWQ1ioFC_qhJCCsJj45Wz2NqxckfJNxo3kRmlE5kyWs'
  },
  'jesus-better-com': {
    url: 'https://uijgokmgmnrrwhlfghdb.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpamdva21nbW5ycndobGZnaGRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MDE5MjMsImV4cCI6MjA4NTE3NzkyM30.AMiV0fo0OZWiYilRnOHHIykoJAEFABUpv50ABdyNa6U'
  },
  'jesus-eternal-com': {
    url: 'https://vfunyzqmjlmrrxrycjsc.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmdW55enFtamxtcnJ4cnljanNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MDE5MjcsImV4cCI6MjA4NTE3NzkyN30.0_VP8ZQ5OSTGcFy74WqOlxl1f-97lbSXENcvmBjDARM'
  },
  'crypto-market-co': {
    url: 'https://zvstwfishoqudmfyyqxa.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2c3R3ZmlzaG9xdWRtZnl5cXhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MDE5MzEsImV4cCI6MjA4NTE3NzkzMX0.8SBRMm7W9YSZkNPuOeEhqT5-1zOpKoApOcB23OalyFI'
  },
  'duskglow-store': {
    url: 'https://bpofspvdlxhuycztxpid.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwb2ZzcHZkbHhodXljenR4cGlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MDE5MzUsImV4cCI6MjA4NTE3NzkzNX0.xVdD9BwBSjPY8-1brNGTXuh2Zw-KuhYgQ19VsDT7bRk'
  },
  'clarityskin-store': {
    url: 'https://nmhqytahuzeovqzydelp.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5taHF5dGFodXplb3ZxenlkZWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MDE5MzksImV4cCI6MjA4NTE3NzkzOX0.mHQwdLN-IP_E-WJlutjjn3vr5WAZC8RRecqokmTocZI'
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

async function addSupabaseEnvVars(projectName, supabaseConfig) {
  console.log(`\n📦 Processing project: ${projectName}`);

  const envVars = [
    {
      key: 'NEXT_PUBLIC_SUPABASE_URL',
      value: supabaseConfig.url,
      type: 'plain',
      target: ['production', 'preview', 'development']
    },
    {
      key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      value: supabaseConfig.anonKey,
      type: 'plain',
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
  console.log('🚀 Starting to add Supabase environment variables to projects...\n');
  console.log(`📋 Total projects: ${Object.keys(PROJECT_SUPABASE_MAP).length}`);
  console.log('🔑 Adding: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY\n');
  console.log('⚠️  Note: You need to manually add SUPABASE_SERVICE_ROLE_KEY to each project\n');

  for (const [projectName, supabaseConfig] of Object.entries(PROJECT_SUPABASE_MAP)) {
    await addSupabaseEnvVars(projectName, supabaseConfig);
  }

  console.log('\n✨ All done!');
  console.log('\n📝 Next steps:');
  console.log('   1. Go to each project in Vercel dashboard');
  console.log('   2. Add SUPABASE_SERVICE_ROLE_KEY manually from Supabase dashboard');
  console.log('   3. Set it to "encrypted" type and target all environments');
}

main().catch(console.error);
