#!/bin/bash
# Script to rebuild Docker images and restart containers

echo "Stopping all containers..."
docker compose down

echo "Removing old images..."
docker compose rm -f

echo "Rebuilding images..."
docker compose build --no-cache

echo "Starting containers..."
docker compose up -d

echo "Viewing logs..."
docker compose logs -f
