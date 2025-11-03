#!/usr/bin/env python3
"""
Script to create a user directly in the database
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from passlib.context import CryptContext
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.user import User
import uuid
from datetime import datetime

# Password context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://fanpulse_user:fanpulse_password@localhost:5432/fanpulse_db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def create_user(email: str, password: str, subscription_tier: str = "pro"):
    """Create a new user"""
    db = SessionLocal()

    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"❌ User with email {email} already exists!")
            return False

        # Hash password
        hashed_password = pwd_context.hash(password)

        # Create user
        new_user = User(
            id=uuid.uuid4(),
            email=email,
            hashed_password=hashed_password,
            subscription_tier=subscription_tier,
            is_verified=True,  # Auto-verify
            created_at=datetime.utcnow()
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        print(f"✅ User created successfully!")
        print(f"   Email: {email}")
        print(f"   Password: {password}")
        print(f"   Tier: {subscription_tier}")
        print(f"   ID: {new_user.id}")
        print(f"   Verified: {new_user.is_verified}")

        return True

    except Exception as e:
        print(f"❌ Error creating user: {e}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python create_user.py <email> <password> [tier]")
        print("Example: python create_user.py test@example.com password123 pro")
        sys.exit(1)

    email = sys.argv[1]
    password = sys.argv[2]
    tier = sys.argv[3] if len(sys.argv) > 3 else "pro"

    create_user(email, password, tier)
