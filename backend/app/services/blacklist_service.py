"""Service layer for blacklist management"""
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.models.blacklist import Blacklist


class BlacklistService:
    """Service for managing user blacklist"""
    
    @staticmethod
    async def add_to_blacklist(
        db: AsyncSession,
        email: str,
        phone_number: Optional[str],
        reason: str,
        banned_user_id: int
    ) -> Blacklist:
        """
        Add email/phone to blacklist.
        
        Args:
            db: Database session
            email: Email to blacklist
            phone_number: Phone number to blacklist (optional)
            reason: Reason for ban
            banned_user_id: ID of banned user
            
        Returns:
            Created Blacklist record
        """
        entry = Blacklist(
            email=email,
            phone_number=phone_number,
            reason=reason,
            banned_user_id=banned_user_id
        )
        db.add(entry)
        await db.flush()
        return entry
    
    @staticmethod
    async def remove_from_blacklist(
        db: AsyncSession,
        user_id: int
    ) -> int:
        """
        Remove all blacklist entries for a user.
        
        Args:
            db: Database session
            user_id: ID of user to unban
            
        Returns:
            Number of entries removed
        """
        query = select(Blacklist).where(Blacklist.banned_user_id == user_id)
        result = await db.execute(query)
        entries = result.scalars().all()
        
        count = 0
        for entry in entries:
            await db.delete(entry)
            count += 1
        
        return count
    
    @staticmethod
    async def is_blacklisted(
        db: AsyncSession,
        email: Optional[str] = None,
        phone_number: Optional[str] = None
    ) -> bool:
        """
        Check if email or phone is blacklisted.
        
        Args:
            db: Database session
            email: Email to check
            phone_number: Phone to check
            
        Returns:
            True if blacklisted, False otherwise
        """
        if not email and not phone_number:
            return False
        
        from sqlalchemy import or_
        
        conditions = []
        if email:
            conditions.append(Blacklist.email == email)
        if phone_number:
            conditions.append(Blacklist.phone_number == phone_number)
        
        query = select(Blacklist).where(or_(*conditions))
        result = await db.execute(query)
        entry = result.scalars().first()
        
        return entry is not None
    
    @staticmethod
    async def get_blacklist_entry(
        db: AsyncSession,
        email: Optional[str] = None,
        phone_number: Optional[str] = None
    ) -> Optional[Blacklist]:
        """Get blacklist entry if exists"""
        if not email and not phone_number:
            return None
        
        from sqlalchemy import or_
        
        conditions = []
        if email:
            conditions.append(Blacklist.email == email)
        if phone_number:
            conditions.append(Blacklist.phone_number == phone_number)
        
        query = select(Blacklist).where(or_(*conditions))
        result = await db.execute(query)
        return result.scalars().first()
