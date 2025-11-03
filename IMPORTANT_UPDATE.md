# 🔧 Important Update - Bcrypt Fix Required

## What Changed?

We've fixed the registration error by updating the password hashing implementation:

- **Removed**: `passlib` (outdated, compatibility issues)
- **Added**: Direct `bcrypt==4.2.0` implementation
- **Fixed**: 72-byte password truncation (bcrypt limitation)

## 🚨 Action Required

Since we changed dependencies in `requirements.txt`, you **MUST rebuild** your Docker containers:

```bash
./rebuild.sh
```

Or manually:

```bash
docker compose down
docker compose build backend celery-worker celery-beat
docker compose up -d
docker compose exec backend alembic upgrade head
```

## What This Fixes

1. ✅ **ValueError**: `password cannot be longer than 72 bytes`
2. ✅ **AttributeError**: `module 'bcrypt' has no attribute '__about__'`
3. ✅ **500 Error**: Registration endpoint now works correctly

## Testing After Rebuild

1. Go to http://localhost:3000/register
2. Enter email and password
3. Click "Create Account"
4. Should see success message and redirect to login

## Why This Change?

- `passlib` (v1.7.4) is no longer actively maintained
- Has compatibility issues with modern `bcrypt` versions
- Direct `bcrypt` usage is simpler, faster, and more reliable

## Files Modified

- `backend/app/core/security.py` - Switched from passlib to bcrypt
- `backend/requirements.txt` - Updated dependencies
- `rebuild.sh` - New script to rebuild containers easily

## Previous Fixes in This Branch

1. ✅ Frontend text visibility (white text on white background)
2. ✅ Missing `app.api.deps` module
3. ✅ Missing `subscription_tier` field in database migration
4. ✅ Bcrypt compatibility (this update)

All issues are now resolved! 🎉
