#!/bin/bash
set -e

echo "Waiting for postgres..."
while ! pg_isready -h postgres -p 5432 -U fanpulse; do
  sleep 1
done
echo "PostgreSQL started"

echo "Running database migrations..."
cd /app && alembic upgrade head

echo "Starting application..."
exec "$@"
