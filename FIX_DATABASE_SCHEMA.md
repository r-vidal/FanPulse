# Fix Database Schema Errors

## Problem
The application was showing errors related to missing database tables:
- `relation "momentum_scores" does not exist`
- `column alerts.user_id does not exist`

## Solution
I've made the following changes to fix these issues:

### 1. Created Migration for momentum_scores Table
- **File**: `backend/alembic/versions/20251104_add_momentum_scores.py`
- **Purpose**: Creates the `momentum_scores` table with all required columns and indexes

### 2. Fixed alerts Table Schema
- **Existing Migration**: `backend/alembic/versions/20251103_fix_alerts_schema.py`
- **Purpose**: Adds the `user_id` column to the alerts table

### 3. Added Automatic Migration on Startup
- **Files**:
  - `backend/entrypoint.sh` (new)
  - `backend/Dockerfile` (updated)
- **Purpose**: Automatically runs database migrations when the backend container starts

## How to Apply the Fixes

Run the rebuild script to apply all changes:

```bash
./rebuild.sh
```

This script will:
1. Stop all running containers
2. Rebuild the backend image with the new changes
3. Remove the old database volume (to start fresh)
4. Start all services
5. Migrations will run automatically on backend startup

## Verify the Fix

1. Check backend logs to confirm migrations ran successfully:
   ```bash
   docker compose logs backend
   ```
   You should see: "Running database migrations..." followed by migration output

2. Open the application at http://localhost:3000 and verify:
   - Dashboard loads without errors
   - No SQL errors in the backend logs
   - All statistics display correctly

## Alternative: Manual Migration (if needed)

If you prefer to run migrations manually without rebuilding:

```bash
docker compose exec backend alembic upgrade head
```

## What Was Fixed

1. **momentum_scores table**: Now properly created with columns:
   - id, artist_id, overall_score, velocity_score, consistency_score
   - momentum_category, key_insights, calculated_at

2. **alerts table**: Now includes the `user_id` column that was missing

3. **Automatic migrations**: The backend will now automatically run migrations on startup, preventing future schema issues

## Notes

- The `rebuild.sh` script removes the database volume, which means you'll lose existing data
- If you want to keep existing data, comment out line 13 in `rebuild.sh` before running it
- All future migrations will run automatically when you restart the backend
