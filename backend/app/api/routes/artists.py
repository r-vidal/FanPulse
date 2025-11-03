from fastapi import APIRouter, Depends, HTTPException, status, Query
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

router = APIRouter()


class ArtistCreate(BaseModel):
    name: str
    genre: str = None
    spotify_id: str = None
    instagram_id: str = None
    youtube_id: str = None
    image_url: str = None


class SpotifyArtistImport(BaseModel):
    """Import artist directly from Spotify"""
    spotify_id: str


class ArtistResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    genre: str = None
    spotify_id: str = None
    instagram_id: str = None
    youtube_id: str = None
    image_url: str = None
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
    """Delete an artist"""
    artist = db.query(Artist).filter(
        Artist.id == artist_id,
        Artist.user_id == current_user.id
    ).first()

    if not artist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artist not found"
        )

    db.delete(artist)
    db.commit()
    return None


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
    # Check if artist already exists for this user
    existing_artist = db.query(Artist).filter(
        Artist.user_id == current_user.id,
        Artist.spotify_id == import_data.spotify_id
    ).first()

    if existing_artist:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This artist is already added to your account"
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
