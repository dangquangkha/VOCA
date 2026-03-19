import asyncio
from sqlalchemy import text
from backend.app.db.session import AsyncSessionLocal

async def list_tables():
    async with AsyncSessionLocal() as session:
        result = await session.execute(text("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema'"))
        for row in result:
            print(row[0])

if __name__ == "__main__":
    asyncio.run(list_tables())
