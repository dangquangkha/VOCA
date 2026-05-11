import asyncio
import sys
import os

sys.path.append(os.getcwd())

from sqlalchemy import select
from backend.app.db.session import AsyncSessionLocal
from backend.app.models.blacklist import Blacklist
# Import base to register all models
from backend.app.db import base

async def check_blacklist():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Blacklist))
        items = result.scalars().all()
        print(f"{'Email':<30} {'Phone':<15}")
        print("-" * 50)
        for item in items:
            print(f"{str(item.email):<30} {str(item.phone_number):<15}")

if __name__ == "__main__":
    asyncio.run(check_blacklist())
