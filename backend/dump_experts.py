import asyncio
from backend.app.db.session import AsyncSessionLocal
from backend.app.domains.marketplace.models import ExpertProfile
from backend.app.domains.identity.models import User
from sqlalchemy import select

async def dump():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(ExpertProfile))
        profiles = res.scalars().all()
        print(f"Total Experts: {len(profiles)}")
        for ep in profiles:
            u_res = await db.execute(select(User).where(User.id == ep.user_id))
            user = u_res.scalars().first()
            user_info = f"{user.email} ({user.id})" if user else "USER NOT FOUND"
            print(f"ExpertProfile ID: {ep.id} -> User: {user_info}")

if __name__ == '__main__':
    asyncio.run(dump())
