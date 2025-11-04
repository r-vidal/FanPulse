# Quick Start - Fix Database Errors

## 🚨 Problem
The dashboard shows database errors:
- "relation momentum_scores does not exist"
- "column alerts.user_id does not exist"

## ✅ Solution

### Step 1: Fix Docker (if needed)

If Docker is not starting or looping, try:

```bash
sudo systemctl restart docker
```

Wait 30 seconds, then verify:
```bash
docker info
```

**If Docker still doesn't work**, see detailed troubleshooting:
- Run: `./docker-diagnostic.sh`
- Read: `DOCKER_TROUBLESHOOTING.md`

### Step 2: Apply Database Fixes

Once Docker is working, run:

```bash
./fix-database.sh
```

This smart script will:
- Check your Docker/container status
- Automatically choose the best fix method
- Apply database migrations
- Restart services if needed

**That's it!** 🎉

---

## Alternative: Manual Steps

### If containers are already running:

```bash
./apply-migrations-only.sh
```

This is faster - it updates the running containers without rebuilding.

### If you want a fresh start:

```bash
./rebuild.sh
```

This rebuilds everything from scratch (takes longer but more thorough).

---

## Verify the Fix

1. Check backend logs:
   ```bash
   docker compose logs -f backend
   ```
   Look for: "Running database migrations..."

2. Open http://localhost:3000
   - Dashboard should load without errors
   - No SQL errors in console

---

## Quick Reference

| Script | When to Use |
|--------|-------------|
| `fix-database.sh` | **Start here** - Smart auto-detection |
| `apply-migrations-only.sh` | Containers running, quick update |
| `rebuild.sh` | Fresh start, full rebuild |
| `docker-diagnostic.sh` | Diagnose Docker issues |

---

## Need Help?

1. **Docker won't start**: See `DOCKER_TROUBLESHOOTING.md`
2. **Migrations fail**: Check logs with `docker compose logs backend`
3. **Still getting errors**: Check `FIX_DATABASE_SCHEMA.md` for detailed info

---

## What Was Fixed

The fixes include:
- ✅ New migration for `momentum_scores` table
- ✅ Fixed `alerts` table schema (added `user_id` column)
- ✅ Automatic migrations on backend startup
- ✅ Updated Docker configuration

All changes are in branch: `claude/fix-database-schema-errors-011CUoALvpTWviFXt4HvzmhS`
