import asyncio
from backend.app.db.session import engine
from backend.app.models.email_log import EmailLog 
from sqlalchemy.schema import CreateTable

async def create_email_log_table():
    async with engine.begin() as conn:
        # Generate CREATE TABLE statement
        await conn.run_sync(EmailLog.metadata.create_all) 
        print("Tried to create all tables (including EmailLog)")

if __name__ == "__main__":
    asyncio.run(create_email_log_table())
