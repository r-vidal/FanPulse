# Docker Troubleshooting Guide

## Problem: Docker Engine Loops / Won't Start

If Docker Engine is stuck in a loop or won't start properly, follow these steps:

---

## Quick Fix Attempts

### 1. Restart Docker Service

```bash
sudo systemctl restart docker
```

Wait 30 seconds, then check status:
```bash
sudo systemctl status docker
docker info
```

### 2. Stop Conflicting Containers

```bash
# Stop all containers
docker compose down

# Check if anything is still running
docker ps -a

# Force remove stuck containers
docker rm -f $(docker ps -aq) 2>/dev/null
```

### 3. Check for Port Conflicts

```bash
sudo lsof -i :5432  # PostgreSQL
sudo lsof -i :8000  # Backend
sudo lsof -i :3000  # Frontend
```

If ports are in use, either:
- Kill the processes: `sudo kill -9 <PID>`
- Change ports in `docker-compose.yml`

---

## If Quick Fixes Don't Work

### Option A: Clean Docker State

```bash
# Stop Docker
sudo systemctl stop docker

# Clean up Docker state
sudo rm -rf /var/lib/docker/network
sudo rm -rf /var/lib/docker/containers

# Restart Docker
sudo systemctl start docker

# Verify it's working
docker info
```

### Option B: Complete Docker Reset

```bash
# Stop all containers
docker compose down -v

# Remove all Docker data (WARNING: This removes all images and containers)
docker system prune -a --volumes

# Restart Docker
sudo systemctl restart docker
```

---

## Alternative: Apply Fixes Without Docker Rebuild

If Docker is running but just unstable, you can apply the database migrations without a full rebuild:

```bash
# Make the script executable
chmod +x apply-migrations-only.sh

# Run it
./apply-migrations-only.sh
```

This script:
1. Checks if containers are running
2. Copies new migration files into the running container
3. Runs migrations
4. Restarts backend services

---

## Diagnostic Tool

Run the diagnostic tool to identify the issue:

```bash
chmod +x docker-diagnostic.sh
./docker-diagnostic.sh
```

This will check:
- Docker service status
- Docker daemon responsiveness
- Running containers
- Port conflicts
- Disk space

---

## Platform-Specific Issues

### Docker Desktop (Mac/Windows)

1. Open Docker Desktop application
2. Click the bug icon (troubleshoot)
3. Try "Restart Docker Desktop"
4. If that fails, try "Reset to factory defaults" (WARNING: removes all data)

### Linux

1. Check system logs:
   ```bash
   sudo journalctl -u docker.service -n 50 --no-pager
   ```

2. Check Docker daemon logs:
   ```bash
   sudo cat /var/log/docker.log
   ```

3. Restart the service:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl restart docker
   ```

---

## After Docker is Fixed

Once Docker is working again, apply the database fixes:

### Option 1: Full Rebuild (Recommended for fresh start)

```bash
./rebuild.sh
```

### Option 2: Quick Apply (If containers already running)

```bash
./apply-migrations-only.sh
```

---

## Still Having Issues?

### Check System Resources

```bash
# Check available disk space
df -h

# Check memory
free -h

# Check if swap is available
swapon --show
```

Docker needs:
- At least 2GB free disk space
- At least 2GB RAM available

### Enable Debug Mode

Edit `/etc/docker/daemon.json`:

```json
{
  "debug": true,
  "log-level": "debug"
}
```

Then restart:
```bash
sudo systemctl restart docker
```

### Contact Support

If none of these work, gather this info for support:
- Output of `docker version`
- Output of `docker info`
- Output of `sudo systemctl status docker`
- Output of `sudo journalctl -u docker.service -n 100`
- Your OS version: `cat /etc/os-release`
