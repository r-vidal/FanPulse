# Deployment Guide

This guide covers deploying FanPulse to production environments.

## Overview

- **Frontend**: Deployed to Vercel
- **Backend**: Deployed to Railway
- **Database**: Railway PostgreSQL
- **Redis**: Railway Redis
- **CI/CD**: GitHub Actions

## Prerequisites

### Accounts Needed
- [Vercel Account](https://vercel.com)
- [Railway Account](https://railway.app)
- [Sentry Account](https://sentry.io) (optional, for monitoring)

### GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets):

**Vercel:**
- `VERCEL_TOKEN` - Get from Vercel Settings
- `VERCEL_ORG_ID` - Get from Vercel Project Settings
- `VERCEL_PROJECT_ID` - Get from Vercel Project Settings

**Railway:**
- `RAILWAY_TOKEN` - Get from Railway Account Settings

**Sentry (optional):**
- `SENTRY_AUTH_TOKEN` - Get from Sentry Settings

## Frontend Deployment (Vercel)

### Initial Setup

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Link project:**
   ```bash
   cd frontend
   vercel link
   ```

4. **Set environment variables:**
   ```bash
   vercel env add NEXT_PUBLIC_API_URL production
   # Enter your backend API URL (e.g., https://api.fanpulse.io)
   ```

### Manual Deployment

```bash
cd frontend
vercel --prod
```

### Automatic Deployment

- Push to `main` branch triggers automatic deployment via GitHub Actions
- See `.github/workflows/deploy-frontend.yml`

### Custom Domain

1. Go to Vercel Project Settings → Domains
2. Add your custom domain (e.g., `app.fanpulse.io`)
3. Update DNS records as instructed

## Backend Deployment (Railway)

### Initial Setup

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway:**
   ```bash
   railway login
   ```

3. **Create new project:**
   ```bash
   railway init
   ```

4. **Add PostgreSQL:**
   ```bash
   railway add postgresql
   ```

5. **Add Redis:**
   ```bash
   railway add redis
   ```

### Environment Variables

Set these in Railway Project Settings:

```env
# Application
APP_ENV=production
DEBUG=False
SECRET_KEY=<generate-secure-key>
JWT_SECRET_KEY=<generate-secure-jwt-key>

# Database (auto-set by Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (auto-set by Railway)
REDIS_URL=${{Redis.REDIS_URL}}
CELERY_BROKER_URL=${{Redis.REDIS_URL}}/1
CELERY_RESULT_BACKEND=${{Redis.REDIS_URL}}/2

# CORS
CORS_ORIGINS=https://app.fanpulse.io,https://fanpulse.io

# External APIs
SPOTIFY_CLIENT_ID=<your-spotify-client-id>
SPOTIFY_CLIENT_SECRET=<your-spotify-client-secret>
APPLE_MUSIC_KEY_ID=<your-apple-music-key-id>
APPLE_MUSIC_TEAM_ID=<your-apple-music-team-id>

# Email
SENDGRID_API_KEY=<your-sendgrid-key>
FROM_EMAIL=noreply@fanpulse.io

# Stripe
STRIPE_SECRET_KEY=<your-stripe-secret>
STRIPE_PUBLISHABLE_KEY=<your-stripe-public>
STRIPE_WEBHOOK_SECRET=<your-stripe-webhook>

# Monitoring (optional)
SENTRY_DSN=<your-sentry-dsn>
```

### Manual Deployment

```bash
cd backend
railway up
```

### Run Migrations

```bash
railway run alembic upgrade head
```

### Automatic Deployment

- Push to `main` branch triggers automatic deployment via GitHub Actions
- See `.github/workflows/deploy-backend.yml`

### Custom Domain

1. Go to Railway Project Settings → Domains
2. Add custom domain (e.g., `api.fanpulse.io`)
3. Update DNS records as instructed

## Database Migrations

### Run migrations on Railway

```bash
# Option 1: Via Railway CLI
railway run alembic upgrade head

# Option 2: Via GitHub Actions (automatic on deploy)
# Migrations run automatically after deployment
```

### Rollback migration

```bash
railway run alembic downgrade -1
```

## Monitoring

### Sentry Setup

1. **Create Sentry projects:**
   - Frontend project: `fanpulse-frontend`
   - Backend project: `fanpulse-backend`

2. **Add Sentry to backend:**
   ```bash
   cd backend
   pip install sentry-sdk[fastapi]
   ```

   Update `backend/app/main.py`:
   ```python
   import sentry_sdk
   from sentry_sdk.integrations.fastapi import FastApiIntegration

   if settings.SENTRY_DSN:
       sentry_sdk.init(
           dsn=settings.SENTRY_DSN,
           integrations=[FastApiIntegration()],
           environment=settings.APP_ENV,
           traces_sample_rate=1.0 if settings.APP_ENV == "production" else 0.1,
       )
   ```

3. **Add Sentry to frontend:**
   ```bash
   cd frontend
   npm install @sentry/nextjs
   npx @sentry/wizard -i nextjs
   ```

### Health Checks

**Backend health:**
```bash
curl https://api.fanpulse.io/health
```

**Database health:**
```bash
curl https://api.fanpulse.io/health/db
```

## CI/CD Workflows

### Backend Tests
- Runs on every push to `backend/**`
- Tests with PostgreSQL and Redis
- Coverage report uploaded to Codecov

### Frontend Tests
- Runs on every push to `frontend/**`
- Linting, type checking, and build
- Tests (when added)

### Deployments
- Automatic on push to `main`
- Manual trigger via GitHub Actions UI

## Troubleshooting

### Frontend build fails
```bash
# Clear Next.js cache
cd frontend
rm -rf .next
npm run build
```

### Backend crashes on startup
```bash
# Check Railway logs
railway logs

# Check environment variables
railway variables
```

### Database connection issues
```bash
# Test connection
railway run python -c "from app.core.database import engine; engine.connect()"
```

### Migrations fail
```bash
# Check current version
railway run alembic current

# Show migration history
railway run alembic history

# Reset to specific version
railway run alembic downgrade <revision>
```

## Rollback Procedure

### Frontend Rollback (Vercel)
1. Go to Vercel Project → Deployments
2. Find previous successful deployment
3. Click "..." → "Promote to Production"

### Backend Rollback (Railway)
1. Go to Railway Project → Deployments
2. Find previous successful deployment
3. Click "Redeploy"

### Database Rollback
```bash
# Rollback last migration
railway run alembic downgrade -1

# Rollback to specific version
railway run alembic downgrade <revision>
```

## Security Checklist

- [ ] All secrets stored in environment variables
- [ ] No `.env` files in git
- [ ] CORS origins configured correctly
- [ ] Rate limiting enabled
- [ ] HTTPS enforced
- [ ] Database backups enabled
- [ ] Sentry monitoring active
- [ ] Error logging configured

## Backup & Restore

### Database Backup

```bash
# Create backup
railway run pg_dump $DATABASE_URL > backup.sql

# Restore backup
railway run psql $DATABASE_URL < backup.sql
```

### Automated Backups

Railway provides automatic daily backups. Configure in Project Settings.

## Scaling

### Railway Scaling

- **Vertical**: Upgrade instance size in Project Settings
- **Horizontal**: Add replicas in Deployment Settings

### Database Scaling

- Upgrade PostgreSQL plan in Railway
- Consider read replicas for high traffic

## Cost Estimation

### Free Tier (Development)
- Vercel: Free (hobby plan)
- Railway: $5/month (includes database and Redis)
- **Total**: ~$5/month

### Production (Small Scale)
- Vercel Pro: $20/month
- Railway: $20-50/month (depending on usage)
- Sentry: Free (up to 5k errors/month)
- SendGrid: Free (up to 100 emails/day)
- **Total**: ~$40-70/month

### Production (Growing)
- Vercel Pro: $20/month
- Railway: $100-200/month
- Sentry Team: $26/month
- SendGrid Essentials: $20/month
- **Total**: ~$166-266/month

## Support

For deployment issues:
- Railway: https://railway.app/help
- Vercel: https://vercel.com/support
- GitHub Actions: Check workflow logs

For application issues:
- GitHub Issues: https://github.com/r-vidal/FanPulse/issues
