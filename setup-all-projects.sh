#!/bin/bash

# Setup All Projects - Master Script
# This script runs all environment variable setup scripts in the correct order

set -e  # Exit on error

echo "🚀 Starting Environment Variables Setup for All Projects"
echo "=========================================================="
echo ""

# Check prerequisites
if [ -z "$VERCEL_TOKEN" ]; then
    echo "❌ Error: VERCEL_TOKEN environment variable not set"
    exit 1
fi

echo "✅ Prerequisites checked"
echo ""

# Phase 1: Universal Variables (same for all projects)
echo "📦 Phase 1: Adding Universal Environment Variables..."
echo "   (Google services, third-party APIs, etc.)"
if [ -f "add-universal-env-vars.js" ]; then
    node add-universal-env-vars.js
else
    echo "⚠️  Skipping - add-universal-env-vars.js not found"
fi
echo ""

# Phase 2: Supabase (unique per project)
echo "📦 Phase 2: Adding Supabase Environment Variables..."
if [ -f "add-supabase-env-vars.js" ]; then
    node add-supabase-env-vars.js
else
    echo "⚠️  Skipping - add-supabase-env-vars.js not found"
fi
echo ""

# Phase 3: Stripe (same for all projects)
echo "📦 Phase 3: Adding Stripe Environment Variables..."
if [ -f "add-stripe-env-vars.js" ]; then
    node add-stripe-env-vars.js
else
    echo "⚠️  Skipping - add-stripe-env-vars.js not found"
fi
echo ""

# Phase 4: Resend (unique per project)
echo "📦 Phase 4: Adding Resend Environment Variables..."
echo "   Note: API keys should be created first if needed"
if [ -f "add-resend-env-vars.js" ]; then
    node add-resend-env-vars.js
else
    echo "⚠️  Skipping - add-resend-env-vars.js not found"
fi
echo ""

# Phase 5: Project Identity
echo "📦 Phase 5: Adding Store Names and Admin Emails..."
if [ -f "add-store-name-admin-env-vars.js" ]; then
    node add-store-name-admin-env-vars.js
else
    echo "⚠️  Skipping - add-store-name-admin-env-vars.js not found"
fi
echo ""

# Phase 6: Deployment-Specific
echo "📦 Phase 6: Adding Deployment-Specific Variables..."
echo "   (URLs, logos, PageSpeed URLs)"
if [ -f "add-deployment-specific-env-vars.js" ]; then
    node add-deployment-specific-env-vars.js
else
    echo "⚠️  Skipping - add-deployment-specific-env-vars.js not found"
fi
echo ""

# Phase 7: Marketing & Analytics Placeholders
echo "📦 Phase 7: Adding Marketing & Analytics Placeholders..."
if [ -f "add-marketing-analytics-env-vars.js" ]; then
    node add-marketing-analytics-env-vars.js
else
    echo "⚠️  Skipping - add-marketing-analytics-env-vars.js not found"
fi
echo ""

echo "=========================================================="
echo "✨ Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Verify all projects have the correct variables"
echo "2. Fill in blank marketing/analytics values as needed"
echo "3. Test deployments"
echo ""
