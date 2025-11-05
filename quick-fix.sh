#!/bin/bash
# Quick fix: Rebuild only backend services

echo "Fixing line endings in entrypoint.sh..."
dos2unix backend/entrypoint.sh 2>/dev/null || sed -i 's/\r$//' backend/entrypoint.sh

echo "Stopping backend services..."
docker compose stop backend celery-worker celery-beat

echo "Removing old backend images..."
docker rmi fanpulse-backend 2>/dev/null || true

echo "Rebuilding backend image (no cache)..."
docker compose build --no-cache backend

echo "Starting backend services..."
docker compose up -d backend celery-worker celery-beat

echo "Checking status..."
docker compose ps

echo ""
echo "View logs with: docker compose logs -f backend celery-worker celery-beat"
