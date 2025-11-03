"""Tests for authentication endpoints"""
import pytest
from app.models.user import User


class TestRegister:
    """Test user registration"""

    def test_register_success(self, client, test_user_data):
        """Test successful user registration"""
        response = client.post("/api/auth/register", json=test_user_data)

        assert response.status_code == 201
        data = response.json()
        assert data["email"] == test_user_data["email"]
        assert "id" in data
        assert data["subscription_tier"] == "solo"

    def test_register_duplicate_email(self, client, create_test_user, test_user_data):
        """Test registration with existing email"""
        # Create first user
        create_test_user(email=test_user_data["email"])

        # Try to register with same email
        response = client.post("/api/auth/register", json=test_user_data)

        assert response.status_code == 400
        assert response.json()["detail"] == "Email already registered"

    def test_register_invalid_email(self, client):
        """Test registration with invalid email"""
        response = client.post("/api/auth/register", json={
            "email": "not-an-email",
            "password": "TestPassword123!"
        })

        assert response.status_code == 422

    def test_register_missing_fields(self, client):
        """Test registration with missing fields"""
        response = client.post("/api/auth/register", json={"email": "test@example.com"})

        assert response.status_code == 422


class TestLogin:
    """Test user login"""

    def test_login_success(self, client, create_test_user):
        """Test successful login"""
        # Create user
        email = "test@example.com"
        password = "TestPassword123!"
        create_test_user(email=email, password=password)

        # Login
        response = client.post("/api/auth/login", data={
            "username": email,
            "password": password
        })

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client, create_test_user):
        """Test login with wrong password"""
        # Create user
        create_test_user(email="test@example.com", password="CorrectPassword")

        # Try login with wrong password
        response = client.post("/api/auth/login", data={
            "username": "test@example.com",
            "password": "WrongPassword"
        })

        assert response.status_code == 401
        assert response.json()["detail"] == "Incorrect email or password"

    def test_login_nonexistent_user(self, client):
        """Test login with non-existent user"""
        response = client.post("/api/auth/login", data={
            "username": "nonexistent@example.com",
            "password": "SomePassword"
        })

        assert response.status_code == 401


class TestGetCurrentUser:
    """Test getting current user"""

    def test_get_current_user_success(self, client, create_test_user):
        """Test getting current user with valid token"""
        # Create and login user
        email = "test@example.com"
        password = "TestPassword123!"
        create_test_user(email=email, password=password)

        login_response = client.post("/api/auth/login", data={
            "username": email,
            "password": password
        })
        token = login_response.json()["access_token"]

        # Get current user
        response = client.get("/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == email

    def test_get_current_user_no_token(self, client):
        """Test getting current user without token"""
        response = client.get("/api/auth/me")

        assert response.status_code == 401

    def test_get_current_user_invalid_token(self, client):
        """Test getting current user with invalid token"""
        response = client.get("/api/auth/me", headers={
            "Authorization": "Bearer invalid_token"
        })

        assert response.status_code == 401


class TestPasswordReset:
    """Test password reset functionality"""

    def test_forgot_password_existing_user(self, client, create_test_user):
        """Test forgot password for existing user"""
        email = "test@example.com"
        create_test_user(email=email)

        response = client.post("/api/auth/forgot-password", json={
            "email": email
        })

        assert response.status_code == 200
        assert "password reset link" in response.json()["message"]

    def test_forgot_password_nonexistent_user(self, client):
        """Test forgot password for non-existent user"""
        response = client.post("/api/auth/forgot-password", json={
            "email": "nonexistent@example.com"
        })

        # Should return success to prevent user enumeration
        assert response.status_code == 200

    def test_reset_password_success(self, client, create_test_user, test_db):
        """Test successful password reset"""
        from app.utils.tokens import generate_reset_token, get_reset_token_expiry

        # Create user with reset token
        user = create_test_user(email="test@example.com")
        reset_token = generate_reset_token()
        user.reset_token = reset_token
        user.reset_token_expires_at = get_reset_token_expiry()
        test_db.commit()

        # Reset password
        new_password = "NewPassword123!"
        response = client.post("/api/auth/reset-password", json={
            "token": reset_token,
            "new_password": new_password
        })

        assert response.status_code == 200
        assert "successfully" in response.json()["message"]

        # Verify can login with new password
        login_response = client.post("/api/auth/login", data={
            "username": "test@example.com",
            "password": new_password
        })
        assert login_response.status_code == 200

    def test_reset_password_invalid_token(self, client):
        """Test password reset with invalid token"""
        response = client.post("/api/auth/reset-password", json={
            "token": "invalid_token",
            "new_password": "NewPassword123!"
        })

        assert response.status_code == 400

    def test_reset_password_expired_token(self, client, create_test_user, test_db):
        """Test password reset with expired token"""
        from datetime import datetime, timedelta

        # Create user with expired reset token
        user = create_test_user(email="test@example.com")
        user.reset_token = "expired_token"
        user.reset_token_expires_at = datetime.utcnow() - timedelta(hours=2)
        test_db.commit()

        response = client.post("/api/auth/reset-password", json={
            "token": "expired_token",
            "new_password": "NewPassword123!"
        })

        assert response.status_code == 400


class TestEmailVerification:
    """Test email verification"""

    def test_verify_email_success(self, client, create_test_user, test_db):
        """Test successful email verification"""
        from app.utils.tokens import generate_verification_token

        # Create unverified user
        user = create_test_user(email="test@example.com", verified=False)
        token = generate_verification_token()
        user.verification_token = token
        test_db.commit()

        # Verify email
        response = client.post(f"/api/auth/verify-email?token={token}")

        assert response.status_code == 200
        assert "successfully" in response.json()["message"]

        # Check user is verified
        test_db.refresh(user)
        assert user.is_verified is True

    def test_verify_email_invalid_token(self, client):
        """Test email verification with invalid token"""
        response = client.post("/api/auth/verify-email?token=invalid_token")

        assert response.status_code == 400

    def test_verify_email_already_verified(self, client, create_test_user, test_db):
        """Test verifying already verified email"""
        from app.utils.tokens import generate_verification_token

        # Create verified user
        user = create_test_user(email="test@example.com", verified=True)
        token = generate_verification_token()
        user.verification_token = token
        test_db.commit()

        # Try to verify again
        response = client.post(f"/api/auth/verify-email?token={token}")

        assert response.status_code == 200
        assert "already verified" in response.json()["message"]

    def test_resend_verification(self, client, create_test_user):
        """Test resending verification email"""
        create_test_user(email="test@example.com", verified=False)

        response = client.post("/api/auth/resend-verification", json={
            "email": "test@example.com"
        })

        assert response.status_code == 200
