"""White-Label Report Generation Service"""
import logging
import os
import time
import secrets
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from pathlib import Path
from sqlalchemy.orm import Session
from jinja2 import Environment, FileSystemLoader, select_autoescape
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from io import BytesIO
import base64

from app.models.artist import Artist
from app.models.user import User
from app.models.report import (
    BrandingSettings, ReportTemplate, GeneratedReport,
    ReportFormat, ReportPeriod, ReportStatus
)
from app.models.stream_history import StreamHistory
from app.models.momentum import MomentumScore
from app.models.revenue import RevenueForecast, ForecastScenario

logger = logging.getLogger(__name__)


class ReportGenerator:
    """
    Generate white-label PDF and HTML reports for artists

    Creates professional, branded reports with analytics, charts,
    and recommendations for manager-to-client presentations.
    """

    def __init__(self, db: Session):
        self.db = db

        # Setup Jinja2 environment
        template_dir = Path(__file__).parent.parent / "templates" / "reports"
        template_dir.mkdir(parents=True, exist_ok=True)

        self.jinja_env = Environment(
            loader=FileSystemLoader(str(template_dir)),
            autoescape=select_autoescape(['html', 'xml'])
        )

        # Report storage directory
        self.reports_dir = Path("/tmp/fanpulse_reports")  # Change to S3 in production
        self.reports_dir.mkdir(parents=True, exist_ok=True)

    def generate_report(
        self,
        user_id: str,
        artist_id: str,
        template_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> GeneratedReport:
        """
        Generate a complete report for an artist

        Args:
            user_id: User UUID
            artist_id: Artist UUID
            template_id: Report template UUID (optional)
            start_date: Report start date (optional, defaults to 30 days ago)
            end_date: Report end date (optional, defaults to today)

        Returns:
            GeneratedReport model with file paths
        """
        start_time = time.time()

        # Get user and artist
        user = self.db.query(User).filter(User.id == user_id).first()
        artist = self.db.query(Artist).filter(Artist.id == artist_id).first()

        if not user or not artist:
            raise ValueError("User or artist not found")

        # Get or create branding settings
        branding = self.db.query(BrandingSettings).filter(
            BrandingSettings.user_id == user_id
        ).first()

        if not branding:
            branding = self._create_default_branding(user)

        # Get template
        if template_id:
            template = self.db.query(ReportTemplate).filter(
                ReportTemplate.id == template_id,
                ReportTemplate.user_id == user_id,
            ).first()
        else:
            template = self._get_default_template(user)

        if not template:
            raise ValueError("Report template not found")

        # Determine date range
        if not end_date:
            end_date = datetime.utcnow()
        if not start_date:
            if template.period == ReportPeriod.WEEKLY:
                start_date = end_date - timedelta(days=7)
            elif template.period == ReportPeriod.MONTHLY:
                start_date = end_date - timedelta(days=30)
            elif template.period == ReportPeriod.QUARTERLY:
                start_date = end_date - timedelta(days=90)
            else:
                start_date = end_date - timedelta(days=30)

        # Create report record
        report = GeneratedReport(
            user_id=user_id,
            artist_id=artist_id,
            template_id=template_id,
            title=f"{artist.name} - {template.period.value.capitalize()} Report",
            format=template.format,
            period=template.period,
            start_date=start_date,
            end_date=end_date,
            status=ReportStatus.GENERATING,
        )

        self.db.add(report)
        self.db.commit()
        self.db.refresh(report)

        try:
            # Gather all data
            logger.info(f"Gathering data for report {report.id}")
            data = self._gather_report_data(artist, start_date, end_date, template)

            # Generate charts
            logger.info(f"Generating charts for report {report.id}")
            charts = self._generate_charts(data, branding)

            # Prepare context for template
            context = {
                "report": report,
                "artist": artist,
                "user": user,
                "branding": branding,
                "template": template,
                "data": data,
                "charts": charts,
                "start_date": start_date,
                "end_date": end_date,
                "generated_at": datetime.utcnow(),
            }

            # Generate HTML
            logger.info(f"Generating HTML for report {report.id}")
            html_content = self._generate_html(context, template)
            html_path = self._save_html(report.id, html_content)

            report.html_file_path = html_path
            report.html_file_size = len(html_content.encode('utf-8'))

            # Generate PDF if requested
            if template.format in [ReportFormat.PDF, ReportFormat.BOTH]:
                logger.info(f"Generating PDF for report {report.id}")
                pdf_path = self._generate_pdf(html_content, report.id)
                report.pdf_file_path = pdf_path
                report.pdf_file_size = os.path.getsize(pdf_path)

            # Update report status
            generation_time = int(time.time() - start_time)
            report.status = ReportStatus.COMPLETED
            report.generation_time_seconds = generation_time
            report.data_snapshot = data.get("summary", {})

            self.db.commit()
            self.db.refresh(report)

            logger.info(
                f"Successfully generated report {report.id} in {generation_time}s"
            )

            return report

        except Exception as e:
            logger.error(f"Failed to generate report {report.id}: {e}")
            report.status = ReportStatus.FAILED
            report.error_message = str(e)
            self.db.commit()
            raise

    def _gather_report_data(
        self,
        artist: Artist,
        start_date: datetime,
        end_date: datetime,
        template: ReportTemplate,
    ) -> Dict:
        """Gather all data needed for the report"""
        data = {}

        # Streaming stats
        if template.include_streaming_stats:
            stream_data = self._get_streaming_data(artist.id, start_date, end_date)
            data["streaming"] = stream_data

        # Momentum score
        if template.include_momentum_score:
            momentum = self._get_momentum_data(artist.id)
            data["momentum"] = momentum

        # Revenue forecast
        if template.include_revenue_forecast:
            revenue = self._get_revenue_forecast(artist.id)
            data["revenue_forecast"] = revenue

        # Social stats (from platform connections)
        if template.include_social_stats:
            social = self._get_social_stats(artist)
            data["social"] = social

        # Summary stats
        data["summary"] = self._calculate_summary_stats(data)

        return data

    def _get_streaming_data(
        self, artist_id: str, start_date: datetime, end_date: datetime
    ) -> Dict:
        """Get streaming statistics"""
        history = self.db.query(StreamHistory).filter(
            StreamHistory.artist_id == artist_id,
            StreamHistory.date >= start_date,
            StreamHistory.date <= end_date,
        ).order_by(StreamHistory.date).all()

        if not history:
            return {
                "total_streams": 0,
                "avg_daily_streams": 0,
                "growth_rate": 0,
                "trend": "stable",
                "timeline": [],
            }

        total_streams = sum(h.total_streams for h in history)
        avg_daily = total_streams / len(history) if history else 0

        # Calculate growth rate
        if len(history) >= 2:
            first_week = sum(h.total_streams for h in history[:7])
            last_week = sum(h.total_streams for h in history[-7:])
            growth_rate = ((last_week - first_week) / first_week * 100) if first_week > 0 else 0
        else:
            growth_rate = 0

        # Determine trend
        if growth_rate > 10:
            trend = "growing"
        elif growth_rate < -10:
            trend = "declining"
        else:
            trend = "stable"

        return {
            "total_streams": total_streams,
            "avg_daily_streams": int(avg_daily),
            "growth_rate": round(growth_rate, 1),
            "trend": trend,
            "timeline": [
                {"date": h.date, "streams": h.total_streams}
                for h in history
            ],
        }

    def _get_momentum_data(self, artist_id: str) -> Dict:
        """Get latest momentum score"""
        momentum = self.db.query(MomentumScore).filter(
            MomentumScore.artist_id == artist_id
        ).order_by(MomentumScore.calculated_at.desc()).first()

        if not momentum:
            return {"score": 5.0, "category": "Steady", "insights": []}

        return {
            "score": momentum.overall_score,
            "category": momentum.momentum_category,
            "velocity": momentum.velocity_score,
            "consistency": momentum.consistency_score,
            "insights": momentum.key_insights or [],
        }

    def _get_revenue_forecast(self, artist_id: str) -> Dict:
        """Get revenue forecast data"""
        forecasts = self.db.query(RevenueForecast).filter(
            RevenueForecast.artist_id == artist_id,
            RevenueForecast.scenario == ForecastScenario.REALISTIC,
        ).order_by(RevenueForecast.forecast_month).limit(6).all()

        if not forecasts:
            return {"total_forecast": 0, "monthly": []}

        total = sum(f.total_revenue for f in forecasts)

        return {
            "total_forecast": round(total, 2),
            "monthly": [
                {
                    "month": f.forecast_month,
                    "revenue": f.total_revenue,
                    "streaming": f.streaming_revenue,
                    "concerts": f.concert_revenue,
                }
                for f in forecasts
            ],
        }

    def _get_social_stats(self, artist: Artist) -> Dict:
        """Get social media statistics"""
        # This would be populated from platform connections
        return {
            "instagram_followers": 0,
            "tiktok_followers": 0,
            "youtube_subscribers": 0,
            "total_followers": 0,
        }

    def _calculate_summary_stats(self, data: Dict) -> Dict:
        """Calculate high-level summary statistics"""
        streaming = data.get("streaming", {})
        momentum = data.get("momentum", {})
        revenue = data.get("revenue_forecast", {})

        return {
            "total_streams": streaming.get("total_streams", 0),
            "momentum_score": momentum.get("score", 5.0),
            "revenue_forecast": revenue.get("total_forecast", 0),
            "growth_rate": streaming.get("growth_rate", 0),
            "trend": streaming.get("trend", "stable"),
        }

    def _generate_charts(self, data: Dict, branding: BrandingSettings) -> Dict:
        """Generate chart images as base64 strings"""
        charts = {}

        # Use brand colors for charts
        primary_color = branding.primary_color or "#1DB954"

        # Streaming trend chart
        if "streaming" in data and data["streaming"]["timeline"]:
            charts["streaming_trend"] = self._create_line_chart(
                data["streaming"]["timeline"],
                "Streaming Trend",
                "Date",
                "Streams",
                primary_color
            )

        # Revenue forecast chart
        if "revenue_forecast" in data and data["revenue_forecast"]["monthly"]:
            charts["revenue_forecast"] = self._create_bar_chart(
                data["revenue_forecast"]["monthly"],
                "Revenue Forecast (6 Months)",
                "Month",
                "Revenue (€)",
                primary_color
            )

        return charts

    def _create_line_chart(
        self, timeline: List[Dict], title: str, xlabel: str, ylabel: str, color: str
    ) -> str:
        """Create a line chart and return as base64 string"""
        fig, ax = plt.subplots(figsize=(10, 5))

        dates = [item["date"] for item in timeline]
        values = [item["streams"] for item in timeline]

        ax.plot(dates, values, color=color, linewidth=2)
        ax.set_title(title, fontsize=14, fontweight='bold')
        ax.set_xlabel(xlabel)
        ax.set_ylabel(ylabel)
        ax.grid(True, alpha=0.3)

        # Format x-axis dates
        ax.xaxis.set_major_formatter(mdates.DateFormatter('%m/%d'))
        plt.xticks(rotation=45)

        plt.tight_layout()

        # Convert to base64
        buffer = BytesIO()
        plt.savefig(buffer, format='png', dpi=100, bbox_inches='tight')
        buffer.seek(0)
        image_base64 = base64.b64encode(buffer.read()).decode()
        plt.close(fig)

        return f"data:image/png;base64,{image_base64}"

    def _create_bar_chart(
        self, monthly_data: List[Dict], title: str, xlabel: str, ylabel: str, color: str
    ) -> str:
        """Create a bar chart and return as base64 string"""
        fig, ax = plt.subplots(figsize=(10, 5))

        months = [item["month"].strftime("%b") for item in monthly_data]
        values = [item["revenue"] for item in monthly_data]

        ax.bar(months, values, color=color, alpha=0.8)
        ax.set_title(title, fontsize=14, fontweight='bold')
        ax.set_xlabel(xlabel)
        ax.set_ylabel(ylabel)
        ax.grid(True, alpha=0.3, axis='y')

        plt.tight_layout()

        # Convert to base64
        buffer = BytesIO()
        plt.savefig(buffer, format='png', dpi=100, bbox_inches='tight')
        buffer.seek(0)
        image_base64 = base64.b64encode(buffer.read()).decode()
        plt.close(fig)

        return f"data:image/png;base64,{image_base64}"

    def _generate_html(self, context: Dict, template: ReportTemplate) -> str:
        """Generate HTML report from template"""
        try:
            jinja_template = self.jinja_env.get_template("default_report.html")
            html_content = jinja_template.render(**context)
            return html_content
        except Exception as e:
            logger.error(f"Error generating HTML: {e}")
            # Fallback to simple HTML
            return self._generate_fallback_html(context)

    def _generate_fallback_html(self, context: Dict) -> str:
        """Generate simple fallback HTML if template fails"""
        artist = context["artist"]
        data = context["data"]
        branding = context["branding"]

        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>{artist.name} Report</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 40px; }}
                h1 {{ color: {branding.primary_color}; }}
                .metric {{ margin: 20px 0; }}
                .metric-value {{ font-size: 32px; font-weight: bold; color: {branding.primary_color}; }}
            </style>
        </head>
        <body>
            <h1>{branding.company_name}</h1>
            <h2>{artist.name} - Performance Report</h2>
            <div class="metric">
                <div>Total Streams</div>
                <div class="metric-value">{data.get('summary', {}).get('total_streams', 0):,}</div>
            </div>
            <div class="metric">
                <div>Momentum Score</div>
                <div class="metric-value">{data.get('summary', {}).get('momentum_score', 0)}/10</div>
            </div>
            <p>Generated on {context['generated_at'].strftime('%Y-%m-%d %H:%M')}</p>
        </body>
        </html>
        """
        return html

    def _save_html(self, report_id: str, html_content: str) -> str:
        """Save HTML content to file"""
        filename = f"report_{report_id}.html"
        filepath = self.reports_dir / filename

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html_content)

        return str(filepath)

    def _generate_pdf(self, html_content: str, report_id: str) -> str:
        """Generate PDF from HTML using WeasyPrint"""
        try:
            from weasyprint import HTML

            filename = f"report_{report_id}.pdf"
            filepath = self.reports_dir / filename

            HTML(string=html_content).write_pdf(filepath)

            return str(filepath)

        except ImportError:
            logger.warning("WeasyPrint not installed, PDF generation skipped")
            # Fallback: just save HTML with .pdf extension as placeholder
            filename = f"report_{report_id}.pdf"
            filepath = self.reports_dir / filename
            with open(filepath, 'w') as f:
                f.write(f"PDF generation requires WeasyPrint. Install with: pip install weasyprint")
            return str(filepath)

    def _create_default_branding(self, user: User) -> BrandingSettings:
        """Create default branding settings for a user"""
        branding = BrandingSettings(
            user_id=user.id,
            company_name=f"{user.email.split('@')[0].title()} Management",
            primary_color="#1DB954",
            secondary_color="#191414",
            accent_color="#1ED760",
        )

        self.db.add(branding)
        self.db.commit()
        self.db.refresh(branding)

        return branding

    def _get_default_template(self, user: User) -> ReportTemplate:
        """Get or create default report template"""
        template = self.db.query(ReportTemplate).filter(
            ReportTemplate.user_id == user.id,
            ReportTemplate.is_default == True,
        ).first()

        if not template:
            template = ReportTemplate(
                user_id=user.id,
                name="Default Monthly Report",
                format=ReportFormat.PDF,
                period=ReportPeriod.MONTHLY,
                is_default=True,
            )
            self.db.add(template)
            self.db.commit()
            self.db.refresh(template)

        return template


# Singleton instance
report_generator = None

def get_report_generator(db: Session) -> ReportGenerator:
    """Get or create report generator instance"""
    return ReportGenerator(db)
