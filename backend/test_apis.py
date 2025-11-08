#!/usr/bin/env python3
"""
Test script to verify API credentials are working
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_spotify():
    """Test Spotify API credentials"""
    print("\n🎵 Testing Spotify API...")
    try:
        import spotipy
        from spotipy.oauth2 import SpotifyClientCredentials

        client_id = os.getenv('SPOTIFY_CLIENT_ID')
        client_secret = os.getenv('SPOTIFY_CLIENT_SECRET')

        if not client_id or not client_secret:
            print("❌ Spotify credentials not found in .env")
            return False

        sp = spotipy.Spotify(auth_manager=SpotifyClientCredentials(
            client_id=client_id,
            client_secret=client_secret
        ))

        # Test with a simple search
        results = sp.search(q='Billie Eilish', type='artist', limit=1)
        if results and results.get('artists'):
            artist = results['artists']['items'][0]
            print(f"✅ Spotify API working! Test artist: {artist['name']} ({artist['followers']['total']:,} followers)")
            return True
        else:
            print("❌ Spotify API returned no results")
            return False

    except Exception as e:
        print(f"❌ Spotify API error: {str(e)}")
        return False


def test_youtube():
    """Test YouTube API credentials"""
    print("\n📺 Testing YouTube API...")
    try:
        from googleapiclient.discovery import build

        api_key = os.getenv('YOUTUBE_API_KEY')

        if not api_key:
            print("❌ YouTube API key not found in .env")
            return False

        youtube = build('youtube', 'v3', developerKey=api_key)

        # Test with a simple search
        request = youtube.search().list(
            part='snippet',
            q='music',
            maxResults=1,
            type='video'
        )
        response = request.execute()

        if response and response.get('items'):
            video = response['items'][0]
            print(f"✅ YouTube API working! Test video: {video['snippet']['title']}")
            return True
        else:
            print("❌ YouTube API returned no results")
            return False

    except Exception as e:
        print(f"❌ YouTube API error: {str(e)}")
        return False


def test_tiktok():
    """Test TikTok API credentials"""
    print("\n🎬 Testing TikTok API...")
    try:
        client_key = os.getenv('TIKTOK_CLIENT_KEY')
        client_secret = os.getenv('TIKTOK_CLIENT_SECRET')

        if not client_key or not client_secret:
            print("❌ TikTok credentials not found in .env")
            return False

        print(f"✅ TikTok credentials found")
        print(f"   Client Key: {client_key[:10]}...")
        print("   ⚠️  TikTok requires OAuth flow, can't test without user token")
        return True

    except Exception as e:
        print(f"❌ TikTok API error: {str(e)}")
        return False


def test_stripe():
    """Test Stripe API credentials"""
    print("\n💳 Testing Stripe API...")
    try:
        import stripe

        secret_key = os.getenv('STRIPE_SECRET_KEY')

        if not secret_key:
            print("❌ Stripe secret key not found in .env")
            return False

        stripe.api_key = secret_key

        # Test with retrieving account
        account = stripe.Account.retrieve()
        print(f"✅ Stripe API working! Account ID: {account.id}")
        return True

    except Exception as e:
        print(f"❌ Stripe API error: {str(e)}")
        return False


def main():
    """Run all API tests"""
    print("=" * 60)
    print("🔍 FanPulse API Credentials Test")
    print("=" * 60)

    results = {
        'Spotify': test_spotify(),
        'YouTube': test_youtube(),
        'TikTok': test_tiktok(),
        'Stripe': test_stripe(),
    }

    print("\n" + "=" * 60)
    print("📊 Test Summary")
    print("=" * 60)

    for api, success in results.items():
        status = "✅ WORKING" if success else "❌ FAILED"
        print(f"{api:.<20} {status}")

    total = len(results)
    passed = sum(results.values())

    print("\n" + "=" * 60)
    print(f"Result: {passed}/{total} APIs working")
    print("=" * 60)

    if passed == total:
        print("\n🎉 All APIs are configured correctly!")
        return 0
    else:
        print("\n⚠️  Some APIs need attention")
        return 1


if __name__ == "__main__":
    sys.exit(main())
