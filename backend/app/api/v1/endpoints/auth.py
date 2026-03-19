from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.api import deps
from backend.app.core import security
from backend.app.core.config import settings
from backend.app.core.email import send_email
from backend.app.models.user import User, UserRole
from backend.app.models.expert import ExpertProfile, KYCStatus
from backend.app.schemas.user import Token, UserCreate, User as UserSchema, PasswordResetRequest, PasswordResetConfirm
from jose import jwt
from backend.app.schemas.token import GoogleLoginRequest

router = APIRouter()

@router.post("/google", response_model=Token)
async def google_login(
    login_in: GoogleLoginRequest,
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    """
    Google Login (Mock).
    Accepts `id_token`. If it starts with `mock_google_`, accepts it.
    """
    # 1. Verify Token (Mock)
    if not login_in.id_token.startswith("mock_google_"):
        raise HTTPException(status_code=400, detail="Invalid Google Token (Use 'mock_google_...')")
    
    # Extract email from mock token (format: mock_google_EMAIL)
    # If just "mock_google_", generate random
    parts = login_in.id_token.split("_", 2)
    if len(parts) >= 3 and "@" in parts[2]:
        email = parts[2]
    else:
        email = "google_user@gmail.com"
        
    # 2. Check if user exists
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    
    if not user:
        # Register new user
        user = User(
            email=email,
            hashed_password=security.get_password_hash("google_auth_random_pass"), # Random password
            full_name="Google User",
            role="STUDENT",
            is_active=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    # 3. Create Token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.email, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.post("/password-recovery")
async def recover_password(
    email_in: PasswordResetRequest,
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    """
    Password Recovery (Mock Email).
    """
    result = await db.execute(select(User).where(User.email == email_in.email))
    user = result.scalars().first()
    
    if not user:
        # Avoid user enumeration, return OK even if user doesn't exist
        return {"msg": "If the email exists, a recovery link has been sent."}

    # Generate recovery token
    password_reset_token = security.create_access_token(
        subject=user.email, expires_delta=timedelta(minutes=10)
    )
    
    # Mock sending email (via service)
    await send_email(
        to=user.email,
        subject="Password Recovery",
        body=f"Your recovery token is: {password_reset_token}",
        db=db
    )
    
    return {"msg": "Password recovery email sent"}

@router.post("/reset-password")
async def reset_password(
    token_in: PasswordResetConfirm,
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    """
    Reset password using token.
    """
    try:
        payload = jwt.decode(
            token_in.token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        email: str = payload.get("sub")
        if email is None:
             raise HTTPException(status_code=400, detail="Invalid token")
    except (jwt.JWTError):
        raise HTTPException(status_code=400, detail="Invalid or expired token")
        
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Update password
    user.hashed_password = security.get_password_hash(token_in.new_password)
    db.add(user)
    await db.commit()
    
    return {"msg": "Password updated successfully"}

@router.post("/login/access-token", response_model=Token)
async def login_access_token(
    db: AsyncSession = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    from backend.app.models.user import UserStatus
    
    # Authenticate via Email
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalars().first()
    
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    # Check account status (BR-22, BR-24)
    if user.account_status == UserStatus.BANNED:
        raise HTTPException(
            status_code=403, 
            detail="Your account has been permanently banned due to violation of Community Standards. Please contact support if you believe this is an error."
        )
    
    if user.account_status == UserStatus.SUSPENDED:
        raise HTTPException(
            status_code=403,
            detail="Your account has been temporarily suspended. Please contact admin@careerpath.com to appeal."
        )
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.email, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.post("/register", response_model=UserSchema)
async def register_user(
    *,
    db: AsyncSession = Depends(deps.get_db),
    user_in: UserCreate,
) -> Any:
    """
    Create new user without the need to be logged in
    """
    # BR-26: Check if email or phone is blacklisted
    from backend.app.models.blacklist import Blacklist
    from sqlalchemy import or_
    
    blacklist_query = select(Blacklist).where(
        or_(
            Blacklist.email == user_in.email,
            Blacklist.phone_number == user_in.phone_number if user_in.phone_number else None
        )
    )
    blacklist_result = await db.execute(blacklist_query)
    blacklisted = blacklist_result.scalars().first()
    
    if blacklisted:
        raise HTTPException(
            status_code=403,
            detail="This email or phone number is blacklisted and cannot be used for registration"
        )
    
    result = await db.execute(select(User).where(User.email == user_in.email))
    user = result.scalars().first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system",
        )
    
    user = User(
        email=user_in.email,
        hashed_password=security.get_password_hash(user_in.password),
        full_name=user_in.full_name,
        phone_number=user_in.phone_number,
        role=user_in.role,
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Auto-create Expert Profile if role is EXPERT
    if user.role == UserRole.EXPERT:
        expert_profile = ExpertProfile(
            user_id=user.id,
            kyc_status=KYCStatus.PENDING
        )
        db.add(expert_profile)
        await db.commit()
    
    # Reload user with options to ensure expert_profile is loaded (avoids MissingGreenlet)
    # This is needed because the Response Model 'User' includes 'expert_profile'
    from sqlalchemy.orm import selectinload
    query = select(User).where(User.id == user.id).options(selectinload(User.expert_profile))
    result = await db.execute(query)
    user = result.scalars().first()

    return user
