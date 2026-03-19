import asyncio
import sys
import os

sys.path.append(os.getcwd())

from sqlalchemy import select
from backend.app.db import base
from backend.app.db.session import AsyncSessionLocal
from backend.app.models.user import User

async def list_users():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User))
        users = result.scalars().all()
        print(f"{'ID':<5} {'Email':<30} {'Role':<10} {'Superuser':<10}")
        print("-" * 60)
        for user in users:
            print(f"{user.id:<5} {user.email:<30} {user.role:<10} {user.is_superuser:<10}")

if __name__ == "__main__":
    asyncio.run(list_users())
