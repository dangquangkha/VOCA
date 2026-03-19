"""Service layer for account action logging and management"""
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.models.account_action import AccountAction, AccountActionType
from backend.app.models.user import User


class AccountActionService:
    """Service for managing account action audit logs"""
    
    @staticmethod
    async def log_action(
        db: AsyncSession,
        action_type: AccountActionType,
        target_user_id: int,
        admin_id: int,
        reason: str,
        notes: Optional[str] = None
    ) -> AccountAction:
        """
        Log an account moderation action.
        
        Args:
            db: Database session
            action_type: Type of action (SUSPEND, BAN, etc.)
            target_user_id: ID of user being moderated
            admin_id: ID of admin performing action
            reason: Reason for action
            notes: Optional admin notes
            
        Returns:
            Created AccountAction record
        """
        action = AccountAction(
            action_type=action_type,
            target_user_id=target_user_id,
            admin_id=admin_id,
            reason=reason,
            notes=notes
        )
        db.add(action)
        await db.flush()  # Get ID without committing
        return action
    
    @staticmethod
    async def get_user_actions(
        db: AsyncSession,
        user_id: int,
        limit: int = 50
    ) -> list[AccountAction]:
        """Get all actions performed on a specific user"""
        query = (
            select(AccountAction)
            .where(AccountAction.target_user_id == user_id)
            .order_by(AccountAction.created_at.desc())
            .limit(limit)
        )
        result = await db.execute(query)
        return list(result.scalars().all())
    
    @staticmethod
    async def get_admin_actions(
        db: AsyncSession,
        admin_id: int,
        limit: int = 50
    ) -> list[AccountAction]:
        """Get all actions performed by a specific admin"""
        query = (
            select(AccountAction)
            .where(AccountAction.admin_id == admin_id)
            .order_by(AccountAction.created_at.desc())
            .limit(limit)
        )
        result = await db.execute(query)
        return list(result.scalars().all())
    
    @staticmethod
    async def get_recent_actions(
        db: AsyncSession,
        limit: int = 100
    ) -> list[AccountAction]:
        """Get most recent moderation actions across all users"""
        query = (
            select(AccountAction)
            .order_by(AccountAction.created_at.desc())
            .limit(limit)
        )
        result = await db.execute(query)
        return list(result.scalars().all())
