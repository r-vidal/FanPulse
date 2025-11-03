#!/bin/bash
# Fix database schema and clear Python cache

set -e

echo "=== Fixing FanPulse Database Schema ==="

# Clear Python cache
echo "Clearing Python bytecode cache..."
find /app -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find /app -type f -name "*.pyc" -delete 2>/dev/null || true

# Run database migrations
echo "Running database migrations..."
cd /app
alembic upgrade head

echo "=== Schema fix complete! ==="
echo "Please restart the backend service."
