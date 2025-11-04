# Fix: Low Disk Space Issues

## 🚨 Problem
Docker daemon won't start because there's almost no disk space left (only a few MB remaining).

## ⚠️ Critical Information
Docker needs **at least 2-3GB of free disk space** to operate properly. If you have less than that:
- Docker daemon will fail to start
- Containers won't run
- Database operations will fail

## ✅ Quick Fix

### Run the automatic cleanup script:

```bash
chmod +x free-disk-space.sh
./free-disk-space.sh
```

This script will:
- ✅ Show current disk usage
- ✅ Clean all unused Docker images, containers, volumes
- ✅ Clean package manager cache (apt)
- ✅ Clean old log files
- ✅ Clean temporary files
- ✅ Clean thumbnail cache
- ✅ Show you large files you can delete
- ✅ Show new disk usage

**Time:** 2-5 minutes depending on system

---

## Manual Cleanup Steps

If you prefer to do it manually:

### 1. Clean Docker (Most Effective)

```bash
# Stop all containers
docker stop $(docker ps -aq)

# Remove all unused Docker data
docker system prune -a -f --volumes
```

This can free up **several GB** typically.

### 2. Clean Package Cache

```bash
sudo apt-get clean
sudo apt-get autoclean
sudo apt-get autoremove -y
```

Can free up **500MB - 2GB**.

### 3. Clean Logs

```bash
# Clean systemd journal logs (keep last 3 days)
sudo journalctl --vacuum-time=3d

# Clean old log files
sudo find /var/log -type f -name "*.log" -mtime +7 -delete
sudo find /var/log -type f -name "*.gz" -delete
```

Can free up **100MB - 1GB**.

### 4. Clean Temporary Files

```bash
sudo rm -rf /tmp/*
sudo rm -rf /var/tmp/*
rm -rf ~/.cache/*
```

Can free up **100MB - 500MB**.

### 5. Empty Trash

```bash
rm -rf ~/.local/share/Trash/*
```

### 6. Find Large Files

```bash
# Find files larger than 100MB in home directory
find ~ -type f -size +100M -exec ls -lh {} \; | awk '{ print $9 ": " $5 }'

# Find largest directories
sudo du -h / | sort -rh | head -20
```

---

## How Much Space Do You Need?

| Purpose | Minimum | Recommended |
|---------|---------|-------------|
| Docker to start | 500MB | 2GB |
| Run FanPulse | 2GB | 5GB |
| Development (with logs, caches) | 5GB | 10GB+ |

---

## After Cleanup

Once you have freed up space (at least 2GB):

### 1. Verify disk space:
```bash
df -h
```

### 2. Start Docker:
```bash
./docker-force-restart.sh
```

### 3. Apply database fixes:
```bash
./fix-database.sh
```

---

## Prevent Future Issues

### 1. Set up Docker cleanup job

Add to your crontab (`crontab -e`):

```bash
# Clean Docker every Sunday at 2am
0 2 * * 0 docker system prune -a -f --volumes
```

### 2. Monitor disk space

```bash
# Check disk space regularly
df -h

# Set up alerts (example for bash)
if [ $(df / | tail -1 | awk '{print $5}' | sed 's/%//') -gt 80 ]; then
    echo "⚠️  Disk usage above 80%!"
fi
```

### 3. Clean Docker after testing

When done with development for the day:

```bash
docker compose down
docker system prune -f
```

---

## Docker Disk Space Management

### Check Docker disk usage:

```bash
docker system df
```

Shows:
- Images space
- Containers space
- Volumes space
- Build cache space

### Clean specific components:

```bash
# Remove stopped containers only
docker container prune

# Remove unused images only
docker image prune -a

# Remove unused volumes only
docker volume prune

# Remove build cache only
docker builder prune
```

---

## If Still Low on Space

### Option 1: Move Docker directory

If `/var/lib/docker` is on a small partition, move it to a larger one:

```bash
# Stop Docker
sudo systemctl stop docker

# Move Docker directory
sudo mv /var/lib/docker /path/to/larger/partition/docker

# Create symlink
sudo ln -s /path/to/larger/partition/docker /var/lib/docker

# Start Docker
sudo systemctl start docker
```

### Option 2: Clean system thoroughly

```bash
# Remove old kernels (Ubuntu/Debian)
sudo apt-get autoremove --purge

# Clean snap packages (if using Ubuntu)
sudo snap list --all | awk '/disabled/{print $1, $3}' | \
    while read snapname revision; do
        sudo snap remove "$snapname" --revision="$revision"
    done

# Clean pip cache
pip cache purge

# Clean npm cache
npm cache clean --force

# Clean yarn cache
yarn cache clean
```

---

## Related Issues

- Docker daemon won't start → Usually caused by low disk space
- "No space left on device" errors → Run cleanup script
- Containers fail to start → Check disk space first

---

## Quick Checklist

- [ ] Run `df -h` to check disk space
- [ ] Run `./free-disk-space.sh` for automatic cleanup
- [ ] Verify at least 2GB is free
- [ ] Restart Docker with `./docker-force-restart.sh`
- [ ] Apply database fixes with `./fix-database.sh`

---

## Summary

**Root Cause:** Low disk space prevents Docker daemon from starting

**Solution:** Free up disk space (need 2GB minimum)

**Quick Action:** Run `./free-disk-space.sh`

**After Cleanup:** Run `./docker-force-restart.sh` then `./fix-database.sh`
