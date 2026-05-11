import asyncio
from backend.app.db.session import AsyncSessionLocal
from backend.app.db import base
from backend.app.domains.identity.models import User
from sqlalchemy import select

async def check():
    async with AsyncSessionLocal() as s:
        r = await s.execute(select(User))
        users = r.scalars().all()
        print(f"Total users: {len(users)}")
        for u in users:
            print(f"User: {u.email} (ID: {u.id}, Role: {u.role}, Status: {u.account_status})")

if __name__ == "__main__":
    asyncio.run(check())
