# Monitoring & Observability

Guide for monitoring FanPulse in production.

## Sentry Setup

### Backend Integration

1. **Install Sentry SDK:**
   ```bash
   pip install sentry-sdk[fastapi]
   ```

2. **Configure in `app/main.py`:**
   ```python
   import sentry_sdk
   from sentry_sdk.integrations.fastapi import FastApiIntegration
   from app.core.config import settings

   if settings.SENTRY_DSN:
       sentry_sdk.init(
           dsn=settings.SENTRY_DSN,
           integrations=[FastApiIntegration()],
           environment=settings.APP_ENV,
           traces_sample_rate=1.0 if settings.APP_ENV == "production" else 0.1,
           profiles_sample_rate=0.5,
       )
   ```

3. **Test error reporting:**
   ```python
   @app.get("/sentry-test")
   async def trigger_error():
       division_by_zero = 1 / 0
   ```

### Frontend Integration

1. **Install Sentry SDK:**
   ```bash
   npx @sentry/wizard@latest -i nextjs
   ```

2. **Configure `sentry.client.config.ts`:**
   ```typescript
   import * as Sentry from "@sentry/nextjs";

   Sentry.init({
     dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
     environment: process.env.NODE_ENV,
     tracesSampleRate: 1.0,
   });
   ```

## Health Checks

### Endpoints

**Basic health:**
```bash
GET /health
Response: { "status": "healthy", "service": "FanPulse API", "version": "0.1.0" }
```

**Database health:**
```bash
GET /health/db
Response: { "status": "healthy", "database": "connected" }
```

### Monitoring Scripts

Create `scripts/health_check.sh`:
```bash
#!/bin/bash

API_URL="https://api.fanpulse.io"

# Check API health
if curl -f "$API_URL/health" > /dev/null 2>&1; then
    echo "✅ API is healthy"
else
    echo "❌ API is down"
    exit 1
fi

# Check database
if curl -f "$API_URL/health/db" > /dev/null 2>&1; then
    echo "✅ Database is healthy"
else
    echo "❌ Database connection failed"
    exit 1
fi
```

## Logging

### Backend Logging

Configure in `app/core/logging.py`:
```python
import logging
import sys

def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )

    # Set log levels for different modules
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("sqlalchemy").setLevel(logging.WARNING)
    logging.getLogger("celery").setLevel(logging.INFO)
```

### Log Aggregation

**Option 1: Railway Logs**
```bash
railway logs --follow
```

**Option 2: Datadog** (Optional for production)
```python
# pip install ddtrace
from ddtrace import tracer
tracer.configure(
    hostname="datadog-agent",
    port=8126,
)
```

## Metrics

### Key Metrics to Track

**Application Metrics:**
- Request rate (requests/second)
- Response time (p50, p95, p99)
- Error rate (%)
- Active users

**Database Metrics:**
- Query performance
- Connection pool usage
- Database size

**Celery Metrics:**
- Task queue length
- Task processing time
- Failed tasks

### Custom Metrics

Add to `app/core/metrics.py`:
```python
from prometheus_client import Counter, Histogram

request_count = Counter('http_requests_total', 'Total HTTP requests')
request_duration = Histogram('http_request_duration_seconds', 'HTTP request duration')

@app.middleware("http")
async def track_metrics(request: Request, call_next):
    request_count.inc()
    with request_duration.time():
        response = await call_next(request)
    return response
```

## Alerts

### Sentry Alerts

Configure in Sentry UI:
- Error rate threshold: > 10 errors/minute
- Performance degradation: p95 > 5 seconds
- Database errors: Any occurrence

### Email Notifications

Configure in `app/services/alerts.py`:
```python
async def send_alert(title: str, message: str):
    if settings.ALERT_EMAIL:
        await email_service.send_email(
            to_email=settings.ALERT_EMAIL,
            subject=f"[ALERT] {title}",
            html_content=message
        )
```

## Performance Monitoring

### Database Query Monitoring

```python
from sqlalchemy import event
from sqlalchemy.engine import Engine
import time
import logging

logger = logging.getLogger(__name__)

@event.listens_for(Engine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    conn.info.setdefault('query_start_time', []).append(time.time())

@event.listens_for(Engine, "after_cursor_execute")
def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    total = time.time() - conn.info['query_start_time'].pop(-1)
    if total > 1.0:  # Log slow queries (> 1 second)
        logger.warning(f"Slow query ({total:.2f}s): {statement}")
```

### API Response Time Tracking

```python
import time
from fastapi import Request

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)

    if process_time > 5.0:
        logger.warning(f"Slow endpoint: {request.url.path} took {process_time:.2f}s")

    return response
```

## Dashboards

### Sentry Dashboard

Key widgets:
- Error rate over time
- Most frequent errors
- Affected users
- Performance issues

### Custom Dashboard (Optional)

Use Grafana + Prometheus:
```yaml
# docker-compose monitoring stack
version: '3.8'

services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

## Troubleshooting

### High Error Rate

1. Check Sentry for error details
2. Review recent deployments
3. Check external API status (Spotify, etc.)
4. Review database performance

### Slow API Responses

1. Check database query times
2. Review Redis cache hit rate
3. Check external API response times
4. Review Celery queue length

### Database Issues

```bash
# Check connection pool
railway run python -c "from app.core.database import engine; print(engine.pool.status())"

# Check active queries
railway run psql $DATABASE_URL -c "SELECT pid, query, state FROM pg_stat_activity;"
```

### Memory Leaks

```python
# Add memory tracking
import tracemalloc

tracemalloc.start()

@app.get("/memory-stats")
async def get_memory_stats():
    current, peak = tracemalloc.get_traced_memory()
    return {
        "current_mb": current / 1024 / 1024,
        "peak_mb": peak / 1024 / 1024
    }
```

## Best Practices

1. **Log structured data** (JSON format)
2. **Set appropriate log levels**
   - DEBUG: Development only
   - INFO: Important events
   - WARNING: Potential issues
   - ERROR: Errors that need attention
   - CRITICAL: System failures

3. **Use correlation IDs** for request tracing
4. **Monitor external dependencies**
5. **Set up automated alerts**
6. **Regular performance reviews**
7. **Keep monitoring costs in check**

## Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [FastAPI Monitoring](https://fastapi.tiangolo.com/advanced/monitoring/)
- [PostgreSQL Monitoring](https://www.postgresql.org/docs/current/monitoring.html)
- [Celery Monitoring](https://docs.celeryq.dev/en/stable/userguide/monitoring.html)
