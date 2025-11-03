#!/bin/bash

# Reset Database Script
# This script stops containers, removes the database volume, and restarts with fresh migrations

echo "🛑 Stopping containers..."
docker compose down

echo "🗑️  Removing database volume..."
docker volume rm fanpulse_postgres_data 2>/dev/null || echo "Volume already removed or doesn't exist"

echo "🚀 Starting containers..."
docker compose up -d postgres redis

echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

echo "📊 Running database migrations..."
docker compose run --rm backend alembic upgrade head

echo "✅ Database reset complete!"
echo ""
echo "Now starting all services..."
docker compose up -d

echo ""
echo "✨ All done! Your database is fresh and ready."
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
