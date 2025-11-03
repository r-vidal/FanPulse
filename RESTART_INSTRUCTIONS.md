# How to Fix FanPulse - Complete Restart Instructions

## Problems Fixed in This Branch

1. ✅ **Login Error** - AlertPriority database schema mismatch
2. ✅ **Actions Endpoint** - created_at validation error
3. ✅ **Celery Tasks** - Unregistered tasks error

## How to Apply All Fixes

### Option 1: Using Docker (Recommended)

```bash
# Stop all services
docker-compose down

# Pull latest changes
git pull origin claude/fix-login-alert-priority-011CUmfv2xqVU3cvzLtmLUWk

# Start database first
docker-compose up -d postgres redis

# Wait for database to be ready
sleep 10

# Run migrations
docker-compose run --rm backend bash -c "alembic upgrade head"

# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f backend
docker-compose logs -f celery-worker
```

### Option 2: Running Without Docker

If you're running backend and frontend separately (not in Docker):

**Backend:**
```bash
# Navigate to backend
cd backend

# Activate virtual environment (if using one)
# source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Clear Python cache
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -type f -name "*.pyc" -delete 2>/dev/null || true

# Start backend (in one terminal)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Start Celery worker (in another terminal)
celery -A celery_worker worker --loglevel=info

# Start Celery Beat (in another terminal)
celery -A celery_worker beat --loglevel=info
```

**Frontend:**
```bash
# Navigate to frontend
cd frontend

# Install dependencies (if needed)
npm install

# Create .env.local file with API URL
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
echo "NEXT_PUBLIC_AUTH_ENABLED=true" >> .env.local

# Start frontend
npm run dev
```

## Verify Everything Works

1. **Backend**: Visit http://localhost:8000/docs - Should see API documentation
2. **Login**: Visit http://localhost:3000/login - Should NOT see AlertPriority error
3. **Actions**: API call to `/api/actions/next` should work without validation errors
4. **Celery**: Check logs - Should NOT see "unregistered task" errors

## Troubleshooting

### Frontend doesn't load

- Check browser console for JavaScript errors (F12)
- Verify API URL in .env.local matches where backend is running
- Make sure backend is actually running and responding
- Try clearing browser cache

### Backend errors

- Check `docker-compose logs backend` for detailed errors
- Verify migrations ran: `docker-compose run --rm backend alembic current`
- Check database connection

### Celery still showing errors

- Restart Celery worker: `docker-compose restart celery-worker celery-beat`
- Check worker logs: `docker-compose logs celery-worker`
- Verify all tasks imported: Check backend/app/tasks/__init__.py

## What Changed

### Database Migration
- New migration: `20251103_fix_alerts_schema.py`
- Recreates `alerts` table with correct schema
- Adds AlertType and AlertSeverity enums

### Code Changes
- `action_engine.py`: Added explicit `created_at` timestamps
- `app/tasks/__init__.py`: Import all Celery tasks for registration
- `FIX_LOGIN_ISSUE.md`: Comprehensive troubleshooting guide

## Need Help?

If you still have issues after following these steps:
1. Check all logs: `docker-compose logs`
2. Verify all services are running: `docker-compose ps`
3. Try a complete reset: `docker-compose down -v && docker-compose up -d`
