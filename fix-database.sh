#!/bin/bash

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     FanPulse Database Schema Fix - Smart Installer        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if Docker is running
echo "🔍 Checking Docker status..."
if docker info &> /dev/null; then
    echo "✅ Docker is running"
    DOCKER_RUNNING=true
else
    echo "❌ Docker is not responding"
    DOCKER_RUNNING=false
fi

echo ""

# Check if containers are running
if [ "$DOCKER_RUNNING" = true ]; then
    if docker compose ps backend 2>/dev/null | grep -q "Up"; then
        echo "✅ Backend container is running"
        CONTAINERS_RUNNING=true
    else
        echo "⚠️  Backend container is not running"
        CONTAINERS_RUNNING=false
    fi
else
    CONTAINERS_RUNNING=false
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Provide options based on status
if [ "$DOCKER_RUNNING" = false ]; then
    echo "🔧 DOCKER IS NOT RUNNING"
    echo ""
    echo "Please fix Docker first. Try these commands:"
    echo ""
    echo "  sudo systemctl restart docker"
    echo "  docker info  # Verify it works"
    echo ""
    echo "For detailed troubleshooting, see: DOCKER_TROUBLESHOOTING.md"
    echo "Or run: ./docker-diagnostic.sh"
    echo ""
    exit 1

elif [ "$CONTAINERS_RUNNING" = false ]; then
    echo "🚀 CONTAINERS NOT RUNNING - Starting fresh..."
    echo ""
    echo "This will:"
    echo "  1. Stop any existing containers"
    echo "  2. Rebuild the backend with migrations"
    echo "  3. Start all services"
    echo ""
    read -p "Continue? (y/N) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ./rebuild.sh
    else
        echo "Cancelled."
        exit 0
    fi

else
    echo "✨ CONTAINERS RUNNING - Applying migrations to existing setup..."
    echo ""
    echo "This will:"
    echo "  1. Copy new migration files to the running container"
    echo "  2. Run database migrations"
    echo "  3. Restart backend services"
    echo ""
    echo "⚠️  This is faster but requires containers to be healthy."
    echo ""
    read -p "Continue? (y/N) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ./apply-migrations-only.sh
    else
        echo ""
        echo "Alternative: Use rebuild.sh for a fresh start"
        exit 0
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Done!"
echo ""
echo "🌐 Access your application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "📋 Check logs:"
echo "   docker compose logs -f backend"
echo ""
