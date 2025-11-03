"""Spotify API integration service"""
from typing import Dict, Any, Optional, List
from datetime import datetime
from urllib.parse import urlencode
import base64
from app.services.platforms.base import PlatformServiceBase
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class SpotifyService(PlatformServiceBase):
    """
    Spotify API integration

    Uses:
    - Spotify Web API for basic artist data
    - Spotify for Artists API for streaming statistics (requires special access)

    Docs: https://developer.spotify.com/documentation/web-api
    """

    def __init__(self):
        super().__init__()
        self.client_id = settings.SPOTIFY_CLIENT_ID
        self.client_secret = settings.SPOTIFY_CLIENT_SECRET
        self.redirect_uri = settings.SPOTIFY_REDIRECT_URI

    def get_base_url(self) -> str:
        return "https://api.spotify.com/v1"

    async def get_authorization_url(self, state: str) -> str:
        """
        Generate Spotify OAuth authorization URL

        Scopes needed:
        - user-read-email: Get user email
        - user-read-private: Get user profile
        - user-top-read: Get user's top artists and tracks
        """
        params = {
            "client_id": self.client_id,
            "response_type": "code",
            "redirect_uri": self.redirect_uri,
            "state": state,
            "scope": " ".join([
                "user-read-email",
                "user-read-private",
                "user-top-read",
                "user-library-read",
            ]),
        }
        return f"https://accounts.spotify.com/authorize?{urlencode(params)}"

    async def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for access token"""
        # Create Basic Auth header
        auth_str = f"{self.client_id}:{self.client_secret}"
        auth_bytes = auth_str.encode("utf-8")
        auth_b64 = base64.b64encode(auth_bytes).decode("utf-8")

        headers = {
            "Authorization": f"Basic {auth_b64}",
            "Content-Type": "application/x-www-form-urlencoded",
        }

        data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": self.redirect_uri,
        }

        response = await self.make_request(
            method="POST",
            url="https://accounts.spotify.com/api/token",
            headers=headers,
            data=data,  # Use data instead of json for form-encoded
        )

        return {
            "access_token": response["access_token"],
            "refresh_token": response["refresh_token"],
            "expires_in": response["expires_in"],
            "token_type": response["token_type"],
        }

    async def refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh expired access token"""
        auth_str = f"{self.client_id}:{self.client_secret}"
        auth_bytes = auth_str.encode("utf-8")
        auth_b64 = base64.b64encode(auth_bytes).decode("utf-8")

        headers = {
            "Authorization": f"Basic {auth_b64}",
            "Content-Type": "application/x-www-form-urlencoded",
        }

        data = {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
        }

        response = await self.make_request(
            method="POST",
            url="https://accounts.spotify.com/api/token",
            headers=headers,
            data=data,  # Use data instead of json for form-encoded
        )

        return {
            "access_token": response["access_token"],
            "expires_in": response["expires_in"],
            "token_type": response["token_type"],
        }

    async def get_artist_data(self, platform_artist_id: str, access_token: str) -> Dict[str, Any]:
        """
        Fetch artist profile data from Spotify

        Returns:
            - name: Artist name
            - genres: List of genres
            - popularity: Popularity score (0-100)
            - followers: Follower count
            - images: Artist images
            - external_urls: Spotify URL
        """
        headers = {"Authorization": f"Bearer {access_token}"}

        response = await self.make_request(
            method="GET",
            url=f"{self.base_url}/artists/{platform_artist_id}",
            headers=headers,
        )

        return {
            "id": response["id"],
            "name": response["name"],
            "genres": response.get("genres", []),
            "popularity": response.get("popularity", 0),
            "followers": response.get("followers", {}).get("total", 0),
            "images": response.get("images", []),
            "external_url": response.get("external_urls", {}).get("spotify", ""),
            "raw_data": response,
        }

    async def get_artist_top_tracks(
        self, platform_artist_id: str, access_token: str, market: str = "US"
    ) -> List[Dict[str, Any]]:
        """Get artist's top tracks in a specific market"""
        headers = {"Authorization": f"Bearer {access_token}"}

        response = await self.make_request(
            method="GET",
            url=f"{self.base_url}/artists/{platform_artist_id}/top-tracks",
            headers=headers,
            params={"market": market},
        )

        return [
            {
                "id": track["id"],
                "name": track["name"],
                "popularity": track.get("popularity", 0),
                "duration_ms": track.get("duration_ms", 0),
                "preview_url": track.get("preview_url"),
                "external_url": track.get("external_urls", {}).get("spotify"),
            }
            for track in response.get("tracks", [])
        ]

    async def get_streaming_stats(
        self,
        platform_artist_id: str,
        access_token: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """
        Fetch streaming statistics for the artist

        NOTE: Detailed streaming stats require Spotify for Artists API access
        which requires special approval. For now, we'll use public Web API data.

        For production, you'll need to:
        1. Apply for Spotify for Artists API access
        2. Implement the artists.me endpoint
        3. Fetch time-series streaming data

        Current implementation returns basic public metrics.
        """
        artist_data = await self.get_artist_data(platform_artist_id, access_token)
        top_tracks = await self.get_artist_top_tracks(platform_artist_id, access_token)

        # Calculate approximate monthly listeners from popularity and followers
        # This is an estimation - real data requires Spotify for Artists API
        popularity = artist_data.get("popularity", 0)
        followers = artist_data.get("followers", 0)
        estimated_monthly_listeners = int(followers * (popularity / 100) * 1.5)

        return {
            "timestamp": datetime.utcnow(),
            "followers": followers,
            "followers_change": 0,  # Requires historical data
            "popularity": popularity,
            "monthly_listeners": estimated_monthly_listeners,  # Estimated
            "top_tracks": top_tracks[:10],
            "genres": artist_data.get("genres", []),
            "raw_data": {
                "artist": artist_data,
                "note": "Detailed streaming stats require Spotify for Artists API access",
            },
        }

    async def get_client_credentials_token(self) -> str:
        """
        Get access token using Client Credentials flow (no user auth needed)
        Used for public API endpoints like search
        """
        auth_str = f"{self.client_id}:{self.client_secret}"
        auth_bytes = auth_str.encode("utf-8")
        auth_b64 = base64.b64encode(auth_bytes).decode("utf-8")

        headers = {
            "Authorization": f"Basic {auth_b64}",
            "Content-Type": "application/x-www-form-urlencoded",
        }

        data = {
            "grant_type": "client_credentials",
        }

        response = await self.make_request(
            method="POST",
            url="https://accounts.spotify.com/api/token",
            headers=headers,
            data=data,  # Use data instead of json for form-encoded
        )

        return response["access_token"]

    async def search_artist(self, query: str, access_token: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Search for artists by name

        Useful for connecting an artist to their Spotify profile
        If no access_token provided, will use client credentials
        """
        if not access_token:
            access_token = await self.get_client_credentials_token()

        headers = {"Authorization": f"Bearer {access_token}"}

        response = await self.make_request(
            method="GET",
            url=f"{self.base_url}/search",
            headers=headers,
            params={
                "q": query,
                "type": "artist",
                "limit": 10,
            },
        )

        artists = response.get("artists", {}).get("items", [])
        return [
            {
                "id": artist["id"],
                "name": artist["name"],
                "genres": artist.get("genres", []),
                "popularity": artist.get("popularity", 0),
                "followers": artist.get("followers", {}).get("total", 0),
                "images": artist.get("images", []),
                "external_url": artist.get("external_urls", {}).get("spotify"),
            }
            for artist in artists
        ]

    async def get_artist_albums(
        self, platform_artist_id: str, access_token: str, limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Get artist's albums"""
        headers = {"Authorization": f"Bearer {access_token}"}

        response = await self.make_request(
            method="GET",
            url=f"{self.base_url}/artists/{platform_artist_id}/albums",
            headers=headers,
            params={
                "limit": limit,
                "include_groups": "album,single",
            },
        )

        return [
            {
                "id": album["id"],
                "name": album["name"],
                "release_date": album.get("release_date"),
                "total_tracks": album.get("total_tracks", 0),
                "type": album.get("album_type"),
                "external_url": album.get("external_urls", {}).get("spotify"),
                "images": album.get("images", []),
            }
            for album in response.get("items", [])
        ]

    async def get_audio_features(self, track_ids: List[str], access_token: str) -> List[Dict[str, Any]]:
        """
        Get audio features for tracks (danceability, energy, tempo, etc.)
        Useful for advanced analytics
        """
        headers = {"Authorization": f"Bearer {access_token}"}

        response = await self.make_request(
            method="GET",
            url=f"{self.base_url}/audio-features",
            headers=headers,
            params={"ids": ",".join(track_ids)},
        )

        return response.get("audio_features", [])
