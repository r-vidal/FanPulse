#!/bin/bash

echo "╔════════════════════════════════════════════════════════════╗"
echo "║        Force Docker Daemon Restart (AGGRESSIVE)           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "⚠️  WARNING: This will forcefully restart Docker"
echo "   All running containers will be stopped!"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: Kill docker info if it's hanging
echo "1️⃣  Killing any hanging docker processes..."
sudo pkill -9 docker
sudo pkill -9 dockerd
sudo pkill -9 containerd
sleep 2

# Step 2: Stop Docker service forcefully
echo ""
echo "2️⃣  Stopping Docker service..."
sudo systemctl stop docker.socket 2>/dev/null || true
sudo systemctl stop docker.service 2>/dev/null || true
sleep 3

# Step 3: Clean up problematic Docker state
echo ""
echo "3️⃣  Cleaning Docker network state..."
sudo rm -rf /var/lib/docker/network 2>/dev/null || true
sudo rm -rf /var/run/docker.sock 2>/dev/null || true

# Step 4: Restart Docker
echo ""
echo "4️⃣  Starting Docker daemon..."
sudo systemctl daemon-reload
sudo systemctl start docker.socket
sudo systemctl start docker.service

# Step 5: Wait and verify
echo ""
echo "5️⃣  Waiting for Docker to be ready..."
for i in {1..30}; do
    if timeout 2 docker info &>/dev/null; then
        echo ""
        echo "✅ Docker daemon is now responsive!"
        echo ""
        docker version
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "✅ SUCCESS! Docker is working."
        echo ""
        echo "Next step: Run the database fix"
        echo "   ./fix-database.sh"
        echo ""
        exit 0
    fi
    echo -n "."
    sleep 1
done

echo ""
echo ""
echo "❌ Docker daemon is still not responding after 30 seconds."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔍 Let's check what's wrong..."
echo ""
echo "📋 Docker service status:"
sudo systemctl status docker --no-pager -l
echo ""
echo "📋 Recent Docker logs:"
sudo journalctl -u docker.service -n 20 --no-pager
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🆘 NEXT STEPS:"
echo ""
echo "Option 1: Complete Docker reset (nuclear option)"
echo "   ./docker-nuclear-reset.sh"
echo ""
echo "Option 2: Check system resources"
echo "   df -h          # Check disk space"
echo "   free -h        # Check memory"
echo ""
echo "Option 3: Check for conflicting processes"
echo "   sudo lsof -i :2375    # Docker API port"
echo "   sudo lsof -i :2376    # Docker TLS port"
echo ""
