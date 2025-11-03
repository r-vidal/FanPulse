"""Token generation utilities"""
import secrets
from datetime import datetime, timedelta


def generate_reset_token() -> str:
    """
    Generate a secure random token for password reset

    Returns:
        A secure random token string
    """
    return secrets.token_urlsafe(32)


def generate_verification_token() -> str:
    """
    Generate a secure random token for email verification

    Returns:
        A secure random token string
    """
    return secrets.token_urlsafe(32)


def get_reset_token_expiry() -> datetime:
    """
    Get the expiry time for a password reset token (1 hour from now)

    Returns:
        DateTime object representing token expiry
    """
    return datetime.utcnow() + timedelta(hours=1)


def get_verification_token_expiry() -> datetime:
    """
    Get the expiry time for an email verification token (24 hours from now)

    Returns:
        DateTime object representing token expiry
    """
    return datetime.utcnow() + timedelta(hours=24)


def is_token_expired(expires_at: datetime) -> bool:
    """
    Check if a token has expired

    Args:
        expires_at: Token expiry datetime

    Returns:
        True if token is expired, False otherwise
    """
    if not expires_at:
        return True
    return datetime.utcnow() > expires_at
