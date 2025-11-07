"""
Scout A&R API Endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.api import deps
from app.services.spotify_scout import SpotifyScout
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


# ==================== SCHEMAS ====================

class ScoutedArtist(BaseModel):
    """Scouted artist schema"""
    spotify_id: str
    name: str
    genres: List[str] = []
    popularity: int
    followers: int
    image_url: Optional[str]
    spotify_url: str

    # Release info
    release_type: str
    release_name: str
    release_date: str
    total_releases: int
    is_first_release: bool

    # Track info
    track_count: Optional[int]
    first_track_name: Optional[str]
    preview_url: Optional[str]

    # Audio analysis
    audio_features: Optional[dict]

    # AI Detection
    is_ai_generated: bool
    ai_confidence: float
    tags: List[str] = []

    # Metadata
    discovered_at: str

    class Config:
        from_attributes = True


class ScoutResponse(BaseModel):
    """Scout scan response"""
    total: int
    artists: List[ScoutedArtist]
    filters_applied: dict


class ArtistPotentialScore(BaseModel):
    """Artist potential scoring"""
    spotify_id: str
    name: str
    potential_score: float = Field(..., ge=0, le=100)
    score_breakdown: dict
    recommendation: str


# ==================== ENDPOINTS ====================

@router.get("/scan/new-releases", response_model=ScoutResponse)
async def scan_new_releases(
    country: str = Query(default="US", description="Country code (ISO 3166-1)"),
    limit: int = Query(default=50, ge=1, le=100, description="Number of releases to scan"),
    genres: Optional[str] = Query(default=None, description="Comma-separated genres to filter"),
    current_user = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    """
    Scan Spotify for new releases from emerging artists

    **Required Subscription:** PRO or higher

    **Features:**
    - Scans latest releases from specified country
    - Filters for emerging artists (1-5 total releases)
    - Detects AI-generated music
    - Analyzes audio features
    - Auto-tags artists (genre, release type, authenticity, etc.)
    - Provides preview URLs for tracks

    **Use Cases:**
    - A&R talent discovery
    - Finding new artists before they blow up
    - Identifying authentic vs AI-generated music
    - Genre-specific scouting
    """
    try:
        # Check subscription tier
        if current_user.subscription_tier not in ['pro', 'label', 'enterprise']:
            raise HTTPException(
                status_code=403,
                detail="Scout A&R requires PRO subscription or higher"
            )

        logger.info(f"User {current_user.email} scanning new releases: country={country}, limit={limit}")

        # Parse genres
        genre_list = None
        if genres:
            genre_list = [g.strip() for g in genres.split(',')]

        # Initialize scout service
        scout = SpotifyScout()

        # Scan new releases
        artists = scout.scan_new_releases(
            country=country,
            limit=limit,
            genres=genre_list
        )

        # Calculate potential scores
        for artist in artists:
            artist['potential_score'] = scout.get_artist_potential_score(artist)

        # Sort by potential score
        artists.sort(key=lambda x: x.get('potential_score', 0), reverse=True)

        return ScoutResponse(
            total=len(artists),
            artists=artists,
            filters_applied={
                'country': country,
                'limit': limit,
                'genres': genre_list or []
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error scanning new releases: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to scan releases: {str(e)}")


@router.get("/scan/by-genre/{genre}", response_model=ScoutResponse)
async def scan_by_genre(
    genre: str,
    limit: int = Query(default=20, ge=1, le=50),
    current_user = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    """
    Scan Spotify for emerging artists in a specific genre

    **Required Subscription:** PRO or higher

    **Features:**
    - Genre-specific artist discovery
    - Filters for emerging artists only
    - AI detection
    - Audio analysis
    - Auto-tagging

    **Popular Genres:**
    - pop, rock, hip-hop, electronic, indie, r&b, jazz, country, latin, metal
    """
    try:
        # Check subscription
        if current_user.subscription_tier not in ['pro', 'label', 'enterprise']:
            raise HTTPException(
                status_code=403,
                detail="Scout A&R requires PRO subscription or higher"
            )

        logger.info(f"User {current_user.email} scanning genre: {genre}")

        scout = SpotifyScout()
        artists = scout.scan_by_genre(genre=genre, limit=limit)

        # Calculate potential scores
        for artist in artists:
            artist['potential_score'] = scout.get_artist_potential_score(artist)

        artists.sort(key=lambda x: x.get('potential_score', 0), reverse=True)

        return ScoutResponse(
            total=len(artists),
            artists=artists,
            filters_applied={
                'genre': genre,
                'limit': limit
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error scanning genre {genre}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to scan genre: {str(e)}")


@router.get("/artist/{spotify_id}/potential", response_model=ArtistPotentialScore)
async def get_artist_potential(
    spotify_id: str,
    current_user = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    """
    Get detailed potential score for a specific artist

    **Returns:**
    - Overall potential score (0-100)
    - Score breakdown by category
    - AI recommendation
    - Investment recommendation
    """
    try:
        if current_user.subscription_tier not in ['pro', 'label', 'enterprise']:
            raise HTTPException(
                status_code=403,
                detail="Scout A&R requires PRO subscription or higher"
            )

        scout = SpotifyScout()

        # Get artist from Spotify
        artist = scout.sp.artist(spotify_id)
        albums = scout.sp.artist_albums(spotify_id, album_type='album,single,ep', limit=5)

        # Build artist data
        artist_data = {
            'spotify_id': spotify_id,
            'name': artist['name'],
            'popularity': artist.get('popularity', 0),
            'followers': artist.get('followers', {}).get('total', 0),
            'genres': artist.get('genres', []),
            'total_releases': albums['total'],
            'is_first_release': albums['total'] == 1,
        }

        # Get most recent release
        if albums['items']:
            recent_album = albums['items'][0]
            tracks = scout.sp.album_tracks(recent_album['id'])['items']

            if tracks and tracks[0].get('preview_url'):
                preview_url = tracks[0]['preview_url']
                is_ai, confidence = scout.ai_detector.detect_ai_music(preview_url)
                artist_data['is_ai_generated'] = is_ai
                artist_data['ai_confidence'] = confidence
                artist_data['preview_url'] = preview_url

                # Get audio features
                try:
                    audio_features = scout.sp.audio_features([tracks[0]['id']])[0]
                    artist_data['audio_features'] = audio_features
                except:
                    pass

        # Calculate potential score
        potential_score = scout.get_artist_potential_score(artist_data)

        # Generate score breakdown
        score_breakdown = {
            'popularity_factor': min(20, artist_data.get('popularity', 0) / 5),
            'follower_growth_potential': 15 if 1000 < artist_data.get('followers', 0) < 50000 else 5,
            'release_activity': 10 if 1 <= artist_data.get('total_releases', 0) <= 3 else 0,
            'authenticity_bonus': 15 if not artist_data.get('is_ai_generated', False) else -20,
            'first_release_bonus': 10 if artist_data.get('is_first_release', False) else 0,
        }

        # Generate recommendation
        if potential_score >= 85:
            recommendation = "STRONG INVEST - High potential emerging artist. Recommend immediate outreach."
        elif potential_score >= 70:
            recommendation = "INVEST - Good potential. Add to watchlist and monitor closely."
        elif potential_score >= 55:
            recommendation = "MONITOR - Moderate potential. Keep on radar."
        else:
            recommendation = "PASS - Low potential at this time."

        # AI-generated warning
        if artist_data.get('is_ai_generated', False):
            recommendation += f" ⚠️ AI-GENERATED MUSIC DETECTED (confidence: {artist_data.get('ai_confidence', 0):.0%})"

        return ArtistPotentialScore(
            spotify_id=spotify_id,
            name=artist_data['name'],
            potential_score=potential_score,
            score_breakdown=score_breakdown,
            recommendation=recommendation
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting artist potential: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze artist: {str(e)}")


@router.get("/tags", response_model=dict)
async def get_available_tags(
    current_user = Depends(deps.get_current_active_user)
):
    """
    Get list of all available tags used in Scout A&R

    **Tag Categories:**
    - Release: first_release, emerging, single, ep, debut_album
    - Popularity: underground, rising, trending
    - Size: micro, small, growing
    - Authenticity: ai_generated, authentic
    - Energy: high_energy, low_energy
    - Style: danceable, acoustic, instrumental
    - Timing: new_this_week, new_this_month
    - Genres: Various genre tags
    """
    tags = {
        'release_tags': ['first_release', 'emerging', 'single', 'ep', 'debut_album'],
        'popularity_tags': ['underground', 'rising', 'trending'],
        'size_tags': ['micro', 'small', 'growing'],
        'authenticity_tags': ['ai_generated', 'authentic'],
        'energy_tags': ['high_energy', 'low_energy'],
        'style_tags': ['danceable', 'acoustic', 'instrumental'],
        'timing_tags': ['new_this_week', 'new_this_month'],
        'genre_examples': ['pop', 'rock', 'hip-hop', 'electronic', 'indie', 'r&b', 'jazz', 'country']
    }

    return tags


@router.post("/watchlist/add/{spotify_id}")
async def add_to_watchlist(
    spotify_id: str,
    current_user = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    """
    Add artist to A&R watchlist

    **Future Enhancement:**
    - Store in database
    - Track over time
    - Alert on momentum changes
    """
    # TODO: Implement watchlist storage in database
    return {
        "message": f"Artist {spotify_id} added to watchlist",
        "user_id": current_user.id
    }


@router.delete("/watchlist/remove/{spotify_id}")
async def remove_from_watchlist(
    spotify_id: str,
    current_user = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    """Remove artist from A&R watchlist"""
    # TODO: Implement watchlist removal
    return {
        "message": f"Artist {spotify_id} removed from watchlist",
        "user_id": current_user.id
    }
