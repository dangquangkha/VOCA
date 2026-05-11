from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from backend.app.domains.identity.models import User, UserRole
from backend.app.models.notification import Notification, NotificationType, NotificationPriority
from backend.app.services.notification_socket import notification_manager
from backend.app.services.telegram_service import send_telegram_message, format_admin_alert
import json
import asyncio

async def notify_all_admins(
    db: AsyncSession,
    title: str,
    message: str,
    link: str = None,
    priority: NotificationPriority = NotificationPriority.LOW,
    data: dict = None
):
    """
    Send an in-app notification to all users with ADMIN role.
    """
    # 1. Find all Admins
    # Include superusers as well as they often act as admins
    from sqlalchemy import or_
    result = await db.execute(
        select(User).where(or_(User.role == UserRole.ADMIN, User.is_superuser == True))
    )
    admins = result.scalars().all()
    
    if not admins:
        return

    notifications = []
    for admin in admins:
        # 2. Create database record
        notification = Notification(
            recipient_id=admin.id,
            title=title,
            message=message,
            type=NotificationType.ADMIN_ALERT,
            priority=priority,
            link=link,
            data=json.dumps(data) if data else None
        )
        db.add(notification)
        notifications.append(notification)
    
    # Commit to save all notifications
    await db.commit()
    
    # 3. Push real-time via WebSocket
    for admin in admins:
        socket_data = {
            "title": title,
            "message": message,
            "type": NotificationType.ADMIN_ALERT,
            "link": link,
            "priority": priority,
            "is_admin_alert": True
        }
        await notification_manager.send_notification(socket_data, admin.id)
    
    # 4. Push to Telegram (Async, non-blocking)
    telegram_text = format_admin_alert(title, message, link)
    asyncio.create_task(send_telegram_message(telegram_text))
