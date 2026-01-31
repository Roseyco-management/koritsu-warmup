const https = require('https');

const VERCEL_TOKEN = process.env.VERCEL_TOKEN || 'WRefq5l6O9Km9DAk6oaLoA7E';
const TEAM_SLUG = 'rosey-co-team';

// BluePillar projects
const PROJECTS = [
  'bluepillar-admin',
  'ecommerce-template-investor',
  'ecommerce-template-affiliate'
];

// Source project to copy from
const SOURCE_PROJECT = 'ecom-elevated';

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

async function getSourceEnvVars() {
  console.log(`📥 Fetching environment variables from ${SOURCE_PROJECT}...\n`);
  const response = await makeRequest('GET', `/v10/projects/${encodeURIComponent(SOURCE_PROJECT)}/env?slug=${TEAM_SLUG}`);
  return response.envs;
}

async function addEnvVarToProject(projectName, envVar) {
  // Create the body for the new env var
  const body = {
    key: envVar.key,
    value: envVar.value,
    type: envVar.type,
    target: envVar.target
  };

  await makeRequest('POST', `/v10/projects/${encodeURIComponent(projectName)}/env?upsert=true&slug=${TEAM_SLUG}`, body);
}

async function main() {
  try {
    // Get all env vars from source project
    const sourceEnvVars = await getSourceEnvVars();
    console.log(`✅ Found ${sourceEnvVars.length} environment variables\n`);

    // Add to each BluePillar project
    for (const project of PROJECTS) {
      console.log(`📦 Processing project: ${project}`);

      let successCount = 0;
      let errorCount = 0;

      for (const envVar of sourceEnvVars) {
        try {
          await addEnvVarToProject(project, envVar);
          successCount++;
          console.log(`  ✅ ${envVar.key}`);
        } catch (error) {
          errorCount++;
          console.log(`  ⚠️  ${envVar.key}: ${error.message}`);
        }
      }

      console.log(`\n✅ Completed ${project}: ${successCount} added, ${errorCount} errors\n`);
    }

    console.log('✨ All done!');
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

main().catch(console.error);
