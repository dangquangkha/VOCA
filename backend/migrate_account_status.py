"""
Database migration script to add account status system
Run this script to add UserStatus enum, account_status column, AccountAction and Blacklist tables
"""

import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from backend.app.core.config import settings

async def migrate():
    engine = create_async_engine(settings.DATABASE_URL.replace('postgresql://', 'postgresql+asyncpg://'), echo=True)
    
    async with engine.begin() as conn:
        print("Creating UserStatus enum...")
        await conn.execute(text("""
            DO $$ BEGIN
                CREATE TYPE userstatus AS ENUM ('ACTIVE', 'SUSPENDED', 'BANNED');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        """))
        
        print("Adding account_status column to user table...")
        await conn.execute(text("""
            ALTER TABLE "user" 
            ADD COLUMN IF NOT EXISTS account_status userstatus DEFAULT 'ACTIVE';
        """))
        
        print("Creating AccountActionType enum...")
        await conn.execute(text("""
            DO $$ BEGIN
                CREATE TYPE accountactiontype AS ENUM (
                    'SUSPEND_EXPERT', 
                    'UNSUSPEND_EXPERT', 
                    'BAN_USER', 
                    'UNBAN_USER'
                );
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        """))
        
        print("Creating account_actions table...")
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS account_actions (
                id SERIAL PRIMARY KEY,
                action_type accountactiontype NOT NULL,
                target_user_id INTEGER NOT NULL REFERENCES "user"(id),
                admin_id INTEGER NOT NULL REFERENCES "user"(id),
                reason VARCHAR NOT NULL,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
            );
        """))
        
        print("Creating blacklist table...")
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS blacklist (
                id SERIAL PRIMARY KEY,
                email VARCHAR UNIQUE NOT NULL,
                phone_number VARCHAR,
                reason VARCHAR NOT NULL,
                banned_user_id INTEGER REFERENCES "user"(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
            );
        """))
        
        print("Creating indexes...")
        await conn.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_blacklist_email ON blacklist(email);
        """))
        await conn.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_blacklist_phone_number ON blacklist(phone_number);
        """))
        
        print("✅ Migration completed successfully!")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(migrate())
