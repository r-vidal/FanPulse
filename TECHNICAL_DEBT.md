# Technical Debt - FanPulse

## High Priority

### 1. Artist Model - Single-Tenant Limitation

**Status:** 🔴 Active Limitation
**Impact:** High - Prevents multiple users from tracking the same artist
**Effort:** Medium (Requires database migration and refactoring)

#### Problem

The current `Artist` model has a `spotify_id` column with a `unique=True` constraint, which means only ONE user in the entire system can track a given Spotify artist. This is a significant limitation for a multi-user platform.

**Current Schema:**
```python
class Artist(Base):
    id = Column(UUID, primary_key=True)
    user_id = Column(UUID, ForeignKey("users.id"), nullable=False)
    spotify_id = Column(String, unique=True, index=True)  # ❌ Problem
    # ... other fields
```

**Error when second user tries to add same artist:**
```
psycopg2.errors.UniqueViolation: duplicate key value violates unique constraint "ix_artists_spotify_id"
```

#### Why This Exists

This was likely an early design decision for MVP/prototype where each user was expected to manage their own artists exclusively (e.g., artist managers managing their own roster).

#### Proper Solution

Refactor to a **many-to-many relationship** between Users and Artists:

```python
# New model
class GlobalArtist(Base):
    """Shared artist data across all users"""
    __tablename__ = "global_artists"

    id = Column(UUID, primary_key=True)
    spotify_id = Column(String, unique=True, index=True)  # ✅ Unique globally
    name = Column(String, nullable=False)
    genre = Column(String)
    image_url = Column(String)
    # Platform-agnostic data

# Junction table
class UserArtist(Base):
    """User's relationship to an artist"""
    __tablename__ = "user_artists"

    id = Column(UUID, primary_key=True)
    user_id = Column(UUID, ForeignKey("users.id"), nullable=False)
    artist_id = Column(UUID, ForeignKey("global_artists.id"), nullable=False)

    # User-specific settings
    is_favorite = Column(Boolean, default=False)
    custom_notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('user_id', 'artist_id', name='uq_user_artist'),
    )
```

#### Migration Path

1. **Phase 1: Create New Tables**
   - Create `global_artists` table
   - Create `user_artists` junction table
   - Migrate existing `artists` data to new schema

2. **Phase 2: Update Code**
   - Refactor all artist queries to use new relationships
   - Update API endpoints
   - Update services (momentum, analytics, etc.)

3. **Phase 3: Deprecate Old Table**
   - Drop `artists` table
   - Remove old relationships

4. **Phase 4: Update Frontend**
   - Ensure UI handles shared artists correctly
   - Update artist selection/management UIs

#### Temporary Workaround (CURRENT)

For now, we catch the duplicate key error and return a clear HTTP 409 Conflict error:

```python
if existing_artist and existing_artist.user_id != current_user.id:
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail=f"Artist '{existing_artist.name}' is already being tracked by another user..."
    )
```

This prevents the cryptic database error and informs users of the limitation.

#### Related Files

- `backend/app/models/artist.py` - Artist model definition
- `backend/app/api/routes/artists.py` - Artist import logic
- `backend/alembic/versions/20251103_add_platform_models.py` - Initial migration

#### Tracking

- Created: 2025-11-03
- Last Updated: 2025-11-03
- Assigned: Unassigned
- Target Release: v2.0

---

## Medium Priority

### 2. Celery Task Registration

**Status:** ✅ Fixed (2025-11-03)
**Impact:** Medium - Prevented background tasks from running

Tasks were not being registered because they weren't imported in `app/tasks/__init__.py`. Fixed by explicitly importing all task functions.

---

## Low Priority

*(Add future technical debt items here)*

---

## How to Use This Document

1. **Report New Debt:** Add items as they're discovered
2. **Track Status:** Update status when working on items
3. **Link Issues:** Reference GitHub issues if tracking externally
4. **Estimate Effort:** T-shirt sizes (Small, Medium, Large, XL)
5. **Prioritize:** High/Medium/Low based on user impact
