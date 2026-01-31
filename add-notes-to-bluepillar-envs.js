const https = require('https');

const VERCEL_TOKEN = process.env.VERCEL_TOKEN || 'WRefq5l6O9Km9DAk6oaLoA7E';
const TEAM_SLUG = 'rosey-co-team';

// BluePillar projects
const PROJECTS = [
  'bluepillar-admin',
  'ecommerce-template-investor',
  'ecommerce-template-affiliate'
];

const COMMENT = 'Blue Pillar - Project Level Variable';

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

async function addCommentToEnvVar(projectName, envVar) {
  const body = {
    comment: COMMENT
  };

  await makeRequest('PATCH', `/v10/projects/${encodeURIComponent(projectName)}/env/${envVar.id}?slug=${TEAM_SLUG}`, body);
}

async function main() {
  console.log('🚀 Adding notes to BluePillar project environment variables...\n');

  for (const project of PROJECTS) {
    console.log(`📦 Processing project: ${project}`);

    try {
      // Get all env vars for this project
      const envVars = await getProjectEnvVars(project);
      console.log(`  Found ${envVars.length} environment variables`);

      let successCount = 0;
      let errorCount = 0;

      for (const envVar of envVars) {
        try {
          await addCommentToEnvVar(project, envVar);
          successCount++;
          console.log(`  ✅ ${envVar.key}`);

          // Add a small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          errorCount++;
          console.log(`  ⚠️  ${envVar.key}: ${error.message}`);
        }
      }

      console.log(`\n✅ Completed ${project}: ${successCount} updated, ${errorCount} errors\n`);
    } catch (error) {
      console.error(`❌ Error processing ${project}: ${error.message}\n`);
    }
  }

  console.log('✨ All done!');
}

main().catch(console.error);
