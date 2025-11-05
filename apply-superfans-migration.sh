#!/bin/bash

echo "=== Applying Superfans Schema Migration ==="
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

echo "🔍 Checking current migration version..."
docker compose exec -T backend alembic current
echo ""

echo "🔄 Applying migration to fix superfans schema..."
docker compose exec -T backend alembic upgrade head

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration applied successfully!"
    echo ""
    echo "📊 Current version:"
    docker compose exec -T backend alembic current
    echo ""
    echo "🔄 Restarting backend to ensure all changes are applied..."
    docker compose restart backend

    echo ""
    echo "⏳ Waiting for backend to be ready..."
    sleep 3

    echo ""
    echo "✅ Done! The superfans API endpoints should now work correctly."
    echo ""
    echo "Test with:"
    echo "  curl http://localhost:8000/api/analytics/{artist_id}/superfans"
else
    echo ""
    echo "❌ Migration failed. Check the error above."
    echo ""
    echo "You can check the logs with:"
    echo "  docker compose logs backend"
    exit 1
fi
