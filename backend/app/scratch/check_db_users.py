import asyncio
import os
import sys
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select

# Add project root to sys.path
sys.path.append(os.getcwd())

from backend.app.core.config import settings
from backend.app.domains.identity.models import User

async def check_users():
    url = settings.DATABASE_URL
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://")
    
    engine = create_async_engine(url)
    async_session = sessionmaker(engine, class_=AsyncSession)
    
    async with async_session() as session:
        result = await session.execute(select(User).order_by(User.id))
        users = result.scalars().all()
        for u in users:
            print(f"ID: {u.id}, Email: {u.email}, Role: {u.role}, Name: {u.full_name}")

if __name__ == "__main__":
    asyncio.run(check_users())
