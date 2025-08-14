#!/bin/bash

# Elastic Beanstalk post-deploy hook for Prisma migrations
# This script runs after the application is deployed

set -e

echo "🚀 Post-deploy: Running Prisma migrations..."

# Navigate to application directory
cd /var/app/current

# Set NODE_ENV to production
export NODE_ENV=production

# Generate Prisma client (in case it's not generated)
echo "⚡ Generating Prisma client..."
npm run db:generate

# Run migrations (this won't break if no new migrations)
echo "📊 Running database migrations..."
npm run db:migrate:deploy

echo "✅ Post-deploy migrations completed successfully!"
