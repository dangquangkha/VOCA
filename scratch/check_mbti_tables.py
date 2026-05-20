import asyncio
from backend.app.db.session import AsyncSessionLocal
from sqlalchemy import text

async def check_tables():
    async with AsyncSessionLocal() as db:
        try:
            result = await db.execute(text("SELECT * FROM mbti_questions LIMIT 1"))
            print("mbti_questions exists")
        except Exception as e:
            print(f"mbti_questions error: {e}")

        try:
            result = await db.execute(text("SELECT * FROM mbti_types LIMIT 1"))
            print("mbti_types exists")
        except Exception as e:
            print(f"mbti_types error: {e}")
            
        try:
            result = await db.execute(text("SELECT * FROM user_mbti_results LIMIT 1"))
            print("user_mbti_results exists")
        except Exception as e:
            print(f"user_mbti_results error: {e}")

if __name__ == "__main__":
    asyncio.run(check_tables())
