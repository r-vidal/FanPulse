from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.core.database import get_db
from app.api.routes.auth import get_current_user
from app.models.user import User
from app.models.artist import Artist
from pydantic import BaseModel

router = APIRouter()


class ArtistCreate(BaseModel):
    name: str
    genre: str
    spotify_id: str = None
    instagram_id: str = None
    youtube_id: str = None


class ArtistResponse(BaseModel):
    id: str
    name: str
    genre: str
    spotify_id: str = None
    instagram_id: str = None
    youtube_id: str = None
    image_url: str = None
    created_at: str

    class Config:
        from_attributes = True


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
