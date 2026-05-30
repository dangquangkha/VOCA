from typing import Any, List
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
# UPDATE (BL-01): Import with_for_update support via select().with_for_update()
from sqlalchemy import select as sa_select

from backend.app.api import deps
from backend.app.domains.identity.models import User, UserRole
from backend.app.domains.marketplace.models import ExpertProfile
from .models import Booking, BookingStatus, BookingDispute
from backend.app.domains.payments.models import PaymentTransaction, TransactionType, TransactionStatus
from .schemas import Booking as BookingSchema, BookingCreate, BookingUpdate, BookingDispute as BookingDisputeSchema, BookingDisputeCreate, BookingDisputeUpdate
from backend.app.services.chat_service import send_system_message
from backend.app.services.notification_service import create_notification
from backend.app.models.notification import NotificationType, NotificationPriority
from backend.app.services.admin_notification_service import notify_all_admins


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


# ─── Create booking ───────────────────────────────────────────────────────────

from backend.app.domains.booking.service import booking_service

@router.post("/", response_model=BookingSchema)
async def create_booking(
    booking_in: BookingCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create a new booking request.
    Uses BookingService for atomic logic.
    """
    try:
        # Step 1: Validate expert exists
        result = await db.execute(select(ExpertProfile).where(ExpertProfile.id == booking_in.expert_id))
        expert = result.scalars().first()
        if not expert:
            raise HTTPException(status_code=404, detail="Expert not found")

        # Step 1.5: Check if expert requires a quiz before booking
        from backend.app.domains.marketplace.models import ExpertQuiz, PublicQuizResponse
        required_quiz_result = await db.execute(
            select(ExpertQuiz).where(
                ExpertQuiz.expert_id == expert.id,
                ExpertQuiz.is_required_for_booking == True,
                ExpertQuiz.is_active == True,
            )
        )
        required_quiz = required_quiz_result.scalars().first()
        if required_quiz:
            completed_result = await db.execute(
                select(PublicQuizResponse).where(
                    PublicQuizResponse.user_id == current_user.id,
                    PublicQuizResponse.quiz_id == required_quiz.id,
                )
            )
            if not completed_result.scalars().first():
                raise HTTPException(
                    status_code=400,
                    detail={
                        "code": "QUIZ_REQUIRED",
                        "quiz_id": required_quiz.id,
                        "quiz_title": required_quiz.title,
                        "message": "Bạn cần hoàn thành khảo sát trước khi đặt lịch với chuyên gia này"
                    }
                )

        # Step 2: Validate booking duration
        duration_hours = (booking_in.end_time - booking_in.start_time).total_seconds() / 3600
        if duration_hours <= 0:
            raise HTTPException(status_code=400, detail="Invalid booking duration")

        # Step 2.5: Group Bookings Validation (max_participants)
        from sqlalchemy import and_, func
        from backend.app.domains.marketplace.models import ExpertAvailability
        
        day_of_week = booking_in.start_time.weekday()
        time_str = booking_in.start_time.strftime("%H:%M")
        
        avail_query = select(ExpertAvailability).where(
            ExpertAvailability.expert_id == expert.id,
            ExpertAvailability.day_of_week == day_of_week,
            ExpertAvailability.start_time == time_str
        )
        avail_result = await db.execute(avail_query)
        availability = avail_result.scalars().first()
        max_participants = availability.max_participants if availability else 1

        # Count existing bookings
        count_query = select(func.count(Booking.id)).where(
            Booking.expert_id == expert.id,
            Booking.start_time == booking_in.start_time,
            Booking.end_time == booking_in.end_time,
            Booking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS])
        )
        current_participants = await db.scalar(count_query) or 0
        
        if current_participants >= max_participants:
            raise HTTPException(status_code=400, detail="Lịch hẹn này đã đủ số lượng người tham gia.")
        
        # Check if we should auto-confirm and sync meeting_url
        new_status = BookingStatus.PENDING
        sync_meeting_url = None
        
        if max_participants > 1:
            new_status = BookingStatus.CONFIRMED  # Auto-confirm group bookings
            
        # If there are existing bookings, grab the meeting_url
        if current_participants > 0:
            existing_booking_query = select(Booking).where(
                Booking.expert_id == expert.id,
                Booking.start_time == booking_in.start_time,
                Booking.end_time == booking_in.end_time,
                Booking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS])
            )
            existing_booking_result = await db.execute(existing_booking_query)
            existing_booking = existing_booking_result.scalars().first()
            if existing_booking:
                sync_meeting_url = existing_booking.meeting_url

        # Step 3: Check if expert is a MENTOR (PWYW)
        expert_user_result = await db.execute(select(User).where(User.id == expert.user_id))
        expert_user = expert_user_result.scalars().first()
        is_pwyw = expert_user and expert_user.role.value == "MENTOR"
        total_cost = 0 if is_pwyw else int(duration_hours * expert.hourly_rate)

        # Step 4: USE SERVICE for atomic creation and credit hold
        booking = await booking_service.create_booking(
            db=db,
            student_id=current_user.id,
            expert_id=expert.id,
            start_time=booking_in.start_time,
            end_time=booking_in.end_time,
            total_cost=total_cost,
            student_note=booking_in.student_note,
            is_pwyw=is_pwyw,
            status=new_status,
            meeting_url=sync_meeting_url
        )

        await db.commit()

        # UC-38.0: Notify Expert & Student via Background Tasks
        # Use background tasks to prevent blocking the response
        async def send_booking_notifications():
            try:
                # 1. Notify Expert
                await create_notification(
                    recipient_id=expert.user_id,
                    sender_id=current_user.id,
                    title="Yêu cầu đặt lịch mới",
                    message=f"{current_user.full_name or 'Học viên'} đã gửi yêu cầu tư vấn.",
                    type=NotificationType.BOOKING,
                    priority=NotificationPriority.HIGH,
                    link=f"/dashboard/manage/bookings?booking={booking.id}"
                )
                # 2. Notify Student
                await create_notification(
                    recipient_id=current_user.id,
                    title="Đặt lịch thành công",
                    message=f"Yêu cầu tư vấn với {expert.user.full_name} đã được gửi đi.",
                    type=NotificationType.BOOKING,
                    priority=NotificationPriority.LOW,
                    link=f"/dashboard/student/bookings"
                )
                print(f"📡 [BG-TASK] Notifications sent for booking {booking.id}")
            except Exception as e:
                print(f"⚠️ [BG-TASK] Notification error: {e}")

        background_tasks.add_task(send_booking_notifications)

        return await _reload_booking(db, booking.id)

    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ─── Get Slot Status for Expert ──────────────────────────────────────────────────
@router.get("/experts/{expert_id}/slots-status")
async def get_slots_status(
    expert_id: int,
    date: str, # YYYY-MM-DD
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Get the occupancy of slots for a specific date."""
    try:
        from datetime import datetime, timedelta
        target_date = datetime.strptime(date, "%Y-%m-%d").date()
        start_dt = datetime.combine(target_date, datetime.min.time())
        end_dt = datetime.combine(target_date, datetime.max.time())
        
        # 1. Get current bookings for that day
        from sqlalchemy import func
        bookings_query = select(Booking.start_time, func.count(Booking.id)).where(
            Booking.expert_id == expert_id,
            Booking.start_time >= start_dt,
            Booking.start_time <= end_dt,
            Booking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS])
        ).group_by(Booking.start_time)
        
        result = await db.execute(bookings_query)
        occupancy = {str(row[0]): row[1] for row in result.all()}
        
        return occupancy
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

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
            allowed_domains = ["meet.google.com", "zoom.us", "zoom.com", "teams.microsoft.com", "teams.live.com", "webex.com", "skype.com"]
            if not any(domain in url for domain in allowed_domains):
                raise HTTPException(status_code=400, detail="Invalid meeting URL. Please use Google Meet, Zoom, Teams, Webex or Skype.")
            if not (url.startswith("http://") or url.startswith("https://")):
                raise HTTPException(status_code=400, detail="URL must start with http/https")
            booking.meeting_url = booking_update.meeting_url
            
            # Sync meeting_url for all group bookings in the same time slot
            sync_query = select(Booking).where(
                Booking.expert_id == booking.expert_id,
                Booking.start_time == booking.start_time,
                Booking.end_time == booking.end_time,
                Booking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS]),
                Booking.id != booking.id
            )
            sync_result = await db.execute(sync_query)
            for group_booking in sync_result.scalars().all():
                group_booking.meeting_url = booking_update.meeting_url
                db.add(group_booking)
        if booking_update.expert_note:
            booking.expert_note = booking_update.expert_note
        db.add(booking)
        await db.commit()
        return await _reload_booking(db, booking.id)

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
            print(f"WARNING: create_notification failed: {e}")

    elif new_status in [BookingStatus.CANCELLED, BookingStatus.REJECTED]:
        if current_status in [BookingStatus.COMPLETED, BookingStatus.CANCELLED, BookingStatus.REJECTED]:
            raise HTTPException(status_code=400, detail="Cannot cancel finalized booking")

        if is_expert and current_status == BookingStatus.CONFIRMED:
            raise HTTPException(
                status_code=403,
                detail="Expert cannot cancel a CONFIRMED booking. Contact admin for dispute resolution."
            )

        booking.status = new_status

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

    elif new_status == BookingStatus.COMPLETED:
        if not is_student:
            raise HTTPException(status_code=403, detail="Only student can mark booking as complete")
        if current_status not in [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS]:
            raise HTTPException(status_code=400, detail=f"Can only complete confirmed/in-progress bookings")

        booking.status = BookingStatus.COMPLETED

        if booking.is_pwyw:
            pass
        else:
            PLATFORM_COMMISSION_RATE = 0.20
            commission_amount = int(booking.total_amount * PLATFORM_COMMISSION_RATE)
            expert_payout = booking.total_amount - commission_amount

            expert_user_result = await db.execute(select(User).where(User.id == expert_profile.user_id))
            expert_user = expert_user_result.scalars().first()
            expert_user.credits += expert_payout
            db.add(expert_user)

            trx = PaymentTransaction(
                user_id=expert_user.id, booking_id=booking.id,
                amount=expert_payout, type=TransactionType.BOOKING_RELEASE,
                status=TransactionStatus.COMPLETED,
                description=f"Expert payout (80%) for booking #{booking.id}",
            )
            db.add(trx)

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
        print(f"WARNING: send_system_message failed: {e}")

    return await _reload_booking(db, booking.id)

# ─── Dispute Booking ──────────────────────────────────────────────────────────

@router.post("/{booking_id}/dispute", response_model=BookingDisputeSchema)
async def dispute_booking(
    booking_id: int,
    dispute_in: BookingDisputeCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Raise a dispute for a booking."""
    query = select(Booking).where(Booking.id == booking_id).options(selectinload(Booking.expert))
    result = await db.execute(query)
    booking = result.scalars().first()

    if not booking: raise HTTPException(status_code=404, detail="Booking not found")
    if booking.student_id != current_user.id: raise HTTPException(status_code=403, detail="Only student can raise a dispute")

    booking.status = BookingStatus.DISPUTED
    db.add(booking)

    dispute = BookingDispute(
        booking_id=booking.id, user_id=current_user.id,
        reason=dispute_in.reason, description=dispute_in.description,
        contact_info=dispute_in.contact_info,
    )
    db.add(dispute)
    await db.flush()

    # UC-38.2: Notify Admins of new dispute
    try:
        await notify_all_admins(
            db=db,
            title="Khiếu nại mới",
            message=f"Học viên {current_user.full_name or current_user.email} đã gửi khiếu nại cho buổi tư vấn #{booking.id}. Lý do: {dispute_in.reason}",
            link=f"/dashboard/admin/disputes",
            priority=NotificationPriority.HIGH,
            data={"booking_id": booking.id, "dispute_id": dispute.id}
        )
    except Exception as e:
        print(f"WARNING: Admin notification failed: {e}")

    await db.commit()
    await db.refresh(dispute)
    return dispute

# ─── Admin Dispute Management ──────────────────────────────────────────────────

@router.get("/disputes/all", response_model=List[BookingDisputeSchema])
async def list_all_disputes(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_superuser),
) -> Any:
    """List all disputes (Admin only)."""
    query = select(BookingDispute).options(
        selectinload(BookingDispute.user),
        selectinload(BookingDispute.booking).selectinload(Booking.expert).selectinload(ExpertProfile.user)
    ).order_by(BookingDispute.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()

@router.patch("/disputes/{dispute_id}", response_model=BookingDisputeSchema)
async def update_dispute_status(
    dispute_id: int,
    dispute_update: BookingDisputeUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_superuser),
) -> Any:
    """Update dispute status (Admin only)."""
    query = select(BookingDispute).where(BookingDispute.id == dispute_id)
    result = await db.execute(query)
    dispute = result.scalars().first()

    if not dispute: raise HTTPException(status_code=404, detail="Dispute not found")

    dispute.status = dispute_update.status
    if dispute_update.admin_note:
        dispute.admin_note = dispute_update.admin_note
    
    db.add(dispute)
    await db.commit()
    await db.refresh(dispute)
    return dispute
