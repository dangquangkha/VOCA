from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException
from typing import List, Optional
from .models import Booking, BookingStatus
from .state_machine import booking_fsm, ActorRole
from backend.app.domains.payments.service import credit_service
from backend.app.domains.payments.models import TransactionType

class BookingService:
    @staticmethod
    async def create_booking(
        db: AsyncSession,
        student_id: int,
        expert_id: int,
        start_time,
        end_time,
        total_cost: int,
        student_note: str,
        is_pwyw: bool = False,
        status: BookingStatus = BookingStatus.PENDING,
        meeting_url: Optional[str] = None,
    ) -> Booking:
        booking = Booking(
            student_id=student_id,
            expert_id=expert_id,
            start_time=start_time,
            end_time=end_time,
            status=status,
            meeting_url=meeting_url,
            total_amount=total_cost,
            student_note=student_note,
            is_pwyw=is_pwyw,
        )
        db.add(booking)
        await db.flush()

        # PWYW bookings: no credit hold needed (student pays voluntarily after session)
        if not is_pwyw and total_cost > 0:
            await credit_service.deduct_credits_atomic(
                db=db,
                user_id=student_id,
                amount=total_cost,
                booking_id=booking.id,
                description=f"Hold for booking #{booking.id}",
            )
        await db.commit()
        return booking

    @staticmethod
    async def transition_status(db: AsyncSession, booking_id: int, actor_role: ActorRole, new_status: BookingStatus) -> Booking:
        result = await db.execute(
            select(Booking).where(Booking.id == booking_id).options(selectinload(Booking.expert))
        )
        booking = result.scalars().first()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")

        if not booking_fsm.can_transition(booking.status, actor_role, new_status):
            raise HTTPException(status_code=400, detail=f"Invalid transition from {booking.status} to {new_status} for {actor_role}")

        # Business logic for specific transitions
        if new_status == BookingStatus.COMPLETED:
            # BL-03: 80/20 split
            commission_rate = 0.20
            commission = int(booking.total_amount * commission_rate)
            expert_payout = booking.total_amount - commission
            
            # Payout to expert (80%)
            await credit_service.add_credits(
                db=db, user_id=booking.expert.user_id, amount=expert_payout,
                trx_type=TransactionType.BOOKING_RELEASE,
                description=f"Expert payout (80%) for booking #{booking.id}",
                booking_id=booking.id
            )
            # Log platform commission (20%) - Credited to Admin account (ID: 2)
            # This ensures the platform revenue is tracked and not paid to expert.
            await credit_service.add_credits(
                db=db, user_id=2, amount=commission, # ID 2 is admin@careerpath.com
                trx_type=TransactionType.SERVICE_PAYMENT,
                description=f"Platform commission (20%) from booking #{booking.id}",
                booking_id=booking.id
            )

        elif new_status in [BookingStatus.REJECTED, BookingStatus.CANCELLED]:
            # Automated refund to student
            await credit_service.refund_credits(
                db=db,
                user_id=booking.student_id,
                amount=booking.total_amount,
                booking_id=booking.id,
                description=f"Refund for {new_status.lower()} booking #{booking.id}"
            )

        booking.status = new_status
        db.add(booking)
        await db.commit()
        return booking

booking_service = BookingService()
