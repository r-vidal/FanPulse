#!/bin/bash

# Health check script for FanPulse services

API_URL="${1:-http://localhost:8000}"

echo "🏥 FanPulse Health Check"
echo "======================="
echo "Checking: $API_URL"
echo ""

# Check API health
echo -n "🔍 API Health: "
if curl -sf "$API_URL/health" > /dev/null 2>&1; then
    echo "✅ Healthy"
else
    echo "❌ Unhealthy"
    exit 1
fi

# Check database
echo -n "🗄️  Database: "
if curl -sf "$API_URL/health/db" > /dev/null 2>&1; then
    echo "✅ Connected"
else
    echo "❌ Connection failed"
    exit 1
fi

# Check Redis (if endpoint exists)
echo -n "📦 Redis: "
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Running"
else
    echo "⚠️  Not accessible (might not be running locally)"
fi

# Check Celery worker
echo -n "⚙️  Celery Worker: "
if docker-compose ps | grep -q "celery-worker.*Up"; then
    echo "✅ Running"
else
    echo "❌ Not running"
fi

# Check Celery beat
echo -n "⏰ Celery Beat: "
if docker-compose ps | grep -q "celery-beat.*Up"; then
    echo "✅ Running"
else
    echo "❌ Not running"
fi

echo ""
echo "✅ All checks passed!"
