from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from uuid import UUID
from app.core.database import get_db
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
)
from app.core.config import settings
from app.models.user import User
from app.services.email import email_service
from app.utils.tokens import (
    generate_reset_token,
    generate_verification_token,
    get_reset_token_expiry,
    is_token_expired,
)
from app.api.deps import get_current_user
from pydantic import BaseModel, EmailStr, field_serializer, ConfigDict

router = APIRouter()


class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    subscription_tier: str
    is_verified: bool
    created_at: str

    @field_serializer('id')
    def serialize_id(self, value: UUID) -> str:
        return str(value)

    @field_serializer('created_at')
    def serialize_created_at(self, value) -> str:
        return value.isoformat() if value else ''


class Token(BaseModel):
    access_token: str
    token_type: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class MessageResponse(BaseModel):
    message: str


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user with verification token
    hashed_password = get_password_hash(user_data.password)
    verification_token = generate_verification_token()

    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        verification_token=verification_token
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Send verification email
    await email_service.send_verification_email(
        to_email=new_user.email,
        verification_token=verification_token
    )

    return new_user


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login and get access token"""
    # Find user
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user)
):
    """Get current authenticated user"""
    return current_user


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    """Request password reset email"""
    user = db.query(User).filter(User.email == request.email).first()

    # Always return success to prevent user enumeration
    if not user:
        return {"message": "If the email exists, a password reset link has been sent"}

    # Generate reset token
    reset_token = generate_reset_token()
    user.reset_token = reset_token
    user.reset_token_expires_at = get_reset_token_expiry()

    db.commit()

    # Send password reset email
    await email_service.send_password_reset_email(
        to_email=user.email,
        reset_token=reset_token
    )

    return {"message": "If the email exists, a password reset link has been sent"}


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """Reset password with token"""
    user = db.query(User).filter(User.reset_token == request.token).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )

    # Check if token is expired
    if is_token_expired(user.reset_token_expires_at):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )

    # Update password
    user.hashed_password = get_password_hash(request.new_password)
    user.reset_token = None
    user.reset_token_expires_at = None

    db.commit()

    return {"message": "Password has been reset successfully"}


@router.post("/verify-email", response_model=MessageResponse)
async def verify_email(
    token: str,
    db: Session = Depends(get_db)
):
    """Verify user email with token"""
    user = db.query(User).filter(User.verification_token == token).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification token"
        )

    if user.is_verified:
        return {"message": "Email already verified"}

    # Mark user as verified
    user.is_verified = True
    user.verification_token = None

    db.commit()

    return {"message": "Email verified successfully"}


@router.post("/resend-verification", response_model=MessageResponse)
async def resend_verification(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    """Resend email verification"""
    user = db.query(User).filter(User.email == request.email).first()

    if not user:
        # Don't reveal if user exists
        return {"message": "If the email exists, a verification link has been sent"}

    if user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already verified"
        )

    # Generate new verification token
    verification_token = generate_verification_token()
    user.verification_token = verification_token

    db.commit()

    # Send verification email
    await email_service.send_verification_email(
        to_email=user.email,
        verification_token=verification_token
    )

    return {"message": "If the email exists, a verification link has been sent"}
