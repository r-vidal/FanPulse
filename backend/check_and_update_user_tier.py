#!/usr/bin/env python3
"""
Script to check and update user subscription tiers
"""
import sys
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User, SubscriptionTier


def check_user_tier(email: str, db: Session):
    """Check a user's subscription tier"""
    user = db.query(User).filter(User.email == email).first()

    if not user:
        print(f"❌ User with email '{email}' not found")
        return None

    print(f"\n✅ User found:")
    print(f"   Email: {user.email}")
    print(f"   ID: {user.id}")
    print(f"   Subscription Tier: {user.subscription_tier}")
    print(f"   Is Verified: {user.is_verified}")
    print(f"   Created: {user.created_at}")

    return user


def update_user_tier(email: str, new_tier: str, db: Session):
    """Update a user's subscription tier"""
    # Validate tier
    valid_tiers = ['solo', 'pro', 'label', 'enterprise']
    if new_tier not in valid_tiers:
        print(f"❌ Invalid tier: {new_tier}")
        print(f"   Valid tiers: {', '.join(valid_tiers)}")
        return False

    user = db.query(User).filter(User.email == email).first()

    if not user:
        print(f"❌ User with email '{email}' not found")
        return False

    old_tier = user.subscription_tier
    user.subscription_tier = new_tier
    db.commit()

    print(f"\n✅ Updated subscription tier:")
    print(f"   User: {user.email}")
    print(f"   Old tier: {old_tier}")
    print(f"   New tier: {user.subscription_tier}")

    return True


def list_all_users(db: Session):
    """List all users and their subscription tiers"""
    users = db.query(User).all()

    if not users:
        print("❌ No users found in database")
        return

    print(f"\n📋 Found {len(users)} user(s):\n")
    for user in users:
        print(f"   {user.email}")
        print(f"      Tier: {user.subscription_tier}")
        print(f"      Verified: {user.is_verified}")
        print(f"      ID: {user.id}")
        print()


def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print("  Check user:        python check_and_update_user_tier.py check <email>")
        print("  Update user:       python check_and_update_user_tier.py update <email> <tier>")
        print("  List all users:    python check_and_update_user_tier.py list")
        print()
        print("Valid tiers: solo, pro, label, enterprise")
        sys.exit(1)

    command = sys.argv[1]

    # Create database session
    db = SessionLocal()

    try:
        if command == "list":
            list_all_users(db)

        elif command == "check":
            if len(sys.argv) < 3:
                print("❌ Please provide an email address")
                sys.exit(1)
            email = sys.argv[2]
            check_user_tier(email, db)

        elif command == "update":
            if len(sys.argv) < 4:
                print("❌ Please provide email and new tier")
                print("Usage: python check_and_update_user_tier.py update <email> <tier>")
                sys.exit(1)
            email = sys.argv[2]
            new_tier = sys.argv[3]
            update_user_tier(email, new_tier, db)

        else:
            print(f"❌ Unknown command: {command}")
            print("Valid commands: check, update, list")
            sys.exit(1)

    finally:
        db.close()


if __name__ == "__main__":
    main()
