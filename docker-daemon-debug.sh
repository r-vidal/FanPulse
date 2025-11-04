#!/bin/bash

echo "╔════════════════════════════════════════════════════════════╗"
echo "║          Docker Daemon Debug & Analysis Tool              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    echo "⚠️  This script needs root access for full diagnostics."
    echo "   Some checks may fail without sudo."
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Check Docker processes
echo "1️⃣  Checking Docker processes..."
ps aux | grep -E 'dockerd|containerd' | grep -v grep
if [ $? -ne 0 ]; then
    echo "   ❌ No Docker daemon processes running!"
else
    echo "   ✅ Docker processes found"
fi
echo ""

# 2. Check Docker socket
echo "2️⃣  Checking Docker socket..."
if [ -S /var/run/docker.sock ]; then
    echo "   ✅ Socket exists: /var/run/docker.sock"
    ls -la /var/run/docker.sock
else
    echo "   ❌ Socket missing: /var/run/docker.sock"
fi
echo ""

# 3. Check system resources
echo "3️⃣  Checking system resources..."
echo ""
echo "   💾 Disk space:"
df -h / | tail -1 | awk '{print "      Root: " $4 " free (" $5 " used)"}'
df -h /var/lib/docker 2>/dev/null | tail -1 | awk '{print "      Docker: " $4 " free (" $5 " used)"}' || echo "      Docker: N/A"
echo ""
echo "   🧠 Memory:"
free -h | grep Mem | awk '{print "      Total: " $2 ", Used: " $3 ", Free: " $4}'
echo ""

# 4. Check Docker service status
echo "4️⃣  Docker service status..."
sudo systemctl status docker.service --no-pager -l | head -20
echo ""

# 5. Check recent Docker logs
echo "5️⃣  Recent Docker logs (last 30 lines)..."
sudo journalctl -u docker.service -n 30 --no-pager
echo ""

# 6. Check for port conflicts
echo "6️⃣  Checking for port conflicts..."
check_port() {
    local port=$1
    local name=$2
    if sudo lsof -i :$port 2>/dev/null | grep -q LISTEN; then
        echo "   ⚠️  Port $port ($name) is in use:"
        sudo lsof -i :$port | grep LISTEN
    else
        echo "   ✅ Port $port ($name) is free"
    fi
}
check_port 2375 "Docker API"
check_port 2376 "Docker TLS"
echo ""

# 7. Check Docker configuration
echo "7️⃣  Docker daemon configuration..."
if [ -f /etc/docker/daemon.json ]; then
    echo "   📄 /etc/docker/daemon.json exists:"
    cat /etc/docker/daemon.json
else
    echo "   ℹ️  No custom daemon.json (using defaults)"
fi
echo ""

# 8. Check for hanging operations
echo "8️⃣  Checking for stuck operations..."
if sudo ls -la /var/lib/docker/tmp 2>/dev/null; then
    echo "   ⚠️  Temporary files found (may indicate stuck operations)"
else
    echo "   ✅ No stuck temporary operations"
fi
echo ""

# 9. Try to ping daemon with timeout
echo "9️⃣  Testing Docker daemon responsiveness (5 second timeout)..."
if timeout 5 docker info &>/dev/null; then
    echo "   ✅ Daemon responds!"
else
    echo "   ❌ Daemon does not respond within 5 seconds"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 DIAGNOSTIC SUMMARY"
echo ""

# Provide recommendations based on findings
FREE_SPACE=$(df / | tail -1 | awk '{print $4}')
FREE_MEM=$(free | grep Mem | awk '{print $4}')

if [ "$FREE_SPACE" -lt 2000000 ]; then
    echo "⚠️  LOW DISK SPACE (< 2GB free)"
    echo "   → Free up disk space or clean Docker:"
    echo "     docker system prune -a --volumes"
    echo ""
fi

if [ "$FREE_MEM" -lt 1000000 ]; then
    echo "⚠️  LOW MEMORY (< 1GB free)"
    echo "   → Close other applications"
    echo "   → Add swap space if needed"
    echo ""
fi

if ! sudo systemctl is-active --quiet docker; then
    echo "❌ DOCKER SERVICE NOT ACTIVE"
    echo "   → Try: ./docker-force-restart.sh"
    echo ""
fi

if ! [ -S /var/run/docker.sock ]; then
    echo "❌ DOCKER SOCKET MISSING"
    echo "   → Try: ./docker-force-restart.sh"
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔧 RECOMMENDED ACTIONS:"
echo ""
echo "1. Try force restart first:"
echo "   ./docker-force-restart.sh"
echo ""
echo "2. If that fails, check the logs above for specific errors"
echo ""
echo "3. Nuclear option (complete reset):"
echo "   ./docker-nuclear-reset.sh"
echo ""
