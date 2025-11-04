# Quick Start - Fix Database Errors

## 🚨 Problem
The dashboard shows database errors:
- "relation momentum_scores does not exist"
- "column alerts.user_id does not exist"

## ✅ Solution

### Step 1: Fix Docker (if needed)

#### 🔥 MOST IMPORTANT: Check Disk Space First!

```bash
df -h
```

**If you have less than 2GB free**, Docker won't start! This is the #1 cause (80% of cases).

**Free up space immediately:**
```bash
./free-disk-space.sh
```

This automatically cleans Docker images, containers, logs, and temporary files (2-5 minutes).

📖 See detailed guide: `FIX_LOW_DISK_SPACE.md`

---

#### After disk space is OK, try force restart:

```bash
./docker-force-restart.sh
```

This will forcefully restart Docker and fix most issues (1 minute).

---

#### If Docker daemon is still blocked/hanging:

📖 See `FIX_DOCKER_DAEMON_BLOCKED.md` for detailed solutions.

Quick commands:
```bash
# Debug what's wrong
sudo ./docker-daemon-debug.sh

# Nuclear option (deletes all Docker data - last resort)
./docker-nuclear-reset.sh
```

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
| `free-disk-space.sh` | **Low disk space?** Start here! ⭐ |
| `docker-force-restart.sh` | Docker blocked after cleaning disk |
| `docker-daemon-debug.sh` | Analyze why Docker is stuck |
| `docker-nuclear-reset.sh` | Last resort - complete Docker reset |
| `fix-database.sh` | Apply database fixes (after Docker works) |
| `apply-migrations-only.sh` | Quick update if containers running |
| `rebuild.sh` | Fresh start, full rebuild |

---

## Need Help?

1. **Low disk space** (only a few MB/GB free): See `FIX_LOW_DISK_SPACE.md` 🔥
2. **Docker daemon blocked/hanging**: See `FIX_DOCKER_DAEMON_BLOCKED.md` ⭐
3. **Docker won't start**: See `DOCKER_TROUBLESHOOTING.md`
4. **Migrations fail**: Check logs with `docker compose logs backend`
5. **Still getting errors**: Check `FIX_DATABASE_SCHEMA.md` for detailed info

---

## What Was Fixed

The fixes include:
- ✅ New migration for `momentum_scores` table
- ✅ Fixed `alerts` table schema (added `user_id` column)
- ✅ Automatic migrations on backend startup
- ✅ Updated Docker configuration

All changes are in branch: `claude/fix-database-schema-errors-011CUoALvpTWviFXt4HvzmhS`
