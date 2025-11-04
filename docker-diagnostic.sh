#!/bin/bash

echo "=== Docker Engine Diagnostic Tool ==="
echo ""

# Check Docker status
echo "1. Checking Docker service status..."
if command -v systemctl &> /dev/null; then
    sudo systemctl status docker --no-pager || echo "   ❌ Docker service not running properly"
else
    echo "   ⚠️  systemctl not available"
fi

echo ""
echo "2. Checking Docker daemon..."
docker info &> /dev/null
if [ $? -eq 0 ]; then
    echo "   ✅ Docker daemon is responsive"
else
    echo "   ❌ Docker daemon is not responding"
fi

echo ""
echo "3. Checking running containers..."
docker ps 2>&1
if [ $? -ne 0 ]; then
    echo "   ❌ Cannot list containers"
fi

echo ""
echo "4. Checking Docker Compose..."
docker compose version 2>&1
if [ $? -ne 0 ]; then
    echo "   ❌ Docker Compose not available"
fi

echo ""
echo "5. Checking for port conflicts..."
sudo lsof -i :5432 | grep LISTEN || echo "   ✅ Port 5432 (PostgreSQL) is free"
sudo lsof -i :8000 | grep LISTEN || echo "   ✅ Port 8000 (Backend) is free"
sudo lsof -i :3000 | grep LISTEN || echo "   ✅ Port 3000 (Frontend) is free"

echo ""
echo "6. Checking disk space..."
df -h | grep -E "Filesystem|/$"

echo ""
echo "=== Recommended Actions ==="
echo ""
echo "If Docker service is not running:"
echo "  sudo systemctl restart docker"
echo ""
echo "If Docker daemon is unresponsive:"
echo "  sudo systemctl stop docker"
echo "  sudo rm -rf /var/lib/docker/network"
echo "  sudo systemctl start docker"
echo ""
echo "If ports are in use:"
echo "  docker compose down"
echo "  # Or kill the processes using the ports"
echo ""
echo "For a fresh start:"
echo "  docker compose down -v"
echo "  docker system prune -a"
echo "  sudo systemctl restart docker"
