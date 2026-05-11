import asyncio
from backend.app.db.session import AsyncSessionLocal as SessionLocal
from backend.app.domains.payments.models import PaymentTransaction, TransactionType
from sqlalchemy import select

async def check():
    async with SessionLocal() as db:
        res = await db.execute(select(PaymentTransaction).where(PaymentTransaction.type == TransactionType.ROADMAP_REWARD))
        trxs = res.scalars().all()
        print(f"Found {len(trxs)} roadmap rewards")
        for t in trxs:
            print(f"User {t.user_id}: {t.amount} credits - {t.description}")

if __name__ == "__main__":
    asyncio.run(check())
