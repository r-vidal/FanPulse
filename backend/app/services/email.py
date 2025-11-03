"""Email service for sending notifications"""
import logging
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Email service for sending emails via SendGrid or SMTP"""

    def __init__(self):
        self.from_email = settings.FROM_EMAIL
        self.sendgrid_api_key = settings.SENDGRID_API_KEY

    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """
        Send an email

        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML content of the email
            text_content: Plain text content (optional)

        Returns:
            True if email was sent successfully, False otherwise
        """
        # For development, we'll just log the email
        # In production, integrate with SendGrid or SMTP
        logger.info(f"Sending email to {to_email}")
        logger.info(f"Subject: {subject}")
        logger.info(f"Content: {html_content}")

        # TODO: Integrate with SendGrid
        # if self.sendgrid_api_key:
        #     from sendgrid import SendGridAPIClient
        #     from sendgrid.helpers.mail import Mail
        #     message = Mail(
        #         from_email=self.from_email,
        #         to_emails=to_email,
        #         subject=subject,
        #         html_content=html_content
        #     )
        #     try:
        #         sg = SendGridAPIClient(self.sendgrid_api_key)
        #         response = sg.send(message)
        #         return response.status_code == 202
        #     except Exception as e:
        #         logger.error(f"Error sending email: {e}")
        #         return False

        return True

    async def send_password_reset_email(
        self,
        to_email: str,
        reset_token: str,
        frontend_url: str = "http://localhost:3000"
    ) -> bool:
        """
        Send password reset email

        Args:
            to_email: User email address
            reset_token: Password reset token
            frontend_url: Frontend URL for reset link

        Returns:
            True if email was sent successfully
        """
        reset_link = f"{frontend_url}/reset-password?token={reset_token}"

        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Password Reset Request</h2>
                <p>You requested to reset your password for your FanPulse account.</p>
                <p>Click the link below to reset your password:</p>
                <p>
                    <a href="{reset_link}"
                       style="background-color: #3B82F6; color: white; padding: 12px 24px;
                              text-decoration: none; border-radius: 6px; display: inline-block;">
                        Reset Password
                    </a>
                </p>
                <p>Or copy and paste this link into your browser:</p>
                <p style="color: #6B7280; word-break: break-all;">{reset_link}</p>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, please ignore this email.</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #E5E7EB;">
                <p style="color: #6B7280; font-size: 12px;">
                    FanPulse - Music Analytics for Managers
                </p>
            </body>
        </html>
        """

        return await self.send_email(
            to_email=to_email,
            subject="Password Reset - FanPulse",
            html_content=html_content
        )

    async def send_verification_email(
        self,
        to_email: str,
        verification_token: str,
        frontend_url: str = "http://localhost:3000"
    ) -> bool:
        """
        Send email verification email

        Args:
            to_email: User email address
            verification_token: Email verification token
            frontend_url: Frontend URL for verification link

        Returns:
            True if email was sent successfully
        """
        verification_link = f"{frontend_url}/verify-email?token={verification_token}"

        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Welcome to FanPulse!</h2>
                <p>Thank you for signing up. Please verify your email address to get started.</p>
                <p>
                    <a href="{verification_link}"
                       style="background-color: #3B82F6; color: white; padding: 12px 24px;
                              text-decoration: none; border-radius: 6px; display: inline-block;">
                        Verify Email
                    </a>
                </p>
                <p>Or copy and paste this link into your browser:</p>
                <p style="color: #6B7280; word-break: break-all;">{verification_link}</p>
                <p>This link will expire in 24 hours.</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #E5E7EB;">
                <p style="color: #6B7280; font-size: 12px;">
                    FanPulse - Music Analytics for Managers
                </p>
            </body>
        </html>
        """

        return await self.send_email(
            to_email=to_email,
            subject="Verify Your Email - FanPulse",
            html_content=html_content
        )


# Singleton instance
email_service = EmailService()
