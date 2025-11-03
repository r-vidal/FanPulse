"""Apple Music API integration service"""
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import jwt
import time
from app.services.platforms.base import PlatformServiceBase
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class AppleMusicService(PlatformServiceBase):
    """
    Apple Music API integration using MusicKit

    Apple Music uses a different auth approach:
    1. Developer Token (JWT) - Server-to-server auth
    2. User Token (Music User Token) - User-specific access

    For artist analytics, you need:
    - Apple Music for Artists account
    - Analytics API access (separate from MusicKit)

    Docs:
    - MusicKit: https://developer.apple.com/documentation/applemusicapi
    - Analytics: https://developer.apple.com/documentation/apple_music_analytics_api
    """

    def __init__(self):
        super().__init__()
        self.team_id = settings.APPLE_TEAM_ID
        self.key_id = settings.APPLE_KEY_ID
        self.private_key = settings.APPLE_PRIVATE_KEY  # PEM format
        self.analytics_api_url = "https://api.music.apple.com/v1/analytics"

    def get_base_url(self) -> str:
        return "https://api.music.apple.com/v1"

    def generate_developer_token(self) -> str:
        """
        Generate Apple Music API Developer Token (JWT)

        This token is used for server-to-server requests and lasts up to 6 months
        """
        headers = {
            "alg": "ES256",
            "kid": self.key_id,
        }

        payload = {
            "iss": self.team_id,
            "iat": int(time.time()),
            "exp": int(time.time()) + (6 * 30 * 24 * 60 * 60),  # 6 months
        }

        token = jwt.encode(
            payload=payload,
            key=self.private_key,
            algorithm="ES256",
            headers=headers,
        )

        return token

    async def get_authorization_url(self, state: str) -> str:
        """
        Generate authorization URL

        For Apple Music, user authorization happens client-side using MusicKit JS
        This returns the web app URL where users can connect their Apple Music account
        """
        # In a real implementation, this would be handled by MusicKit JS on the frontend
        # The frontend would request a music user token and send it to the backend
        return f"{settings.FRONTEND_URL}/connect/apple-music?state={state}"

    async def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        """
        Exchange authorization code for access token

        Note: Apple Music uses Music User Tokens obtained client-side via MusicKit JS
        The 'code' here would actually be the Music User Token from the frontend
        """
        # Validate the music user token
        developer_token = self.generate_developer_token()

        # In production, you'd validate the user token here
        # For now, we'll store it as-is
        return {
            "access_token": code,  # This is the Music User Token
            "refresh_token": None,  # Apple Music tokens don't have refresh tokens
            "expires_in": 6 * 30 * 24 * 60 * 60,  # 6 months
            "token_type": "Bearer",
        }

    async def refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        """
        Refresh access token

        Apple Music tokens are long-lived (6 months) and don't use refresh tokens
        When they expire, users need to re-authenticate via MusicKit JS
        """
        raise NotImplementedError(
            "Apple Music tokens don't support refresh. Users must re-authenticate via MusicKit JS."
        )

    async def get_artist_data(self, platform_artist_id: str, access_token: str) -> Dict[str, Any]:
        """
        Fetch artist profile data from Apple Music

        Uses the Catalog API to get public artist information
        """
        developer_token = self.generate_developer_token()

        headers = {
            "Authorization": f"Bearer {developer_token}",
            "Music-User-Token": access_token,
        }

        response = await self.make_request(
            method="GET",
            url=f"{self.base_url}/catalog/us/artists/{platform_artist_id}",
            headers=headers,
        )

        artist = response.get("data", [{}])[0]
        attributes = artist.get("attributes", {})

        return {
            "id": artist.get("id"),
            "name": attributes.get("name"),
            "genre": attributes.get("genreNames", []),
            "url": attributes.get("url"),
            "artwork": attributes.get("artwork"),
            "raw_data": artist,
        }

    async def get_streaming_stats(
        self,
        platform_artist_id: str,
        access_token: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """
        Fetch streaming statistics using Apple Music Analytics API

        Requires:
        1. Apple Music for Artists account
        2. Analytics API access token (different from MusicKit token)
        3. Artist must be claimed in Apple Music for Artists

        This is a placeholder - actual implementation requires Analytics API credentials
        """
        developer_token = self.generate_developer_token()

        # Format dates
        if not start_date:
            start_date = datetime.utcnow() - timedelta(days=30)
        if not end_date:
            end_date = datetime.utcnow()

        headers = {
            "Authorization": f"Bearer {developer_token}",
            "Music-User-Token": access_token,
        }

        # NOTE: This endpoint requires Analytics API access
        # You need to request access from Apple Music for Artists team
        try:
            response = await self.make_request(
                method="GET",
                url=f"{self.analytics_api_url}/artist/{platform_artist_id}/metrics",
                headers=headers,
                params={
                    "start_date": start_date.strftime("%Y-%m-%d"),
                    "end_date": end_date.strftime("%Y-%m-%d"),
                    "metrics": "plays,listeners,shazams",
                },
            )

            metrics = response.get("data", {})

            return {
                "timestamp": datetime.utcnow(),
                "plays": metrics.get("plays", {}).get("total", 0),
                "listeners": metrics.get("listeners", {}).get("total", 0),
                "shazams": metrics.get("shazams", {}).get("total", 0),
                "raw_data": metrics,
            }

        except Exception as e:
            logger.warning(f"Analytics API not available: {e}")
            # Fallback to basic catalog data
            artist_data = await self.get_artist_data(platform_artist_id, access_token)
            return {
                "timestamp": datetime.utcnow(),
                "plays": 0,
                "listeners": 0,
                "shazams": 0,
                "note": "Analytics API access required for detailed stats",
                "raw_data": artist_data,
            }

    async def search_artist(self, query: str) -> List[Dict[str, Any]]:
        """
        Search for artists by name in Apple Music catalog

        Does not require user authentication (uses developer token only)
        """
        developer_token = self.generate_developer_token()

        headers = {"Authorization": f"Bearer {developer_token}"}

        response = await self.make_request(
            method="GET",
            url=f"{self.base_url}/catalog/us/search",
            headers=headers,
            params={
                "term": query,
                "types": "artists",
                "limit": 10,
            },
        )

        artists = response.get("results", {}).get("artists", {}).get("data", [])

        return [
            {
                "id": artist.get("id"),
                "name": artist.get("attributes", {}).get("name"),
                "genre": artist.get("attributes", {}).get("genreNames", []),
                "url": artist.get("attributes", {}).get("url"),
                "artwork": artist.get("attributes", {}).get("artwork"),
            }
            for artist in artists
        ]

    async def get_artist_albums(
        self, platform_artist_id: str, access_token: str, limit: int = 25
    ) -> List[Dict[str, Any]]:
        """Get artist's albums from Apple Music catalog"""
        developer_token = self.generate_developer_token()

        headers = {
            "Authorization": f"Bearer {developer_token}",
            "Music-User-Token": access_token,
        }

        response = await self.make_request(
            method="GET",
            url=f"{self.base_url}/catalog/us/artists/{platform_artist_id}/albums",
            headers=headers,
            params={"limit": limit},
        )

        albums = response.get("data", [])

        return [
            {
                "id": album.get("id"),
                "name": album.get("attributes", {}).get("name"),
                "release_date": album.get("attributes", {}).get("releaseDate"),
                "track_count": album.get("attributes", {}).get("trackCount", 0),
                "genre": album.get("attributes", {}).get("genreNames", []),
                "url": album.get("attributes", {}).get("url"),
                "artwork": album.get("attributes", {}).get("artwork"),
            }
            for album in albums
        ]

    async def get_top_songs(
        self, platform_artist_id: str, access_token: str, limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get artist's top songs"""
        developer_token = self.generate_developer_token()

        headers = {
            "Authorization": f"Bearer {developer_token}",
            "Music-User-Token": access_token,
        }

        response = await self.make_request(
            method="GET",
            url=f"{self.base_url}/catalog/us/artists/{platform_artist_id}/songs",
            headers=headers,
            params={"limit": limit},
        )

        songs = response.get("data", [])

        return [
            {
                "id": song.get("id"),
                "name": song.get("attributes", {}).get("name"),
                "album": song.get("attributes", {}).get("albumName"),
                "duration_ms": song.get("attributes", {}).get("durationInMillis", 0),
                "release_date": song.get("attributes", {}).get("releaseDate"),
                "url": song.get("attributes", {}).get("url"),
                "preview_url": song.get("attributes", {}).get("previews", [{}])[0].get("url"),
            }
            for song in songs
        ]

    async def get_artist_playlists(
        self, platform_artist_id: str, access_token: str, limit: int = 25
    ) -> List[Dict[str, Any]]:
        """Get playlists featuring the artist"""
        developer_token = self.generate_developer_token()

        headers = {
            "Authorization": f"Bearer {developer_token}",
            "Music-User-Token": access_token,
        }

        response = await self.make_request(
            method="GET",
            url=f"{self.base_url}/catalog/us/artists/{platform_artist_id}/playlists",
            headers=headers,
            params={"limit": limit},
        )

        playlists = response.get("data", [])

        return [
            {
                "id": playlist.get("id"),
                "name": playlist.get("attributes", {}).get("name"),
                "curator": playlist.get("attributes", {}).get("curatorName"),
                "url": playlist.get("attributes", {}).get("url"),
                "artwork": playlist.get("attributes", {}).get("artwork"),
            }
            for playlist in playlists
        ]
