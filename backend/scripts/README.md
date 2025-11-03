# Backend Scripts

Utility scripts for database and development tasks.

## Database Scripts

### Initialize Database

Creates all database tables:

```bash
python scripts/init_db.py
```

### Create Migration

Creates a new Alembic migration:

```bash
python scripts/create_initial_migration.py
```

Or manually:

```bash
alembic revision --autogenerate -m "migration message"
```

### Apply Migrations

Apply all pending migrations:

```bash
alembic upgrade head
```

### Rollback Migration

Rollback the last migration:

```bash
alembic downgrade -1
```

## Celery Worker

Start the Celery worker:

```bash
celery -A celery_worker worker --loglevel=info
```

Start Celery Beat (for periodic tasks):

```bash
celery -A celery_worker beat --loglevel=info
```

Or start both together:

```bash
celery -A celery_worker worker --beat --loglevel=info
```

## Development

### Run Tests

```bash
pytest
pytest -v  # verbose
pytest --cov=app  # with coverage
```

### Lint Code

```bash
black .
flake8 app
```

### Type Check

```bash
mypy app
```
