"""Add white-label reports system

Revision ID: 006_white_label_reports
Revises: 005_api_keys
Create Date: 2025-11-03

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '006_white_label_reports'
down_revision = '005_api_keys'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enum for report formats
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE reportformat AS ENUM ('pdf', 'html', 'both');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # Create enum for report periods
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE reportperiod AS ENUM ('weekly', 'monthly', 'quarterly', 'custom');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # Create enum for report status
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE reportstatus AS ENUM ('pending', 'generating', 'completed', 'failed');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # Create enum for delivery method
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE deliverymethod AS ENUM ('email', 'download', 'both');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # Reference the ENUM types
    report_format_enum = postgresql.ENUM(
        'pdf', 'html', 'both',
        name='reportformat',
        create_type=False
    )

    report_period_enum = postgresql.ENUM(
        'weekly', 'monthly', 'quarterly', 'custom',
        name='reportperiod',
        create_type=False
    )

    report_status_enum = postgresql.ENUM(
        'pending', 'generating', 'completed', 'failed',
        name='reportstatus',
        create_type=False
    )

    delivery_method_enum = postgresql.ENUM(
        'email', 'download', 'both',
        name='deliverymethod',
        create_type=False
    )

    # Create branding_settings table
    op.create_table(
        'branding_settings',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True),

        # Company branding
        sa.Column('company_name', sa.String(100), nullable=False),
        sa.Column('company_tagline', sa.String(200)),
        sa.Column('logo_url', sa.String(500)),
        sa.Column('website_url', sa.String(200)),

        # Color scheme
        sa.Column('primary_color', sa.String(7), server_default='#1DB954'),
        sa.Column('secondary_color', sa.String(7), server_default='#191414'),
        sa.Column('accent_color', sa.String(7), server_default='#1ED760'),
        sa.Column('text_color', sa.String(7), server_default='#000000'),
        sa.Column('background_color', sa.String(7), server_default='#FFFFFF'),

        # Contact information
        sa.Column('contact_email', sa.String(100)),
        sa.Column('contact_phone', sa.String(20)),
        sa.Column('contact_address', sa.String(200)),

        # Social media
        sa.Column('social_links', postgresql.JSON(), server_default='{}'),

        # Report preferences
        sa.Column('include_logo', sa.Boolean(), server_default='true'),
        sa.Column('include_contact_info', sa.Boolean(), server_default='true'),
        sa.Column('include_watermark', sa.Boolean(), server_default='false'),
        sa.Column('watermark_text', sa.String(50)),

        # Footer
        sa.Column('footer_text', sa.Text()),

        # Metadata
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime()),
    )

    # Create report_templates table
    op.create_table(
        'report_templates',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),

        # Template info
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.String(500)),
        sa.Column('is_default', sa.Boolean(), server_default='false'),

        # Report configuration
        sa.Column('format', report_format_enum, nullable=False, server_default='pdf'),
        sa.Column('period', report_period_enum, nullable=False, server_default='monthly'),

        # Sections
        sa.Column('sections', postgresql.JSON(), server_default='[]'),

        # Metrics to include
        sa.Column('include_streaming_stats', sa.Boolean(), server_default='true'),
        sa.Column('include_social_stats', sa.Boolean(), server_default='true'),
        sa.Column('include_revenue_forecast', sa.Boolean(), server_default='true'),
        sa.Column('include_momentum_score', sa.Boolean(), server_default='true'),
        sa.Column('include_recommendations', sa.Boolean(), server_default='true'),
        sa.Column('include_release_calendar', sa.Boolean(), server_default='true'),
        sa.Column('include_competitor_analysis', sa.Boolean(), server_default='false'),

        # Chart preferences
        sa.Column('chart_style', sa.String(20), server_default='modern'),
        sa.Column('show_charts', sa.Boolean(), server_default='true'),
        sa.Column('chart_colors', postgresql.JSON(), server_default='[]'),

        # Scheduling
        sa.Column('is_scheduled', sa.Boolean(), server_default='false'),
        sa.Column('schedule_frequency', sa.String(20)),
        sa.Column('schedule_day_of_week', sa.Integer()),
        sa.Column('schedule_day_of_month', sa.Integer()),
        sa.Column('next_run_at', sa.DateTime()),

        # Delivery
        sa.Column('delivery_method', delivery_method_enum, server_default='both'),
        sa.Column('delivery_emails', postgresql.JSON(), server_default='[]'),

        # Metadata
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime()),
    )

    # Create index on user_id for templates
    op.create_index(
        'ix_report_templates_user_id',
        'report_templates',
        ['user_id']
    )

    # Create generated_reports table
    op.create_table(
        'generated_reports',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('artist_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('artists.id', ondelete='CASCADE'), nullable=False),
        sa.Column('template_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('report_templates.id', ondelete='SET NULL')),

        # Report info
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('format', report_format_enum, nullable=False),
        sa.Column('period', report_period_enum, nullable=False),

        # Time range
        sa.Column('start_date', sa.DateTime(), nullable=False),
        sa.Column('end_date', sa.DateTime(), nullable=False),

        # Generation status
        sa.Column('status', report_status_enum, nullable=False, server_default='pending'),
        sa.Column('error_message', sa.Text()),

        # File storage
        sa.Column('pdf_file_path', sa.String(500)),
        sa.Column('html_file_path', sa.String(500)),
        sa.Column('pdf_file_size', sa.Integer()),
        sa.Column('html_file_size', sa.Integer()),

        # Report metadata
        sa.Column('page_count', sa.Integer()),
        sa.Column('generation_time_seconds', sa.Integer()),
        sa.Column('data_snapshot', postgresql.JSON(), server_default='{}'),

        # Delivery tracking
        sa.Column('delivered_at', sa.DateTime()),
        sa.Column('delivery_recipients', postgresql.JSON(), server_default='[]'),
        sa.Column('download_count', sa.Integer(), server_default='0'),
        sa.Column('last_downloaded_at', sa.DateTime()),

        # Metadata
        sa.Column('created_at', sa.DateTime(), nullable=False, index=True),
        sa.Column('updated_at', sa.DateTime()),
    )

    # Create composite index for user + artist queries
    op.create_index(
        'ix_generated_reports_user_artist',
        'generated_reports',
        ['user_id', 'artist_id']
    )

    # Create index on status for filtering
    op.create_index(
        'ix_generated_reports_status',
        'generated_reports',
        ['status']
    )

    # Create report_shares table
    op.create_table(
        'report_shares',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('report_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('generated_reports.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),

        # Share link
        sa.Column('share_token', sa.String(64), unique=True, nullable=False, index=True),
        sa.Column('public_url', sa.String(500), nullable=False),

        # Access control
        sa.Column('requires_password', sa.Boolean(), server_default='false'),
        sa.Column('password_hash', sa.String()),
        sa.Column('expires_at', sa.DateTime()),
        sa.Column('is_active', sa.Boolean(), server_default='true'),

        # Usage tracking
        sa.Column('view_count', sa.Integer(), server_default='0'),
        sa.Column('last_viewed_at', sa.DateTime()),
        sa.Column('viewer_ips', postgresql.JSON(), server_default='[]'),

        # Permissions
        sa.Column('allow_download', sa.Boolean(), server_default='true'),
        sa.Column('allow_print', sa.Boolean(), server_default='true'),

        # Metadata
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime()),
    )


def downgrade() -> None:
    # Drop tables
    op.drop_table('report_shares')
    op.drop_table('generated_reports')
    op.drop_table('report_templates')
    op.drop_table('branding_settings')

    # Drop enums
    op.execute('DROP TYPE IF EXISTS deliverymethod CASCADE')
    op.execute('DROP TYPE IF EXISTS reportstatus CASCADE')
    op.execute('DROP TYPE IF EXISTS reportperiod CASCADE')
    op.execute('DROP TYPE IF EXISTS reportformat CASCADE')
