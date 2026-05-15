import asyncio
import os
import sys

# Add the project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from sqlalchemy import text
from backend.app.db.session import engine

async def check_db():
    try:
        async with engine.connect() as conn:
            print("Connecting to DB...")
            start_time = asyncio.get_event_loop().time()
            result = await conn.execute(text("SELECT count(*) FROM notifications"))
            count = result.scalar()
            end_time = asyncio.get_event_loop().time()
            print(f"Notifications count: {count}")
            print(f"Query took: {end_time - start_time:.4f} seconds")
            
            # Check for active connections
            try:
                result = await conn.execute(text("SELECT count(*) FROM pg_stat_activity"))
                active_conns = result.scalar()
                print(f"Active connections in Postgres: {active_conns}")
            except Exception as pg_e:
                print(f"Could not check pg_stat_activity: {pg_e}")
            
    except Exception as e:
        print(f"Error connecting to DB: {e}")

if __name__ == "__main__":
    asyncio.run(check_db())
