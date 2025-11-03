"""Add platform integration models

Revision ID: 001_platform_models
Revises:
Create Date: 2025-11-03

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_platform_models'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enum for platform types using SQL to handle "already exists" gracefully
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE platformtype AS ENUM ('spotify', 'apple_music', 'youtube', 'instagram', 'tiktok', 'twitter');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # Create enum for subscription tiers using SQL to handle "already exists" gracefully
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE subscriptiontier AS ENUM ('solo', 'pro', 'label', 'enterprise');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # Reference the ENUM types (don't try to create them)
    platform_type_enum = postgresql.ENUM(
        'spotify', 'apple_music', 'youtube', 'instagram', 'tiktok', 'twitter',
        name='platformtype',
        create_type=False
    )

    subscription_tier_enum = postgresql.ENUM(
        'solo', 'pro', 'label', 'enterprise',
        name='subscriptiontier',
        create_type=False
    )

    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(), nullable=False, unique=True, index=True),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('subscription_tier', subscription_tier_enum, server_default='solo', nullable=False),
        sa.Column('is_verified', sa.Boolean(), default=False, nullable=False),
        sa.Column('verification_token', sa.String(), nullable=True),
        sa.Column('reset_token', sa.String(), nullable=True),
        sa.Column('reset_token_expires_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime()),
    )

    # Create artists table
    op.create_table(
        'artists',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('spotify_id', sa.String(), unique=True, index=True),
        sa.Column('instagram_id', sa.String(), index=True),
        sa.Column('youtube_id', sa.String(), index=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('genre', sa.String()),
        sa.Column('image_url', sa.String()),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime()),
    )

    # Create platform_connections table
    op.create_table(
        'platform_connections',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('artist_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('artists.id'), nullable=False),
        sa.Column('platform_type', platform_type_enum, nullable=False),
        sa.Column('platform_artist_id', sa.String(), nullable=False),
        sa.Column('platform_username', sa.String()),
        sa.Column('access_token', sa.String()),
        sa.Column('refresh_token', sa.String()),
        sa.Column('token_expires_at', sa.DateTime()),
        sa.Column('is_active', sa.Boolean(), default=True, nullable=False),
        sa.Column('last_synced_at', sa.DateTime()),
        sa.Column('sync_error', sa.String()),
        sa.Column('platform_data', sa.JSON()),
        sa.Column('connected_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime()),
    )

    # Create stream_history table
    op.create_table(
        'stream_history',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('artist_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('artists.id'), nullable=False),
        sa.Column('platform_connection_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('platform_connections.id'), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False, index=True),
        sa.Column('total_streams', sa.Integer(), default=0),
        sa.Column('daily_streams', sa.Integer(), default=0),
        sa.Column('monthly_streams', sa.Integer(), default=0),
        sa.Column('total_listeners', sa.Integer(), default=0),
        sa.Column('monthly_listeners', sa.Integer(), default=0),
        sa.Column('daily_listeners', sa.Integer(), default=0),
        sa.Column('followers', sa.Integer(), default=0),
        sa.Column('followers_change', sa.Integer(), default=0),
        sa.Column('saves', sa.Integer(), default=0),
        sa.Column('playlist_adds', sa.Integer(), default=0),
        sa.Column('skip_rate', sa.Float()),
        sa.Column('completion_rate', sa.Float()),
        sa.Column('top_countries', postgresql.JSONB()),
        sa.Column('demographics', postgresql.JSONB()),
        sa.Column('top_tracks', postgresql.JSONB()),
        sa.Column('raw_data', postgresql.JSONB()),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )

    # Create indexes for stream_history
    op.create_index('ix_stream_history_artist_time', 'stream_history', ['artist_id', 'timestamp'])
    op.create_index('ix_stream_history_platform_time', 'stream_history', ['platform_connection_id', 'timestamp'])

    # Create social_posts table
    op.create_table(
        'social_posts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('artist_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('artists.id'), nullable=False),
        sa.Column('platform_connection_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('platform_connections.id'), nullable=False),
        sa.Column('platform_post_id', sa.String(), nullable=False, unique=True, index=True),
        sa.Column('post_type', sa.String()),
        sa.Column('caption', sa.Text()),
        sa.Column('media_url', sa.String()),
        sa.Column('thumbnail_url', sa.String()),
        sa.Column('permalink', sa.String()),
        sa.Column('likes', sa.Integer(), default=0),
        sa.Column('comments', sa.Integer(), default=0),
        sa.Column('shares', sa.Integer(), default=0),
        sa.Column('saves', sa.Integer(), default=0),
        sa.Column('views', sa.Integer(), default=0),
        sa.Column('plays', sa.Integer(), default=0),
        sa.Column('engagement_rate', sa.Float()),
        sa.Column('view_rate', sa.Float()),
        sa.Column('posted_at', sa.DateTime(), nullable=False),
        sa.Column('scraped_at', sa.DateTime()),
        sa.Column('hashtags', postgresql.JSONB()),
        sa.Column('mentions', postgresql.JSONB()),
        sa.Column('raw_data', postgresql.JSONB()),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime()),
    )

    # Create superfans table
    op.create_table(
        'superfans',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('artist_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('artists.id'), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('name', sa.String()),
        sa.Column('location', sa.String()),
        sa.Column('lifetime_value', sa.Float(), default=0.0),
        sa.Column('engagement_score', sa.Float(), default=0.0),
        sa.Column('last_interaction', sa.DateTime()),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime()),
    )

    # Create streams table
    op.create_table(
        'streams',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('artist_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('artists.id'), nullable=False),
        sa.Column('platform', sa.String(), nullable=False),
        sa.Column('count', sa.Integer(), default=0),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )

    # Create alerts table
    op.create_table(
        'alerts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('artist_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('artists.id'), nullable=False),
        sa.Column('alert_type', sa.String(), nullable=False),
        sa.Column('threshold', sa.Float()),
        sa.Column('is_active', sa.Boolean(), default=True, nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime()),
    )


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table('alerts')
    op.drop_table('streams')
    op.drop_table('superfans')
    op.drop_table('social_posts')
    op.drop_index('ix_stream_history_platform_time', 'stream_history')
    op.drop_index('ix_stream_history_artist_time', 'stream_history')
    op.drop_table('stream_history')
    op.drop_table('platform_connections')
    op.drop_table('artists')
    op.drop_table('users')

    # Drop enum types
    platform_type_enum = postgresql.ENUM(name='platformtype')
    platform_type_enum.drop(op.get_bind(), checkfirst=True)

    subscription_tier_enum = postgresql.ENUM(name='subscriptiontier')
    subscription_tier_enum.drop(op.get_bind(), checkfirst=True)
