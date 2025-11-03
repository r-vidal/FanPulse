"""TikTok API integration service"""
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from urllib.parse import urlencode
from app.services.platforms.base import PlatformServiceBase
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class TikTokService(PlatformServiceBase):
    """
    TikTok API integration

    TikTok has several API products:
    1. TikTok Login Kit - User authentication
    2. TikTok Display API - Access user info and videos
    3. TikTok Research API - For researchers (requires special access)
    4. TikTok for Business API - For advertisers
    5. TikTok Creator Marketplace API - For brands and creators

    For artist analytics, the ideal solution is:
    - TikTok Creator Marketplace API (requires partnership)
    - Or custom web scraping (against TOS, not recommended)

    Current implementation uses Display API for basic data.
    Full analytics require special API access or partnerships.

    Docs:
    - Login Kit: https://developers.tiktok.com/doc/login-kit-web
    - Display API: https://developers.tiktok.com/doc/display-api-get-started
    """

    def __init__(self):
        super().__init__()
        self.client_key = settings.TIKTOK_CLIENT_KEY
        self.client_secret = settings.TIKTOK_CLIENT_SECRET
        self.redirect_uri = settings.TIKTOK_REDIRECT_URI

    def get_base_url(self) -> str:
        return "https://open.tiktokapis.com/v2"

    async def get_authorization_url(self, state: str) -> str:
        """
        Generate TikTok OAuth authorization URL

        Available scopes:
        - user.info.basic: Basic profile info
        - user.info.profile: Extended profile info
        - user.info.stats: Follower/following counts
        - video.list: List user's videos
        - video.publish: Upload videos (not needed for analytics)
        """
        # Generate CSRF token
        csrf_token = state

        params = {
            "client_key": self.client_key,
            "scope": "user.info.basic,user.info.profile,user.info.stats,video.list",
            "response_type": "code",
            "redirect_uri": self.redirect_uri,
            "state": csrf_token,
        }

        return f"https://www.tiktok.com/v2/auth/authorize?{urlencode(params)}"

    async def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        """
        Exchange authorization code for access token
        """
        data = {
            "client_key": self.client_key,
            "client_secret": self.client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": self.redirect_uri,
        }

        response = await self.make_request(
            method="POST",
            url="https://open.tiktokapis.com/v2/oauth/token/",
            json=data,
        )

        return {
            "access_token": response["data"]["access_token"],
            "refresh_token": response["data"]["refresh_token"],
            "expires_in": response["data"]["expires_in"],
            "token_type": response["data"]["token_type"],
            "open_id": response["data"]["open_id"],
        }

    async def refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        """
        Refresh expired access token
        """
        data = {
            "client_key": self.client_key,
            "client_secret": self.client_secret,
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
        }

        response = await self.make_request(
            method="POST",
            url="https://open.tiktokapis.com/v2/oauth/token/",
            json=data,
        )

        return {
            "access_token": response["data"]["access_token"],
            "refresh_token": response["data"]["refresh_token"],
            "expires_in": response["data"]["expires_in"],
            "token_type": response["data"]["token_type"],
        }

    async def get_artist_data(self, platform_artist_id: str, access_token: str) -> Dict[str, Any]:
        """
        Fetch TikTok user profile data

        Returns basic profile information using Display API
        Note: platform_artist_id here is the open_id from TikTok OAuth
        """
        headers = {"Authorization": f"Bearer {access_token}"}

        # Get user info
        response = await self.make_request(
            method="GET",
            url=f"{self.base_url}/user/info/",
            headers=headers,
            params={"fields": "open_id,union_id,avatar_url,display_name,bio_description,profile_deep_link,is_verified,follower_count,following_count,likes_count,video_count"},
        )

        data = response.get("data", {}).get("user", {})

        return {
            "id": data.get("open_id"),
            "union_id": data.get("union_id"),
            "username": data.get("display_name"),
            "display_name": data.get("display_name"),
            "bio": data.get("bio_description"),
            "avatar_url": data.get("avatar_url"),
            "profile_url": data.get("profile_deep_link"),
            "is_verified": data.get("is_verified", False),
            "followers": data.get("follower_count", 0),
            "following": data.get("following_count", 0),
            "likes": data.get("likes_count", 0),
            "video_count": data.get("video_count", 0),
            "raw_data": data,
        }

    async def get_streaming_stats(
        self,
        platform_artist_id: str,
        access_token: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """
        Fetch TikTok analytics

        NOTE: Detailed analytics (views, engagement rates, demographic data)
        are NOT available through the public Display API.

        Options for production:
        1. Apply for TikTok Creator Marketplace API access
        2. Partner with TikTok for Business API
        3. Use TikTok Analytics (requires users to manually export data)
        4. Web scraping (against TOS, not recommended)

        Current implementation returns basic public metrics only.
        """
        profile = await self.get_artist_data(platform_artist_id, access_token)

        # Get recent videos to calculate engagement
        videos = await self.get_user_videos(platform_artist_id, access_token, limit=20)

        # Calculate average engagement from recent videos
        total_views = sum(v.get("views", 0) for v in videos)
        total_likes = sum(v.get("likes", 0) for v in videos)
        total_comments = sum(v.get("comments", 0) for v in videos)
        total_shares = sum(v.get("shares", 0) for v in videos)

        avg_engagement_rate = 0
        if videos and profile.get("followers", 0) > 0:
            total_engagement = total_likes + total_comments + total_shares
            avg_engagement_rate = (total_engagement / len(videos)) / profile["followers"] * 100

        return {
            "timestamp": datetime.utcnow(),
            "followers": profile.get("followers", 0),
            "following": profile.get("following", 0),
            "total_likes": profile.get("likes", 0),
            "video_count": profile.get("video_count", 0),
            "recent_videos": len(videos),
            "total_views": total_views,
            "average_engagement_rate": round(avg_engagement_rate, 2),
            "note": "Detailed analytics require TikTok Creator Marketplace API or Business API access",
            "raw_data": {
                "profile": profile,
                "recent_videos": videos,
            },
        }

    async def get_user_videos(
        self, platform_artist_id: str, access_token: str, limit: int = 20, cursor: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get user's public videos

        Note: Video statistics (views, likes, comments, shares) are limited
        in the public API. Full analytics require special access.
        """
        headers = {"Authorization": f"Bearer {access_token}"}

        params = {
            "fields": "id,create_time,cover_image_url,share_url,video_description,duration,height,width,title,embed_html,embed_link,like_count,comment_count,share_count,view_count",
            "max_count": limit,
        }

        if cursor:
            params["cursor"] = cursor

        response = await self.make_request(
            method="POST",
            url=f"{self.base_url}/video/list/",
            headers=headers,
            json=params,
        )

        videos_data = response.get("data", {}).get("videos", [])

        return [
            {
                "id": video.get("id"),
                "title": video.get("title"),
                "description": video.get("video_description"),
                "cover_url": video.get("cover_image_url"),
                "share_url": video.get("share_url"),
                "duration": video.get("duration"),
                "width": video.get("width"),
                "height": video.get("height"),
                "created_at": video.get("create_time"),
                "likes": video.get("like_count", 0),
                "comments": video.get("comment_count", 0),
                "shares": video.get("share_count", 0),
                "views": video.get("view_count", 0),
                "embed_html": video.get("embed_html"),
                "embed_link": video.get("embed_link"),
            }
            for video in videos_data
        ]

    async def get_video_details(
        self, video_id: str, access_token: str
    ) -> Dict[str, Any]:
        """
        Get details for a specific video

        Note: Limited data available through public API
        """
        headers = {"Authorization": f"Bearer {access_token}"}

        response = await self.make_request(
            method="POST",
            url=f"{self.base_url}/video/query/",
            headers=headers,
            json={
                "filters": {
                    "video_ids": [video_id]
                },
                "fields": "id,create_time,cover_image_url,share_url,video_description,duration,height,width,title,like_count,comment_count,share_count,view_count",
            },
        )

        videos = response.get("data", {}).get("videos", [])
        return videos[0] if videos else {}

    async def search_user(self, query: str, access_token: str) -> List[Dict[str, Any]]:
        """
        Search for TikTok users

        NOTE: User search is NOT available in the public TikTok API.
        This is a placeholder for future implementation if/when available.

        Alternatives:
        1. Use TikTok's web interface and have users manually input their handle
        2. Use web scraping (against TOS)
        3. Apply for special API access
        """
        logger.warning("TikTok user search not available through public API")
        return []

    async def get_trending_hashtags(self, access_token: str) -> List[Dict[str, Any]]:
        """
        Get trending hashtags

        NOTE: Trending data is NOT available in the public Display API.
        This requires TikTok Business API or Creator Marketplace access.
        """
        logger.warning("Trending hashtags not available through public API")
        return []

    async def get_sound_details(self, sound_id: str, access_token: str) -> Dict[str, Any]:
        """
        Get details about a specific sound/music

        This could be useful for tracking which songs are trending on TikTok.
        However, this endpoint is not yet available in the public API.
        """
        logger.warning("Sound details not available through public API")
        return {}
