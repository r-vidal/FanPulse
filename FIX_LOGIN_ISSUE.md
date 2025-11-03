# Fix Login Issue - AlertPriority Error

## Problem
The login is failing because the `alerts` table schema in the database doesn't match the current code model, causing a `NameError: name 'AlertPriority' is not defined` error.

## Solution
I've created a database migration to fix the schema mismatch. Follow these steps:

### Step 1: Stop and clear Python cache in containers
```bash
# Stop all services
docker-compose down

# Optional: Remove volumes if you want a fresh start
# WARNING: This will delete all data!
# docker-compose down -v
```

### Step 2: Run the migration
```bash
# Start only the database
docker-compose up -d postgres redis

# Wait for postgres to be ready (about 10 seconds)
sleep 10

# Run the migration in the backend container
docker-compose run --rm backend bash -c "alembic upgrade head"
```

### Step 3: Restart all services
```bash
# Start all services
docker-compose up -d

# View logs to confirm everything is working
docker-compose logs -f backend
```

## What was fixed

1. **Created new migration** (`20251103_fix_alerts_schema.py`):
   - Drops and recreates the `alerts` table with correct schema
   - Adds `AlertType` enum (viral, engagement_drop, opportunity, threat)
   - Adds `AlertSeverity` enum (urgent, warning, info)
   - Adds missing columns: `user_id`, `severity`, `message`, `data`, `resolved_at`

2. **Updated migration chain**:
   - `001_platform_models` → `001a_fix_alerts` → `002_alerts_notifications` → ...

## Alternative: Fresh Database Start

If migrations don't work or you don't need existing data:

```bash
# Stop everything and remove volumes
docker-compose down -v

# Start fresh
docker-compose up -d
```

## Verify the fix

After restarting, check that the backend starts without errors:
```bash
docker-compose logs backend
```

You should NOT see `NameError: name 'AlertPriority' is not defined` anymore.

Test login at: http://localhost:3000/login
