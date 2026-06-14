from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import logging

from backend.app.core.config import settings
from backend.app.core import security
from backend.app.db.session import AsyncSessionLocal
from backend.app.domains.identity.models import User
from backend.app.schemas.user import TokenData

logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"/api/v1/auth/login/access-token")




async def get_db() -> Generator:
    async with AsyncSessionLocal() as session:
        yield session

from fastapi import WebSocket, Query

async def verify_supabase_token(token: str) -> dict:
    """
    Decodes and validates a Supabase JWT token either locally using JWT secret
    or remotely via Supabase auth API endpoint.
    """
    import httpx
    # 1. Try local decoding if JWT Secret is configured
    if settings.SUPABASE_JWT_SECRET and settings.SUPABASE_JWT_SECRET not in ("your_supabase_jwt_secret_here", "placeholder", ""):
        try:
            # Supabase tokens typically use HS256 and have aud="authenticated"
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated"
            )
            return payload
        except JWTError as e:
            logger.warning("Local JWT decode failed, falling back to remote: %s", e)
            
    # 2. Fallback to remote API verification
    if not settings.SUPABASE_URL or settings.SUPABASE_ANON_KEY in ("your_supabase_anon_key_here", "placeholder", ""):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Supabase credentials are not configured on the backend.",
        )
        
    url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/user"
    headers = {
        "Authorization": f"Bearer {token}",
        "apikey": settings.SUPABASE_ANON_KEY
    }
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, timeout=10.0)
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired Supabase token",
                )
            user_data = response.json()
            return {
                "email": user_data.get("email"),
                "sub": user_data.get("id"),
                "user_metadata": user_data.get("user_metadata", {})
            }
        except httpx.RequestError as exc:
            logger.error("Failed to connect to Supabase Auth API: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Could not reach authentication server",
            )

async def get_or_create_user_from_payload(payload: dict, db: AsyncSession) -> User:
    """
    Retrieves or JIT provisions a user inside the local DB from their verified token payload.
    Supports user metadata like role, phone number, full name, and auto-provisions expert profile.
    """
    email = payload.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token does not contain email claim",
        )
        
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(User).where(User.email == email)
        .options(selectinload(User.expert_profile))
    )
    user = result.scalars().first()
    
    if user is None:
        logger.info("User %s not found in database. Creating JIT...", email)
        user_metadata = payload.get("user_metadata", {}) or {}
        full_name = user_metadata.get("full_name") or email.split("@")[0]
        avatar_url = user_metadata.get("avatar_url")
        phone_number = user_metadata.get("phone_number")
        
        from backend.app.domains.identity.models import UserRole, UserStatus
        role_str = str(user_metadata.get("role", "STUDENT")).upper()
        if role_str not in UserRole.__members__:
            role = UserRole.STUDENT
        else:
            role = UserRole[role_str]
            
        user = User(
            email=email,
            full_name=full_name,
            avatar_url=avatar_url,
            phone_number=phone_number,
            role=role,
            account_status=UserStatus.ACTIVE,
            credits=0,
            is_active=True,
            is_superuser=False,
            hashed_password=None
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
        # Auto-create Expert Profile if role is EXPERT or MENTOR
        if user.role in [UserRole.EXPERT, UserRole.MENTOR]:
            from backend.app.domains.marketplace.models import ExpertProfile, KYCStatus
            expert_profile = ExpertProfile(
                user_id=user.id,
                kyc_status=KYCStatus.APPROVED if user.role == UserRole.MENTOR else KYCStatus.PENDING
            )
            db.add(expert_profile)
            await db.commit()
            
            # Re-fetch user to load the expert_profile relation
            result = await db.execute(
                select(User).where(User.id == user.id)
                .options(selectinload(User.expert_profile))
            )
            user = result.scalars().first()
        
    return user

async def get_current_user_ws(
    websocket: WebSocket,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Authenticate WebSocket connection via Query param token.
    """
    try:
        payload = await verify_supabase_token(token)
        user = await get_or_create_user_from_payload(payload, db)
        return user
    except Exception as e:
        logger.warning("WS auth failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    """
    Get current user from Supabase JWT token.
    """
    payload = await verify_supabase_token(token)
    user = await get_or_create_user_from_payload(payload, db)
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Get current active user.
    """
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

async def get_current_user_optional(
    db: AsyncSession = Depends(get_db),
    token: Optional[str] = Depends(OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login/access-token", auto_error=False)),
) -> Optional[User]:
    """
    Get current user from JWT token if provided, otherwise return None.
    """
    if not token:
        return None
    try:
        payload = await verify_supabase_token(token)
        user = await get_or_create_user_from_payload(payload, db)
        return user
    except Exception:
        return None


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
