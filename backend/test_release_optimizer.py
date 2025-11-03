#!/usr/bin/env python3
"""
Quick test script for Release Optimizer

Run: python test_release_optimizer.py
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import get_db_sync
from app.services.release_optimizer import ReleaseOptimizer
from app.models.artist import Artist
from app.models.release import ReleaseScore, ScheduledRelease, CompetingRelease
from datetime import date, datetime, timedelta
import uuid


def print_header(text):
    """Print formatted header"""
    print(f"\n{'='*60}")
    print(f"  {text}")
    print(f"{'='*60}\n")


def test_database_connection():
    """Test 1: Database connection"""
    print_header("TEST 1: Database Connection")
    try:
        db = next(get_db_sync())
        # Try a simple query
        artist_count = db.query(Artist).count()
        print(f"✅ Database connected successfully")
        print(f"   Found {artist_count} artists in database")
        return db, True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return None, False


def test_tables_exist(db):
    """Test 2: Check if Release Optimizer tables exist"""
    print_header("TEST 2: Tables Existence")

    tables = {
        'release_scores': ReleaseScore,
        'scheduled_releases': ScheduledRelease,
        'competing_releases': CompetingRelease
    }

    all_exist = True
    for table_name, model in tables.items():
        try:
            count = db.query(model).count()
            print(f"✅ Table '{table_name}' exists ({count} rows)")
        except Exception as e:
            print(f"❌ Table '{table_name}' missing or error: {e}")
            all_exist = False

    return all_exist


def test_get_or_create_artist(db):
    """Test 3: Get or create test artist"""
    print_header("TEST 3: Test Artist")

    # Try to find existing artist
    artist = db.query(Artist).first()

    if artist:
        print(f"✅ Using existing artist: {artist.name} (ID: {artist.id})")
    else:
        print("⚠️  No artists found in database")
        print("   Create an artist via API first, or run this script with --create-test-artist")
        return None

    return artist


def test_release_optimizer(db, artist):
    """Test 4: Release Optimizer Service"""
    print_header("TEST 4: Release Optimizer Service")

    if not artist:
        print("❌ Skipping - no artist available")
        return False

    try:
        optimizer = ReleaseOptimizer(db)
        print(f"✅ ReleaseOptimizer initialized")

        # Calculate scores for 4 weeks
        print(f"\n📊 Calculating release scores for {artist.name}...")
        scores = optimizer.calculate_release_scores(str(artist.id), weeks_ahead=4)

        print(f"✅ Calculated {len(scores)} release dates\n")

        # Display results
        print(f"{'Date':<15} {'Score':<8} {'Momentum':<10} {'Competition':<12} {'Prediction':<15} {'Status'}")
        print("-" * 90)

        for score in scores:
            status_emoji = "✅" if score.overall_score >= 7.5 else "🟡" if score.overall_score >= 5.0 else "🔴"
            print(
                f"{str(score.release_date):<15} "
                f"{score.overall_score:>5.1f}/10  "
                f"{score.momentum_score:>5.1f}/10  "
                f"{score.competition_score:>5.1f}/10     "
                f"{score.predicted_first_week_streams:>10,} streams  "
                f"{status_emoji}"
            )

        # Show best date
        best_score = max(scores, key=lambda s: s.overall_score)
        print(f"\n🎯 Best release date: {best_score.release_date} (Score: {best_score.overall_score}/10)")
        print(f"   {best_score.recommendation}")

        if best_score.advantages:
            print(f"\n   Advantages:")
            for adv in best_score.advantages:
                print(f"     • {adv}")

        if best_score.risks:
            print(f"\n   Risks:")
            for risk in best_score.risks:
                print(f"     • {risk}")

        return True

    except Exception as e:
        print(f"❌ Release Optimizer test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_scheduled_release(db, artist):
    """Test 5: Create Scheduled Release"""
    print_header("TEST 5: Scheduled Release")

    if not artist:
        print("❌ Skipping - no artist available")
        return False

    try:
        # Create a test scheduled release
        test_release = ScheduledRelease(
            artist_id=artist.id,
            user_id=artist.user_id,
            title="Test Single - Automated Test",
            release_type="single",
            release_date=date.today() + timedelta(days=14),
            chosen_score=8.5,
            notes="Created by test script"
        )

        db.add(test_release)
        db.commit()
        db.refresh(test_release)

        print(f"✅ Created scheduled release:")
        print(f"   Title: {test_release.title}")
        print(f"   Date: {test_release.release_date}")
        print(f"   Score: {test_release.chosen_score}/10")
        print(f"   Status: {test_release.status}")

        # Clean up (delete test release)
        db.delete(test_release)
        db.commit()
        print(f"\n🧹 Cleaned up test release")

        return True

    except Exception as e:
        print(f"❌ Scheduled release test failed: {e}")
        db.rollback()
        return False


def test_competing_releases(db):
    """Test 6: Competing Releases"""
    print_header("TEST 6: Competing Releases")

    try:
        count = db.query(CompetingRelease).count()
        print(f"📊 Found {count} competing releases in database")

        if count > 0:
            # Show some examples
            recent = db.query(CompetingRelease).order_by(
                CompetingRelease.release_date
            ).limit(5).all()

            print(f"\nRecent competing releases:")
            for release in recent:
                major = "🔥" if release.is_major_release else "  "
                print(
                    f"{major} {release.release_date} - {release.artist_name}: "
                    f"{release.album_name} ({release.artist_followers:,} followers)"
                )
            print("✅ Competing releases working")
        else:
            print("⚠️  No competing releases found")
            print("   Run: python -c 'from app.tasks.releases import scrape_competing_releases_task; scrape_competing_releases_task()'")

        return True

    except Exception as e:
        print(f"❌ Competing releases test failed: {e}")
        return False


def main():
    """Run all tests"""
    print("\n" + "🚀" * 30)
    print("  RELEASE OPTIMIZER TEST SUITE")
    print("🚀" * 30)

    # Run tests
    db, db_ok = test_database_connection()
    if not db_ok:
        print("\n❌ Database connection failed. Exiting.")
        sys.exit(1)

    tables_ok = test_tables_exist(db)
    if not tables_ok:
        print("\n❌ Tables missing. Run: alembic upgrade head")
        sys.exit(1)

    artist = test_get_or_create_artist(db)

    optimizer_ok = test_release_optimizer(db, artist)
    scheduled_ok = test_scheduled_release(db, artist)
    competing_ok = test_competing_releases(db)

    # Summary
    print_header("TEST SUMMARY")

    results = [
        ("Database Connection", db_ok),
        ("Tables Exist", tables_ok),
        ("Release Optimizer", optimizer_ok),
        ("Scheduled Releases", scheduled_ok),
        ("Competing Releases", competing_ok),
    ]

    passed = sum(1 for _, ok in results if ok)
    total = len(results)

    for test_name, ok in results:
        status = "✅ PASS" if ok else "❌ FAIL"
        print(f"{test_name:<25} {status}")

    print(f"\n{'─'*60}")
    print(f"Results: {passed}/{total} tests passed")

    if passed == total:
        print("\n🎉 All tests passed! Release Optimizer is working correctly.")
        sys.exit(0)
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Check errors above.")
        sys.exit(1)


if __name__ == "__main__":
    main()
