"""YouTube API integration service"""
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from urllib.parse import urlencode
from app.services.platforms.base import PlatformServiceBase
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class YouTubeService(PlatformServiceBase):
    """
    YouTube Data API v3 integration

    Uses:
    - YouTube Data API v3 for channel stats, videos, playlists
    - YouTube Analytics API for detailed analytics (requires special access)

    For artist analytics, you'll need:
    1. YouTube Data API key (for public data)
    2. OAuth 2.0 for accessing private channel data
    3. YouTube Analytics API access (requires channel ownership verification)

    Docs:
    - Data API: https://developers.google.com/youtube/v3
    - Analytics API: https://developers.google.com/youtube/analytics
    """

    def __init__(self):
        super().__init__()
        self.client_id = settings.YOUTUBE_CLIENT_ID
        self.client_secret = settings.YOUTUBE_CLIENT_SECRET
        self.redirect_uri = settings.YOUTUBE_REDIRECT_URI
        self.api_key = settings.YOUTUBE_API_KEY

    def get_base_url(self) -> str:
        return "https://www.googleapis.com/youtube/v3"

    async def get_authorization_url(self, state: str) -> str:
        """
        Generate YouTube OAuth authorization URL

        Scopes needed:
        - https://www.googleapis.com/auth/youtube.readonly: Read channel data
        - https://www.googleapis.com/auth/yt-analytics.readonly: Read analytics data
        - https://www.googleapis.com/auth/youtubepartner: Partner API access (optional)
        """
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "state": state,
            "scope": " ".join([
                "https://www.googleapis.com/auth/youtube.readonly",
                "https://www.googleapis.com/auth/yt-analytics.readonly",
                "https://www.googleapis.com/auth/userinfo.email",
            ]),
            "access_type": "offline",  # Get refresh token
            "prompt": "consent",  # Force consent to get refresh token
        }
        return f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"

    async def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for access token"""
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": self.redirect_uri,
        }

        response = await self.make_request(
            method="POST",
            url="https://oauth2.googleapis.com/token",
            data=data,  # Use form data, not JSON
        )

        return {
            "access_token": response["access_token"],
            "refresh_token": response.get("refresh_token"),
            "expires_in": response["expires_in"],
            "token_type": response["token_type"],
            "scope": response.get("scope"),
        }

    async def refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh expired access token"""
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token",
        }

        response = await self.make_request(
            method="POST",
            url="https://oauth2.googleapis.com/token",
            data=data,
        )

        return {
            "access_token": response["access_token"],
            "expires_in": response["expires_in"],
            "token_type": response["token_type"],
        }

    async def get_artist_data(self, platform_artist_id: str, access_token: str) -> Dict[str, Any]:
        """
        Fetch YouTube channel data

        Args:
            platform_artist_id: YouTube channel ID
            access_token: OAuth access token

        Returns:
            Channel info including subscriber count, view count, video count
        """
        params = {
            "part": "snippet,statistics,brandingSettings,contentDetails",
            "id": platform_artist_id,
        }

        headers = {"Authorization": f"Bearer {access_token}"}

        response = await self.make_request(
            method="GET",
            url=f"{self.base_url}/channels",
            headers=headers,
            params=params,
        )

        if not response.get("items"):
            raise ValueError(f"Channel not found: {platform_artist_id}")

        channel = response["items"][0]
        snippet = channel.get("snippet", {})
        statistics = channel.get("statistics", {})
        branding = channel.get("brandingSettings", {}).get("channel", {})

        return {
            "id": channel["id"],
            "title": snippet.get("title"),
            "description": snippet.get("description"),
            "custom_url": snippet.get("customUrl"),
            "published_at": snippet.get("publishedAt"),
            "thumbnails": snippet.get("thumbnails"),
            "country": snippet.get("country"),
            "subscribers": int(statistics.get("subscriberCount", 0)),
            "total_views": int(statistics.get("viewCount", 0)),
            "video_count": int(statistics.get("videoCount", 0)),
            "subscriber_count_hidden": statistics.get("hiddenSubscriberCount", False),
            "keywords": branding.get("keywords"),
            "raw_data": channel,
        }

    async def get_channel_by_username(self, username: str, access_token: Optional[str] = None) -> Dict[str, Any]:
        """
        Get channel info by username/handle

        Args:
            username: Channel username (e.g., @artistname or just artistname)
            access_token: Optional OAuth token for authenticated requests
        """
        # Remove @ if present
        username = username.lstrip("@")

        params = {
            "part": "snippet,statistics",
            "forHandle": username,
        }

        headers = {}
        if access_token:
            headers["Authorization"] = f"Bearer {access_token}"
        else:
            params["key"] = self.api_key

        response = await self.make_request(
            method="GET",
            url=f"{self.base_url}/channels",
            headers=headers if access_token else None,
            params=params,
        )

        if not response.get("items"):
            raise ValueError(f"Channel not found for username: {username}")

        return response["items"][0]

    async def search_channel(self, query: str) -> List[Dict[str, Any]]:
        """
        Search for YouTube channels by name

        Uses API key authentication (no OAuth needed)
        """
        params = {
            "part": "snippet",
            "q": query,
            "type": "channel",
            "maxResults": 10,
            "key": self.api_key,
        }

        response = await self.make_request(
            method="GET",
            url=f"{self.base_url}/search",
            params=params,
        )

        results = []
        for item in response.get("items", []):
            channel_id = item["id"]["channelId"]
            snippet = item["snippet"]

            results.append({
                "id": channel_id,
                "title": snippet.get("title"),
                "description": snippet.get("description"),
                "thumbnail": snippet.get("thumbnails", {}).get("default", {}).get("url"),
                "published_at": snippet.get("publishedAt"),
            })

        return results

    async def get_streaming_stats(
        self,
        platform_artist_id: str,
        access_token: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """
        Fetch YouTube channel statistics

        For basic stats, uses YouTube Data API.
        For detailed analytics (requires channel ownership), would use YouTube Analytics API.

        Returns:
            Channel stats including subscribers, views, videos
        """
        # Get channel data
        channel_data = await self.get_artist_data(platform_artist_id, access_token)

        # Get recent videos for engagement metrics
        recent_videos = await self.get_channel_videos(platform_artist_id, access_token, limit=10)

        # Calculate average engagement from recent videos
        total_views = sum(v.get("views", 0) for v in recent_videos)
        total_likes = sum(v.get("likes", 0) for v in recent_videos)
        total_comments = sum(v.get("comments", 0) for v in recent_videos)

        avg_views_per_video = total_views / len(recent_videos) if recent_videos else 0
        avg_engagement_rate = 0
        if total_views > 0:
            avg_engagement_rate = ((total_likes + total_comments) / total_views) * 100

        return {
            "timestamp": datetime.utcnow(),
            "subscribers": channel_data.get("subscribers", 0),
            "total_views": channel_data.get("total_views", 0),
            "video_count": channel_data.get("video_count", 0),
            "recent_videos": len(recent_videos),
            "avg_views_per_video": int(avg_views_per_video),
            "avg_engagement_rate": round(avg_engagement_rate, 2),
            "note": "Detailed analytics require YouTube Analytics API access with channel ownership",
            "raw_data": {
                "channel": channel_data,
                "recent_videos": recent_videos,
            },
        }

    async def get_channel_videos(
        self, channel_id: str, access_token: str, limit: int = 50, order: str = "date"
    ) -> List[Dict[str, Any]]:
        """
        Get videos from a channel

        Args:
            channel_id: YouTube channel ID
            access_token: OAuth access token
            limit: Max number of videos to return
            order: Sort order (date, viewCount, rating, relevance, title, videoCount)
        """
        # First, get the uploads playlist ID
        channel_data = await self.get_artist_data(channel_id, access_token)
        uploads_playlist_id = channel_data["raw_data"].get("contentDetails", {}).get("relatedPlaylists", {}).get("uploads")

        if not uploads_playlist_id:
            logger.warning(f"No uploads playlist found for channel {channel_id}")
            return []

        # Get videos from uploads playlist
        headers = {"Authorization": f"Bearer {access_token}"}
        params = {
            "part": "snippet,contentDetails",
            "playlistId": uploads_playlist_id,
            "maxResults": min(limit, 50),
        }

        response = await self.make_request(
            method="GET",
            url=f"{self.base_url}/playlistItems",
            headers=headers,
            params=params,
        )

        video_ids = [item["contentDetails"]["videoId"] for item in response.get("items", [])]

        if not video_ids:
            return []

        # Get detailed statistics for these videos
        video_stats = await self.get_video_stats(video_ids, access_token)

        return video_stats

    async def get_video_stats(self, video_ids: List[str], access_token: str) -> List[Dict[str, Any]]:
        """
        Get detailed statistics for videos

        Args:
            video_ids: List of video IDs
            access_token: OAuth access token
        """
        headers = {"Authorization": f"Bearer {access_token}"}
        params = {
            "part": "snippet,statistics,contentDetails",
            "id": ",".join(video_ids),
        }

        response = await self.make_request(
            method="GET",
            url=f"{self.base_url}/videos",
            headers=headers,
            params=params,
        )

        videos = []
        for video in response.get("items", []):
            snippet = video.get("snippet", {})
            statistics = video.get("statistics", {})
            content_details = video.get("contentDetails", {})

            videos.append({
                "id": video["id"],
                "title": snippet.get("title"),
                "description": snippet.get("description"),
                "published_at": snippet.get("publishedAt"),
                "thumbnail": snippet.get("thumbnails", {}).get("default", {}).get("url"),
                "duration": content_details.get("duration"),
                "views": int(statistics.get("viewCount", 0)),
                "likes": int(statistics.get("likeCount", 0)),
                "comments": int(statistics.get("commentCount", 0)),
                "favorites": int(statistics.get("favoriteCount", 0)),
            })

        return videos

    async def get_analytics_report(
        self,
        channel_id: str,
        access_token: str,
        start_date: datetime,
        end_date: datetime,
        metrics: str = "views,estimatedMinutesWatched,averageViewDuration,subscribersGained,subscribersLost"
    ) -> Dict[str, Any]:
        """
        Get YouTube Analytics data (requires channel ownership)

        Args:
            channel_id: YouTube channel ID
            access_token: OAuth access token with analytics scope
            start_date: Start date for analytics
            end_date: End date for analytics
            metrics: Comma-separated list of metrics

        Returns:
            Analytics data

        Note: This requires the channel owner's authorization and YouTube Analytics API access.
        """
        headers = {"Authorization": f"Bearer {access_token}"}
        params = {
            "ids": f"channel=={channel_id}",
            "startDate": start_date.strftime("%Y-%m-%d"),
            "endDate": end_date.strftime("%Y-%m-%d"),
            "metrics": metrics,
            "dimensions": "day",
        }

        try:
            response = await self.make_request(
                method="GET",
                url="https://youtubeanalytics.googleapis.com/v2/reports",
                headers=headers,
                params=params,
            )

            return response
        except Exception as e:
            logger.error(f"Failed to fetch YouTube Analytics: {e}")
            raise ValueError(
                "YouTube Analytics API access required. "
                "User must be the channel owner and have granted analytics permissions."
            )
