#!/bin/bash

# Quick Restart Backend
# Use this to restart just the backend after code changes

echo "🔄 Restarting backend container..."
docker compose restart backend

echo "⏳ Waiting for backend to be ready..."
sleep 5

echo "✅ Backend restarted!"
echo ""
echo "Checking backend health..."
curl -s http://localhost:8000/ | head -3 || echo "Backend not responding yet, wait a few more seconds"

echo ""
echo "Backend logs (last 20 lines):"
docker compose logs --tail=20 backend
