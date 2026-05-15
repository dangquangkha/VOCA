from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.core.config import settings
from backend.app.core import security
from backend.app.db.session import AsyncSessionLocal
from backend.app.domains.identity.models import User
from backend.app.schemas.user import TokenData

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"/api/v1/auth/login/access-token")




async def get_db() -> Generator:
    async with AsyncSessionLocal() as session:
        yield session

from fastapi import WebSocket, Query

async def get_current_user_ws(
    websocket: WebSocket,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Authenticate WebSocket connection via Query param token.
    """
    print(f"📡 [WS AUTH] Starting validation for token: {token[:10]}...")
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        
        if email is None:
            print(f"❌ [WS AUTH] Token payload missing 'sub'")
            raise credentials_exception
        token_data = TokenData(email=email)
    except (JWTError, ValidationError) as e:
        print(f"❌ [WS AUTH] JWT decode error: {e}")
        raise credentials_exception
        
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(User).where(User.email == token_data.email)
        .options(selectinload(User.expert_profile))
    )
    user = result.scalar_one_or_none()
    
    if user is None:
        print(f"❌ [WS AUTH] User not found for email: {token_data.email}")
        raise credentials_exception
        
    print(f"✅ [WS AUTH] Success for user: {user.email}")
    return user

async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    """
    Get current user from JWT token.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except (JWTError, ValidationError):
        raise credentials_exception
    
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(User).where(User.email == token_data.email)
        .options(selectinload(User.expert_profile))
    )
    user = result.scalars().first()
    
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Get current active user.
    """
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    # TEST ACCOUNT: Auto-refill credits for thanh@email.com (Optimized)
    # Only update if credits are actually low, and avoid commit/refresh inside dependency if possible
    # or at least make it efficient.
    if current_user.email == "thanh@email.com" and current_user.credits < 1000:
        current_user.credits = 999999
        db.add(current_user)
        try:
            await db.commit()
            print(f"🔋 Auto-refilled credits for test account: {current_user.email}")
        except Exception as e:
            await db.rollback()
            print(f"⚠️ Failed to auto-refill credits: {e}")
    
    return current_user


async def get_current_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Get current superuser (admin only).
    Accepts users with is_superuser=True OR role=ADMIN.
    """
    from backend.app.domains.identity.models import UserRole
    is_admin = current_user.is_superuser or current_user.role == UserRole.ADMIN
    if not is_admin:
        raise HTTPException(
            status_code=403,
            detail="The user doesn't have enough privileges"
        )
    return current_user
