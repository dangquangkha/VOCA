import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def test_db():
    # Use the same URL as in .env
    db_url = "postgresql+asyncpg://khai:KHAi2692004@127.0.0.1:5432/careerpath_db"
    engine = create_async_engine(db_url)
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            print("DATABASE IS UP")
    except Exception as e:
        print(f"DATABASE IS DOWN: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(test_db())
