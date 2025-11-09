#!/bin/bash
set -e

echo "Waiting for postgres..."
while ! pg_isready -h postgres -p 5432 -U fanpulse; do
  sleep 1
done
echo "PostgreSQL started"

echo "Running database migrations..."
cd /app

# Check for multiple heads
HEADS_OUTPUT=$(alembic heads 2>&1)
HEAD_COUNT=$(echo "$HEADS_OUTPUT" | grep -c "^[a-z0-9]" || true)

if [ "$HEAD_COUNT" -gt 1 ]; then
  echo "⚠ Multiple migration heads detected ($HEAD_COUNT heads)"
  echo "Creating merge migration..."

  # Extract revision IDs and create merge
  REVISIONS=$(echo "$HEADS_OUTPUT" | grep "^[a-z0-9]" | awk '{print $1}' | tr '\n' ' ')
  echo "Merging revisions: $REVISIONS"

  # Create merge migration (this will handle any number of heads)
  alembic merge heads -m "Auto-merge multiple heads"

  echo "✓ Merge migration created"
fi

# Now upgrade to head
echo "Upgrading database to latest version..."
alembic upgrade head

echo "✓ Database migrations completed successfully"
echo "Starting application..."
exec "$@"
