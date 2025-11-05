#!/bin/bash
# Script to rebuild Docker images and restart containers

echo "Fixing line endings in entrypoint.sh..."
dos2unix backend/entrypoint.sh 2>/dev/null || sed -i 's/\r$//' backend/entrypoint.sh

echo "Stopping all containers..."
docker compose down

echo "Removing old images..."
docker compose rm -f
docker rmi fanpulse-backend fanpulse-frontend 2>/dev/null || true

echo "Rebuilding images (no cache)..."
docker compose build --no-cache

echo "Starting containers..."
docker compose up -d

echo "Checking status..."
docker compose ps

echo ""
echo "View logs with: docker compose logs -f"
