import asyncio
from sqlalchemy import select
from backend.app.db.session import AsyncSessionLocal
from backend.app.domains.identity.models import User

async def list_users():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User.email, User.is_active))
        users = result.all()
        print(f"Total users: {len(users)}")
        for email, is_active in users:
            print(f" - {email} (Active: {is_active})")

if __name__ == "__main__":
    asyncio.run(list_users())
