#!/bin/bash

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     Docker Nuclear Reset (COMPLETE REINSTALL STATE)       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "⚠️  ⚠️  ⚠️  EXTREME WARNING ⚠️  ⚠️  ⚠️"
echo ""
echo "This will:"
echo "  - Stop all Docker services"
echo "  - DELETE all Docker data (/var/lib/docker)"
echo "  - Remove all containers, images, volumes, networks"
echo "  - Reset Docker to factory state"
echo ""
echo "You will need to rebuild everything after this!"
echo ""
read -p "Are you ABSOLUTELY SURE? Type 'YES' to continue: " response
if [ "$response" != "YES" ]; then
    echo "Cancelled. (Type exactly 'YES' to proceed)"
    exit 0
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: Stop everything
echo "1️⃣  Stopping all Docker services..."
sudo systemctl stop docker.socket
sudo systemctl stop docker.service
sudo systemctl stop containerd.service
sudo pkill -9 dockerd
sudo pkill -9 containerd
sleep 3

# Step 2: Backup current state (just in case)
echo ""
echo "2️⃣  Creating backup of Docker directory names (for reference)..."
if [ -d /var/lib/docker/volumes ]; then
    sudo ls -la /var/lib/docker/volumes > ~/docker-volumes-backup-$(date +%Y%m%d-%H%M%S).txt 2>/dev/null || true
    echo "   Backup saved to ~/docker-volumes-backup-*.txt"
fi

# Step 3: Remove Docker data
echo ""
echo "3️⃣  Removing all Docker data..."
echo "   This may take a while..."
sudo rm -rf /var/lib/docker
sudo rm -rf /var/lib/containerd
sudo rm -rf /var/run/docker.sock
sudo rm -rf /var/run/docker
echo "   ✅ Docker data removed"

# Step 4: Restart services
echo ""
echo "4️⃣  Restarting Docker services..."
sudo systemctl daemon-reload
sudo systemctl start containerd.service
sleep 2
sudo systemctl start docker.socket
sudo systemctl start docker.service
sleep 5

# Step 5: Verify
echo ""
echo "5️⃣  Verifying Docker is working..."
for i in {1..20}; do
    if timeout 3 docker info &>/dev/null; then
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "✅ SUCCESS! Docker has been reset and is now working!"
        echo ""
        docker version
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "📋 NEXT STEPS:"
        echo ""
        echo "1. Pull base images:"
        echo "   docker pull postgres:15-alpine"
        echo "   docker pull redis:7-alpine"
        echo "   docker pull python:3.11-slim"
        echo ""
        echo "2. Rebuild and start FanPulse:"
        echo "   ./rebuild.sh"
        echo ""
        echo "   OR start fresh:"
        echo "   docker compose up -d --build"
        echo ""
        exit 0
    fi
    echo -n "."
    sleep 1
done

echo ""
echo ""
echo "❌ Docker still not working after reset."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🆘 This indicates a deeper system issue."
echo ""
echo "Please check:"
echo ""
echo "1. System logs:"
echo "   sudo journalctl -u docker.service -n 50"
echo ""
echo "2. Disk space (need at least 10GB free):"
echo "   df -h"
echo ""
echo "3. Memory (need at least 2GB free):"
echo "   free -h"
echo ""
echo "4. Docker installation:"
echo "   docker --version"
echo "   which dockerd"
echo ""
echo "5. Consider reinstalling Docker:"
echo "   sudo apt-get remove docker docker-engine docker.io containerd runc"
echo "   sudo apt-get update"
echo "   sudo apt-get install docker.io docker-compose"
echo ""
