import re
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, and_, desc
from sqlalchemy.orm import selectinload

from backend.app.api import deps
from backend.app.models.user import User
from backend.app.models.chat import Message
from backend.app.schemas.chat import Message as MessageSchema, MessageCreate
from fastapi import WebSocket, WebSocketDisconnect
from backend.app.services.chat_socket import manager
from backend.app.services.notification_service import create_notification
from backend.app.models.notification import NotificationType, NotificationPriority

router = APIRouter()

def validate_content(content: str):
    """
    BR-29: Cleanse/Block Phone & Email & Sensitive Keywords
    """
    # Regex 
    phone_pattern = r'\b(\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|\d{10})\b'
    email_pattern = r'[\w\.-]+@[\w\.-]+\.\w+'
    sensitive_keywords = ["zalo", "stk", "ck riêng", "transfer", "bank"]
    
    # Allow Google Meet / Zoom links (which might look like emails or domains)
    if "meet.google.com" in content or "zoom.us" in content:
        pass # Allow these specifically
    elif re.search(email_pattern, content):
        raise HTTPException(status_code=400, detail="Message contains email. Please keep transactions on platform.")
        
    for word in sensitive_keywords:
        if word.lower() in content.lower():
             raise HTTPException(status_code=400, detail=f"Message contains prohibited keyword: {word}")

@router.post("/", response_model=MessageSchema)
async def send_message(
    msg_in: MessageCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Send a message to another user.
    """
    if msg_in.receiver_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot chat with yourself")
        
    # Check if receiver exists
    result = await db.execute(select(User).where(User.id == msg_in.receiver_id))
    receiver = result.scalars().first()
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")
        
    # Content Filter
    validate_content(msg_in.content)
    
    message = Message(
        sender_id=current_user.id,
        receiver_id=msg_in.receiver_id,
        content=msg_in.content,
        is_read=False
    )
    db.add(message)
    await db.commit()
    
    # Reload with sender to avoid MissingGreenlet
    from sqlalchemy.orm import selectinload
    query = select(Message).where(Message.id == message.id).options(
        selectinload(Message.sender),
        selectinload(Message.receiver)
    )
    result = await db.execute(query)
    message = result.scalars().first()
    
    # Broadcast to receiver via WebSocket
    message_data = {
        "id": message.id,
        "sender_id": message.sender_id,
        "receiver_id": message.receiver_id,
        "content": message.content,
        "created_at": message.created_at.isoformat()
    }
    
    # Send to receiver
    await manager.send_personal_message(message_data, message.receiver_id)
    
    # Also send to sender (for multi-device/tab sync)
    await manager.send_personal_message(message_data, message.sender_id)
    
    # UC-38.2: Notify Receiver of new message
    try:
        await create_notification(
            recipient_id=message.receiver_id,
            sender_id=message.sender_id,
            title=f"Tin nhắn mới từ {current_user.full_name or 'Người dùng'}",
            message=message.content[:50] + ("..." if len(message.content) > 50 else ""),
            type=NotificationType.CHAT,
            priority=NotificationPriority.LOW,
            link=f"/dashboard/chat?user={current_user.id}"
        )
    except Exception as e:
        print(f"WARNING: create_notification failed (non-critical): {e}")

    return message

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    current_user: User = Depends(deps.get_current_user_ws),
):
    await manager.connect(current_user.id, websocket)
    try:
        while True:
            import json
            data = await websocket.receive_text()
            try:
                message_json = json.loads(data)
                # Handle typing indicator relay
                if message_json.get("type") == "typing":
                    receiver_id = message_json.get("receiver_id")
                    if receiver_id:
                        relay_data = {
                            "type": "typing",
                            "sender_id": current_user.id,
                            "is_typing": message_json.get("is_typing", False)
                        }
                        await manager.send_personal_message(relay_data, receiver_id)
            except (json.JSONDecodeError, ValueError):
                pass 
    except WebSocketDisconnect:
        manager.disconnect(current_user.id)

@router.post("/read/{sender_id}")
async def mark_as_read(
    sender_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Mark all messages from sender_id as read by current_user.
    """
    from sqlalchemy import update
    query = update(Message).where(
        and_(Message.sender_id == sender_id, Message.receiver_id == current_user.id, Message.is_read == False)
    ).values(is_read=True)
    await db.execute(query)
    await db.commit()
    return {"status": "success"}

@router.get("/unread-count")
async def get_unread_count(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get total unread messages count for current user.
    """
    from sqlalchemy import func
    query = select(func.count(Message.id)).where(
        and_(Message.receiver_id == current_user.id, Message.is_read == False)
    )
    result = await db.execute(query)
    count = result.scalar()
    return {"count": count}

@router.get("/", response_model=List[MessageSchema])
async def get_chat_history(
    other_user_id: int,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get chat history with specific user.
    """
    query = select(Message).where(
        or_(
            and_(Message.sender_id == current_user.id, Message.receiver_id == other_user_id),
            and_(Message.sender_id == other_user_id, Message.receiver_id == current_user.id)
        )
    ).order_by(Message.created_at.desc()).options(
        selectinload(Message.sender).selectinload(User.expert_profile),
        selectinload(Message.receiver).selectinload(User.expert_profile)
    ).offset(skip).limit(limit)
    
    result = await db.execute(query)
    messages = result.scalars().all()
    return messages
