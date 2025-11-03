"""Script to create initial database migration"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from alembic.config import Config
from alembic import command

# Alembic configuration
alembic_cfg = Config("alembic.ini")

# Create initial migration
print("Creating initial migration...")
command.revision(
    alembic_cfg,
    autogenerate=True,
    message="Initial migration - users, artists, superfans, streams, alerts"
)
print("✅ Migration created successfully!")
print("\nTo apply the migration, run:")
print("  alembic upgrade head")
