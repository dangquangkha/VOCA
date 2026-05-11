from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Optional, List
from .models import User, UserStatus, UserRole
from backend.app.core import security

class IdentityService:
    @staticmethod
    async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
        result = await db.execute(select(User).where(User.email == email))
        return result.scalars().first()

    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: int) -> Optional[User]:
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalars().first()

    @staticmethod
    async def create_user(db: AsyncSession, user_in: dict) -> User:
        user = User(**user_in)
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    async def update_user_status(db: AsyncSession, user_id: int, status: UserStatus) -> Optional[User]:
        user = await IdentityService.get_user_by_id(db, user_id)
        if user:
            user.account_status = status
            db.add(user)
            await db.commit()
            await db.refresh(user)
        return user

identity_service = IdentityService()
