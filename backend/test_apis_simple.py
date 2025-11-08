#!/usr/bin/env python3
"""
Simple API credentials checker - just verifies the .env file has the keys
"""

import os
from pathlib import Path


def check_env():
    """Check if .env file exists and has required keys"""
    env_path = Path(__file__).parent / '.env'

    if not env_path.exists():
        print("❌ .env file not found!")
        return False

    print("✅ .env file found\n")

    # Read .env file
    env_vars = {}
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                env_vars[key] = value

    # Check required APIs
    print("=" * 60)
    print("🔍 API Credentials Status")
    print("=" * 60)

    apis = {
        'Spotify': ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET'],
        'YouTube': ['YOUTUBE_API_KEY', 'YOUTUBE_CLIENT_ID', 'YOUTUBE_CLIENT_SECRET'],
        'TikTok': ['TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET'],
        'Stripe': ['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY'],
        'Instagram': ['INSTAGRAM_CLIENT_ID', 'INSTAGRAM_CLIENT_SECRET'],
        'Database': ['DATABASE_URL'],
        'Redis': ['REDIS_URL'],
    }

    results = {}

    for api_name, keys in apis.items():
        print(f"\n{api_name}:")
        all_present = True
        for key in keys:
            value = env_vars.get(key, '')
            if value and value not in ['', '""', "''", 'your-secret-key-here']:
                # Mask the value for security
                if len(value) > 20:
                    masked = f"{value[:10]}...{value[-4:]}"
                else:
                    masked = f"{value[:6]}..." if len(value) > 6 else "***"
                print(f"  ✅ {key}: {masked}")
            else:
                print(f"  ❌ {key}: NOT SET")
                all_present = False

        results[api_name] = all_present

    print("\n" + "=" * 60)
    print("📊 Summary")
    print("=" * 60)

    for api, status in results.items():
        emoji = "✅" if status else "❌"
        status_text = "CONFIGURED" if status else "MISSING"
        print(f"{api:.<20} {emoji} {status_text}")

    total = len(results)
    configured = sum(results.values())

    print("\n" + "=" * 60)
    print(f"Result: {configured}/{total} APIs configured")
    print("=" * 60)

    # Priority check
    critical_apis = ['Spotify', 'Database', 'Redis']
    critical_ok = all(results.get(api, False) for api in critical_apis)

    if critical_ok:
        print("\n🎉 Critical APIs (Spotify, Database, Redis) are configured!")
        print("   You can test Scout A&R now!")
    else:
        print("\n⚠️  Missing critical APIs:")
        for api in critical_apis:
            if not results.get(api, False):
                print(f"   - {api}")

    return critical_ok


if __name__ == "__main__":
    check_env()
