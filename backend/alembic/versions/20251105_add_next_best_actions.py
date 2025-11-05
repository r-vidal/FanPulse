"""add next_best_actions table

Revision ID: 008_next_best_actions
Revises: 007_momentum_scores
Create Date: 2025-11-05 15:15:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '008_next_best_actions'
down_revision = '007_momentum_scores'
branch_labels = None
depends_on = None


def upgrade():
    # Create next_best_actions table
    op.create_table(
        'next_best_actions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('artist_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('artists.id'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('action_type', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=False),
        sa.Column('urgency', sa.Enum('critical', 'high', 'medium', 'low', name='actionurgency'), nullable=False),
        sa.Column('reason', sa.String(), nullable=True),
        sa.Column('expected_impact', sa.String(), nullable=True),
        sa.Column('status', sa.Enum('pending', 'completed', 'snoozed', 'ignored', name='actionstatus'), nullable=False, server_default='pending'),
        sa.Column('impact_score', sa.Integer(), nullable=True),
        sa.Column('impact_measured_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('snoozed_until', sa.DateTime(), nullable=True),
    )

    # Create indexes
    op.create_index('ix_next_best_actions_artist_id', 'next_best_actions', ['artist_id'])
    op.create_index('ix_next_best_actions_user_id', 'next_best_actions', ['user_id'])
    op.create_index('ix_next_best_actions_status', 'next_best_actions', ['status'])
    op.create_index('ix_next_best_actions_created_at', 'next_best_actions', ['created_at'])


def downgrade():
    # Drop indexes
    op.drop_index('ix_next_best_actions_created_at', 'next_best_actions')
    op.drop_index('ix_next_best_actions_status', 'next_best_actions')
    op.drop_index('ix_next_best_actions_user_id', 'next_best_actions')
    op.drop_index('ix_next_best_actions_artist_id', 'next_best_actions')

    # Drop table
    op.drop_table('next_best_actions')

    # Drop enums
    op.execute('DROP TYPE IF EXISTS actionurgency')
    op.execute('DROP TYPE IF EXISTS actionstatus')
