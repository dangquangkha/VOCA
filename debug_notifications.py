import asyncio
from backend.app.db.session import AsyncSessionLocal
from backend.app.models.notification import Notification
from sqlalchemy.future import select
from sqlalchemy import func

async def check():
    async with AsyncSessionLocal() as s:
        r = await s.execute(select(func.count(Notification.id)))
        print(f"Total Notifications: {r.scalar()}")
        
        # Check last 5
        r = await s.execute(select(Notification).order_by(Notification.id.desc()).limit(5))
        for n in r.scalars().all():
            print(f"ID: {n.id}, To: {n.recipient_id}, Title: {n.title}, Created: {n.created_at}")

if __name__ == "__main__":
    asyncio.run(check())
