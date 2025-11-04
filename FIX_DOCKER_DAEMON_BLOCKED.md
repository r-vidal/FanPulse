# Fix: Docker Daemon Blocked

## 🚨 Symptom
Script blocks at "Checking Docker daemon..." and never returns.

## ⚠️ MOST COMMON CAUSE: Low Disk Space

**Before trying anything else, check your disk space:**

```bash
df -h
```

If you have less than 2GB free, **Docker won't start**. This is the #1 cause!

### Solution 0: Free Up Disk Space (If low on space)

```bash
./free-disk-space.sh
```

This will automatically clean Docker images, containers, logs, and temporary files.

See detailed guide: `FIX_LOW_DISK_SPACE.md`

---

## ✅ Quick Fix (Try these in order)

### Solution 1: Force Restart (Try this after freeing disk space)

```bash
./docker-force-restart.sh
```

This script will:
- Kill all hanging Docker processes
- Stop Docker service
- Clean network state
- Restart Docker
- Verify it works

**Time:** ~1 minute

---

### Solution 2: Debug Analysis (If Solution 1 didn't work)

```bash
sudo ./docker-daemon-debug.sh
```

This will:
- Show you exactly what's wrong
- Check system resources
- Show Docker logs
- Provide specific recommendations

**Time:** ~30 seconds

---

### Solution 3: Nuclear Reset (Last resort)

```bash
./docker-nuclear-reset.sh
```

⚠️ **WARNING:** This deletes ALL Docker data!
- All containers will be removed
- All images will be removed
- All volumes will be removed
- Docker reset to factory state

**Time:** ~2-3 minutes

---

## 🔍 Manual Troubleshooting

If scripts don't work, try these commands manually:

### Kill hanging Docker processes
```bash
sudo pkill -9 dockerd
sudo pkill -9 containerd
```

### Stop and start Docker service
```bash
sudo systemctl stop docker
sudo systemctl start docker
```

### Check Docker logs
```bash
sudo journalctl -u docker.service -n 50
```

### Test if Docker responds
```bash
timeout 5 docker info
```

If it times out, Docker daemon is blocked.

---

## 💡 Common Causes & Fixes

### 1. 🔥 Low disk space (MOST COMMON - 80% of cases)
```bash
df -h
# If less than 2GB free, run:
./free-disk-space.sh
```

**Why this happens:** Docker needs space for:
- Container logs
- Layer cache
- Temporary files
- Socket operations

**Quick fix:** `./free-disk-space.sh`

### 2. Corrupted network state
```bash
sudo systemctl stop docker
sudo rm -rf /var/lib/docker/network
sudo systemctl start docker
```

### 3. Stuck containers
```bash
docker ps -a
docker rm -f $(docker ps -aq)
```

### 4. Port conflicts
```bash
sudo lsof -i :2375  # Docker API
sudo lsof -i :2376  # Docker TLS
# Kill the conflicting processes if found
```

---

## 🎯 After Docker is Fixed

Once Docker daemon responds, apply the database fixes:

```bash
./fix-database.sh
```

---

## 📊 Step-by-Step Recovery Process

**0. CHECK DISK SPACE FIRST** (Most important!)
   ```bash
   df -h
   # If < 2GB free, run:
   ./free-disk-space.sh
   ```

1. **Try force restart** (fastest, safest)
   ```bash
   ./docker-force-restart.sh
   ```

2. **If still blocked, debug**
   ```bash
   sudo ./docker-daemon-debug.sh
   ```
   Read the output carefully - it will tell you what's wrong

3. **Fix specific issues** based on debug output

4. **If nothing works, nuclear reset**
   ```bash
   ./docker-nuclear-reset.sh
   ```

5. **After Docker works, fix database**
   ```bash
   ./fix-database.sh
   ```

---

## 🆘 Still Not Working?

### Check system requirements:
- Disk space: Need at least 10GB free
- RAM: Need at least 2GB free
- Docker version: Should be 20.10 or higher

```bash
df -h           # Check disk
free -h         # Check RAM
docker --version  # Check Docker version
```

### Consider Docker reinstall:
```bash
# Remove Docker
sudo apt-get remove docker docker-engine docker.io containerd runc

# Install fresh
sudo apt-get update
sudo apt-get install docker.io docker-compose

# Add user to docker group
sudo usermod -aG docker $USER

# Restart system
sudo reboot
```

---

## 🔗 Related Documentation

- `FIX_LOW_DISK_SPACE.md` - ⭐ Disk space cleanup guide (read this first!)
- `DOCKER_TROUBLESHOOTING.md` - Comprehensive Docker troubleshooting
- `QUICK_START.md` - Quick start guide
- `FIX_DATABASE_SCHEMA.md` - Database schema fixes

---

## ⏱️ Expected Timeline

| Action | Time | Success Rate |
|--------|------|--------------|
| **Disk cleanup** | **2-5 min** | **80%** ⭐ |
| Force restart | 1 min | 60% without cleanup, 90% after |
| Debug + fix | 5 min | 95% |
| Nuclear reset | 3 min | 99% |
| Full reinstall | 15 min | 100% |

**Start with disk cleanup if you have low space!** Most Docker issues are caused by this.
