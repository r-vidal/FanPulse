#!/usr/bin/env python3
"""
Simple script to update user subscription tier using raw SQL
No ORM relationships needed
"""
import sys
from sqlalchemy import text
from app.core.database import SessionLocal


def list_users():
    """List all users with their tiers"""
    db = SessionLocal()
    try:
        result = db.execute(text("""
            SELECT email, subscription_tier, is_verified, id
            FROM users
            ORDER BY email
        """))

        users = result.fetchall()

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

    finally:
        db.close()


def check_user(email: str):
    """Check a specific user"""
    db = SessionLocal()
    try:
        result = db.execute(
            text("SELECT email, subscription_tier, is_verified, id FROM users WHERE email = :email"),
            {"email": email}
        )

        user = result.fetchone()

        if not user:
            print(f"❌ User with email '{email}' not found")
            return

        print(f"\n✅ User found:")
        print(f"   Email: {user.email}")
        print(f"   ID: {user.id}")
        print(f"   Subscription Tier: {user.subscription_tier}")
        print(f"   Is Verified: {user.is_verified}")
        print()

    finally:
        db.close()


def update_tier(email: str, new_tier: str):
    """Update user subscription tier"""
    valid_tiers = ['solo', 'pro', 'label', 'enterprise']

    if new_tier not in valid_tiers:
        print(f"❌ Invalid tier: {new_tier}")
        print(f"   Valid tiers: {', '.join(valid_tiers)}")
        return False

    db = SessionLocal()
    try:
        # Get current tier
        result = db.execute(
            text("SELECT email, subscription_tier FROM users WHERE email = :email"),
            {"email": email}
        )
        user = result.fetchone()

        if not user:
            print(f"❌ User with email '{email}' not found")
            return False

        old_tier = user.subscription_tier

        # Update tier
        db.execute(
            text("UPDATE users SET subscription_tier = :new_tier WHERE email = :email"),
            {"new_tier": new_tier, "email": email}
        )
        db.commit()

        print(f"\n✅ Updated subscription tier:")
        print(f"   User: {email}")
        print(f"   Old tier: {old_tier}")
        print(f"   New tier: {new_tier}")
        print()

        return True

    except Exception as e:
        db.rollback()
        print(f"❌ Error updating tier: {e}")
        return False
    finally:
        db.close()


def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print("  List all users:    python update_tier_simple.py list")
        print("  Check user:        python update_tier_simple.py check <email>")
        print("  Update tier:       python update_tier_simple.py update <email> <tier>")
        print()
        print("Valid tiers: solo, pro, label, enterprise")
        sys.exit(1)

    command = sys.argv[1]

    if command == "list":
        list_users()

    elif command == "check":
        if len(sys.argv) < 3:
            print("❌ Please provide an email address")
            sys.exit(1)
        email = sys.argv[2]
        check_user(email)

    elif command == "update":
        if len(sys.argv) < 4:
            print("❌ Please provide email and new tier")
            print("Usage: python update_tier_simple.py update <email> <tier>")
            sys.exit(1)
        email = sys.argv[2]
        new_tier = sys.argv[3]
        update_tier(email, new_tier)

    else:
        print(f"❌ Unknown command: {command}")
        print("Valid commands: list, check, update")
        sys.exit(1)


if __name__ == "__main__":
    main()
