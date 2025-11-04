#!/bin/bash

echo "=== Apply Database Migrations Without Rebuild ==="
echo ""
echo "⚠️  This script applies migrations to existing containers."
echo "    Use this if Docker is already running but you need to update the database."
echo ""

# Check if backend container is running
if ! docker compose ps backend | grep -q "Up"; then
    echo "❌ Backend container is not running!"
    echo ""
    echo "Please start the containers first with:"
    echo "  docker compose up -d"
    echo ""
    exit 1
fi

echo "✅ Backend container is running"
echo ""

# Copy new migration files to container
echo "📁 Copying new migration file to container..."
docker compose cp backend/alembic/versions/20251104_add_momentum_scores.py backend:/app/alembic/versions/

# Copy new entrypoint script
echo "📁 Copying entrypoint script..."
docker compose cp backend/entrypoint.sh backend:/app/entrypoint.sh
docker compose exec backend chmod +x /app/entrypoint.sh

echo ""
echo "🔄 Running database migrations..."
docker compose exec backend alembic upgrade head

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migrations applied successfully!"
    echo ""
    echo "🔄 Restarting backend to apply all changes..."
    docker compose restart backend celery-worker celery-beat

    echo ""
    echo "⏳ Waiting for services to be ready..."
    sleep 5

    echo ""
    echo "✅ Done! Check the logs with:"
    echo "   docker compose logs -f backend"
else
    echo ""
    echo "❌ Migration failed. Check the logs:"
    echo "   docker compose logs backend"
    exit 1
fi
