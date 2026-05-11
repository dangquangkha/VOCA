from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import select as sa_select
from fastapi import HTTPException
from typing import Optional, List
from backend.app.domains.identity.models import User
from .models import PaymentTransaction, TransactionType, TransactionStatus

class CreditService:
    @staticmethod
    async def deduct_credits_atomic(
        db: AsyncSession,
        user_id: int,
        amount: int,
        booking_id: int,
        description: str,
    ) -> PaymentTransaction:
        """
        Atomically deduct credits with row-level lock.
        Legacy fix BL-01 migrated to CreditService.
        """
        result = await db.execute(
            sa_select(User)
            .where(User.id == user_id)
            .with_for_update()
        )
        user: User | None = result.scalars().first()

        if user is None:
            raise HTTPException(status_code=404, detail="User not found")

        if user.credits < amount:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient credits: balance={user.credits}, required={amount}"
            )

        user.credits -= amount
        db.add(user)

        trx = PaymentTransaction(
            user_id=user_id,
            booking_id=booking_id,
            amount=amount,
            type=TransactionType.BOOKING_HOLD,
            status=TransactionStatus.COMPLETED,
            description=description,
        )
        db.add(trx)
        return trx

    @staticmethod
    async def add_credits(
        db: AsyncSession,
        user_id: int,
        amount: int,
        trx_type: TransactionType,
        description: str,
        booking_id: Optional[int] = None
    ) -> PaymentTransaction:
        user = await db.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user.credits += amount
        db.add(user)
        
        trx = PaymentTransaction(
            user_id=user_id,
            amount=amount,
            type=trx_type,
            status=TransactionStatus.COMPLETED,
            description=description,
            booking_id=booking_id
        )
        db.add(trx)
        return trx

    @staticmethod
    async def refund_credits(
        db: AsyncSession,
        user_id: int,
        amount: int,
        booking_id: int,
        description: str
    ) -> PaymentTransaction:
        """Helper for automated refunds on cancellation/rejection."""
        return await CreditService.add_credits(
            db=db,
            user_id=user_id,
            amount=amount,
            trx_type=TransactionType.BOOKING_REFUND,
            description=description,
            booking_id=booking_id
        )

credit_service = CreditService()
