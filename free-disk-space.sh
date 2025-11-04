#!/bin/bash

echo "╔════════════════════════════════════════════════════════════╗"
echo "║           Emergency Disk Space Cleanup Tool               ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "⚠️  This will free up disk space by cleaning Docker and system files"
echo ""

# Show current disk usage
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Current Disk Usage:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
df -h / /var
echo ""

# Calculate sizes
echo "📦 Docker Space Usage:"
if command -v docker &> /dev/null && docker info &> /dev/null; then
    sudo du -sh /var/lib/docker 2>/dev/null || echo "   Cannot access Docker directory"
    echo ""
    echo "   Images:"
    docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" 2>/dev/null || echo "   Cannot list images"
else
    echo "   Docker is not running (cannot check size)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "Start cleanup? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧹 STARTING CLEANUP..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

FREED=0

# 1. Docker cleanup (if Docker is accessible)
if command -v docker &> /dev/null; then
    echo "1️⃣  Cleaning Docker (this will remove unused images and containers)..."

    # Try to clean even if daemon is not responsive
    echo "   → Stopping all containers..."
    docker stop $(docker ps -aq) 2>/dev/null || true

    echo "   → Removing stopped containers..."
    docker container prune -f 2>/dev/null || true

    echo "   → Removing unused images..."
    docker image prune -a -f 2>/dev/null || true

    echo "   → Removing unused volumes..."
    docker volume prune -f 2>/dev/null || true

    echo "   → Removing build cache..."
    docker builder prune -a -f 2>/dev/null || true

    echo "   → Full system prune..."
    docker system prune -a -f --volumes 2>/dev/null || true

    echo "   ✅ Docker cleanup complete"
else
    echo "1️⃣  Docker not available, skipping..."
fi

echo ""

# 2. Clean APT cache
echo "2️⃣  Cleaning package manager cache..."
sudo apt-get clean 2>/dev/null || true
sudo apt-get autoclean 2>/dev/null || true
sudo apt-get autoremove -y 2>/dev/null || true
echo "   ✅ Package cache cleaned"
echo ""

# 3. Clean logs
echo "3️⃣  Cleaning old log files..."
sudo journalctl --vacuum-time=3d 2>/dev/null || true
sudo find /var/log -type f -name "*.log" -mtime +7 -delete 2>/dev/null || true
sudo find /var/log -type f -name "*.gz" -delete 2>/dev/null || true
echo "   ✅ Old logs cleaned"
echo ""

# 4. Clean temporary files
echo "4️⃣  Cleaning temporary files..."
sudo rm -rf /tmp/* 2>/dev/null || true
sudo rm -rf /var/tmp/* 2>/dev/null || true
rm -rf ~/.cache/* 2>/dev/null || true
echo "   ✅ Temporary files cleaned"
echo ""

# 5. Clean thumbnail cache
echo "5️⃣  Cleaning thumbnail cache..."
rm -rf ~/.thumbnails/* 2>/dev/null || true
rm -rf ~/.cache/thumbnails/* 2>/dev/null || true
echo "   ✅ Thumbnail cache cleaned"
echo ""

# 6. Find and clean large files in common locations
echo "6️⃣  Finding large files (>100MB)..."
echo "   This may take a moment..."
echo ""
echo "   Top 10 largest files in home directory:"
find ~ -type f -size +100M 2>/dev/null | head -10 | while read file; do
    size=$(du -h "$file" | cut -f1)
    echo "      $size - $file"
done
echo ""

# Show results
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ CLEANUP COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 New Disk Usage:"
df -h / /var
echo ""

# Check if we freed enough space
AVAILABLE=$(df / | tail -1 | awk '{print $4}')
if [ "$AVAILABLE" -gt 2000000 ]; then
    echo "✅ Good! You now have enough disk space (>2GB free)"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🚀 NEXT STEPS:"
    echo ""
    echo "1. Try starting Docker again:"
    echo "   ./docker-force-restart.sh"
    echo ""
    echo "2. Once Docker works, apply database fixes:"
    echo "   ./fix-database.sh"
    echo ""
else
    echo "⚠️  Still low on disk space (<2GB free)"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🔍 ADDITIONAL CLEANUP OPTIONS:"
    echo ""
    echo "1. Review large files listed above and delete if not needed"
    echo ""
    echo "2. Clean old kernels (Ubuntu/Debian):"
    echo "   sudo apt-get autoremove --purge"
    echo ""
    echo "3. Find large directories:"
    echo "   sudo du -h / | sort -rh | head -20"
    echo ""
    echo "4. Empty trash:"
    echo "   rm -rf ~/.local/share/Trash/*"
    echo ""
    echo "5. Clean npm/pip cache if you use them:"
    echo "   npm cache clean --force"
    echo "   pip cache purge"
    echo ""
fi
