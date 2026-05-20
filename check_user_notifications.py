import asyncio
from backend.app.db.session import AsyncSessionLocal
from backend.app.models.notification import Notification
from backend.app.domains.identity.models import User
from sqlalchemy.future import select

async def check(email):
    async with AsyncSessionLocal() as s:
        # Find user
        res = await s.execute(select(User).where(User.email == email))
        user = res.scalars().first()
        if not user:
            print(f"User {email} not found")
            return
            
        print(f"User {user.email} (ID: {user.id})")
        
        # Count notifications
        res = await s.execute(select(Notification).where(Notification.recipient_id == user.id))
        notifs = res.scalars().all()
        print(f"Total notifications for this user: {len(notifs)}")
        for n in notifs[-5:]:
            print(f"[{n.created_at}] ID: {n.id}, Title: {n.title}, Read: {n.is_read}")

if __name__ == "__main__":
    import sys
    email = sys.argv[1] if len(sys.argv) > 1 else "sarah.ml@careerpath.com"
    asyncio.run(check(email))
