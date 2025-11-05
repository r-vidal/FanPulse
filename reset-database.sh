#!/bin/bash
# Script to reset database and apply all migrations

echo "Stopping backend services..."
docker compose stop backend celery-worker celery-beat

echo "Dropping and recreating database..."
docker compose exec -T postgres psql -U fanpulse -d postgres -c "DROP DATABASE IF EXISTS fanpulse;"
docker compose exec -T postgres psql -U fanpulse -d postgres -c "CREATE DATABASE fanpulse;"

echo "Starting backend services..."
docker compose up -d backend celery-worker celery-beat

echo "Waiting for migrations to complete..."
sleep 5

echo "Checking logs..."
docker compose logs backend | tail -20

echo ""
echo "Database reset complete!"
echo "View logs with: docker compose logs -f backend celery-worker celery-beat"
