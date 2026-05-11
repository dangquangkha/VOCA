import asyncio
from sqlalchemy.future import select
from backend.app.db.session import AsyncSessionLocal
from backend.app.models.expert import ExpertProfile
from backend.app.models.user import User

async def check():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(ExpertProfile, User).join(User))
        items = res.all()
        print(f"Total experts in DB: {len(items)}")
        for e, u in items:
            print(f"User: {u.email}, KYC: {e.kyc_status}, Status: {u.account_status}")

if __name__ == "__main__":
    asyncio.run(check())
