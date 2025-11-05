#!/bin/bash

echo "=== Apply Social Media Connections Migration ==="
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
echo "📁 Copying migrations to container..."
docker compose cp backend/alembic/versions/20251105_fix_superfans_schema.py backend:/app/alembic/versions/
docker compose cp backend/alembic/versions/20251105_add_social_media_connections.py backend:/app/alembic/versions/

echo ""
echo "🔄 Running database migrations..."
docker compose exec backend alembic upgrade head

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration applied successfully!"
    echo ""
    echo "🔄 Restarting backend to apply changes..."
    docker compose restart backend

    echo ""
    echo "⏳ Waiting for backend to be ready..."
    sleep 3

    echo ""
    echo "✅ Done!"
else
    echo ""
    echo "❌ Migration failed. Check the logs:"
    echo "   docker compose logs backend"
    exit 1
fi
