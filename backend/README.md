# FanPulse Backend

FastAPI backend for FanPulse music analytics platform with real-time data processing, Spotify OAuth, and AI-powered analytics.

## Tech Stack

- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM with async support
- **PostgreSQL** - Primary database
- **Redis** - Caching & message broker
- **Alembic** - Database migrations
- **Celery** - Distributed task queue
- **Flower** - Celery monitoring UI
- **JWT** - Token-based authentication
- **Spotipy** - Spotify API integration
- **NumPy/Pandas** - Data analytics
- **scikit-learn** - Machine learning

## Features

✅ **Platform Integrations**
- Spotify OAuth 2.0 with automatic token refresh
- Instagram, TikTok, YouTube, Apple Music APIs
- Real-time data synchronization every 6 hours

✅ **AI-Powered Analytics**
- Fan Value Score (FVS) calculation
- Momentum Index tracking
- Viral spike detection
- Breakout prediction
- Superfan segmentation

✅ **Background Jobs**
- Data sync from all platforms (every 6h)
- FVS calculation (daily at 3 AM UTC)
- Momentum calculation (every 6h)
- Viral spike detection (every 3h)
- OAuth token auto-refresh (hourly)
- Weekly email reports (Monday 8 AM UTC)

✅ **Production Ready**
- Celery task queue with Redis
- Flower monitoring UI
- Comprehensive error handling
- Rate limiting & security
- Docker support

## Getting Started

### Prerequisites

- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

### Quick Start with Docker

```bash
# Start all services (Postgres, Redis, Backend, Celery, Flower, Frontend)
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f celery-worker

# Stop all services
docker-compose down
```

Services will be available at:
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Flower (Celery Monitor)**: http://localhost:5555
- **Frontend**: http://localhost:3000

### Manual Installation

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in required credentials:
```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/fanpulse

# Security
SECRET_KEY=your-secret-key-here  # Generate: openssl rand -hex 32
JWT_SECRET_KEY=your-jwt-secret   # Generate: openssl rand -hex 32

# Spotify API (Required for P1)
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/connect/spotify/callback

# Redis
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2
```

3. **Get Spotify Credentials**:
   - Go to https://developer.spotify.com/dashboard
   - Create a new app
   - Add redirect URI: `http://localhost:3000/connect/spotify/callback`
   - Copy Client ID and Client Secret to `.env`

### Database Setup

```bash
# Run migrations
alembic upgrade head

# Create new migration (after model changes)
alembic revision --autogenerate -m "description"

# Rollback migration
alembic downgrade -1
```

### Development

#### Start Backend API
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Start Celery Worker (Required for background tasks)
```bash
celery -A celery_worker worker --loglevel=info
```

#### Start Celery Beat (Required for scheduled tasks)
```bash
celery -A celery_worker beat --loglevel=info
```

#### Start Flower (Optional - Monitoring UI)
```bash
celery -A celery_worker flower --port=5555
```

Then access:
- **Backend API**: http://localhost:8000
- **Interactive API Docs**: http://localhost:8000/docs
- **Flower Dashboard**: http://localhost:5555

## Project Structure

```
app/
├── api/                    # API endpoints
│   ├── routes/            # 23 route modules (auth, artists, analytics, etc.)
│   └── deps.py            # Dependency injection
├── core/                  # Core configuration
│   ├── celery_app.py     # Celery setup & beat schedule
│   ├── config.py         # Settings management (Pydantic)
│   ├── database.py       # SQLAlchemy setup
│   └── security.py       # JWT & password hashing
├── models/                # SQLAlchemy models (16 models)
│   ├── user.py           # User & subscription tiers
│   ├── artist.py         # Artist profiles
│   ├── platform.py       # OAuth tokens & connections
│   ├── stream_history.py # Time-series streaming data
│   ├── social_post.py    # Social media posts
│   ├── alert.py          # Alert system
│   └── ...
├── services/              # Business logic
│   ├── platforms/        # Platform API integrations
│   │   ├── spotify.py   # Spotify OAuth & API
│   │   ├── instagram.py
│   │   ├── tiktok.py
│   │   └── youtube.py
│   ├── analytics/        # Analytics services
│   │   ├── fvs.py       # FVS calculator
│   │   ├── momentum.py  # Momentum calculator
│   │   └── superfan.py  # Superfan segmentation
│   └── token_manager.py # OAuth token auto-refresh
├── algorithms/           # Core algorithms
│   ├── fvs.py           # Fan Value Score
│   └── momentum.py      # Momentum Index
├── tasks/                # Celery tasks (8 modules)
│   ├── analytics.py     # Data sync, FVS, Momentum, Viral detection
│   ├── email.py         # Email sending (SendGrid)
│   ├── releases.py      # Release scoring
│   └── ...
└── utils/                # Utilities
    ├── email.py
    └── validators.py
```

## Celery Background Tasks

### Scheduled Tasks (Celery Beat)

| Task | Schedule | Description |
|------|----------|-------------|
| `fetch_all_artist_data` | Every 6 hours | Sync data from Spotify, Instagram, TikTok, etc. |
| `calculate_all_fvs` | **Daily at 3 AM UTC** | Calculate Fan Value Score for all artists |
| `calculate_all_momentum` | **Every 6 hours** | Calculate Momentum Index for all artists |
| `detect_all_viral_spikes` | **Every 3 hours** | Detect viral content and create alerts |
| `refresh_expiring_tokens` | Every hour | Auto-refresh OAuth tokens before expiry |
| `send_weekly_reports` | Monday 8 AM UTC | Email weekly analytics reports |
| `cleanup_expired_alerts` | Daily 2 AM UTC | Clean up old alert notifications |
| `calculate_release_scores` | Monday 6 AM UTC | Calculate release optimizer scores |
| `scrape_competing_releases` | Daily 3 AM UTC | Scrape competing releases data |

### Monitoring Tasks with Flower

Access the Flower dashboard at http://localhost:5555 to:
- View active, scheduled, and completed tasks
- Monitor task execution times and success rates
- Inspect task arguments and results
- View worker status and resource usage
- Restart failed tasks
- Configure task rate limits

**Flower Features:**
- Real-time task monitoring
- Task history and statistics
- Worker pool management
- Broker monitoring (Redis)
- HTTP API for automation

## Analytics Algorithms

### Fan Value Score (FVS)

**Location**: `app/algorithms/fvs.py` + `app/services/analytics/fvs.py`

Calculates a **0-100 score** representing fan value based on:

| Component | Weight | Metrics |
|-----------|--------|---------|
| Engagement Rate | 40% | Likes, comments, shares relative to followers |
| Growth Rate | 30% | Follower/listener growth over time |
| Reach | 20% | Total followers & monthly listeners |
| Conversion | 10% | Playlist adds, saves, shares |

**Usage**:
```python
from app.services.analytics.fvs import FVSCalculator

calculator = FVSCalculator(db)
result = calculator.calculate_fvs(artist_id, days=30)
# Returns: {"fvs": 78.5, "breakdown": {...}}
```

### Momentum Index

**Location**: `app/algorithms/momentum.py` + `app/services/analytics/momentum.py`

Calculates a **0-10 momentum score** tracking growth velocity:

| Component | Weight | Description |
|-----------|--------|-------------|
| Velocity | 35% | Rate of follower/listener growth |
| Acceleration | 30% | Change in growth rate over time |
| Consistency | 20% | Stability of growth |
| Viral Potential | 15% | Engagement spike detection |

**Status Levels**:
- **0-3**: Declining
- **3-5**: Stable
- **5-7**: Growing
- **7-9**: Rapid growth
- **9-10**: Viral/Breakout

**Usage**:
```python
from app.services.analytics.momentum import MomentumCalculator

calculator = MomentumCalculator(db)
result = calculator.calculate_momentum(artist_id, days=30)
# Returns: {"momentum_index": 7.8, "status": "rapid_growth", ...}

# Predict breakout
prediction = calculator.predict_breakout(artist_id)
# Returns: {"prediction": "high", "probability": 0.85, ...}
```

### Viral Spike Detection

Automatically creates alerts when:
- Viral content detected (engagement >2σ above mean)
- Momentum index ≥ 9
- Breakout probability ≥ 80%

Runs every 3 hours via `detect_all_viral_spikes` Celery task.

## API Documentation

### Interactive API Docs

Access comprehensive API documentation at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

**Authentication**:
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - JWT login
- `GET /api/auth/me` - Get current user

**Spotify OAuth**:
- `GET /api/spotify/authorize` - Start OAuth flow
- `GET /api/spotify/callback` - OAuth callback
- `GET /api/spotify/disconnect` - Disconnect account

**Artists**:
- `GET /api/artists` - List artists
- `POST /api/artists/import-spotify` - Import from Spotify
- `GET /api/artists/{id}` - Get artist details

**Analytics**:
- `GET /api/analytics/{artist_id}/fvs` - Get FVS score
- `GET /api/analytics/{artist_id}/momentum` - Get momentum
- `GET /api/analytics/{artist_id}/superfans` - Get superfans
- `GET /api/analytics/{artist_id}/breakout-prediction` - Breakout probability

**Dashboard**:
- `GET /api/dashboard/stats` - Aggregated stats
- `GET /api/dashboard/top-performers` - Top artists

## Testing

```bash
# Run all tests
pytest

# With coverage report
pytest --cov=app --cov-report=html

# Specific test file
pytest tests/test_auth.py

# Specific test function
pytest tests/test_auth.py::test_login

# Run with verbose output
pytest -v

# Run tests in parallel
pytest -n auto
```

## Troubleshooting

### Celery Worker Not Processing Tasks

```bash
# Check worker status
celery -A celery_worker inspect active

# Check registered tasks
celery -A celery_worker inspect registered

# Purge all tasks (WARNING: deletes all queued tasks)
celery -A celery_worker purge
```

### OAuth Token Issues

Tokens are automatically refreshed 30 minutes before expiry. If manual refresh needed:

```python
from app.services.token_manager import token_manager
await token_manager.ensure_valid_token(platform_connection, db)
```

### Database Migration Issues

```bash
# Check current migration version
alembic current

# View migration history
alembic history

# Generate migration manually
alembic revision -m "description"

# Stamp database to specific revision
alembic stamp head
```

### Redis Connection Issues

```bash
# Test Redis connection
redis-cli ping

# View all keys
redis-cli keys '*'

# Monitor commands
redis-cli monitor
```

## Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for production setup guide covering:
- Railway/Render deployment
- Environment variable configuration
- SSL/HTTPS setup
- Database backups
- Monitoring & alerts
- Scaling considerations

## Learn More

### Documentation
- [FastAPI](https://fastapi.tiangolo.com/) - Web framework
- [Celery](https://docs.celeryq.dev/) - Task queue
- [SQLAlchemy](https://docs.sqlalchemy.org/) - ORM
- [Alembic](https://alembic.sqlalchemy.org/) - Migrations
- [Flower](https://flower.readthedocs.io/) - Celery monitoring
- [Spotipy](https://spotipy.readthedocs.io/) - Spotify API

### Platform API Docs
- [Spotify Web API](https://developer.spotify.com/documentation/web-api)
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)
- [TikTok for Developers](https://developers.tiktok.com/)
- [YouTube Data API](https://developers.google.com/youtube/v3)

## License

Proprietary - All rights reserved
