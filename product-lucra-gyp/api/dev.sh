#!/bin/bash

# Development Helper Script

set -e

echo "🔧 TypeScript API with Prisma - Development Helper"

case "$1" in
  "dev")
    echo "🚀 Starting development server..."
    echo "📚 API Documentation will be available at: http://localhost:4000/api-docs"
    npm run dev
    ;;
  
  "test")
    echo "🧪 Running tests..."
    npm test
    ;;
  
  "test:watch")
    echo "👀 Running tests in watch mode..."
    npm run test:watch
    ;;
  
  "build")
    echo "🏗️  Building TypeScript..."
    npm run build
    ;;
  
  "docs")
    echo "📚 Opening API documentation..."
    echo "🌐 API Documentation: http://localhost:4000/api-docs"
    echo "📄 Swagger JSON: http://localhost:4000/api-docs.json"
    if command -v open >/dev/null 2>&1; then
      open "http://localhost:4000/api-docs"
    elif command -v xdg-open >/dev/null 2>&1; then
      xdg-open "http://localhost:4000/api-docs"
    else
      echo "Please open http://localhost:4000/api-docs in your browser"
    fi
    ;;
  
  "db:studio")
    echo "🎨 Opening Prisma Studio..."
    npm run db:studio
    ;;
  
  "db:migrate")
    echo "🔄 Creating and applying migration..."
    read -p "Enter migration name: " migration_name
    npx prisma migrate dev --name "$migration_name"
    ;;
  
  "db:seed")
    echo "🌱 Seeding database..."
    npm run db:seed
    ;;
  
  "db:generate")
    echo "⚡ Generating Prisma client..."
    npm run db:generate
    ;;
  
  "db:reset")
    echo "⚠️  WARNING: This will delete ALL data!"
    read -p "Are you sure you want to reset the database? (y/N): " confirm
    if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
      npx prisma migrate reset
    else
      echo "❌ Cancelled"
    fi
    ;;
  
  "setup")
    echo "🎯 Setting up database with migrations..."
    chmod +x setup-migration.sh
    ./setup-migration.sh
    ;;
  
  "deploy")
    echo "📦 Preparing deployment package..."
    chmod +x deploy.sh
    ./deploy.sh
    ;;
  
  *)
    echo "Usage: $0 {command}"
    echo ""
    echo "🚀 Development Commands:"
    echo "  dev             - Start development server"
    echo "  test            - Run tests"
    echo "  test:watch      - Run tests in watch mode"
    echo "  build           - Build for production"
    echo "  docs            - Open API documentation"
    echo ""
    echo "🗄️  Database Commands:"
    echo "  setup           - Setup database with proper migrations"
    echo "  db:studio       - Open Prisma Studio (database GUI)"
    echo "  db:migrate      - Create new migration (preserves data)"
    echo "  db:generate     - Generate Prisma client"
    echo "  db:seed         - Seed database with sample data"
    echo "  db:reset        - ⚠️  Reset database (DELETES ALL DATA)"
    echo ""
    echo "🚀 Deployment:"
    echo "  deploy          - Create deployment package"
    echo ""
    echo "📚 Documentation:"
    echo "  - API Docs: http://localhost:4000/api-docs"
    echo "  - Database GUI: Run './dev.sh db:studio'"
    echo ""
    echo "⚠️  For database table issues, run: ./dev.sh setup"
    exit 1
    ;;
esac
