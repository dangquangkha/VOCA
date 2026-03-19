import asyncio
import sys
import os
sys.path.append(os.getcwd())
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from backend.app.core.config import settings

async def topup():
    print(f"Connecting to {settings.DATABASE_URL}")
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.begin() as conn:
        await conn.execute(text('UPDATE "user" SET credits = 500 WHERE id = '))

if __name__ == "__main__":
    asyncio.run(topup())
