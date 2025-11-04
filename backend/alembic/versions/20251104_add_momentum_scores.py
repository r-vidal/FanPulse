"""add momentum scores table

Revision ID: 20251104_momentum
Revises: 20251103_fix_alerts_schema
Create Date: 2025-11-04 15:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSON

# revision identifiers, used by Alembic.
revision = '20251104_momentum'
down_revision = '20251103_fix_alerts_schema'
branch_labels = None
depends_on = None


def upgrade():
    # Create momentum_scores table
    op.create_table(
        'momentum_scores',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('artist_id', UUID(as_uuid=True), sa.ForeignKey('artists.id', ondelete='CASCADE'), nullable=False),
        sa.Column('overall_score', sa.Float(), nullable=False, server_default='5.0'),
        sa.Column('velocity_score', sa.Float(), nullable=False, server_default='5.0'),
        sa.Column('consistency_score', sa.Float(), nullable=False, server_default='5.0'),
        sa.Column('momentum_category', sa.String(20), server_default='Steady'),
        sa.Column('key_insights', JSON(), nullable=True),
        sa.Column('calculated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'), index=True),
    )

    # Create index on artist_id and calculated_at for faster queries
    op.create_index('ix_momentum_scores_artist_time', 'momentum_scores', ['artist_id', 'calculated_at'])


def downgrade():
    op.drop_index('ix_momentum_scores_artist_time', table_name='momentum_scores')
    op.drop_table('momentum_scores')
