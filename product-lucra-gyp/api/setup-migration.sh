#!/bin/bash

# Create migration and fix database table issue
echo "🔧 Creating migration for user_bindings table..."

# First, generate the Prisma client
echo "⚡ Generating Prisma client..."
npx prisma generate

# Create the migration properly
echo "📊 Creating migration..."
npx prisma migrate dev --name add_user_bindings_table --create-only

# Check if migration was created
if [ -d "prisma/migrations" ]; then
    echo "✅ Migration files created successfully!"
    
    # Apply the migration
    echo "📤 Applying migration to database..."
    npx prisma migrate dev
    
    echo "✅ Migration applied successfully!"
else
    echo "⚠️  No migration directory found. Using db push as fallback..."
    npx prisma db push
fi

echo ""
echo "🎯 Database setup complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Run tests: npm test"
echo "  2. Start dev server: ./dev.sh dev"
echo "  3. Check database: ./dev.sh db:studio"
