from typing import Any, List
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
# UPDATE (BL-01): Import with_for_update support via select().with_for_update()
from sqlalchemy import select as sa_select

from backend.app.api import deps
from backend.app.domains.identity.models import User, UserRole
from backend.app.domains.marketplace.models import ExpertProfile
from backend.app.domains.booking.models import Booking, BookingStatus
from backend.app.domains.payments.models import PaymentTransaction, TransactionType, TransactionStatus
from backend.app.schemas.booking import Booking as BookingSchema, BookingCreate, BookingUpdate
from backend.app.services.chat_service import send_system_message
from backend.app.services.notification_service import create_notification
from backend.app.models.notification import NotificationType, NotificationPriority


router = APIRouter()

# ─── Helpers ──────────────────────────────────────────────────────────────────

async def _reload_booking(db: AsyncSession, booking_id: int) -> Booking:
    """Reload booking with all relationships for serialization."""
    query = (
        select(Booking)
        .where(Booking.id == booking_id)
        .options(
            selectinload(Booking.student).selectinload(User.expert_profile),
            selectinload(Booking.expert).selectinload(ExpertProfile.user).selectinload(User.expert_profile),
            selectinload(Booking.expert).selectinload(ExpertProfile.availabilities),
        )
    )
    result = await db.execute(query)
    return result.scalars().first()


async def deduct_credits_atomic(
    db: AsyncSession,
    user_id: int,
    amount: int,
    booking_id: int,
    description: str,
) -> PaymentTransaction:
    """
    Atomically deduct credits from a user with a PostgreSQL row-level lock.

    Uses SELECT FOR UPDATE to acquire an exclusive lock on the User row before
    reading the balance, ensuring that concurrent requests for the same user
    are serialized at the DB level — preventing double-spend / race conditions.

    Raises:
        HTTPException 400: If balance is insufficient AFTER acquiring the lock.

    Must be called inside an active transaction (before db.commit()).
    """
    # UPDATE (BL-01): Acquire row-level lock on User row BEFORE reading credits.
    # This prevents concurrent requests from both passing the balance check
    # simultaneously and over-spending the same credit pool.
    result = await db.execute(
        sa_select(User)
        .where(User.id == user_id)
        .with_for_update()          # ← Row-level lock (NOWAIT not set — will queue)
    )
    user: User | None = result.scalars().first()

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    # UPDATE (BL-01): Balance check happens AFTER lock is held — safe from race.
    if user.credits < amount:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient credits: balance={user.credits}, required={amount}"
        )

    # UPDATE (BL-01): Deduct credits and create escrow transaction atomically.
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


# ─── Create booking ───────────────────────────────────────────────────────────

@router.post("/", response_model=BookingSchema)
async def create_booking(
    booking_in: BookingCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create a new booking request.
    Validates student credits and creates a HOLD transaction.
    """
    try:
        # Step 1: Validate expert exists
        result = await db.execute(select(ExpertProfile).where(ExpertProfile.id == booking_in.expert_id))
        expert = result.scalars().first()
        if not expert:
            raise HTTPException(status_code=404, detail="Expert not found")

        # Step 2: Validate booking duration
        duration_hours = (booking_in.end_time - booking_in.start_time).total_seconds() / 3600
        if duration_hours <= 0:
            raise HTTPException(status_code=400, detail="Invalid booking duration")

        total_cost = int(duration_hours * expert.hourly_rate)

        # Step 4b: Grit Incentive — apply 10% discount if student completed ≥ 7 roadmap days
        try:
            from backend.app.models.roadmap import DailyProgress, DayStatus as RoadmapDayStatus
            from sqlalchemy import func as sa_func
            grit_result = await db.execute(
                sa_select(sa_func.count(DailyProgress.id))
                .where(DailyProgress.user_id == current_user.id)
                .where(DailyProgress.status == RoadmapDayStatus.COMPLETED)
            )
            completed_days = grit_result.scalar() or 0
            if completed_days >= 7:
                discount_amount = int(total_cost * 0.10)
                total_cost = total_cost - discount_amount
        except Exception:
            pass  # Non-critical — don't block booking if grit check fails

        # Step 3b: Check for Expert Quiz
        from backend.app.domains.marketplace.models import ExpertQuiz
        from backend.app.domains.booking.models import QuizStatus
        quiz_result = await db.execute(select(ExpertQuiz).where(ExpertQuiz.expert_id == expert.id))
        has_quiz = quiz_result.scalars().first() is not None

        # Step 3: Create booking shell
        booking = Booking(
            student_id=current_user.id,
            expert_id=expert.id,
            start_time=booking_in.start_time,
            end_time=booking_in.end_time,
            status=BookingStatus.PENDING,
            total_amount=total_cost,
            student_note=booking_in.student_note,
            quiz_status=QuizStatus.PENDING if has_quiz else QuizStatus.NONE
        )
        db.add(booking)
        await db.flush()  # Assign booking.id without committing

        # Step 4: Atomically deduct credits with row-level lock (BL-01 fix)
        # This call acquires SELECT FOR UPDATE on the User row, re-checks the
        # balance under lock, deducts, and writes the HOLD transaction.
        # Any concurrent request for the same user will block here until this
        # transaction commits or rolls back — no double-spend possible.
        await deduct_credits_atomic(
            db=db,
            user_id=current_user.id,
            amount=total_cost,
            booking_id=booking.id,
            description=f"Hold for booking #{booking.id}",
        )

        await db.commit()

        # UC-38.0: Notify Expert of new booking (non-critical, fire-and-forget)
        try:
            await create_notification(
                recipient_id=expert.user_id,
                sender_id=current_user.id,
                title="Bạn có yêu cầu đặt lịch mới",
                message=f"{current_user.full_name or 'Học viên'} đã gửi cho bạn một yêu cầu đặt lịch tư vấn.",
                type=NotificationType.BOOKING,
                priority=NotificationPriority.HIGH,
                link=f"/dashboard/manage/bookings?booking={booking.id}"
            )
        except Exception as e:
            print(f"WARNING: create_notification failed (non-critical): {e}")

        return await _reload_booking(db, booking.id)

    except HTTPException:
        # HTTPException (incl. InsufficientCredits) bubbles up cleanly.
        # SQLAlchemy async session will rollback on context exit.
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ─── List bookings ────────────────────────────────────────────────────────────

@router.get("/", response_model=List[BookingSchema])
async def read_bookings(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """List bookings for current user (as student or expert)."""
    query = select(Booking)
    if current_user.role == UserRole.STUDENT:
        query = query.where(Booking.student_id == current_user.id)
    elif current_user.role in [UserRole.EXPERT, UserRole.MENTOR]:
        subq = select(ExpertProfile.id).where(ExpertProfile.user_id == current_user.id)
        query = query.where(Booking.expert_id.in_(subq))

    query = query.order_by(Booking.start_time.desc()).offset(skip).limit(limit)
    query = query.options(
        selectinload(Booking.student).selectinload(User.expert_profile),
        selectinload(Booking.expert).selectinload(ExpertProfile.user).selectinload(User.expert_profile),
        selectinload(Booking.expert).selectinload(ExpertProfile.availabilities),
    )
    result = await db.execute(query)
    return result.scalars().all()


# ─── UC-37: Check-in ─────────────────────────────────────────────────────────

@router.post("/{booking_id}/checkin", response_model=BookingSchema)
async def checkin_booking(
    booking_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    UC-37: Check-in for a session.
    Allowed window: [T-5min, T+10min] from booking start_time.
    Both parties must check in for status to become IN_PROGRESS.
    """
    query = select(Booking).where(Booking.id == booking_id).options(selectinload(Booking.expert))
    result = await db.execute(query)
    booking = result.scalars().first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status not in [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS]:
        raise HTTPException(
            status_code=400,
            detail=f"Check-in only allowed for CONFIRMED bookings (current: {booking.status})"
        )

    # BR-37.1: Check-in window
    now = datetime.now(timezone.utc)
    start_aware = booking.start_time.replace(tzinfo=timezone.utc) if booking.start_time.tzinfo is None else booking.start_time
    window_open = start_aware.timestamp() - 5 * 60     # T - 5min
    window_close = start_aware.timestamp() + 10 * 60   # T + 10min

    if now.timestamp() < window_open:
        raise HTTPException(
            status_code=400,
            detail="Check-in window has not opened yet. Please wait until 5 minutes before the session."
        )
    if now.timestamp() > window_close:
        raise HTTPException(
            status_code=400,
            detail="Check-in window has closed (10 minutes after start). The session has been marked as no-show."
        )

    # Determine caller role
    is_student = booking.student_id == current_user.id
    expert_profile = booking.expert
    is_expert = expert_profile.user_id == current_user.id if expert_profile else False

    if not (is_student or is_expert):
        raise HTTPException(status_code=403, detail="Not authorized for this booking")

    # Set check-in timestamp
    if is_student and not booking.student_checked_in_at:
        booking.student_checked_in_at = now
    elif is_expert and not booking.expert_checked_in_at:
        booking.expert_checked_in_at = now

    # If both checked in → IN_PROGRESS
    if booking.student_checked_in_at and booking.expert_checked_in_at:
        booking.status = BookingStatus.IN_PROGRESS

    db.add(booking)
    await db.commit()
    return await _reload_booking(db, booking.id)


# ─── UC-37: No-show resolution (called on GET or triggered manually) ──────────

@router.post("/{booking_id}/resolve-noshow", response_model=BookingSchema)
async def resolve_noshow(
    booking_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    UC-37: Auto-resolve no-show after T+10min.
    - Expert no-show → refund student, record penalty
    - User no-show → release funds to expert
    - Mutual no-show → refund student
    """
    query = select(Booking).where(Booking.id == booking_id).options(selectinload(Booking.expert))
    result = await db.execute(query)
    booking = result.scalars().first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status != BookingStatus.CONFIRMED:
        raise HTTPException(status_code=400, detail="No-show resolution only applies to CONFIRMED bookings")

    now = datetime.now(timezone.utc)
    start_aware = booking.start_time.replace(tzinfo=timezone.utc) if booking.start_time.tzinfo is None else booking.start_time
    window_close = start_aware.timestamp() + 10 * 60  # T+10min

    if now.timestamp() < window_close:
        raise HTTPException(status_code=400, detail="Check-in window has not closed yet")

    student_checked = booking.student_checked_in_at is not None
    expert_checked = booking.expert_checked_in_at is not None
    expert_profile = booking.expert

    student_result = await db.execute(select(User).where(User.id == booking.student_id))
    student = student_result.scalars().first()

    if not student_checked and not expert_checked:
        # Mutual no-show → refund student
        booking.status = BookingStatus.CANCELLED_MUTUAL_NO_SHOW
        student.credits += booking.total_amount
        db.add(student)
        trx = PaymentTransaction(
            user_id=student.id, booking_id=booking.id,
            amount=booking.total_amount, type=TransactionType.BOOKING_REFUND,
            status=TransactionStatus.COMPLETED,
            description=f"Auto-refund: mutual no-show for booking #{booking.id}",
        )
        db.add(trx)

    elif not expert_checked and student_checked:
        # Expert no-show → refund student (BR-37.2)
        booking.status = BookingStatus.CANCELLED_EXPERT_NO_SHOW
        student.credits += booking.total_amount
        db.add(student)
        trx = PaymentTransaction(
            user_id=student.id, booking_id=booking.id,
            amount=booking.total_amount, type=TransactionType.BOOKING_REFUND,
            status=TransactionStatus.COMPLETED,
            description=f"Auto-refund: expert no-show for booking #{booking.id}",
        )
        db.add(trx)

    elif not student_checked and expert_checked:
        # User no-show → release to expert (BR-37.2)
        booking.status = BookingStatus.CANCELLED_USER_NO_SHOW
        expert_user_result = await db.execute(select(User).where(User.id == expert_profile.user_id))
        expert_user = expert_user_result.scalars().first()
        expert_user.credits += booking.total_amount
        db.add(expert_user)
        trx = PaymentTransaction(
            user_id=expert_user.id, booking_id=booking.id,
            amount=booking.total_amount, type=TransactionType.BOOKING_RELEASE,
            status=TransactionStatus.COMPLETED,
            description=f"Auto-release: user no-show for booking #{booking.id}",
        )
        db.add(trx)

    db.add(booking)
    await db.commit()
    return await _reload_booking(db, booking.id)


# ─── Update booking status ────────────────────────────────────────────────────

@router.put("/{booking_id}", response_model=BookingSchema)
async def update_booking_status(
    booking_id: int,
    booking_update: BookingUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Update booking status (Confirm, Cancel, Complete, Reject with reason)."""
    query = select(Booking).where(Booking.id == booking_id).options(selectinload(Booking.expert))
    result = await db.execute(query)
    booking = result.scalars().first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    is_student = booking.student_id == current_user.id
    expert_profile = booking.expert
    is_expert = expert_profile.user_id == current_user.id if expert_profile else False

    if not (is_student or is_expert):
        raise HTTPException(status_code=403, detail="Not authorized")

    current_status = booking.status
    new_status = booking_update.status

    if not new_status:
        # Update URL or notes only
        if booking_update.meeting_url:
            url = booking_update.meeting_url.lower()
            allowed_domains = ["meet.google.com", "zoom.us", "teams.microsoft.com"]
            if not any(domain in url for domain in allowed_domains):
                raise HTTPException(status_code=400, detail="Invalid meeting URL. Allowed: Google Meet, Zoom, Teams.")
            if not (url.startswith("http://") or url.startswith("https://")):
                raise HTTPException(status_code=400, detail="URL must start with http/https")
            booking.meeting_url = booking_update.meeting_url
        if booking_update.expert_note:
            booking.expert_note = booking_update.expert_note
        db.add(booking)
        await db.commit()
        return await _reload_booking(db, booking.id)

    # Meeting URL validation
    if booking_update.meeting_url:
        url = booking_update.meeting_url.lower()
        allowed_domains = ["meet.google.com", "zoom.us", "teams.microsoft.com"]
        if not any(domain in url for domain in allowed_domains):
            raise HTTPException(status_code=400, detail="Invalid meeting URL. Allowed: Google Meet, Zoom, Teams.")
        if not (url.startswith("http://") or url.startswith("https://")):
            raise HTTPException(status_code=400, detail="URL must start with http/https")
        booking.meeting_url = booking_update.meeting_url

    # ── Status Transitions ──

    if new_status == BookingStatus.CONFIRMED:
        if not is_expert:
            raise HTTPException(status_code=403, detail="Only expert can confirm")
        if current_status != BookingStatus.PENDING:
            raise HTTPException(status_code=400, detail="Can only confirm pending bookings")
        booking.status = BookingStatus.CONFIRMED

        # UC-38.0: Notify Student of confirmation
        try:
            await create_notification(
                recipient_id=booking.student_id,
                sender_id=current_user.id,
                title="Chuyên gia đã chấp nhận lịch hẹn",
                message=f"{current_user.full_name or 'Chuyên gia'} đã đồng ý yêu cầu tư vấn của bạn.",
                type=NotificationType.BOOKING,
                priority=NotificationPriority.HIGH,
                link=f"/dashboard/manage/bookings?booking={booking.id}"
            )
        except Exception as e:
            print(f"WARNING: create_notification failed (non-critical): {e}")

    elif new_status in [BookingStatus.CANCELLED, BookingStatus.REJECTED]:
        if current_status in [BookingStatus.COMPLETED, BookingStatus.CANCELLED, BookingStatus.REJECTED,
                               BookingStatus.CANCELLED_BY_EXPERT]:
            raise HTTPException(status_code=400, detail="Cannot cancel finalized booking")

        # Expert can only REJECT while PENDING; use CANCELLED_BY_EXPERT for confirmed sessions
        if is_expert and current_status == BookingStatus.CONFIRMED:
            raise HTTPException(
                status_code=403,
                detail="Để hủy lịch đã xác nhận, hãy sử dụng trạng thái CANCELLED_BY_EXPERT."
            )

        booking.status = new_status

        # UC-13: Save rejection reason
        if booking_update.rejection_reason:
            booking.rejection_reason = booking_update.rejection_reason
        if booking_update.expert_note:
            booking.expert_note = booking_update.expert_note

        # Refund student
        student_result = await db.execute(select(User).where(User.id == booking.student_id))
        student = student_result.scalars().first()
        student.credits += booking.total_amount
        db.add(student)

        trx = PaymentTransaction(
            user_id=student.id, booking_id=booking.id,
            amount=booking.total_amount, type=TransactionType.BOOKING_REFUND,
            status=TransactionStatus.COMPLETED,
            description=f"Refund for booking #{booking.id} ({new_status.value})",
        )
        db.add(trx)

    # ── Expert-initiated cancellation of a CONFIRMED booking (with penalty) ──
    elif new_status == BookingStatus.CANCELLED_BY_EXPERT:
        if not is_expert:
            raise HTTPException(status_code=403, detail="Only the assigned expert can use this cancellation type")
        if current_status != BookingStatus.CONFIRMED:
            raise HTTPException(status_code=400, detail="Can only cancel a CONFIRMED booking")

        booking.status = BookingStatus.CANCELLED_BY_EXPERT
        if booking_update.expert_note:
            booking.expert_note = booking_update.expert_note

        # Immediate refund to student
        student_result = await db.execute(select(User).where(User.id == booking.student_id))
        student = student_result.scalars().first()
        student.credits += booking.total_amount
        db.add(student)

        trx = PaymentTransaction(
            user_id=student.id, booking_id=booking.id,
            amount=booking.total_amount, type=TransactionType.BOOKING_REFUND,
            status=TransactionStatus.COMPLETED,
            description=f"Refund: Expert cancelled booking #{booking.id}",
        )
        db.add(trx)

        # Penalty: increment cancellation count, deduct rating if < 12h
        expert_profile_result = await db.execute(
            select(ExpertProfile).where(ExpertProfile.id == booking.expert_id)
        )
        ep = expert_profile_result.scalars().first()
        if ep:
            ep.cancellation_count = (ep.cancellation_count or 0) + 1
            # Check if late cancellation (< 12 hours before session)
            now_dt = datetime.now(timezone.utc)
            start_aware = booking.start_time.replace(tzinfo=timezone.utc) if booking.start_time.tzinfo is None else booking.start_time
            hours_until_session = (start_aware - now_dt).total_seconds() / 3600
            if hours_until_session < 12:
                ep.late_cancellation_count = (ep.late_cancellation_count or 0) + 1
                # Deduct 0.1 rating per late cancellation (floor at 0)
                ep.rating = max(0.0, round((ep.rating or 0.0) - 0.1, 2))
            db.add(ep)

    elif new_status == BookingStatus.COMPLETED:
        if not is_student:
            raise HTTPException(status_code=403, detail="Only student can mark booking as complete")
        if current_status not in [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS]:
            raise HTTPException(status_code=400, detail=f"Can only complete confirmed/in-progress bookings")

        booking.status = BookingStatus.COMPLETED

        # UPDATE (BL-03): Apply 80/20 commission split.
        # Expert receives 80% of total_amount; platform retains 20% as revenue.
        # The 20% commission is NOT credited to any user — it stays in the system
        # (i.e., it was deducted from student via BOOKING_HOLD but never released).
        PLATFORM_COMMISSION_RATE = 0.20
        commission_amount = int(booking.total_amount * PLATFORM_COMMISSION_RATE)
        expert_payout = booking.total_amount - commission_amount  # 80%

        expert_user_result = await db.execute(select(User).where(User.id == expert_profile.user_id))
        expert_user = expert_user_result.scalars().first()
        expert_user.credits += expert_payout  # UPDATE (BL-03): Was booking.total_amount (100%)
        db.add(expert_user)

        # Expert payout transaction (80%)
        trx = PaymentTransaction(
            user_id=expert_user.id, booking_id=booking.id,
            amount=expert_payout, type=TransactionType.BOOKING_RELEASE,
            status=TransactionStatus.COMPLETED,
            description=f"Expert payout (80%) for booking #{booking.id}",
        )
        db.add(trx)

        # Platform commission record (20%) — for accounting / revenue tracking
        commission_trx = PaymentTransaction(
            user_id=expert_user.id, booking_id=booking.id,
            amount=commission_amount, type=TransactionType.SERVICE_PAYMENT,
            status=TransactionStatus.COMPLETED,
            description=f"Platform commission (20%) for booking #{booking.id}",
        )
        db.add(commission_trx)

    db.add(booking)
    await db.commit()

    # Send system chat notifications
    try:
        expert_user_id = booking.expert.user_id if booking.expert else None
        if booking_update.meeting_url and booking.status == BookingStatus.CONFIRMED and expert_user_id:
            await send_system_message(
                sender_id=expert_user_id, receiver_id=booking.student_id,
                content=f"I have updated the meeting link: {booking_update.meeting_url}. Please check.",
            )
        elif new_status == BookingStatus.CONFIRMED and expert_user_id:
            await send_system_message(
                sender_id=expert_user_id, receiver_id=booking.student_id,
                content="I have accepted your booking request. I will send the meeting link soon.",
            )
        elif new_status in (BookingStatus.CANCELLED, BookingStatus.REJECTED) and expert_user_id:
            reason = booking.rejection_reason or booking.expert_note or "No reason provided"
            await send_system_message(
                sender_id=expert_user_id, receiver_id=booking.student_id,
                content=f"Your booking has been {new_status.value}. Reason: {reason}. Refund has been processed to your wallet.",
            )
        elif new_status == BookingStatus.COMPLETED:
            eu_result = await db.execute(select(User).where(User.id == expert_profile.user_id))
            eu = eu_result.scalars().first()
            if eu:
                await send_system_message(
                    sender_id=eu.id, receiver_id=booking.student_id,
                    content="The session has been marked as completed. Thank you for your time!",
                )
    except Exception as e:
        print(f"WARNING: send_system_message failed (non-critical): {e}")

    return await _reload_booking(db, booking.id)
