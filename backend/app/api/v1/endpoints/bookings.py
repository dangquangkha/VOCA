from typing import Any, List
from datetime import datetime, timezone
import logging
import math

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import select as sa_select, func

from backend.app.api import deps
from backend.app.domains.identity.models import User, UserRole
from backend.app.domains.marketplace.models import ExpertProfile
from backend.app.domains.booking.models import Booking, BookingStatus
from backend.app.schemas.booking import Booking as BookingSchema, BookingCreate, BookingUpdate, PaginatedBookingResponse
from backend.app.services.business.booking_service import BookingService

logger = logging.getLogger(__name__)

router = APIRouter()

# ─── Helpers ──────────────────────────────────────────────────────────────────

# Helpers and Logic moved to BookingService


# ─── Create booking ───────────────────────────────────────────────────────────

@router.post("/", response_model=BookingSchema)
async def create_booking(
    booking_in: BookingCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    return await BookingService.create_booking(db, current_user, booking_in)


# ─── List bookings ────────────────────────────────────────────────────────────

@router.get("/", response_model=PaginatedBookingResponse)
async def read_bookings(
    db: AsyncSession = Depends(deps.get_db),
    page: int = Query(default=1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(default=20, ge=1, le=100, description="Items per page"),
    status: BookingStatus | None = Query(default=None, description="Filter by status"),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """List bookings for current user with pagination metadata."""
    base_query = select(Booking)

    # Role-based filtering
    if current_user.role == UserRole.ADMIN:
        pass  # Admin sees all
    elif current_user.role == UserRole.STUDENT:
        base_query = base_query.where(Booking.student_id == current_user.id)
    elif current_user.role in [UserRole.EXPERT, UserRole.MENTOR]:
        subq = select(ExpertProfile.id).where(ExpertProfile.user_id == current_user.id)
        base_query = base_query.where(Booking.expert_id.in_(subq))

    if status:
        base_query = base_query.where(Booking.status == status)

    # Count total (without pagination)
    count_result = await db.execute(select(func.count()).select_from(base_query.subquery()))
    total = count_result.scalar_one()
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    # Fetch page
    skip = (page - 1) * page_size
    data_query = (
        base_query
        .order_by(Booking.start_time.desc())
        .offset(skip)
        .limit(page_size)
        .options(
            selectinload(Booking.student).selectinload(User.expert_profile),
            selectinload(Booking.expert).selectinload(ExpertProfile.user).selectinload(User.expert_profile),
            selectinload(Booking.expert).selectinload(ExpertProfile.availabilities),
        )
    )
    result = await db.execute(data_query)
    items = result.scalars().all()

    return PaginatedBookingResponse(
        items=list(items),
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


# ─── UC-37: Check-in ─────────────────────────────────────────────────────────

@router.post("/{booking_id}/checkin", response_model=BookingSchema)
async def checkin_booking(
    booking_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    return await BookingService.checkin_booking(db, current_user, booking_id)


# ─── UC-37: No-show resolution (called on GET or triggered manually) ──────────

@router.post("/{booking_id}/resolve-noshow", response_model=BookingSchema)
async def resolve_noshow(
    booking_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    return await BookingService.resolve_noshow(db, current_user, booking_id)


# ─── Update booking status ────────────────────────────────────────────────────

@router.put("/{booking_id}", response_model=BookingSchema)
async def update_booking_status(
    booking_id: int,
    booking_update: BookingUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    return await BookingService.update_booking_status(db, current_user, booking_id, booking_update)
