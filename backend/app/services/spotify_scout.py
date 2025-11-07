"""
Spotify Scout Service
Scans Spotify for emerging artists and their first releases
"""

import logging
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from sqlalchemy.orm import Session

from app.core.config import settings
from app.services.ai_music_detector import AIMusicDetector

logger = logging.getLogger(__name__)


class SpotifyScout:
    """Scout service for discovering new artists on Spotify"""

    def __init__(self):
        """Initialize Spotify client"""
        self.sp = spotipy.Spotify(auth_manager=SpotifyClientCredentials(
            client_id=settings.SPOTIFY_CLIENT_ID,
            client_secret=settings.SPOTIFY_CLIENT_SECRET
        ))
        self.ai_detector = AIMusicDetector()

    def scan_new_releases(
        self,
        country: str = 'US',
        limit: int = 50,
        genres: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Scan Spotify for new releases from emerging artists

        Args:
            country: Country code (ISO 3166-1 alpha-2)
            limit: Number of releases to scan
            genres: List of genres to filter by

        Returns:
            List of scouted artists with metadata
        """
        try:
            logger.info(f"Scanning new releases for country: {country}, limit: {limit}")

            # Get new releases
            results = self.sp.new_releases(country=country, limit=limit)
            albums = results['albums']['items']

            scouted_artists = []

            for album in albums:
                try:
                    artist = album['artists'][0]
                    artist_id = artist['id']

                    # Get full artist details
                    artist_details = self.sp.artist(artist_id)

                    # Get artist's albums to check if this is their first release
                    artist_albums = self.sp.artist_albums(
                        artist_id,
                        album_type='album,single,ep',
                        limit=50
                    )

                    total_releases = artist_albums['total']

                    # Filter: only artists with 1-5 releases (emerging)
                    if not (1 <= total_releases <= 5):
                        continue

                    # Filter by genre if specified
                    if genres:
                        artist_genres = set(artist_details.get('genres', []))
                        if not any(g in artist_genres for g in genres):
                            continue

                    # Get album tracks
                    tracks = self.sp.album_tracks(album['id'])['items']

                    # Analyze first track
                    track_analysis = None
                    preview_url = None
                    is_ai_generated = False
                    ai_confidence = 0.0

                    if tracks:
                        first_track = tracks[0]
                        track_id = first_track['id']
                        preview_url = first_track.get('preview_url')

                        # Get audio features
                        try:
                            audio_features = self.sp.audio_features([track_id])[0]
                            track_analysis = audio_features

                            # Detect if AI-generated (using preview if available)
                            if preview_url:
                                is_ai_generated, ai_confidence = self.ai_detector.detect_ai_music(
                                    preview_url
                                )
                        except Exception as e:
                            logger.warning(f"Could not analyze track {track_id}: {e}")

                    # Build scouted artist profile
                    scouted_artist = {
                        # Artist Info
                        'spotify_id': artist_id,
                        'name': artist_details['name'],
                        'genres': artist_details.get('genres', []),
                        'popularity': artist_details.get('popularity', 0),
                        'followers': artist_details.get('followers', {}).get('total', 0),
                        'image_url': artist_details['images'][0]['url'] if artist_details.get('images') else None,
                        'spotify_url': artist_details['external_urls']['spotify'],

                        # Release Info
                        'release_type': album['album_type'],  # album, single, ep
                        'release_name': album['name'],
                        'release_date': album['release_date'],
                        'total_releases': total_releases,
                        'is_first_release': total_releases == 1,

                        # Track Info
                        'track_count': len(tracks),
                        'first_track_name': tracks[0]['name'] if tracks else None,
                        'preview_url': preview_url,

                        # Audio Analysis
                        'audio_features': track_analysis,

                        # AI Detection
                        'is_ai_generated': is_ai_generated,
                        'ai_confidence': ai_confidence,
                        'tags': self._generate_tags(
                            artist_details,
                            album,
                            total_releases,
                            is_ai_generated,
                            track_analysis
                        ),

                        # Timestamps
                        'discovered_at': datetime.utcnow().isoformat(),
                    }

                    scouted_artists.append(scouted_artist)

                except Exception as e:
                    logger.error(f"Error processing album {album.get('name')}: {e}")
                    continue

            logger.info(f"Scouted {len(scouted_artists)} emerging artists")
            return scouted_artists

        except Exception as e:
            logger.error(f"Error scanning new releases: {e}")
            raise

    def scan_by_genre(
        self,
        genre: str,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Scan Spotify for emerging artists in a specific genre

        Args:
            genre: Genre to search for
            limit: Number of artists to return

        Returns:
            List of scouted artists
        """
        try:
            logger.info(f"Scanning genre: {genre}")

            # Search for artists in genre
            results = self.sp.search(
                q=f'genre:"{genre}"',
                type='artist',
                limit=limit
            )

            artists = results['artists']['items']
            scouted_artists = []

            for artist in artists:
                try:
                    artist_id = artist['id']

                    # Get artist albums
                    albums = self.sp.artist_albums(
                        artist_id,
                        album_type='album,single,ep',
                        limit=5
                    )

                    # Filter: emerging artists only (1-5 releases)
                    if not (1 <= albums['total'] <= 5):
                        continue

                    # Process most recent album
                    if albums['items']:
                        recent_album = albums['items'][0]

                        # Get tracks
                        tracks = self.sp.album_tracks(recent_album['id'])['items']

                        # Analyze first track
                        is_ai_generated = False
                        ai_confidence = 0.0
                        preview_url = None

                        if tracks:
                            preview_url = tracks[0].get('preview_url')
                            if preview_url:
                                is_ai_generated, ai_confidence = self.ai_detector.detect_ai_music(
                                    preview_url
                                )

                        scouted_artist = {
                            'spotify_id': artist_id,
                            'name': artist['name'],
                            'genres': artist.get('genres', []),
                            'popularity': artist.get('popularity', 0),
                            'followers': artist.get('followers', {}).get('total', 0),
                            'image_url': artist['images'][0]['url'] if artist.get('images') else None,
                            'spotify_url': artist['external_urls']['spotify'],
                            'release_name': recent_album['name'],
                            'release_date': recent_album['release_date'],
                            'release_type': recent_album['album_type'],
                            'total_releases': albums['total'],
                            'is_first_release': albums['total'] == 1,
                            'preview_url': preview_url,
                            'is_ai_generated': is_ai_generated,
                            'ai_confidence': ai_confidence,
                            'tags': self._generate_tags(
                                artist,
                                recent_album,
                                albums['total'],
                                is_ai_generated,
                                None
                            ),
                            'discovered_at': datetime.utcnow().isoformat(),
                        }

                        scouted_artists.append(scouted_artist)

                except Exception as e:
                    logger.error(f"Error processing artist {artist.get('name')}: {e}")
                    continue

            logger.info(f"Scouted {len(scouted_artists)} artists in genre {genre}")
            return scouted_artists

        except Exception as e:
            logger.error(f"Error scanning genre {genre}: {e}")
            raise

    def _generate_tags(
        self,
        artist: Dict,
        album: Dict,
        total_releases: int,
        is_ai_generated: bool,
        audio_features: Optional[Dict]
    ) -> List[str]:
        """Generate tags for a scouted artist"""
        tags = []

        # Release tags
        if total_releases == 1:
            tags.append('first_release')
        elif total_releases <= 3:
            tags.append('emerging')

        if album['album_type'] == 'single':
            tags.append('single')
        elif album['album_type'] == 'ep':
            tags.append('ep')
        elif album['album_type'] == 'album':
            tags.append('debut_album')

        # Popularity tags
        popularity = artist.get('popularity', 0)
        if popularity < 20:
            tags.append('underground')
        elif popularity < 40:
            tags.append('rising')
        elif popularity < 60:
            tags.append('trending')

        # Follower tags
        followers = artist.get('followers', {}).get('total', 0)
        if followers < 1000:
            tags.append('micro')
        elif followers < 10000:
            tags.append('small')
        elif followers < 50000:
            tags.append('growing')

        # AI detection tag
        if is_ai_generated:
            tags.append('ai_generated')
        else:
            tags.append('authentic')

        # Audio feature tags
        if audio_features:
            # Energy
            if audio_features.get('energy', 0) > 0.8:
                tags.append('high_energy')
            elif audio_features.get('energy', 0) < 0.3:
                tags.append('low_energy')

            # Danceability
            if audio_features.get('danceability', 0) > 0.7:
                tags.append('danceable')

            # Acousticness
            if audio_features.get('acousticness', 0) > 0.7:
                tags.append('acoustic')

            # Instrumentalness
            if audio_features.get('instrumentalness', 0) > 0.5:
                tags.append('instrumental')

        # Genre tags (use first 2 genres)
        genres = artist.get('genres', [])[:2]
        tags.extend(genres)

        # Recent release tag
        try:
            release_date = datetime.strptime(album['release_date'], '%Y-%m-%d')
            days_since_release = (datetime.now() - release_date).days
            if days_since_release < 7:
                tags.append('new_this_week')
            elif days_since_release < 30:
                tags.append('new_this_month')
        except:
            pass

        return tags

    def get_artist_potential_score(self, artist_data: Dict) -> float:
        """
        Calculate potential score for an artist (0-100)

        Factors:
        - Growth velocity (popularity trend)
        - Engagement rate (followers vs streams)
        - Release frequency
        - Genre fit
        - Audio quality
        - Authenticity (not AI-generated)
        """
        score = 50.0  # Base score

        # Popularity boost (0-20 points)
        popularity = artist_data.get('popularity', 0)
        if popularity > 0:
            score += min(20, popularity / 5)

        # Follower growth potential (0-15 points)
        followers = artist_data.get('followers', 0)
        if 1000 < followers < 50000:
            score += 15  # Sweet spot for growth
        elif followers < 1000:
            score += 5  # Early stage

        # Release activity (0-10 points)
        total_releases = artist_data.get('total_releases', 0)
        if 1 <= total_releases <= 3:
            score += 10  # Active and emerging

        # First release bonus (0-10 points)
        if artist_data.get('is_first_release'):
            score += 10

        # Authenticity bonus (0-15 points)
        if not artist_data.get('is_ai_generated'):
            score += 15
        else:
            score -= 20  # Penalty for AI-generated

        # Audio features (0-15 points)
        audio_features = artist_data.get('audio_features')
        if audio_features:
            # Well-balanced tracks score higher
            energy = audio_features.get('energy', 0.5)
            danceability = audio_features.get('danceability', 0.5)
            valence = audio_features.get('valence', 0.5)

            balance_score = 1 - abs(0.6 - energy) - abs(0.6 - danceability)
            score += balance_score * 15

        # Genre diversity (0-10 points)
        genres = artist_data.get('genres', [])
        if len(genres) >= 2:
            score += 10
        elif len(genres) == 1:
            score += 5

        # Preview availability (0-5 points)
        if artist_data.get('preview_url'):
            score += 5

        # Normalize to 0-100
        return max(0, min(100, score))
