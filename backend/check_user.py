import asyncio
from sqlalchemy import select
from backend.app.db.session import AsyncSessionLocal
from backend.app.domains.identity.models import User

async def check_user():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == "sarah.ml@careerpath.com"))
        user = result.scalars().first()
        if user:
            print(f"User found: {user.email}")
            print(f"Is active: {user.is_active}")
            print(f"Account status: {user.account_status}")
            print(f"Hashed password: {user.hashed_password}")
        else:
            print("User NOT found")

if __name__ == "__main__":
    asyncio.run(check_user())
