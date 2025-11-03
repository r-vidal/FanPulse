# Database Setup Guide

## Quick Start

If you're experiencing database-related errors (like the registration 500 error), follow these steps:

### Option 1: Reset Database (Recommended for Fresh Start)

Run the reset script:

```bash
./reset_db.sh
```

This will:
1. Stop all containers
2. Remove the old database volume
3. Restart containers with fresh database
4. Run migrations automatically

### Option 2: Manual Migration

If you just need to run migrations without resetting:

```bash
# Run migrations
docker compose exec backend alembic upgrade head

# Or if backend is not running
docker compose run --rm backend alembic upgrade head
```

### Option 3: Full Reset with Docker Compose

```bash
# Stop everything
docker compose down -v

# Start fresh
docker compose up -d

# Run migrations
docker compose exec backend alembic upgrade head
```

## Verifying the Setup

1. Check if tables exist:
```bash
docker compose exec postgres psql -U fanpulse -d fanpulse -c "\dt"
```

2. Check if migrations ran:
```bash
docker compose exec postgres psql -U fanpulse -d fanpulse -c "SELECT * FROM alembic_version;"
```

3. Test the API:
```bash
curl http://localhost:8000/health
```

## Common Issues

### "No module named 'app.api.deps'"
- **Fixed**: This module has been created in `backend/app/api/deps.py`

### "500 Error on Registration"
- **Fixed**: Added missing `subscription_tier` field to database migration
- **Solution**: Run `./reset_db.sh` to apply the updated migration

### "CORS Error"
- The backend is configured to allow `http://localhost:3000`
- Make sure you're accessing the frontend from exactly that URL

## Database Schema

The migrations create the following tables:
- `users` - User accounts with subscription tiers
- `artists` - Artist profiles managed by users
- `platform_connections` - OAuth connections to streaming platforms
- `stream_history` - Historical streaming data
- `streams` - Current streaming records
- `superfans` - Top fan identification
- `social_posts` - Social media engagement data
- `alerts` - Alert configurations
- `notifications` - User notifications

## Migration Files

Located in `backend/alembic/versions/`:
- `20251103_add_platform_models.py` - Initial schema with all core tables
- `20251103_add_alerts_notifications.py` - Alert and notification tables
