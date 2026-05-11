from backend.app.db.session import AsyncSessionLocal
from backend.app.models.notification import Notification, NotificationPriority, NotificationType
from backend.app.domains.identity.models import User
from backend.app.services.notification_socket import notification_manager
from backend.app.core.email import send_email
from datetime import datetime
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession

async def create_notification(
    recipient_id: int,
    title: str,
    message: str,
    type: NotificationType = NotificationType.SYSTEM,
    priority: NotificationPriority = NotificationPriority.LOW,
    sender_id: int = None,
    link: str = None,
    data: str = None,
    db: AsyncSession = None
):
    """
    Create a notification, persist it, and broadcast via WebSocket.
    Reuses existing session if provided, otherwise creates a new one from global pool.
    """
    async def _process(session: AsyncSession):
        notification = Notification(
            recipient_id=recipient_id,
            sender_id=sender_id,
            title=title,
            message=message,
            type=type,
            priority=priority,
            link=link,
            data=data,
            is_read=False,
        )
        session.add(notification)
        await session.flush()
        
        # BR-38.3: Email Fallback for High Priority
        if priority == NotificationPriority.HIGH:
            try:
                user_result = await session.execute(select(User).where(User.id == recipient_id))
                user = user_result.scalars().first()
                if user and user.email:
                    await send_email(
                        to=user.email,
                        subject=f"[CareerPath] {title}",
                        body=message,
                        db=session
                    )
            except Exception as e:
                print(f"WARNING: Email fallback failed: {e}")
        
        return notification

    async def _broadcast(notification: Notification):
        payload = {
            "id": notification.id,
            "title": notification.title,
            "message": notification.message,
            "type": notification.type,
            "priority": notification.priority,
            "link": notification.link,
            "data": notification.data,
            "created_at": notification.created_at.isoformat() if notification.created_at else datetime.now().isoformat(),
            "is_read": notification.is_read
        }
        await notification_manager.send_notification(payload, recipient_id)

    try:
        if db:
            result = await _process(db)
            # If a session is passed, we broadcast immediately after flush. 
            # This still has a small race risk if the caller doesn't commit fast,
            # but usually the caller commits right after create_notification.
            await _broadcast(result)
            return result
        else:
            async with AsyncSessionLocal() as session:
                result = await _process(session)
                await session.commit()
                # Broadcast ONLY after commit is successful
                await _broadcast(result)
                return result

    except Exception as e:
        print(f"ERROR: create_notification failed: {e}")
        return None
