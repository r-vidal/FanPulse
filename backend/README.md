# FanPulse Backend

FastAPI backend for FanPulse music analytics platform.

## Tech Stack

- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM
- **PostgreSQL** - Primary database
- **Redis** - Caching & task queue
- **Alembic** - Database migrations
- **Celery** - Background tasks
- **JWT** - Authentication

## Getting Started

### Prerequisites

- Python 3.11+
- PostgreSQL 15+
- Redis 7+

### Installation

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Configuration

Copy `.env.example` to `.env` and configure:

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/fanpulse
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret
```

### Database Setup

```bash
# Run migrations
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "description"
```

### Development

```bash
# Start server
uvicorn app.main:app --reload

# Or with make
make dev
```

API will be available at:
- http://localhost:8000
- Docs: http://localhost:8000/docs

## Project Structure

```
app/
├── api/              # API routes
│   └── routes/      # Route handlers
├── core/            # Core configuration
├── models/          # Database models
├── services/        # Business logic
├── algorithms/      # Analytics algorithms
└── utils/           # Utilities
```

## Testing

```bash
# Run tests
pytest

# With coverage
pytest --cov=app

# Specific test
pytest tests/test_auth.py
```

## Algorithms

### Fan Value Score (FVS)
Located in `app/algorithms/fvs.py`
- Calculates 0-100 score for fans
- Weights: Listening (40%), Recency (30%), Social (20%), Monetization (10%)

### Momentum Index
Located in `app/algorithms/momentum.py`
- Calculates 0-10 momentum score
- Components: Streams, Engagement, Playlists, Social, Discovery

## API Documentation

Interactive docs available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Learn More

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)
