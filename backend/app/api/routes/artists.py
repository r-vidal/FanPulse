from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.artist import Artist
from app.models.platform import PlatformConnection, PlatformType
from app.services.platforms.spotify import SpotifyService
from pydantic import BaseModel, ConfigDict, field_serializer
from datetime import datetime
import csv
import io
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class ArtistCreate(BaseModel):
    name: str
    genre: Optional[str] = None
    spotify_id: Optional[str] = None
    instagram_id: Optional[str] = None
    youtube_id: Optional[str] = None
    apple_music_id: Optional[str] = None
    tiktok_id: Optional[str] = None
    twitter_id: Optional[str] = None
    facebook_id: Optional[str] = None
    image_url: Optional[str] = None


class SpotifyArtistImport(BaseModel):
    """Import artist directly from Spotify"""
    spotify_id: str


class ArtistResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    genre: Optional[str] = None
    spotify_id: Optional[str] = None
    instagram_id: Optional[str] = None
    youtube_id: Optional[str] = None
    apple_music_id: Optional[str] = None
    tiktok_id: Optional[str] = None
    twitter_id: Optional[str] = None
    facebook_id: Optional[str] = None
    image_url: Optional[str] = None
    created_at: datetime

    @field_serializer('id')
    def serialize_id(self, value: UUID) -> str:
        return str(value)

    @field_serializer('created_at')
    def serialize_created_at(self, value: datetime) -> str:
        return value.isoformat()


class SpotifyArtistSearchResult(BaseModel):
    """Spotify artist search result"""
    id: str
    name: str
    genres: List[str]
    popularity: int
    followers: int
    images: List[dict]
    external_url: str


@router.get("/", response_model=List[ArtistResponse])
async def get_artists(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all artists for current user"""
    artists = db.query(Artist).filter(Artist.user_id == current_user.id).all()
    return artists


@router.post("/", response_model=ArtistResponse, status_code=status.HTTP_201_CREATED)
async def create_artist(
    artist_data: ArtistCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new artist"""
    new_artist = Artist(
        user_id=current_user.id,
        name=artist_data.name,
        genre=artist_data.genre,
        spotify_id=artist_data.spotify_id,
        instagram_id=artist_data.instagram_id,
        youtube_id=artist_data.youtube_id,
    )
    db.add(new_artist)
    db.commit()
    db.refresh(new_artist)
    return new_artist


@router.get("/{artist_id}", response_model=ArtistResponse)
async def get_artist(
    artist_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific artist"""
    artist = db.query(Artist).filter(
        Artist.id == artist_id,
        Artist.user_id == current_user.id
    ).first()

    if not artist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artist not found"
        )

    return artist


@router.delete("/{artist_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_artist(
    artist_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an artist and all related records (cascades to all relationships)"""
    artist = db.query(Artist).filter(
        Artist.id == artist_id,
        Artist.user_id == current_user.id
    ).first()

    if not artist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artist not found"
        )

    try:
        # Delete artist (will cascade to all related records via relationships)
        db.delete(artist)
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete artist: {str(e)}"
        )


@router.get("/search/spotify", response_model=List[SpotifyArtistSearchResult])
async def search_spotify_artists(
    q: str = Query(..., min_length=1, description="Artist name to search"),
    current_user: User = Depends(get_current_user)
):
    """
    Search for artists on Spotify by name

    This endpoint uses Spotify's Web API to search for artists.
    Results can be used to import artists into the system.
    """
    spotify = SpotifyService()

    try:
        results = await spotify.search_artist(query=q)
        return results
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search Spotify: {str(e)}"
        )
    finally:
        await spotify.close()


@router.post("/import/spotify", response_model=ArtistResponse, status_code=status.HTTP_201_CREATED)
async def import_spotify_artist(
    import_data: SpotifyArtistImport,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Import an artist from Spotify

    This will:
    1. Fetch artist data from Spotify
    2. Create the artist in the database
    3. Create a platform connection for Spotify

    The spotify_id should come from the search results
    """
    # Check if artist already exists globally (spotify_id is unique across the system)
    existing_artist = db.query(Artist).filter(
        Artist.spotify_id == import_data.spotify_id
    ).first()

    if existing_artist:
        # Check if it belongs to the current user
        if existing_artist.user_id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This artist is already added to your account"
            )
        else:
            # Artist exists but belongs to another user
            # This is a limitation of the current single-tenant artist model
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Artist '{existing_artist.name}' is already being tracked by another user in the system. Due to current system limitations, each Spotify artist can only be tracked by one user. This will be addressed in a future update to support multi-tenant artist tracking."
            )

    spotify = SpotifyService()

    try:
        # Get Spotify access token using client credentials
        access_token = await spotify.get_client_credentials_token()

        # Fetch artist data from Spotify
        artist_data = await spotify.get_artist_data(
            platform_artist_id=import_data.spotify_id,
            access_token=access_token
        )

        # Determine genre (take first genre if available)
        genres = artist_data.get("genres", [])
        genre = genres[0] if genres else None

        # Get best quality image
        images = artist_data.get("images", [])
        image_url = images[0]["url"] if images else None

        # Create artist
        new_artist = Artist(
            user_id=current_user.id,
            name=artist_data["name"],
            genre=genre,
            spotify_id=import_data.spotify_id,
            image_url=image_url
        )
        db.add(new_artist)
        db.flush()  # Get the artist ID without committing

        # Create platform connection
        platform_connection = PlatformConnection(
            artist_id=new_artist.id,
            platform_type=PlatformType.SPOTIFY,
            platform_artist_id=import_data.spotify_id,
            is_active=True,
            platform_data={
                "followers": artist_data.get("followers", 0),
                "popularity": artist_data.get("popularity", 0),
                "genres": artist_data.get("genres", []),
                "external_url": artist_data.get("external_url", "")
            }
        )
        db.add(platform_connection)

        db.commit()
        db.refresh(new_artist)

        return new_artist

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to import artist from Spotify: {str(e)}"
        )
    finally:
        await spotify.close()


@router.get("/{artist_id}/stats", response_model=dict)
async def get_artist_stats(
    artist_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get streaming statistics for an artist

    Returns estimated metrics based on public Spotify data.
    Note: Detailed streaming stats require Spotify for Artists API access.
    """
    # Get artist and verify ownership
    artist = db.query(Artist).filter(
        Artist.id == artist_id,
        Artist.user_id == current_user.id
    ).first()

    if not artist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artist not found"
        )

    if not artist.spotify_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Artist does not have a Spotify connection"
        )

    spotify = SpotifyService()

    try:
        # Get access token using client credentials
        access_token = await spotify.get_client_credentials_token()

        # Fetch streaming stats
        stats = await spotify.get_streaming_stats(
            platform_artist_id=artist.spotify_id,
            access_token=access_token
        )

        return stats

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch artist stats: {str(e)}"
        )
    finally:
        await spotify.close()


@router.get("/{artist_id}/instagram-stats", response_model=dict)
async def get_artist_instagram_stats(
    artist_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get Instagram statistics for an artist

    Returns profile metrics, engagement, and recent posts data.
    Requires artist to have an active Instagram connection.
    """
    from app.services.platforms.instagram import InstagramService
    from app.models.platform import PlatformConnection, PlatformType

    # Get artist and verify ownership
    artist = db.query(Artist).filter(
        Artist.id == artist_id,
        Artist.user_id == current_user.id
    ).first()

    if not artist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artist not found"
        )

    # Get Instagram platform connection
    instagram_connection = db.query(PlatformConnection).filter(
        PlatformConnection.artist_id == artist_id,
        PlatformConnection.platform_type == PlatformType.INSTAGRAM,
        PlatformConnection.is_active == True
    ).first()

    if not instagram_connection:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Artist does not have an active Instagram connection"
        )

    instagram = InstagramService()

    try:
        # Fetch Instagram stats using stored access token
        stats = await instagram.get_streaming_stats(
            platform_artist_id=instagram_connection.platform_artist_id,
            access_token=instagram_connection.access_token
        )

        # Get recent media for engagement metrics
        recent_media = await instagram.get_recent_media(
            platform_artist_id=instagram_connection.platform_artist_id,
            access_token=instagram_connection.access_token,
            limit=12
        )

        # Calculate average engagement rate
        total_engagement = 0
        media_with_metrics = 0
        for media in recent_media:
            if media.get('likes') is not None and media.get('comments') is not None:
                total_engagement += media['likes'] + media['comments']
                media_with_metrics += 1

        avg_engagement = total_engagement / media_with_metrics if media_with_metrics > 0 else 0
        followers = stats.get('followers', 0)
        engagement_rate = (avg_engagement / followers * 100) if followers > 0 else 0

        return {
            "platform": "instagram",
            "username": instagram_connection.platform_username,
            "followers": followers,
            "impressions": stats.get('impressions', 0),
            "reach": stats.get('reach', 0),
            "profile_views": stats.get('profile_views', 0),
            "recent_posts": len(recent_media),
            "avg_engagement_per_post": round(avg_engagement, 2),
            "engagement_rate": round(engagement_rate, 2),
            "recent_media": recent_media[:6],  # Return top 6 recent posts
            "timestamp": stats.get('timestamp'),
            "account_type": instagram_connection.platform_data.get('account_type', 'personal') if instagram_connection.platform_data else 'personal'
        }

    except Exception as e:
        logger.error(f"Failed to fetch Instagram stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch Instagram stats: {str(e)}"
        )
    finally:
        await instagram.close()


@router.get("/export/csv")
async def export_artists_csv(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Export all artists to CSV format

    Returns CSV with columns: name, genre, spotify_id, instagram_id,
    youtube_id, followers, popularity, created_at
    """
    # Get all artists for current user
    artists = db.query(Artist).filter(Artist.user_id == current_user.id).all()

    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)

    # Write header
    writer.writerow([
        'Name',
        'Genre',
        'Spotify ID',
        'Instagram ID',
        'YouTube ID',
        'Followers',
        'Popularity',
        'Monthly Listeners (Est.)',
        'Image URL',
        'Added Date'
    ])

    # Fetch stats for each artist
    spotify = SpotifyService()
    try:
        access_token = await spotify.get_client_credentials_token()

        for artist in artists:
            # Default values
            followers = '-'
            popularity = '-'
            monthly_listeners = '-'

            # Fetch stats if Spotify connected
            if artist.spotify_id:
                try:
                    stats = await spotify.get_streaming_stats(
                        platform_artist_id=artist.spotify_id,
                        access_token=access_token
                    )
                    followers = stats.get('followers', '-')
                    popularity = stats.get('popularity', '-')
                    monthly_listeners = stats.get('monthly_listeners', '-')
                except:
                    pass  # Keep defaults if fetch fails

            # Write row
            writer.writerow([
                artist.name,
                artist.genre or '-',
                artist.spotify_id or '-',
                artist.instagram_id or '-',
                artist.youtube_id or '-',
                followers,
                popularity,
                monthly_listeners,
                artist.image_url or '-',
                artist.created_at.strftime('%Y-%m-%d %H:%M:%S')
            ])
    finally:
        await spotify.close()

    # Prepare response
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=fanpulse_artists_{datetime.utcnow().strftime('%Y%m%d')}.csv"
        }
    )
