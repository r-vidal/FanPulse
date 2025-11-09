"""
Publishing Studio API Routes

Multi-platform social media publishing with calendar view and content library
"""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.scheduled_post import ScheduledPost, PostStatus
from app.models.content_library import ContentLibraryItem, MediaType

router = APIRouter()


# ============================================================================
# Pydantic Schemas
# ============================================================================

class ScheduledPostCreate(BaseModel):
    """Create scheduled post"""

    artist_id: Optional[str] = None
    caption: str = Field(..., min_length=1, max_length=5000)
    media_urls: List[str] = Field(default_factory=list)
    hashtags: List[str] = Field(default_factory=list)
    platforms: List[str] = Field(..., min_items=1)  # ["instagram", "tiktok", "facebook"]
    platform_specific_settings: dict = Field(default_factory=dict)
    scheduled_for: Optional[datetime] = None


class ScheduledPostUpdate(BaseModel):
    """Update scheduled post"""

    caption: Optional[str] = None
    media_urls: Optional[List[str]] = None
    hashtags: Optional[List[str]] = None
    platforms: Optional[List[str]] = None
    platform_specific_settings: Optional[dict] = None
    scheduled_for: Optional[datetime] = None
    status: Optional[PostStatus] = None


class ScheduledPostResponse(BaseModel):
    """Scheduled post response"""

    id: str
    artist_id: Optional[str]
    caption: str
    media_urls: List[str]
    hashtags: List[str]
    platforms: List[str]
    platform_specific_settings: dict
    status: str
    scheduled_for: Optional[datetime]
    published_at: Optional[datetime]
    publish_results: dict
    error_message: Optional[str]
    ai_caption_variations: List[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ContentLibraryItemResponse(BaseModel):
    """Content library item response"""

    id: str
    filename: str
    original_filename: str
    file_url: str
    thumbnail_url: Optional[str]
    media_type: str
    mime_type: str
    file_size: int
    duration: Optional[int]
    width: Optional[int]
    height: Optional[int]
    folder: Optional[str]
    tags: List[str]
    description: Optional[str]
    usage_count: int
    uploaded_at: datetime

    class Config:
        from_attributes = True


class CaptionGenerateRequest(BaseModel):
    """AI caption generation request"""

    context: str = Field(..., max_length=1000)
    tone: str = Field(default="professional")  # professional, casual, playful, motivational
    language: str = Field(default="en")  # en, fr
    variations: int = Field(default=3, ge=1, le=5)


class CaptionGenerateResponse(BaseModel):
    """AI caption generation response"""

    captions: List[str]
    metadata: dict


# ============================================================================
# Scheduled Posts Endpoints
# ============================================================================

@router.get("/posts", response_model=List[ScheduledPostResponse])
async def get_scheduled_posts(
    status: Optional[PostStatus] = None,
    artist_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get scheduled posts with filters

    Supports filtering by status, artist, and date range for calendar view
    """
    query = db.query(ScheduledPost).filter(ScheduledPost.user_id == current_user.id)

    if status:
        query = query.filter(ScheduledPost.status == status)

    if artist_id:
        query = query.filter(ScheduledPost.artist_id == artist_id)

    if start_date:
        query = query.filter(ScheduledPost.scheduled_for >= start_date)

    if end_date:
        query = query.filter(ScheduledPost.scheduled_for <= end_date)

    posts = query.order_by(ScheduledPost.scheduled_for.desc()).limit(limit).all()

    return [ScheduledPostResponse.model_validate(post) for post in posts]


@router.post("/posts", response_model=ScheduledPostResponse)
async def create_scheduled_post(
    post_data: ScheduledPostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new scheduled post

    Can be published immediately (scheduled_for=None) or scheduled for future
    """
    # Validate platforms
    supported_platforms = ["instagram", "facebook", "tiktok", "twitter", "linkedin"]
    invalid_platforms = [p for p in post_data.platforms if p not in supported_platforms]
    if invalid_platforms:
        raise HTTPException(
            status_code=400, detail=f"Invalid platforms: {invalid_platforms}"
        )

    # Create post
    post = ScheduledPost(
        user_id=current_user.id,
        artist_id=post_data.artist_id,
        caption=post_data.caption,
        media_urls=post_data.media_urls,
        hashtags=post_data.hashtags,
        platforms=post_data.platforms,
        platform_specific_settings=post_data.platform_specific_settings,
        scheduled_for=post_data.scheduled_for,
        status=PostStatus.SCHEDULED if post_data.scheduled_for else PostStatus.DRAFT,
    )

    db.add(post)
    db.commit()
    db.refresh(post)

    # If publish immediately, queue Celery task
    if not post_data.scheduled_for:
        from app.tasks.publishing import publish_post_task

        publish_post_task.delay(str(post.id))

    return ScheduledPostResponse.model_validate(post)


@router.get("/posts/{post_id}", response_model=ScheduledPostResponse)
async def get_scheduled_post(
    post_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific scheduled post"""
    post = (
        db.query(ScheduledPost)
        .filter(ScheduledPost.id == post_id, ScheduledPost.user_id == current_user.id)
        .first()
    )

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    return ScheduledPostResponse.model_validate(post)


@router.put("/posts/{post_id}", response_model=ScheduledPostResponse)
async def update_scheduled_post(
    post_id: str,
    post_update: ScheduledPostUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a scheduled post"""
    post = (
        db.query(ScheduledPost)
        .filter(ScheduledPost.id == post_id, ScheduledPost.user_id == current_user.id)
        .first()
    )

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Can't update published posts
    if post.status == PostStatus.PUBLISHED:
        raise HTTPException(status_code=400, detail="Cannot update published post")

    # Update fields
    update_data = post_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(post, field, value)

    post.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(post)

    return ScheduledPostResponse.model_validate(post)


@router.delete("/posts/{post_id}")
async def delete_scheduled_post(
    post_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a scheduled post"""
    post = (
        db.query(ScheduledPost)
        .filter(ScheduledPost.id == post_id, ScheduledPost.user_id == current_user.id)
        .first()
    )

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Can't delete published posts
    if post.status == PostStatus.PUBLISHED:
        raise HTTPException(status_code=400, detail="Cannot delete published post")

    db.delete(post)
    db.commit()

    return {"message": "Post deleted successfully"}


@router.post("/posts/{post_id}/publish")
async def publish_post_now(
    post_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Publish a post immediately

    Triggers Celery task to publish across all selected platforms
    """
    post = (
        db.query(ScheduledPost)
        .filter(ScheduledPost.id == post_id, ScheduledPost.user_id == current_user.id)
        .first()
    )

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if post.status == PostStatus.PUBLISHED:
        raise HTTPException(status_code=400, detail="Post already published")

    # Update status
    post.status = PostStatus.PUBLISHING
    db.commit()

    # Queue Celery task
    from app.tasks.publishing import publish_post_task

    publish_post_task.delay(str(post.id))

    return {"message": "Post queued for publishing"}


# ============================================================================
# Content Library Endpoints
# ============================================================================

@router.get("/library", response_model=List[ContentLibraryItemResponse])
async def get_library_items(
    media_type: Optional[MediaType] = None,
    folder: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get content library items

    Supports filtering by media type, folder, and search query
    """
    query = db.query(ContentLibraryItem).filter(ContentLibraryItem.user_id == current_user.id)

    if media_type:
        query = query.filter(ContentLibraryItem.media_type == media_type)

    if folder:
        query = query.filter(ContentLibraryItem.folder == folder)

    if search:
        query = query.filter(
            ContentLibraryItem.original_filename.ilike(f"%{search}%")
            | ContentLibraryItem.description.ilike(f"%{search}%")
        )

    items = query.order_by(ContentLibraryItem.uploaded_at.desc()).offset(offset).limit(limit).all()

    return [ContentLibraryItemResponse.model_validate(item) for item in items]


@router.post("/library/upload", response_model=ContentLibraryItemResponse)
async def upload_media(
    file: UploadFile = File(...),
    folder: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),  # Comma-separated
    description: Optional[str] = Form(None),
    artist_id: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Upload media to content library

    TODO: Implement actual file upload to Cloudflare R2 or S3
    For now, returns a placeholder URL
    """
    import uuid

    # Validate file type
    allowed_types = {
        "image/jpeg",
        "image/png",
        "image/gif",
        "video/mp4",
        "video/quicktime",
    }

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}",
        )

    # Determine media type
    if file.content_type.startswith("image/"):
        media_type = MediaType.IMAGE
    elif file.content_type.startswith("video/"):
        media_type = MediaType.VIDEO
    else:
        media_type = MediaType.DOCUMENT

    # Generate filename
    file_id = str(uuid.uuid4())
    extension = file.filename.split(".")[-1] if "." in file.filename else ""
    filename = f"{file_id}.{extension}" if extension else file_id

    # TODO: Upload to Cloudflare R2/S3
    # For now, use placeholder URL
    file_url = f"https://cdn.fanpulse.io/uploads/{filename}"
    thumbnail_url = (
        f"https://cdn.fanpulse.io/thumbnails/{filename}.jpg"
        if media_type == MediaType.VIDEO
        else None
    )

    # Read file size
    content = await file.read()
    file_size = len(content)

    # Parse tags
    tags_list = [t.strip() for t in tags.split(",")] if tags else []

    # Create library item
    item = ContentLibraryItem(
        user_id=current_user.id,
        artist_id=artist_id,
        filename=filename,
        original_filename=file.filename,
        file_url=file_url,
        thumbnail_url=thumbnail_url,
        media_type=media_type,
        mime_type=file.content_type,
        file_size=file_size,
        folder=folder,
        tags=tags_list,
        description=description,
    )

    db.add(item)
    db.commit()
    db.refresh(item)

    return ContentLibraryItemResponse.model_validate(item)


@router.delete("/library/{item_id}")
async def delete_library_item(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a content library item"""
    item = (
        db.query(ContentLibraryItem)
        .filter(ContentLibraryItem.id == item_id, ContentLibraryItem.user_id == current_user.id)
        .first()
    )

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # TODO: Delete from S3/R2

    db.delete(item)
    db.commit()

    return {"message": "Item deleted successfully"}


# ============================================================================
# AI Caption Generation
# ============================================================================

@router.post("/generate-caption", response_model=CaptionGenerateResponse)
async def generate_caption(
    request: CaptionGenerateRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Generate AI captions using context

    Uses simple template-based generation for now
    TODO: Integrate with Phi-3 Mini or OpenAI for better captions
    """
    # Simple template-based captions for MVP
    templates = {
        "professional": [
            f"Excited to share: {request.context} 🎵",
            f"New milestone: {request.context} 🚀",
            f"Big news: {request.context} ✨",
        ],
        "casual": [
            f"Check this out: {request.context} 🔥",
            f"Guess what? {request.context} 🎉",
            f"So excited about this: {request.context} 💯",
        ],
        "playful": [
            f"🎉 {request.context} 🎊",
            f"Surprise! {request.context} 🤩",
            f"You won't believe this: {request.context} 😱",
        ],
    }

    captions = templates.get(request.tone, templates["professional"])[: request.variations]

    return CaptionGenerateResponse(
        captions=captions,
        metadata={
            "tone": request.tone,
            "language": request.language,
            "generated_at": datetime.utcnow().isoformat(),
        },
    )


# ============================================================================
# Calendar View Helpers
# ============================================================================

@router.get("/calendar")
async def get_calendar_view(
    year: int,
    month: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get calendar view for a specific month

    Returns all scheduled posts grouped by day
    """
    from datetime import date
    from calendar import monthrange

    # Get first and last day of month
    first_day = date(year, month, 1)
    last_day_num = monthrange(year, month)[1]
    last_day = date(year, month, last_day_num)

    # Get all posts in range
    posts = (
        db.query(ScheduledPost)
        .filter(
            ScheduledPost.user_id == current_user.id,
            ScheduledPost.scheduled_for >= first_day,
            ScheduledPost.scheduled_for <= last_day,
        )
        .all()
    )

    # Group by day
    calendar_data = {}
    for post in posts:
        if post.scheduled_for:
            day = post.scheduled_for.day
            if day not in calendar_data:
                calendar_data[day] = []

            calendar_data[day].append(ScheduledPostResponse.model_validate(post))

    return {
        "year": year,
        "month": month,
        "posts_by_day": calendar_data,
        "total_posts": len(posts),
    }
