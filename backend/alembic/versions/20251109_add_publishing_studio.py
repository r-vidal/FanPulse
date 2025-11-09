"""Add publishing studio tables

Revision ID: 014_publishing_studio
Revises: 010_fix_superfans_schema
Create Date: 2025-11-09

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '014_publishing_studio'
down_revision = '010_fix_superfans_schema'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create post_status enum
    op.execute("""
        CREATE TYPE poststatus AS ENUM (
            'draft', 'scheduled', 'publishing', 'published', 'failed', 'cancelled'
        )
    """)

    # Create media_type enum
    op.execute("""
        CREATE TYPE mediatype AS ENUM (
            'image', 'video', 'audio', 'document'
        )
    """)

    # Create scheduled_posts table
    op.create_table(
        'scheduled_posts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('artist_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('artists.id', ondelete='SET NULL'), nullable=True),

        # Content
        sa.Column('caption', sa.Text(), nullable=False),
        sa.Column('media_urls', postgresql.JSONB(), server_default='[]', nullable=False),
        sa.Column('hashtags', postgresql.JSONB(), server_default='[]', nullable=False),

        # Platforms
        sa.Column('platforms', postgresql.JSONB(), server_default='[]', nullable=False),
        sa.Column('platform_specific_settings', postgresql.JSONB(), server_default='{}', nullable=False),

        # Scheduling
        sa.Column('status', sa.Enum('draft', 'scheduled', 'publishing', 'published', 'failed', 'cancelled', name='poststatus'), nullable=False, server_default='draft'),
        sa.Column('scheduled_for', sa.DateTime(timezone=True), nullable=True),
        sa.Column('published_at', sa.DateTime(timezone=True), nullable=True),

        # Results
        sa.Column('publish_results', postgresql.JSONB(), server_default='{}', nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),

        # AI
        sa.Column('ai_caption_variations', postgresql.JSONB(), server_default='[]', nullable=False),
        sa.Column('ai_metadata', postgresql.JSONB(), server_default='{}', nullable=False),

        # Audit
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )

    # Create content_library_items table
    op.create_table(
        'content_library_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('artist_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('artists.id', ondelete='SET NULL'), nullable=True),

        # File info
        sa.Column('filename', sa.String(500), nullable=False),
        sa.Column('original_filename', sa.String(500), nullable=False),
        sa.Column('file_url', sa.String(1000), nullable=False),
        sa.Column('thumbnail_url', sa.String(1000), nullable=True),

        # Media metadata
        sa.Column('media_type', sa.Enum('image', 'video', 'audio', 'document', name='mediatype'), nullable=False),
        sa.Column('mime_type', sa.String(100), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('duration', sa.Integer(), nullable=True),
        sa.Column('width', sa.Integer(), nullable=True),
        sa.Column('height', sa.Integer(), nullable=True),

        # Organization
        sa.Column('folder', sa.String(200), nullable=True),
        sa.Column('tags', postgresql.JSONB(), server_default='[]', nullable=False),
        sa.Column('description', sa.String(1000), nullable=True),

        # Usage tracking
        sa.Column('usage_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('last_used_at', sa.DateTime(timezone=True), nullable=True),

        # AI
        sa.Column('ai_tags', postgresql.JSONB(), server_default='[]', nullable=False),
        sa.Column('ai_description', sa.String(1000), nullable=True),
        sa.Column('ai_metadata', postgresql.JSONB(), server_default='{}', nullable=False),

        # Audit
        sa.Column('uploaded_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )

    # Create indexes for scheduled_posts
    op.create_index('ix_scheduled_posts_user_id', 'scheduled_posts', ['user_id'])
    op.create_index('ix_scheduled_posts_artist_id', 'scheduled_posts', ['artist_id'])
    op.create_index('ix_scheduled_posts_status', 'scheduled_posts', ['status'])
    op.create_index('ix_scheduled_posts_scheduled_for', 'scheduled_posts', ['scheduled_for'])
    op.create_index('ix_scheduled_posts_created_at', 'scheduled_posts', ['created_at'])

    # Create indexes for content_library_items
    op.create_index('ix_content_library_items_user_id', 'content_library_items', ['user_id'])
    op.create_index('ix_content_library_items_artist_id', 'content_library_items', ['artist_id'])
    op.create_index('ix_content_library_items_media_type', 'content_library_items', ['media_type'])
    op.create_index('ix_content_library_items_folder', 'content_library_items', ['folder'])
    op.create_index('ix_content_library_items_uploaded_at', 'content_library_items', ['uploaded_at'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_content_library_items_uploaded_at', 'content_library_items')
    op.drop_index('ix_content_library_items_folder', 'content_library_items')
    op.drop_index('ix_content_library_items_media_type', 'content_library_items')
    op.drop_index('ix_content_library_items_artist_id', 'content_library_items')
    op.drop_index('ix_content_library_items_user_id', 'content_library_items')

    op.drop_index('ix_scheduled_posts_created_at', 'scheduled_posts')
    op.drop_index('ix_scheduled_posts_scheduled_for', 'scheduled_posts')
    op.drop_index('ix_scheduled_posts_status', 'scheduled_posts')
    op.drop_index('ix_scheduled_posts_artist_id', 'scheduled_posts')
    op.drop_index('ix_scheduled_posts_user_id', 'scheduled_posts')

    # Drop tables
    op.drop_table('content_library_items')
    op.drop_table('scheduled_posts')

    # Drop enums
    op.execute('DROP TYPE mediatype')
    op.execute('DROP TYPE poststatus')
