from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from backend.app.models.notification import Notification, NotificationPriority, NotificationType
from backend.app.models.user import User
from backend.app.services.notification_socket import notification_manager
from backend.app.core.config import settings
from backend.app.core.email import send_email
from datetime import datetime
from sqlalchemy.future import select

async def create_notification(
    recipient_id: int,
    title: str,
    message: str,
    type: NotificationType = NotificationType.SYSTEM,
    priority: NotificationPriority = NotificationPriority.LOW,
    sender_id: int = None,
    link: str = None,
    data: str = None
):
    """
    Create a notification, persist it, and broadcast via WebSocket.
    """
    url = settings.DATABASE_URL
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://")

    engine = create_async_engine(url, echo=False)
    AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    try:
        async with AsyncSessionLocal() as session:
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
            await session.commit()
            await session.refresh(notification)

        # Broadcast via WebSocket
        payload = {
            "id": notification.id,
            "title": notification.title,
            "message": notification.message,
            "type": notification.type,
            "priority": notification.priority,
            "link": notification.link,
            "created_at": notification.created_at.isoformat(),
            "is_read": notification.is_read
        }
        await notification_manager.send_notification(payload, recipient_id)

        # BR-38.3: Email Fallback for High Priority
        if priority == NotificationPriority.HIGH:
            try:
                async with AsyncSessionLocal() as email_session:
                    user_result = await email_session.execute(select(User).where(User.id == recipient_id))
                    user = user_result.scalars().first()
                    if user and user.email:
                        await send_email(
                            to=user.email,
                            subject=f"[CareerPath] {title}",
                            body=message,
                            db=email_session
                        )
            except Exception as e:
                print(f"WARNING: Email fallback failed: {e}")

        return notification

    except Exception as e:
        print(f"ERROR: create_notification failed: {e}")
        return None
    finally:
        await engine.dispose()
