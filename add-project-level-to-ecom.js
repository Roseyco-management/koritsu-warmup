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
  const body = {
    key: envVar.key,
    value: envVar.value,
    type: envVar.type,
    target: envVar.target
  };

  await makeRequest('POST', `/v10/projects/${encodeURIComponent(projectName)}/env?upsert=true&slug=${TEAM_SLUG}`, body);
}

async function processProject(project, sourceEnvVars) {
  console.log(`📦 Processing project: ${project}`);

  let successCount = 0;
  let errorCount = 0;
  let rateLimitErrors = [];

  for (const envVar of sourceEnvVars) {
    try {
      await addEnvVarToProject(project, envVar);
      successCount++;
      console.log(`  ✅ ${envVar.key}`);

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 150));
    } catch (error) {
      if (error.message.includes('429')) {
        rateLimitErrors.push(envVar);
        console.log(`  ⏸️  ${envVar.key}: Rate limited, will retry`);
      } else {
        errorCount++;
        console.log(`  ⚠️  ${envVar.key}: ${error.message}`);
      }
    }
  }

  // Retry rate limited variables after waiting
  if (rateLimitErrors.length > 0) {
    console.log(`\n  ⏳ Waiting 30 seconds before retrying ${rateLimitErrors.length} variables...`);
    await new Promise(resolve => setTimeout(resolve, 30000));

    for (const envVar of rateLimitErrors) {
      try {
        await addEnvVarToProject(project, envVar);
        successCount++;
        console.log(`  ✅ ${envVar.key} (retry)`);
        await new Promise(resolve => setTimeout(resolve, 150));
      } catch (error) {
        errorCount++;
        console.log(`  ❌ ${envVar.key}: ${error.message}`);
      }
    }
  }

  console.log(`\n✅ Completed ${project}: ${successCount} added, ${errorCount} errors\n`);
  return { successCount, errorCount };
}

async function main() {
  try {
    // Get all env vars from source project
    const sourceEnvVars = await getSourceEnvVars();
    console.log(`✅ Found ${sourceEnvVars.length} environment variables\n`);

    let totalSuccess = 0;
    let totalErrors = 0;

    // Process each project
    for (const project of PROJECTS) {
      const result = await processProject(project, sourceEnvVars);
      totalSuccess += result.successCount;
      totalErrors += result.errorCount;

      // Wait between projects to avoid rate limiting
      if (PROJECTS.indexOf(project) < PROJECTS.length - 1) {
        console.log('⏳ Waiting 10 seconds before next project...\n');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    console.log('✨ All done!');
    console.log(`\n📊 Summary: ${totalSuccess} variables added, ${totalErrors} errors across ${PROJECTS.length} projects`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

main().catch(console.error);
