"""Add release optimizer models

Revision ID: 003_release_optimizer
Revises: 002_alerts_notifications
Create Date: 2025-11-03

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '003_release_optimizer'
down_revision = '002_alerts_notifications'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enum for release status
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE releasestatus AS ENUM ('planned', 'confirmed', 'released', 'cancelled');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # Reference the ENUM type
    release_status_enum = postgresql.ENUM(
        'planned', 'confirmed', 'released', 'cancelled',
        name='releasestatus',
        create_type=False
    )

    # Create release_scores table
    op.create_table(
        'release_scores',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('artist_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('artists.id', ondelete='CASCADE'), nullable=False),
        sa.Column('release_date', sa.Date(), nullable=False, index=True),
        sa.Column('overall_score', sa.Float(), nullable=False),
        sa.Column('momentum_score', sa.Float(), nullable=False),
        sa.Column('competition_score', sa.Float(), nullable=False),
        sa.Column('historical_performance_score', sa.Float(), nullable=False),
        sa.Column('audience_readiness_score', sa.Float(), nullable=False),
        sa.Column('calendar_events_score', sa.Float(), nullable=False),
        sa.Column('competing_releases_count', sa.Integer(), server_default='0'),
        sa.Column('major_competing_artists', postgresql.JSON()),
        sa.Column('predicted_first_week_streams', sa.Integer()),
        sa.Column('confidence_interval_low', sa.Integer()),
        sa.Column('confidence_interval_high', sa.Integer()),
        sa.Column('advantages', postgresql.JSON()),
        sa.Column('risks', postgresql.JSON()),
        sa.Column('recommendation', sa.String()),
        sa.Column('calculated_at', sa.DateTime(), nullable=False),
        sa.Column('data_snapshot', postgresql.JSON()),
    )

    # Create index on artist_id + release_date for fast queries
    op.create_index(
        'ix_release_scores_artist_date',
        'release_scores',
        ['artist_id', 'release_date']
    )

    # Create scheduled_releases table
    op.create_table(
        'scheduled_releases',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('artist_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('artists.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('release_type', sa.String()),
        sa.Column('release_date', sa.Date(), nullable=False, index=True),
        sa.Column('status', release_status_enum, server_default='planned', nullable=False),
        sa.Column('chosen_score', sa.Float()),
        sa.Column('chosen_score_breakdown', postgresql.JSON()),
        sa.Column('notes', sa.String()),
        sa.Column('external_links', postgresql.JSON()),
        sa.Column('actual_first_week_streams', sa.Integer()),
        sa.Column('actual_first_week_engagement', sa.Float()),
        sa.Column('post_release_data', postgresql.JSON()),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime()),
        sa.Column('released_at', sa.DateTime()),
    )

    # Create index on artist_id + status for filtering
    op.create_index(
        'ix_scheduled_releases_artist_status',
        'scheduled_releases',
        ['artist_id', 'status']
    )

    # Create competing_releases table
    op.create_table(
        'competing_releases',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('release_date', sa.Date(), nullable=False, index=True),
        sa.Column('artist_name', sa.String(), nullable=False),
        sa.Column('artist_spotify_id', sa.String(), index=True),
        sa.Column('album_name', sa.String(), nullable=False),
        sa.Column('album_type', sa.String()),
        sa.Column('artist_followers', sa.Integer()),
        sa.Column('artist_popularity', sa.Integer()),
        sa.Column('artist_monthly_listeners', sa.Integer()),
        sa.Column('genres', postgresql.JSON()),
        sa.Column('spotify_url', sa.String()),
        sa.Column('apple_music_url', sa.String()),
        sa.Column('total_tracks', sa.Integer()),
        sa.Column('is_major_release', sa.Boolean(), server_default='false'),
        sa.Column('scraped_at', sa.DateTime(), nullable=False),
        sa.Column('raw_data', postgresql.JSON()),
    )

    # Create composite index for date + genre filtering
    op.create_index(
        'ix_competing_releases_date_artist',
        'competing_releases',
        ['release_date', 'artist_spotify_id']
    )


def downgrade() -> None:
    # Drop tables
    op.drop_table('competing_releases')
    op.drop_table('scheduled_releases')
    op.drop_table('release_scores')

    # Drop enum
    op.execute('DROP TYPE IF EXISTS releasestatus CASCADE')
