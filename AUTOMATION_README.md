# Environment Variables Automation

Quick reference for the environment variables automation system.

## 🚀 Quick Start

### One-Command Setup
```bash
export VERCEL_TOKEN="your_token_here"
./setup-all-projects.sh
```

### Verify Setup
```bash
node verify-all-projects.js
```

---

## 📁 File Structure

### Documentation
- **REPLICATION_GUIDE.md** - Complete replication guide with all details
- **AUTOMATION_README.md** - This file (quick reference)

### Master Scripts
- **setup-all-projects.sh** - Run all setup scripts in order
- **verify-all-projects.js** - Verify all projects have correct variables

### Individual Setup Scripts
- **add-universal-env-vars.js** - Universal variables (Google, APIs, etc.)
- **add-supabase-env-vars.js** - Supabase credentials (unique per project)
- **add-stripe-env-vars.js** - Stripe credentials (same for all)
- **add-resend-env-vars.js** - Resend email credentials (unique per project)
- **add-store-name-admin-env-vars.js** - Store names and admin email
- **add-deployment-specific-env-vars.js** - URLs, logos, PageSpeed
- **add-marketing-analytics-env-vars.js** - Marketing/Analytics placeholders

### Utility Scripts
- **create-resend-api-keys.js** - Create Resend API keys for new domains
- **update-admin-email.js** - Update admin email across all projects
- **revert-resend-from-email.js** - Revert Resend email format changes

### Reference Files
- **resend-webhook-secrets.json** - Webhook secrets for all domains

---

## 🎯 Common Tasks

### Adding a New Project

1. Update project list in all scripts:
   ```javascript
   const PROJECTS = [
     // ... existing projects
     'new-project-name'
   ];
   ```

2. Add project-specific mappings:
   - Supabase credentials
   - Resend domain/API key
   - Store name
   - Domain/URLs

3. Run setup:
   ```bash
   ./setup-all-projects.sh
   ```

### Updating a Single Variable

1. Find the appropriate script (e.g., `update-admin-email.js`)
2. Modify the value
3. Run the script:
   ```bash
   node update-admin-email.js
   ```

### Creating Resend API Keys

For new domains:
```bash
node create-resend-api-keys.js
```

Note: Add 600ms delay between requests to avoid rate limiting.

---

## 📊 Verification

### Quick Check
```bash
node verify-all-projects.js
```

### Manual Check (Single Project)
```bash
curl -s "https://api.vercel.com/v10/projects/[project-name]/env" \
  -H "Authorization: Bearer $VERCEL_TOKEN" | jq -r '.envs[] | .key' | sort
```

### Expected Count
Each project should have **37 environment variables**.

---

## 🔑 Environment Variables by Category

| Category | Count | Type |
|----------|-------|------|
| Supabase | 3 | Unique per project |
| Stripe | 3 | Same for all |
| Resend | 4 | Unique per project |
| Project Identity | 2 | Store name unique, email same |
| Deployment | 4 | Unique per project |
| Google Services | 7 | Same for all |
| Marketing | 5 | Blank placeholders |
| Analytics | 3 | Blank placeholders |
| Third-party | 4 | Same for all |
| Performance | 2 | Same for all |
| **TOTAL** | **37** | |

---

## ⚠️ Important Notes

### Rate Limiting
- **Resend API**: 2 requests/second
- Add delays when creating multiple API keys

### Variable Types
- **Plain**: Visible in browser (NEXT_PUBLIC_*)
- **Encrypted**: Hidden, for sensitive data

### Target Environments
All variables target: `production`, `preview`, `development`

### Backup
Always keep a backup of:
- `resend-webhook-secrets.json`
- Current environment variables (export from Vercel)

---

## 🐛 Troubleshooting

### "Project not found"
- Check project name matches Vercel exactly
- Verify VERCEL_TOKEN has correct permissions

### "Rate limited" (Resend)
- Add delays between requests (600ms+)
- Split into smaller batches

### Missing variables
- Run verification script: `node verify-all-projects.js`
- Check which script adds the missing variable
- Re-run that specific script

---

## 📞 Support

For detailed information, see **REPLICATION_GUIDE.md**.

For script templates and examples, check the individual script files.

---

## ✅ Checklist for New Setup

- [ ] Set VERCEL_TOKEN environment variable
- [ ] Update project lists in all scripts
- [ ] Create Supabase projects and get credentials
- [ ] Create Resend domains and API keys
- [ ] Get Stripe credentials
- [ ] Run `./setup-all-projects.sh`
- [ ] Run `node verify-all-projects.js`
- [ ] Test a deployment
- [ ] Fill in marketing/analytics values as needed

---

**Last Updated:** 2026-01-28
