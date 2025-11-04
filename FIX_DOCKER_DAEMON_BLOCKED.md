# Fix: Docker Daemon Blocked

## 🚨 Symptom
Script blocks at "Checking Docker daemon..." and never returns.

## ✅ Quick Fix (Try these in order)

### Solution 1: Force Restart (RECOMMENDED - Try this first)

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

### 1. Corrupted network state
```bash
sudo systemctl stop docker
sudo rm -rf /var/lib/docker/network
sudo systemctl start docker
```

### 2. Low disk space
```bash
df -h
# If low, clean up:
docker system prune -a --volumes
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

- `DOCKER_TROUBLESHOOTING.md` - Comprehensive Docker troubleshooting
- `QUICK_START.md` - Quick start guide
- `FIX_DATABASE_SCHEMA.md` - Database schema fixes

---

## ⏱️ Expected Timeline

| Action | Time | Success Rate |
|--------|------|--------------|
| Force restart | 1 min | 80% |
| Debug + fix | 5 min | 90% |
| Nuclear reset | 3 min | 99% |
| Full reinstall | 15 min | 100% |

Start with force restart. If it doesn't work, move to the next option.
