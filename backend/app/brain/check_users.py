
import asyncio
import sys
import os

# Add the project root to sys.path
sys.path.append(os.getcwd())

from sqlalchemy.future import select
from backend.app.db.session import AsyncSessionLocal
from backend.app.domains.identity.models import User

async def check_user():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.id == 2))
        user = result.scalars().first()
        if user:
            print(f"User 2: {user.email}, Role: {user.role}, Active: {user.is_active}")
        else:
            print("User 2 not found")
            
        result = await db.execute(select(User).limit(10))
        users = result.scalars().all()
        print("\nFirst 10 users:")
        for u in users:
            print(f"ID {u.id}: {u.email}, Role: {u.role}")

if __name__ == "__main__":
    asyncio.run(check_user())
