# Environment Variables Setup - Replication Guide

This guide documents the complete process for setting up environment variables across multiple Vercel projects.

## Overview

This process was used to configure **37 environment variables** across **9 Vercel projects**, including Supabase, Stripe, Resend, and various third-party services.

---

## Prerequisites

1. **Vercel API Token**: Set as `VERCEL_TOKEN` environment variable
2. **Resend API Key**: For creating API keys and accessing webhook secrets
3. **Supabase Access**: To retrieve project-specific keys
4. **Node.js**: For running the automation scripts

---

## Project Structure

### The 9 Projects
```
1. muslimstore-co (muslimstore.co)
2. kitty-klub-com (kitty-klub.com)
3. cat-core.com (cat-core.com)
4. christianstore-co (christianstore.co)
5. jesus-better-com (jesus-better.com)
6. jesus-eternal-com (jesus-eternal.com)
7. crypto-market-co (crypto-market.co)
8. duskglow-store (duskglow.store)
9. clarityskin-store (clarityskin.store)
```

---

## Environment Variables Categories

### 1. Supabase (3 vars - unique per project)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
```

**How to get:**
- List Supabase projects: Use Supabase API or MCP tools
- Get keys from each project's Settings → API page
- Match Supabase project names to Vercel projects

**Script:** `add-supabase-env-vars.js`

---

### 2. Stripe (3 vars - same for all)
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**How to get:**
- From Stripe Dashboard → API Keys
- Webhook secret from Stripe → Webhooks

**Script:** `add-stripe-env-vars.js`

---

### 3. Resend Email (4 vars - unique per project)
```bash
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=team@domain.com
RESEND_WEBHOOK_SECRET=whsec_...
RESEND_INBOUND_WEBHOOK_SECRET=whsec_...
```

**How to get:**
1. Create domain-specific API keys via Resend API:
   ```bash
   POST https://api.resend.com/api-keys
   {
     "name": "Domain Name",
     "permission": "full_access",
     "domain_id": "domain-id"
   }
   ```
2. Get webhook secrets from existing webhooks or `resend-webhook-secrets.json`
3. Format from email as: `team@domain.com`

**Scripts:**
- `create-resend-api-keys.js` (create API keys)
- `add-resend-env-vars.js` (add to Vercel)

---

### 4. Project Identity (2 vars)
```bash
NEXT_PUBLIC_STORE_NAME=Store Name
ADMIN_EMAILS=Team@roseyco.co.uk
```

**Mapping:**
- muslimstore-co → "Muslim Store"
- kitty-klub-com → "Kitty Klub"
- cat-core.com → "Cat Core"
- christianstore-co → "Christian Store"
- jesus-better-com → "Jesus Better"
- jesus-eternal-com → "Jesus Eternal"
- crypto-market-co → "Crypto Market"
- duskglow-store → "Duskglow"
- clarityskin-store → "Clarity Skin"

**Script:** `add-store-name-admin-env-vars.js`

---

### 5. Deployment URLs & Branding (4 vars - unique per project)
```bash
NEXT_PUBLIC_APP_URL=https://www.domain.com
SITE_URL=https://domain.com
NEXT_PUBLIC_STORE_LOGO_URL=/LogoName.png
PAGESPEED_TEST_URL=https://domain.com
```

**Logo naming convention:**
- muslimstore-co → /MuslimStore.png
- kitty-klub-com → /KittyKlub.png
- etc. (PascalCase of store name)

**Script:** `add-deployment-specific-env-vars.js`

---

### 6. Marketing Platforms (5 vars - blank)
```bash
KLAVIYO_API_KEY=
META_APP_SECRET=
META_APP_ID=
META_AD_ACCOUNT_ID=
META_ACCESS_TOKEN=
```

**Script:** `add-marketing-analytics-env-vars.js`

---

### 7. Analytics (3 vars - blank)
```bash
NEXT_PUBLIC_CLARITY_PROJECT_ID=
GSC_PROPERTY=
GA4_PROPERTY_ID=
```

**Script:** `add-marketing-analytics-env-vars.js`

---

### 8. Google Services (7 vars - same for all)
```bash
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_MAPS_API_KEY=
GOOGLE_REFRESH_TOKEN=
GOOGLE_ADS_CUSTOMER_ID=
GOOGLE_ADS_DEVELOPER_TOKEN=
GOOGLE_ADS_LOGIN_CUSTOMER_ID=
```

**Script:** `add-universal-env-vars.js`

---

### 9. Third-Party Services (4 vars - same for all)
```bash
CJ_API_KEY=
EXCHANGERATE_API_KEY=
GELATO_STORE_ID=
PRINTFUL_CLIENT_ID=
```

**Script:** `add-universal-env-vars.js`

---

### 10. Performance & Testing (2 vars)
```bash
PAGESPEED_API_KEY=
NODE_ENV=production
```

**Script:** `add-universal-env-vars.js`

---

## Step-by-Step Replication Process

### Phase 1: Preparation

1. **Set up environment:**
   ```bash
   export VERCEL_TOKEN="your_vercel_token"
   export RESEND_API_KEY="your_resend_api_key"
   ```

2. **Create project list:**
   - List all Vercel projects
   - List all Supabase projects
   - List all Resend domains
   - Create mapping between them

### Phase 2: Universal Variables

3. **Add universal variables** (same across all projects):
   ```bash
   node add-universal-env-vars.js
   ```
   Includes: Google services, third-party APIs, NODE_ENV, etc.

### Phase 3: Project-Specific Variables

4. **Add Supabase variables:**
   ```bash
   node add-supabase-env-vars.js
   ```

5. **Add Stripe variables:**
   ```bash
   node add-stripe-env-vars.js
   ```

6. **Create Resend API keys** (with rate limiting):
   ```bash
   node create-resend-api-keys.js
   ```

7. **Add Resend variables:**
   ```bash
   node add-resend-env-vars.js
   ```

8. **Add project identity:**
   ```bash
   node add-store-name-admin-env-vars.js
   ```

9. **Add deployment-specific variables:**
   ```bash
   node add-deployment-specific-env-vars.js
   ```

### Phase 4: Placeholder Variables

10. **Add marketing & analytics placeholders:**
    ```bash
    node add-marketing-analytics-env-vars.js
    ```

### Phase 5: Verification

11. **Verify all projects:**
    ```bash
    # Check each project
    curl -s "https://api.vercel.com/v10/projects/[project-name]/env" \
      -H "Authorization: Bearer $VERCEL_TOKEN" | jq -r '.envs[] | .key' | sort
    ```

---

## Script Template

All scripts follow this structure:

```javascript
const https = require('https');

const VERCEL_TOKEN = process.env.VERCEL_TOKEN || 'token';

// Project mapping
const PROJECT_MAP = {
  'project-name': {
    // project-specific values
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

async function addEnvVars(projectName, config) {
  console.log(`\n📦 Processing project: ${projectName}`);

  const envVars = [
    {
      key: 'VAR_NAME',
      value: config.value,
      type: 'encrypted', // or 'plain'
      target: ['production', 'preview', 'development']
    }
  ];

  try {
    for (const envVar of envVars) {
      console.log(`  ➕ Adding ${envVar.key}...`);
      await makeRequest('POST', `/v10/projects/${encodeURIComponent(projectName)}/env?upsert=true`, {
        key: envVar.key,
        value: envVar.value,
        type: envVar.type,
        target: envVar.target
      });
      console.log(`  ✅ ${envVar.key} added successfully`);
    }
    console.log(`✅ Completed ${projectName}`);
  } catch (error) {
    console.error(`❌ Error processing ${projectName}: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 Starting to add environment variables...\n');

  for (const [projectName, config] of Object.entries(PROJECT_MAP)) {
    await addEnvVars(projectName, config);
  }

  console.log('\n✨ All done!');
}

main().catch(console.error);
```

---

## Key Considerations

### Rate Limiting
- **Resend API**: 2 requests/second
  - Add 600ms delay between requests
  - Split into batches if creating many API keys

### Variable Types
- **Plain**: Public variables (NEXT_PUBLIC_*, visible in browser)
- **Encrypted**: Sensitive data (API keys, secrets)

### Target Environments
Always set to all three:
- `production`
- `preview`
- `development`

### Naming Conventions
- Vercel projects: lowercase with hyphens (muslimstore-co)
- Store names: Title Case (Muslim Store)
- Domains: as-is (muslimstore.co)
- Logo files: PascalCase (MuslimStore.png)

---

## Common Issues & Solutions

### Issue: Project Not Found
**Solution:** Check project name format. Use exact Vercel project name, not domain.

### Issue: Rate Limited (Resend)
**Solution:** Add delay between requests (600ms+) or split into batches.

### Issue: Webhook Secrets Not Found
**Solution:** Use existing `resend-webhook-secrets.json` or fetch from Resend API.

### Issue: Supabase Keys Mismatch
**Solution:** Verify Supabase project name matches domain/Vercel project mapping.

---

## Quick Reference: All Scripts

| Script | Purpose | Unique? |
|--------|---------|---------|
| add-supabase-env-vars.js | Supabase credentials | ✅ Per project |
| add-stripe-env-vars.js | Stripe credentials | ❌ Same for all |
| create-resend-api-keys.js | Create Resend API keys | ✅ Per domain |
| add-resend-env-vars.js | Resend credentials | ✅ Per project |
| add-store-name-admin-env-vars.js | Store identity | ✅ Store name unique |
| add-deployment-specific-env-vars.js | URLs & branding | ✅ Per project |
| add-marketing-analytics-env-vars.js | Marketing/Analytics placeholders | ❌ Blank for all |
| add-universal-env-vars.js | Universal services | ❌ Same for all |

---

## Verification Checklist

After running all scripts, verify each project has:

- [ ] 37 total environment variables
- [ ] All Supabase keys (3)
- [ ] All Stripe keys (3)
- [ ] All Resend keys (4)
- [ ] Store name and admin email (2)
- [ ] Deployment URLs and logo (4)
- [ ] Marketing placeholders (5)
- [ ] Analytics placeholders (3)
- [ ] Google services (7)
- [ ] Third-party services (4)
- [ ] Performance/testing (2)

---

## Future Additions

To add new projects:

1. Create Supabase project
2. Create Resend domain
3. Add project to each script's project list
4. Run all scripts in order (Phases 2-4)
5. Verify with Phase 5

To add new variables:

1. Determine if universal or project-specific
2. Create or modify appropriate script
3. Run against all projects
4. Verify with API check

---

## Files Generated

- `add-supabase-env-vars.js`
- `add-stripe-env-vars.js`
- `add-resend-env-vars.js`
- `add-store-name-admin-env-vars.js`
- `add-deployment-specific-env-vars.js`
- `add-marketing-analytics-env-vars.js`
- `create-resend-api-keys.js`
- `resend-webhook-secrets.json` (webhook secrets reference)

---

## Contact & Support

For issues or questions about this process:
- Review this guide
- Check existing scripts for examples
- Verify API tokens and permissions
- Test with a single project first

---

**Last Updated:** 2026-01-28
**Version:** 1.0
