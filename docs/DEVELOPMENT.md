# FanPulse Development Guide

## Table of Contents

1. [Project Setup](#project-setup)
2. [Development Workflow](#development-workflow)
3. [Architecture Overview](#architecture-overview)
4. [API Documentation](#api-documentation)
5. [Testing](#testing)
6. [Deployment](#deployment)

---

## Project Setup

### Prerequisites

- **Docker & Docker Compose** (recommended for easiest setup)
- **Node.js 20+** (for frontend development)
- **Python 3.11+** (for backend development)
- **PostgreSQL 15+** (if not using Docker)
- **Redis 7+** (if not using Docker)

### Quick Start with Docker (Recommended)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/r-vidal/FanPulse.git
   cd FanPulse
   ```

2. **Set up environment variables:**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   # Frontend
   cp frontend/.env.example frontend/.env
   ```

3. **Start all services:**
   ```bash
   make dev
   # Or: docker-compose up -d
   ```

4. **Access the services:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs
   - PostgreSQL: localhost:5432
   - Redis: localhost:6379

5. **View logs:**
   ```bash
   make dev-logs
   # Or: docker-compose logs -f
   ```

### Manual Setup (Without Docker)

#### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start development server
npm run dev
```

---

## Development Workflow

### Making Changes

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**

3. **Run tests:**
   ```bash
   # Backend tests
   make test-backend

   # Frontend tests
   make test-frontend
   ```

4. **Lint your code:**
   ```bash
   # Backend
   make lint-backend

   # Frontend
   make lint-frontend
   ```

5. **Commit and push:**
   ```bash
   git add .
   git commit -m "Description of changes"
   git push origin feature/your-feature-name
   ```

### Database Migrations

**Create a new migration:**
```bash
make migrate-create
# Or: cd backend && alembic revision --autogenerate -m "migration message"
```

**Apply migrations:**
```bash
make migrate
# Or: cd backend && alembic upgrade head
```

**Rollback migration:**
```bash
cd backend && alembic downgrade -1
```

### Working with the Database

**Access PostgreSQL shell:**
```bash
make db-shell
# Or: docker-compose exec postgres psql -U fanpulse -d fanpulse
```

**Access Redis CLI:**
```bash
make redis-cli
# Or: docker-compose exec redis redis-cli
```

---

## Architecture Overview

### Project Structure

```
FanPulse/
├── frontend/                 # Next.js frontend
│   ├── src/
│   │   ├── app/             # Next.js 14 app directory
│   │   ├── components/      # React components
│   │   ├── lib/             # Utilities and API client
│   │   ├── hooks/           # Custom React hooks
│   │   ├── types/           # TypeScript types
│   │   └── styles/          # Global styles
│   ├── public/              # Static assets
│   └── package.json
│
├── backend/                  # FastAPI backend
│   ├── app/
│   │   ├── api/             # API routes
│   │   │   └── routes/      # Route handlers
│   │   ├── core/            # Core config & utilities
│   │   ├── models/          # Database models
│   │   ├── services/        # Business logic
│   │   ├── algorithms/      # Analytics algorithms
│   │   └── utils/           # Utility functions
│   ├── alembic/             # Database migrations
│   ├── tests/               # Backend tests
│   └── requirements.txt
│
├── docs/                     # Documentation
├── docker-compose.yml        # Docker services
└── Makefile                  # Common commands
```

### Tech Stack

**Frontend:**
- Next.js 14 (React framework)
- TypeScript
- Tailwind CSS
- React Query (data fetching)
- Zustand (state management)
- Recharts (data visualization)

**Backend:**
- FastAPI (Python web framework)
- SQLAlchemy (ORM)
- PostgreSQL (database)
- Redis (caching & queues)
- Alembic (migrations)
- Celery (task queue)

**Algorithms:**
- NumPy & Pandas (data processing)
- Scikit-learn (ML models)
- Statsmodels (time series)

---

## API Documentation

### Authentication

All authenticated endpoints require a Bearer token:

```bash
Authorization: Bearer <access_token>
```

### Key Endpoints

**Auth:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get token
- `GET /api/auth/me` - Get current user

**Artists:**
- `GET /api/artists` - List all artists
- `POST /api/artists` - Create new artist
- `GET /api/artists/{id}` - Get artist details
- `DELETE /api/artists/{id}` - Delete artist

**Analytics (Coming Soon):**
- `GET /api/analytics/momentum/{artist_id}` - Get momentum index
- `GET /api/analytics/superfans/{artist_id}` - Get top superfans
- `GET /api/analytics/forecast/{artist_id}` - Revenue forecast

### API Documentation

Interactive API docs available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## Testing

### Backend Tests

```bash
# Run all tests
cd backend && pytest

# Run with coverage
cd backend && pytest --cov=app

# Run specific test file
cd backend && pytest tests/test_auth.py

# Run with verbose output
cd backend && pytest -v
```

### Frontend Tests

```bash
# Run all tests
cd frontend && npm test

# Run in watch mode
cd frontend && npm test -- --watch

# Run with coverage
cd frontend && npm test -- --coverage
```

---

## Deployment

### Environment Variables

**Backend (.env):**
```env
# Required
DATABASE_URL=postgresql://user:pass@host:5432/fanpulse
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret

# Optional
SPOTIFY_CLIENT_ID=your-spotify-id
INSTAGRAM_CLIENT_ID=your-instagram-id
STRIPE_SECRET_KEY=your-stripe-key
```

**Frontend (.env):**
```env
NEXT_PUBLIC_API_URL=https://api.fanpulse.io
```

### Production Deployment

**Backend (Railway):**
1. Connect GitHub repository
2. Set environment variables
3. Deploy from main branch

**Frontend (Vercel):**
1. Import GitHub repository
2. Set environment variables
3. Deploy

### Health Checks

- Backend: `GET /health`
- Database: `GET /health/db`

---

## Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Stop all services
make stop

# Or kill specific port
lsof -ti:3000 | xargs kill
```

**Database connection errors:**
```bash
# Reset database
make clean
make dev
```

**Module not found errors:**
```bash
# Backend
cd backend && pip install -r requirements.txt

# Frontend
cd frontend && npm install
```

---

## Additional Resources

- [Main README](../README.md)
- [API Documentation](http://localhost:8000/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [FastAPI Docs](https://fastapi.tiangolo.com/)
