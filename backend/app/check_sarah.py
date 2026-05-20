import asyncio
from sqlalchemy import select
from backend.app.db.session import AsyncSessionLocal
from backend.app.domains.identity.models import User

async def check_user():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == "sarah.ml@careerpath.com"))
        user = result.scalars().first()
        if user:
            print(f"FOUND: {user.email}, Role: {user.role}, Active: {user.is_active}")
        else:
            print("NOT FOUND")

if __name__ == "__main__":
    asyncio.run(check_user())
