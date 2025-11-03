"""Platform integration services"""
from app.services.platforms.spotify import SpotifyService
from app.services.platforms.apple_music import AppleMusicService
from app.services.platforms.instagram import InstagramService
from app.services.platforms.tiktok import TikTokService

__all__ = [
    "SpotifyService",
    "AppleMusicService",
    "InstagramService",
    "TikTokService",
]
