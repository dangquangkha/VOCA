import asyncio
import sys
import os

# Add project root to sys.path
sys.path.append(os.getcwd())

from backend.app.db.base import Base
from backend.app.core.config import settings
from sqlalchemy.ext.asyncio import create_async_engine

async def init_models():
    print("Creating tables...")
    # Ensure DATABASE_URL is set for asyncpg
    url = settings.DATABASE_URL
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://")
        
    engine = create_async_engine(url, echo=True)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    await engine.dispose()
    print("✅ Tables created successfully.")

if __name__ == "__main__":
    asyncio.run(init_models())
