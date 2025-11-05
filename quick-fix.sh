#!/bin/bash
# Quick fix: Rebuild only backend services

echo "Stopping backend services..."
docker compose stop backend celery-worker celery-beat

echo "Rebuilding backend image..."
docker compose build backend

echo "Starting backend services..."
docker compose up -d backend celery-worker celery-beat

echo "Checking status..."
docker compose ps
