import asyncio
from backend.app.db.session import AsyncSessionLocal
from backend.app.models.notification import Notification
from sqlalchemy import select

async def check():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(Notification).order_by(Notification.id.desc()).limit(10))
        notifications = res.scalars().all()
        if not notifications:
            print("No notifications found.")
        for n in notifications:
            print(f"ID: {n.id}, Recipient: {n.recipient_id}, Sender: {n.sender_id}, Title: {n.title}, Type: {n.type}, Created: {n.created_at}")

if __name__ == '__main__':
    asyncio.run(check())
