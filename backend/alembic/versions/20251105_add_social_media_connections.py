"""add social media connections to artists

Revision ID: 011_add_social_media
Revises: 010_fix_superfans_schema
Create Date: 2025-11-05

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '011_add_social_media'
down_revision = '010_fix_superfans_schema'
branch_labels = None
depends_on = None


def upgrade():
    """Add social media connection fields to artists table"""
    # Add new columns for social media platforms
    op.add_column('artists', sa.Column('apple_music_id', sa.String(), nullable=True))
    op.add_column('artists', sa.Column('tiktok_id', sa.String(), nullable=True))
    op.add_column('artists', sa.Column('twitter_id', sa.String(), nullable=True))
    op.add_column('artists', sa.Column('facebook_id', sa.String(), nullable=True))

    # Create indexes for faster lookups
    op.create_index('ix_artists_apple_music_id', 'artists', ['apple_music_id'], unique=False)
    op.create_index('ix_artists_tiktok_id', 'artists', ['tiktok_id'], unique=False)
    op.create_index('ix_artists_twitter_id', 'artists', ['twitter_id'], unique=False)
    op.create_index('ix_artists_facebook_id', 'artists', ['facebook_id'], unique=False)


def downgrade():
    """Remove social media connection fields from artists table"""
    # Drop indexes
    op.drop_index('ix_artists_facebook_id', table_name='artists')
    op.drop_index('ix_artists_twitter_id', table_name='artists')
    op.drop_index('ix_artists_tiktok_id', table_name='artists')
    op.drop_index('ix_artists_apple_music_id', table_name='artists')

    # Drop columns
    op.drop_column('artists', 'facebook_id')
    op.drop_column('artists', 'twitter_id')
    op.drop_column('artists', 'tiktok_id')
    op.drop_column('artists', 'apple_music_id')
