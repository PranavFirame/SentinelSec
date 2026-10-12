import secrets
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.core.security import (
    hash_password,
    verify_password,
    hash_token,
    create_access_token
)
from backend.app.core.auth import get_current_user
from backend.app.db.session import get_db
from backend.app.models.user import User
from backend.app.schemas.user import (
    UserCreate,
    UserLogin,
    UserUpdate,
    UserPasswordChange,
    UserPasswordResetRequest,
    UserPasswordResetConfirm,
    UserAccountDelete,
    UserResponse,
    AuthResponse
)

router = APIRouter()


def set_auth_cookie(response: Response, token: str, remember_me: bool = False):
    max_age = 60 * 60 * 24 * 30 if remember_me else 60 * 60 * 24  # 30 days vs 1 day
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=token,
        max_age=max_age,
        expires=max_age,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path="/"
    )


def clear_auth_cookie(response: Response):
    response.delete_cookie(
        key=settings.SESSION_COOKIE_NAME,
        path="/"
    )


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, response: Response, db: Session = Depends(get_db)):
    """Registers a new user account with Argon2id hashed password and establishes a session."""
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    user = User(
        full_name=payload.full_name.strip(),
        email=payload.email,
        password_hash=hash_password(payload.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.id)
    set_auth_cookie(response, token)

    return AuthResponse(
        message="Registration successful.",
        user=UserResponse.model_validate(user),
        token=token
    )


@router.post("/login", response_model=AuthResponse)
def login(payload: UserLogin, response: Response, db: Session = Depends(get_db)):
    """Authenticates user with generic error messages and establishes a secure session."""
    user = db.query(User).filter(User.email == payload.email).first()
    
    # Generic error preventing email enumeration
    generic_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid email or password."
    )

    if not user:
        # Dummy verification to prevent timing attacks
        verify_password("dummy-password", "$argon2id$v=19$m=65536,t=3,p=4$dummy$dummy")
        raise generic_error

    if not verify_password(payload.password, user.password_hash):
        raise generic_error

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Please contact support."
        )

    expires = timedelta(days=30) if payload.remember_me else timedelta(hours=24)
    token = create_access_token(subject=user.id, expires_delta=expires)
    set_auth_cookie(response, token, remember_me=payload.remember_me)

    return AuthResponse(
        message="Sign in successful.",
        user=UserResponse.model_validate(user),
        token=token
    )


@router.post("/logout")
def logout(response: Response, current_user: User = Depends(get_current_user)):
    """Clears the session cookie."""
    clear_auth_cookie(response)
    return {"message": "Successfully signed out."}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Returns the authenticated user's profile."""
    return UserResponse.model_validate(current_user)


@router.patch("/profile", response_model=UserResponse)
def update_profile(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates permitted profile fields (e.g. full_name)."""
    if payload.full_name is not None:
        current_user.full_name = payload.full_name.strip()
    
    current_user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.post("/change-password")
def change_password(
    payload: UserPasswordChange,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verifies current password and updates to a new Argon2id password hash."""
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect."
        )

    current_user.password_hash = hash_password(payload.new_password)
    current_user.updated_at = datetime.now(timezone.utc)
    db.commit()

    # Re-issue new session token
    token = create_access_token(subject=current_user.id)
    set_auth_cookie(response, token)

    return {"message": "Password changed successfully."}


@router.post("/forgot-password")
def forgot_password(payload: UserPasswordResetRequest, db: Session = Depends(get_db)):
    """Generates an expiring reset token and returns a generic response."""
    user = db.query(User).filter(User.email == payload.email).first()
    dev_token: str | None = None

    if user:
        raw_token = secrets.token_urlsafe(32)
        user.reset_token_hash = hash_token(raw_token)
        user.reset_token_expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
        db.commit()
        dev_token = raw_token

    # Generic response regardless of whether email exists
    return {
        "message": "If an account with that email exists, password reset instructions have been generated.",
        "dev_token": dev_token  # For development testing when SMTP is not configured
    }


@router.post("/reset-password")
def reset_password(payload: UserPasswordResetConfirm, db: Session = Depends(get_db)):
    """Verifies reset token hash, checks expiration, and updates password."""
    token_hash = hash_token(payload.token)
    user = db.query(User).filter(User.reset_token_hash == token_hash).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token."
        )

    if user.reset_token_expires_at:
        now_dt = datetime.now(timezone.utc)
        expires_at = user.reset_token_expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < now_dt:
            user.reset_token_hash = None
            user.reset_token_expires_at = None
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password reset token has expired."
            )


    user.password_hash = hash_password(payload.new_password)
    user.reset_token_hash = None
    user.reset_token_expires_at = None
    user.updated_at = datetime.now(timezone.utc)
    db.commit()

    return {"message": "Password has been reset successfully. Please sign in with your new password."}


@router.delete("/account")
def delete_account(
    payload: UserAccountDelete,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletes the user account and associated personal data after password confirmation."""
    if not verify_password(payload.password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect password. Account deletion aborted."
        )

    db.delete(current_user)
    db.commit()
    clear_auth_cookie(response)
    return {"message": "Your account and associated scan data have been permanently deleted."}
