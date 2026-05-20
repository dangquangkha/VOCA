"""
Background Worker — Booking Auto-Resolution (VOCA Platform)

Functions handled:
  BL-04 — Auto-resolve no-show after T+10min (CONFIRMED → CANCELLED_*_NO_SHOW)
  BL-05 — Auto-complete sessions stuck > 48h in IN_PROGRESS (release 80% payout)
  AUTO-CANCEL — Auto-cancel PENDING bookings after 24h if expert never confirmed
  AUTO-START — Auto-transition CONFIRMED → IN_PROGRESS at booking start_time

Scheduler: ARQ (async Redis Queue) — runs independently from uvicorn.
Usage:
    pip install arq redis
    arq backend.workers.booking_worker.WorkerSettings

Requirements:
    - REDIS_URL in backend/.env (e.g., redis://localhost:6379)
    - Same DATABASE_URL as the main FastAPI app

Notes:
    - All DB operations use the same async SQLAlchemy session setup as the app.
    - Deploy this worker separately from uvicorn in production.
    - Commission rate: Platform keeps 20%, expert receives 80% (BL-03).
"""

import logging
from datetime import datetime, timezone, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from backend.app.core.config import settings

# ── DDD-correct model imports ─────────────────────────────────────────────────
from backend.app.domains.booking.models import Booking, BookingStatus
from backend.app.domains.identity.models import User
from backend.app.domains.payments.models import PaymentTransaction, TransactionType, TransactionStatus

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Platform commission: expert receives 80%, platform keeps 20%
PLATFORM_COMMISSION_RATE = 0.20


# ─── DB Session Factory ────────────────────────────────────────────────────────

def _make_session_factory():
    engine = create_async_engine(
        settings.DATABASE_URL, 
        echo=False,
        pool_size=10,
        max_overflow=20,
        pool_timeout=30
    )
    return async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


# ─── BL-04: Auto No-Show Resolution ───────────────────────────────────────────

async def resolve_noshow_bookings(db: AsyncSession) -> int:
    """
    BL-04: Find CONFIRMED bookings where start_time + 10min has passed
    but no check-ins happened. Resolve to appropriate no-show status and handle credits.

    Rules:
      - Mutual no-show       → refund student
      - Expert no-show only  → refund student (BR-37.2)
      - Student no-show only → release 80% to expert (BR-37.2)

    Returns number of bookings resolved.
    """
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(minutes=10)  # T+10min

    result = await db.execute(
        select(Booking).where(
            Booking.status == BookingStatus.CONFIRMED,
            Booking.start_time <= cutoff,
        )
    )
    bookings = result.scalars().all()
    resolved = 0

    for booking in bookings:
        student_checked = booking.student_checked_in_at is not None
        expert_checked  = booking.expert_checked_in_at is not None

        # Load involved users
        student_r = await db.execute(select(User).where(User.id == booking.student_id))
        student   = student_r.scalars().first()

        # Load expert user via ExpertProfile
        from backend.app.domains.marketplace.models import ExpertProfile  # local to avoid circular
        ep_r = await db.execute(select(ExpertProfile).where(ExpertProfile.id == booking.expert_id))
        ep   = ep_r.scalars().first()
        expert_user_r = await db.execute(select(User).where(User.id == ep.user_id))
        expert_user   = expert_user_r.scalars().first()

        if not student_checked and not expert_checked:
            # Mutual no-show → refund student
            booking.status = BookingStatus.CANCELLED_MUTUAL_NO_SHOW
            student.credits += booking.total_amount
            db.add(student)
            db.add(PaymentTransaction(
                user_id=student.id, booking_id=booking.id,
                amount=booking.total_amount, type=TransactionType.BOOKING_REFUND,
                status=TransactionStatus.COMPLETED,
                description=f"[Worker BL-04] Auto-refund: mutual no-show booking #{booking.id}",
            ))

        elif not expert_checked and student_checked:
            # Expert no-show → refund student (BR-37.2)
            booking.status = BookingStatus.CANCELLED_EXPERT_NO_SHOW
            student.credits += booking.total_amount
            db.add(student)
            db.add(PaymentTransaction(
                user_id=student.id, booking_id=booking.id,
                amount=booking.total_amount, type=TransactionType.BOOKING_REFUND,
                status=TransactionStatus.COMPLETED,
                description=f"[Worker BL-04] Auto-refund: expert no-show booking #{booking.id}",
            ))

        elif not student_checked and expert_checked:
            # Student no-show → release 80% to expert (BR-37.2, BL-03 commission)
            booking.status = BookingStatus.CANCELLED_USER_NO_SHOW
            payout = booking.total_amount - int(booking.total_amount * PLATFORM_COMMISSION_RATE)
            commission = booking.total_amount - payout
            expert_user.credits += payout
            db.add(expert_user)
            db.add(PaymentTransaction(
                user_id=expert_user.id, booking_id=booking.id,
                amount=payout, type=TransactionType.BOOKING_RELEASE,
                status=TransactionStatus.COMPLETED,
                description=f"[Worker BL-04] Auto-release (80%): student no-show booking #{booking.id}",
            ))
            db.add(PaymentTransaction(
                user_id=expert_user.id, booking_id=booking.id,
                amount=commission, type=TransactionType.SERVICE_PAYMENT,
                status=TransactionStatus.COMPLETED,
                description=f"[Worker BL-04] Platform commission (20%) booking #{booking.id}",
            ))

        db.add(booking)
        resolved += 1
        logger.info(f"[Worker BL-04] Resolved booking #{booking.id} → {booking.status}")

    if resolved:
        await db.commit()
    return resolved


# ─── BL-05: Auto-Complete Stale IN_PROGRESS Sessions ─────────────────────────

async def auto_complete_bookings(db: AsyncSession) -> int:
    """
    BL-05: Auto-complete sessions stuck > 48h in IN_PROGRESS.
    Student didn't mark COMPLETED (forgot or left) — worker releases 80% payout.

    Uses end_time as the reference: any session whose end_time + 48h has passed
    is considered abandoned and auto-completed.
    """
    now = datetime.now(timezone.utc)
    cutoff_48h = now - timedelta(hours=48)

    result = await db.execute(
        select(Booking).where(
            Booking.status == BookingStatus.IN_PROGRESS,
            Booking.end_time <= cutoff_48h,
        )
    )
    bookings = result.scalars().all()
    resolved = 0

    for booking in bookings:
        payout = booking.total_amount - int(booking.total_amount * PLATFORM_COMMISSION_RATE)
        commission = booking.total_amount - payout

        from backend.app.domains.marketplace.models import ExpertProfile
        ep_r = await db.execute(select(ExpertProfile).where(ExpertProfile.id == booking.expert_id))
        ep   = ep_r.scalars().first()
        expert_user_r = await db.execute(select(User).where(User.id == ep.user_id))
        expert_user   = expert_user_r.scalars().first()

        expert_user.credits += payout
        db.add(expert_user)
        booking.status = BookingStatus.COMPLETED
        db.add(booking)

        db.add(PaymentTransaction(
            user_id=expert_user.id, booking_id=booking.id,
            amount=payout, type=TransactionType.BOOKING_RELEASE,
            status=TransactionStatus.COMPLETED,
            description=f"[Worker BL-05] Auto-complete payout (80%) booking #{booking.id}",
        ))
        db.add(PaymentTransaction(
            user_id=expert_user.id, booking_id=booking.id,
            amount=commission, type=TransactionType.SERVICE_PAYMENT,
            status=TransactionStatus.COMPLETED,
            description=f"[Worker BL-05] Platform commission (20%) booking #{booking.id}",
        ))

        resolved += 1
        logger.info(f"[Worker BL-05] Auto-completed stale booking #{booking.id}")

    if resolved:
        await db.commit()
    return resolved


# ─── AUTO-CANCEL: Cancel PENDING bookings after 24h (expert didn't confirm) ──

async def auto_cancel_pending_bookings(db: AsyncSession) -> int:
    """
    Auto-cancel PENDING bookings after 24h if expert hasn't confirmed.
    Refunds student and releases the escrow hold.
    """
    threshold = datetime.now(timezone.utc) - timedelta(hours=24)

    result = await db.execute(
        select(Booking).where(
            Booking.status == BookingStatus.PENDING,
            Booking.created_at <= threshold,
        )
    )
    bookings = result.scalars().all()
    resolved = 0

    for booking in bookings:
        # Refund student
        student_r = await db.execute(select(User).where(User.id == booking.student_id))
        student = student_r.scalars().first()
        if student:
            student.credits += booking.total_amount
            db.add(student)
            db.add(PaymentTransaction(
                user_id=student.id, booking_id=booking.id,
                amount=booking.total_amount, type=TransactionType.BOOKING_REFUND,
                status=TransactionStatus.COMPLETED,
                description=f"[Worker AUTO-CANCEL] Auto-refund: PENDING booking #{booking.id} expired (24h)",
            ))

        booking.status = BookingStatus.CANCELLED
        booking.rejection_reason = "Automatically cancelled: expert did not confirm within 24 hours."
        db.add(booking)
        resolved += 1
        logger.info(f"[Worker AUTO-CANCEL] Cancelled stale PENDING booking #{booking.id}")

    if resolved:
        await db.commit()
    return resolved


# ─── AUTO-START: Transition CONFIRMED → IN_PROGRESS at start_time ────────────

async def auto_start_confirmed_bookings(db: AsyncSession) -> int:
    """
    Auto-transition CONFIRMED → IN_PROGRESS when start_time has arrived.
    This ensures sessions have the correct status even if check-in was not triggered by the frontend.
    """
    now = datetime.now(timezone.utc)

    result = await db.execute(
        select(Booking).where(
            Booking.status == BookingStatus.CONFIRMED,
            Booking.start_time <= now,
        )
    )
    bookings = result.scalars().all()
    started = 0

    for booking in bookings:
        booking.status = BookingStatus.IN_PROGRESS
        db.add(booking)
        started += 1
        logger.info(f"[Worker AUTO-START] Booking #{booking.id} transitioned CONFIRMED → IN_PROGRESS")

    if started:
        await db.commit()
    return started


# ─── ARQ Task Functions ────────────────────────────────────────────────────────

async def task_resolve_noshows(ctx: dict) -> str:
    """ARQ task: BL-04 — runs every 5 minutes."""
    session_factory = ctx["session_factory"]
    async with session_factory() as db:
        count = await resolve_noshow_bookings(db)
    return f"BL-04: Resolved {count} no-show booking(s)"


async def task_auto_complete(ctx: dict) -> str:
    """ARQ task: BL-05 — runs every hour."""
    session_factory = ctx["session_factory"]
    async with session_factory() as db:
        count = await auto_complete_bookings(db)
    return f"BL-05: Auto-completed {count} stale booking(s)"


async def task_auto_cancel_pending(ctx: dict) -> str:
    """ARQ task: Cancel PENDING bookings after 24h — runs every 30 minutes."""
    session_factory = ctx["session_factory"]
    async with session_factory() as db:
        count = await auto_cancel_pending_bookings(db)
    return f"AUTO-CANCEL: Cancelled {count} stale PENDING booking(s)"


async def task_auto_start(ctx: dict) -> str:
    """ARQ task: Transition CONFIRMED → IN_PROGRESS at start_time — runs every minute."""
    session_factory = ctx["session_factory"]
    async with session_factory() as db:
        count = await auto_start_confirmed_bookings(db)
    return f"AUTO-START: Started {count} confirmed booking(s)"


# ─── Worker Lifecycle ──────────────────────────────────────────────────────────

async def startup(ctx: dict):
    """Called once when ARQ worker starts."""
    ctx["session_factory"] = _make_session_factory()
    logger.info("[Worker] Startup complete. DB session factory ready.")


async def shutdown(ctx: dict):
    """Called once when ARQ worker shuts down."""
    logger.info("[Worker] Shutdown.")


# ─── ARQ WorkerSettings ────────────────────────────────────────────────────────

try:
    import arq
    from arq.cron import cron

    class WorkerSettings:
        """
        ARQ worker configuration.
        Start with: arq backend.workers.booking_worker.WorkerSettings
        Requires: REDIS_URL in environment (default: redis://localhost:6379)
        """
        redis_settings = arq.connections.RedisSettings.from_dsn(
            getattr(settings, "REDIS_URL", "redis://localhost:6379")
        )
        functions = [
            task_resolve_noshows,
            task_auto_complete,
            task_auto_cancel_pending,
            task_auto_start,
        ]
        on_startup = startup
        on_shutdown = shutdown
        cron_jobs = [
            # BL-04: Resolve no-shows every 5 minutes
            cron(task_resolve_noshows, minute={0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55}),
            # BL-05: Auto-complete stale IN_PROGRESS sessions hourly
            cron(task_auto_complete, hour=set(range(24)), minute={0}),
            # AUTO-CANCEL: Cancel stale PENDING every 30 minutes
            cron(task_auto_cancel_pending, minute={0, 30}),
            # AUTO-START: Transition CONFIRMED → IN_PROGRESS every minute
            cron(task_auto_start, minute=set(range(60))),
        ]

except ImportError:
    logger.warning("[Worker] WARNING: 'arq' not installed. Install with: pip install arq redis")
    WorkerSettings = None  # type: ignore
