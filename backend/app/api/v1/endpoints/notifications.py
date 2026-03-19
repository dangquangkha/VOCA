from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, update

from backend.app.api import deps
from backend.app.models.user import User
from backend.app.models.notification import Notification
from backend.app.schemas.notification import Notification as NotificationSchema, NotificationUpdate, NotificationWithSender
from backend.app.services.notification_socket import notification_manager
# Using deps instead of core security for WS auth

router = APIRouter()

@router.get("/", response_model=List[NotificationWithSender])
async def read_notifications(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 50,
) -> Any:
    """
    Retrieve notifications for the current user.
    """
    from sqlalchemy.orm import selectinload
    query = (
        select(Notification)
        .where(Notification.recipient_id == current_user.id)
        .options(selectinload(Notification.sender))
        .order_by(Notification.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/unread-count")
async def get_unread_count(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get the count of unread notifications.
    """
    query = (
        select(func.count(Notification.id))
        .where(Notification.recipient_id == current_user.id)
        .where(Notification.is_read == False)
    )
    result = await db.execute(query)
    count = result.scalar()
    return {"count": count}

@router.put("/{notification_id}/read", response_model=NotificationSchema)
async def mark_notification_as_read(
    notification_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Mark a specific notification as read.
    """
    query = select(Notification).where(Notification.id == notification_id)
    result = await db.execute(query)
    notification = result.scalars().first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    if notification.recipient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    notification.is_read = True
    db.add(notification)
    await db.commit()
    await db.refresh(notification)
    return notification

@router.post("/read-all")
async def mark_all_as_read(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Mark all notifications for the current user as read.
    """
    query = (
        update(Notification)
        .where(Notification.recipient_id == current_user.id)
        .where(Notification.is_read == False)
        .values(is_read=True)
    )
    await db.execute(query)
    await db.commit()
    return {"status": "success"}

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    user: User = Depends(deps.get_current_user_ws),
):
    """
    WebSocket endpoint for real-time notifications.
    Uses deps.get_current_user_ws for authentication (expects token in Query).
    """
    await notification_manager.connect(user.id, websocket)
    try:
        while True:
            # Keep connection alive and listen for any client messages (though we mostly push)
            data = await websocket.receive_text()
            # Handle client-side heartbeat if necessary
    except WebSocketDisconnect:
        notification_manager.disconnect(user.id, websocket)
    except Exception as e:
        print(f"DEBUG: Notification WS Error: {e}")
        notification_manager.disconnect(user.id, websocket)
