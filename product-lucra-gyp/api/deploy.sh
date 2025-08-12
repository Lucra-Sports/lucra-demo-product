#!/bin/bash

# Clean deployment script for Elastic Beanstalk (Updated)
# Ensures all files have proper permissions and structure

set -e

echo "🚀 Preparing deployment for Elastic Beanstalk..."

# Build the application
echo "🏗️  Building TypeScript..."
npm run build

# Make sure all shell scripts have proper permissions
echo "🔧 Setting permissions..."
chmod +x .platform/hooks/postdeploy/*.sh 2>/dev/null || true
chmod +x .platform/confighooks/prebuild/*.sh 2>/dev/null || true

# Clean any existing deployment files
rm -f deploy.zip

# Create deployment package
echo "📦 Creating deployment package..."

# Files to include in deployment
zip -r deploy.zip \
  dist/ \
  prisma/ \
  package.json \
  package-lock.json \
  Procfile \
  .ebextensions/ \
  .platform/ \
  -x "*.sqlite" \
  -x "*.DS_Store" \
  -x "*__MACOSX*" \
  -x "*._*"

echo "✅ Deployment package created: deploy.zip"
echo ""
echo "📋 Deployment package contents:"
unzip -l deploy.zip

echo ""
echo "🚀 Ready to deploy!"
echo "  1. Upload deploy.zip to Elastic Beanstalk"
echo "  2. Or use: eb deploy"
