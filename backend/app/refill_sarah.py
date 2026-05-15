import asyncio
from sqlalchemy import select
from backend.app.db.session import AsyncSessionLocal
from backend.app.domains.identity.models import User
from backend.app.domains.marketplace.models import ExpertProfile
from backend.app.models.assessment import UserAssessmentResult
from backend.app.models.notification import Notification

async def add_credits():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == "sarah.ml@careerpath.com"))
        user = result.scalars().first()
        if user:
            user.credits += 1000
            db.add(user)
            await db.commit()
            print(f"SUCCESS: Added 1000 credits to {user.email}. Current: {user.credits}")
        else:
            print("USER NOT FOUND")

if __name__ == "__main__":
    asyncio.run(add_credits())
