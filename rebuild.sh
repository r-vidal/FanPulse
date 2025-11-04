#!/bin/bash

# Rebuild and Restart Script
# Use this after changing dependencies or Dockerfile

echo "🛑 Stopping all containers..."
docker compose down

echo "🔨 Rebuilding backend image with new dependencies..."
docker compose build backend celery-worker celery-beat

echo "🗑️  Removing old database volume (optional - comment out if you want to keep data)..."
docker volume rm fanpulse_postgres_data 2>/dev/null || echo "Volume doesn't exist or already removed"

echo "🚀 Starting all services..."
docker compose up -d

echo "⏳ Waiting for services to be ready..."
sleep 10

echo "📊 Database migrations will run automatically on backend startup..."
echo "    (You can check logs with: docker compose logs -f backend)"

echo ""
echo "✅ Rebuild complete!"
echo ""
echo "Services running:"
docker compose ps
echo ""
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "API Docs: http://localhost:8000/docs"
