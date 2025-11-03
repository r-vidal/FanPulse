"""API Key Authentication and Rate Limiting Middleware"""
import time
import logging
from typing import Callable, Optional
from fastapi import Request, Response, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.api_key_manager import api_key_manager
from app.models.api_key import APIKey

logger = logging.getLogger(__name__)


class APIKeyAuthMiddleware(BaseHTTPMiddleware):
    """
    Middleware for API key authentication and rate limiting

    Checks for API key in request headers, validates it,
    enforces rate limits, and logs usage.

    Only applied to /api/v1/* routes (external API access).
    Internal routes (/api/*) use JWT authentication.
    """

    # Routes that require API key authentication
    API_KEY_PREFIX = "/api/v1"

    # Public routes that don't require auth (even under /api/v1)
    PUBLIC_ROUTES = [
        "/api/v1/docs",
        "/api/v1/redoc",
        "/api/v1/openapi.json",
    ]

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request through middleware"""

        # Skip API key check for non-API routes
        if not request.url.path.startswith(self.API_KEY_PREFIX):
            return await call_next(request)

        # Skip public routes
        if request.url.path in self.PUBLIC_ROUTES:
            return await call_next(request)

        # Start timing for performance tracking
        start_time = time.time()

        # Get database session
        db: Session = next(get_db())

        try:
            # Extract API key from header
            api_key_header = request.headers.get("X-API-Key") or request.headers.get("Authorization")

            if not api_key_header:
                return self._error_response(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    message="API key required. Provide via X-API-Key header.",
                    error_code="missing_api_key",
                )

            # Handle "Bearer <key>" format
            api_key = api_key_header.replace("Bearer ", "").strip()

            # Validate API key
            api_key_obj = api_key_manager.validate_key(db, api_key)

            if not api_key_obj:
                return self._error_response(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    message="Invalid or expired API key",
                    error_code="invalid_api_key",
                )

            # Check rate limit
            allowed, rate_limit_info = api_key_manager.check_rate_limit(db, api_key_obj)

            if not allowed:
                # Log rate limit hit
                response_time_ms = int((time.time() - start_time) * 1000)
                api_key_manager.log_request(
                    db=db,
                    api_key_id=str(api_key_obj.id),
                    endpoint=request.url.path,
                    method=request.method,
                    status_code=429,
                    response_time_ms=response_time_ms,
                    ip_address=request.client.host if request.client else None,
                    user_agent=request.headers.get("User-Agent"),
                )

                return self._rate_limit_error(rate_limit_info)

            # Increment usage counter
            api_key_manager.increment_usage(db, api_key_obj)

            # Add API key to request state for route access
            request.state.api_key = api_key_obj
            request.state.user_id = str(api_key_obj.user_id)

            # Process request
            response = await call_next(request)

            # Add rate limit headers
            response.headers["X-RateLimit-Limit"] = str(rate_limit_info["limit"])
            response.headers["X-RateLimit-Remaining"] = str(rate_limit_info["remaining"])
            response.headers["X-RateLimit-Reset"] = str(rate_limit_info["reset"])

            # Log successful request
            response_time_ms = int((time.time() - start_time) * 1000)
            api_key_manager.log_request(
                db=db,
                api_key_id=str(api_key_obj.id),
                endpoint=request.url.path,
                method=request.method,
                status_code=response.status_code,
                response_time_ms=response_time_ms,
                ip_address=request.client.host if request.client else None,
                user_agent=request.headers.get("User-Agent"),
            )

            return response

        except HTTPException as e:
            # Re-raise HTTP exceptions
            raise e
        except Exception as e:
            logger.error(f"Error in API key middleware: {e}")
            return self._error_response(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Internal server error",
                error_code="internal_error",
            )
        finally:
            db.close()

    def _error_response(self, status_code: int, message: str, error_code: str) -> JSONResponse:
        """Generate error response"""
        return JSONResponse(
            status_code=status_code,
            content={
                "error": {
                    "code": error_code,
                    "message": message,
                }
            },
        )

    def _rate_limit_error(self, rate_limit_info: dict) -> JSONResponse:
        """Generate rate limit error response"""
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "error": {
                    "code": "rate_limit_exceeded",
                    "message": f"Rate limit exceeded. Limit: {rate_limit_info['limit']} requests/hour. "
                              f"Try again in {rate_limit_info['reset_in_seconds']} seconds.",
                }
            },
            headers={
                "X-RateLimit-Limit": str(rate_limit_info["limit"]),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(rate_limit_info["reset"]),
                "Retry-After": str(rate_limit_info["reset_in_seconds"]),
            },
        )


def require_api_key(request: Request) -> APIKey:
    """
    Dependency to require API key authentication in routes

    Usage:
        @router.get("/endpoint")
        async def endpoint(api_key: APIKey = Depends(require_api_key)):
            # Access api_key.user_id, etc.
    """
    if not hasattr(request.state, "api_key"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key required",
        )

    return request.state.api_key


def get_current_api_user_id(request: Request) -> str:
    """
    Dependency to get current user ID from API key

    Usage:
        @router.get("/endpoint")
        async def endpoint(user_id: str = Depends(get_current_api_user_id)):
            # Use user_id
    """
    if not hasattr(request.state, "user_id"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key required",
        )

    return request.state.user_id
