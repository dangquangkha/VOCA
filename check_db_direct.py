import asyncio
import asyncpg

async def check():
    try:
        conn = await asyncpg.connect("postgresql://khai:KHAi2692004@127.0.0.1:5432/careerpath_db")
        print("CONNECTED SUCCESS")
        await conn.close()
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(check())
