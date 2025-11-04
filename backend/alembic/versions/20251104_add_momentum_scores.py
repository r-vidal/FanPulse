"""Add momentum_scores table

Revision ID: 002_momentum_scores
Revises: 001a_fix_alerts
Create Date: 2025-11-04

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002_momentum_scores'
down_revision = '001a_fix_alerts'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create momentum_scores table
    op.create_table(
        'momentum_scores',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('artist_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('artists.id', ondelete='CASCADE'), nullable=False),
        sa.Column('overall_score', sa.Float(), nullable=False, server_default='5.0'),
        sa.Column('velocity_score', sa.Float(), nullable=False, server_default='5.0'),
        sa.Column('consistency_score', sa.Float(), nullable=False, server_default='5.0'),
        sa.Column('momentum_category', sa.String(20), server_default='Steady'),
        sa.Column('key_insights', postgresql.JSONB(), server_default='[]'),
        sa.Column('calculated_at', sa.DateTime(), nullable=False, index=True),
    )

    # Create indexes
    op.create_index('ix_momentum_scores_artist_id', 'momentum_scores', ['artist_id'])
    op.create_index('ix_momentum_scores_calculated_at', 'momentum_scores', ['calculated_at'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_momentum_scores_calculated_at', 'momentum_scores')
    op.drop_index('ix_momentum_scores_artist_id', 'momentum_scores')

    # Drop table
    op.drop_table('momentum_scores')
