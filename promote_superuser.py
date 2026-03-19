import asyncio
import sys
import os

# Add project root to path
sys.path.append(os.getcwd())

from backend.app.db.session import AsyncSessionLocal
from backend.app.models.user import User
from sqlalchemy import select

async def promote_user(email: str):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalars().first()
        if user:
            user.is_superuser = True
            session.add(user)
            await session.commit()
            print(f'User {email} promoted to superuser')
        else:
            print(f'User {email} not found')

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python promote_superuser.py <email>")
    else:
        asyncio.run(promote_user(sys.argv[1]))
