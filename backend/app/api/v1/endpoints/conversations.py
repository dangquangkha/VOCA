from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, and_, desc, distinct, union_all
from sqlalchemy.orm import selectinload

from backend.app.api import deps
from backend.app.models.user import User
from backend.app.models.chat import Message
from backend.app.schemas.user import User as UserSchema

router = APIRouter()

@router.get("/conversations", response_model=List[UserSchema])
async def get_my_conversations(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get list of all users the current user has had conversations with.
    Returns unique list of users from message history (sent or received).
    """
    # Get distinct user IDs from messages where I'm either sender or receiver
    # Subquery for users I sent messages to
    sent_to = select(Message.receiver_id).where(Message.sender_id == current_user.id).distinct()
    
    # Subquery for users who sent messages to me
    received_from = select(Message.sender_id).where(Message.receiver_id == current_user.id).distinct()
    
    # Union both and get unique user IDs
    result_sent = await db.execute(sent_to)
    sent_ids = {row[0] for row in result_sent.fetchall()}
    
    result_received = await db.execute(received_from)
    received_ids = {row[0] for row in result_received.fetchall()}
    
    unique_user_ids = sent_ids.union(received_ids)
    
    if not unique_user_ids:
        return []
    
    # Fetch full user objects
    query = select(User).where(User.id.in_(unique_user_ids)).options(
        selectinload(User.expert_profile)
    )
    result = await db.execute(query)
    users = result.scalars().all()
    
    return users
