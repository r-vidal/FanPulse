"""Initialize database - create all tables"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine, Base
from app.models import User, Artist, Superfan, Stream, Alert

print("Creating all database tables...")
Base.metadata.create_all(bind=engine)
print("✅ Database initialized successfully!")
