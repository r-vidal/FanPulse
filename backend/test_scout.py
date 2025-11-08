#!/usr/bin/env python3
"""
Test Scout A&R functionality with real Spotify data
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.spotify_scout import SpotifyScout


def test_scout():
    """Test Scout A&R with real Spotify data"""
    print("=" * 80)
    print("🎵 Testing Scout A&R with Real Spotify Data")
    print("=" * 80)

    try:
        print("\n📡 Initializing Spotify Scout...")
        scout = SpotifyScout()
        print("✅ Spotify Scout initialized successfully")

        print("\n🔍 Scanning new releases (US market, limit 20)...")
        print("   This will scan for emerging artists with 1-10 releases...")

        artists = scout.scan_new_releases(
            country='US',
            limit=20,
            genres=None
        )

        print(f"\n✅ Found {len(artists)} emerging artists!\n")

        if artists:
            print("=" * 80)
            print("📊 Top 5 Discovered Artists:")
            print("=" * 80)

            for i, artist in enumerate(artists[:5], 1):
                print(f"\n{i}. {artist['name']}")
                print(f"   Spotify ID: {artist['spotify_id']}")
                print(f"   Genres: {', '.join(artist['genres']) if artist['genres'] else 'N/A'}")
                print(f"   Popularity: {artist['popularity']}/100")
                print(f"   Followers: {artist['followers']:,}")
                print(f"   Total Releases: {artist['total_releases']}")
                print(f"   Release: {artist['release_name']} ({artist['release_type']})")
                print(f"   First Release: {'✅ YES' if artist['is_first_release'] else '❌ No'}")

                # AI Detection
                if artist.get('is_ai_generated'):
                    confidence = artist.get('ai_confidence', 0) * 100
                    print(f"   🤖 AI Detection: ⚠️  POSSIBLY AI-GENERATED ({confidence:.0f}% confidence)")
                else:
                    print(f"   🤖 AI Detection: ✅ Authentic")

                # Tags
                if artist.get('tags'):
                    print(f"   🏷️  Tags: {', '.join(artist['tags'][:5])}")

                # Preview
                if artist.get('preview_url'):
                    print(f"   🎧 Preview: Available")
                else:
                    print(f"   🎧 Preview: Not available")

                # Potential score
                if artist.get('potential_score'):
                    score = artist['potential_score']
                    print(f"   ⭐ Potential Score: {score:.1f}/100")

            print("\n" + "=" * 80)
            print("🎉 Scout A&R is working with real Spotify data!")
            print("=" * 80)

            # Statistics
            first_releases = sum(1 for a in artists if a.get('is_first_release'))
            ai_detected = sum(1 for a in artists if a.get('is_ai_generated'))

            print(f"\n📈 Statistics:")
            print(f"   Total artists scanned: {len(artists)}")
            print(f"   First releases: {first_releases}")
            print(f"   AI-generated detected: {ai_detected}")
            print(f"   Authentic artists: {len(artists) - ai_detected}")

            return True

        else:
            print("⚠️  No emerging artists found. Try adjusting filters.")
            return False

    except Exception as e:
        print(f"\n❌ Error testing Scout A&R: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_genre_scan():
    """Test genre-specific scanning"""
    print("\n" + "=" * 80)
    print("🎸 Testing Genre-Specific Scan (Hip-Hop)")
    print("=" * 80)

    try:
        scout = SpotifyScout()

        print("\n🔍 Scanning hip-hop genre for emerging artists...")
        artists = scout.scan_by_genre(genre='hip-hop', limit=5)

        print(f"\n✅ Found {len(artists)} hip-hop emerging artists!\n")

        if artists:
            for i, artist in enumerate(artists, 1):
                print(f"{i}. {artist['name']} - {artist['release_name']}")
                print(f"   Popularity: {artist['popularity']}/100 | Followers: {artist['followers']:,}")

            return True
        else:
            print("⚠️  No hip-hop artists found")
            return False

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False


if __name__ == "__main__":
    print("\n" + "🚀" * 40)
    print("FanPulse Scout A&R - Live Test")
    print("🚀" * 40 + "\n")

    # Test basic scanning
    success1 = test_scout()

    # Test genre scanning
    success2 = test_genre_scan()

    print("\n" + "=" * 80)
    if success1 and success2:
        print("✅ All tests passed! Scout A&R is ready to discover emerging artists!")
    else:
        print("⚠️  Some tests failed. Check the errors above.")
    print("=" * 80 + "\n")

    sys.exit(0 if success1 else 1)
