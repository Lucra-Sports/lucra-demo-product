#!/bin/bash

# Prebuild hook - Install dependencies and build
set -e

echo "🔧 Prebuild: Installing dependencies..."
npm ci --only=production

echo "⚡ Prebuild: Generating Prisma client..."
npx prisma generate

echo "✅ Prebuild completed!"
