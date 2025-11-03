#!/bin/bash

# FanPulse Local Development Setup Script

set -e

echo "🎵 FanPulse - Local Development Setup"
echo "===================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating backend/.env from .env.example..."
    cp backend/.env.example backend/.env
    echo "⚠️  Please edit backend/.env and add your API keys"
fi

if [ ! -f "frontend/.env" ]; then
    echo "📝 Creating frontend/.env from .env.example..."
    cp frontend/.env.example frontend/.env
fi

echo ""
echo "🐳 Starting Docker containers..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

echo ""
echo "🔧 Running database migrations..."
docker-compose exec backend alembic upgrade head

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 Services are running:"
echo "  - Frontend:  http://localhost:3000"
echo "  - Backend:   http://localhost:8000"
echo "  - API Docs:  http://localhost:8000/docs"
echo "  - PostgreSQL: localhost:5432"
echo "  - Redis:     localhost:6379"
echo ""
echo "📝 Next steps:"
echo "  1. Edit backend/.env with your API keys"
echo "  2. Visit http://localhost:3000 to start"
echo "  3. Register an account and start exploring"
echo ""
echo "🛠️  Useful commands:"
echo "  - View logs:        docker-compose logs -f"
echo "  - Stop services:    docker-compose down"
echo "  - Restart services: docker-compose restart"
echo "  - Run tests:        make test-backend"
echo ""
