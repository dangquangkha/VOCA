import asyncio
from backend.app.db.session import AsyncSessionLocal
from backend.app.domains.identity.models import User
from backend.app.services.notification_service import create_notification
from backend.app.models.notification import NotificationType, NotificationPriority
from sqlalchemy import select

async def test():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User).limit(1))
        user = res.scalars().first()
        if not user:
            print("No users found.")
            return
        
        print(f"Testing notification for User ID: {user.id}")
        notif = await create_notification(
            recipient_id=user.id,
            title="Test Notification",
            message="This is a test notification from Antigravity",
            type=NotificationType.BOOKING,
            priority=NotificationPriority.HIGH
        )
        if notif:
            print(f"Notification created successfully: ID {notif.id}")
        else:
            print("Notification creation failed.")

if __name__ == '__main__':
    asyncio.run(test())
