#!/bin/bash
# Script to fix migration heads without losing data

echo "This will reset the Alembic migration history without losing data."
echo "The database tables will remain intact."
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    exit 1
fi

echo "Stopping backend services..."
docker compose stop backend celery-worker celery-beat

echo "Clearing Alembic version table..."
docker compose exec -T postgres psql -U fanpulse -d fanpulse -c "DELETE FROM alembic_version;"

echo "Starting backend services..."
docker compose up -d backend celery-worker celery-beat

echo "Waiting for migrations to run..."
sleep 5

echo "Checking backend logs..."
docker compose logs backend | tail -30

echo ""
echo "Migration fix complete!"
echo "View logs with: docker compose logs -f backend celery-worker celery-beat"
