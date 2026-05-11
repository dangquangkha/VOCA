from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.api import deps
from backend.app.domains.identity.models import User, UserStatus
from backend.app.domains.marketplace.models import ExpertProfile
from backend.app.domains.booking.models import Booking, BookingStatus
from backend.app.models.account_action import AccountAction, AccountActionType
from backend.app.models.blacklist import Blacklist
from backend.app.core.email import send_email
from backend.app.templates.moderation_emails import (
    get_suspension_email,
    get_unsuspension_email,
    get_ban_email,
    get_unban_email
)

router = APIRouter()

# Request/Response Schemas
class SuspendExpertRequest(BaseModel):
    reason: str
    notes: str | None = None
    acknowledge_booking_cancellation: bool = False

class UnsuspendExpertRequest(BaseModel):
    notes: str | None = None

class BanUserRequest(BaseModel):
    reason: str  # "Harassment", "Payment Fraud", "Spam", "Fake Account"
    notes: str | None = None
    forfeit_credits: bool = False

class UnbanUserRequest(BaseModel):
    notes: str | None = None
    restore_credits: bool = False
    previous_balance: int = 0

@router.post("/experts/{expert_id}/suspend")
async def suspend_expert(
    expert_id: int,
    request: SuspendExpertRequest,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    UC-31: Suspend expert account
    - Updates status to SUSPENDED
    - Cancels pending bookings
    - Refunds students 100%
    - Sends notification email
    - Logs action
    """
    # Check admin permission
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    #Get expert user
    result = await db.execute(select(User).where(User.id == expert_id))
    expert = result.scalars().first()
    
    if not expert:
        raise HTTPException(status_code=404, detail="Expert not found")
    
    if expert.account_status == UserStatus.SUSPENDED:
        raise HTTPException(status_code=400, detail="Expert already suspended")
    
    # Check for pending bookings
    pending_bookings_query = select(Booking).where(
        Booking.expert_id == expert_id,
        Booking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED])
    )
    pending_result = await db.execute(pending_bookings_query)
    pending_bookings = pending_result.scalars().all()
    
    if pending_bookings and not request.acknowledge_booking_cancellation:
        raise HTTPException(
            status_code=400,
            detail=f"Expert has {len(pending_bookings)} upcoming appointments. Set acknowledge_booking_cancellation=true to proceed"
        )
    
    # Update expert status
    expert.account_status = UserStatus.SUSPENDED
    db.add(expert)
    
    # Cancel pending bookings
    for booking in pending_bookings:
        booking.status = BookingStatus.CANCELLED_BY_ADMIN
       
# Refund student 100%
        student_result = await db.execute(select(User).where(User.id == booking.student_id))
        student = student_result.scalars().first()
        if student:
            student.credits += booking.total_amount
            db.add(student)
            
            # TODO: Send email to student about cancellation
    
    # Log action
    action = AccountAction(
        action_type=AccountActionType.SUSPEND_EXPERT,
        target_user_id=expert_id,
        admin_id=current_user.id,
        reason=request.reason,
        notes=request.notes
    )
    db.add(action)
    
    await db.commit()
    await db.refresh(expert)
    
    # Send suspension email to expert
    subject, body = get_suspension_email(expert.full_name or "User", request.reason)
    await send_email(to=expert.email, subject=subject, body=body, db=db)
    
    return {"message": "Expert suspended successfully", "cancelled_bookings": len(pending_bookings)}

@router.post("/experts/{expert_id}/unsuspend")
async def unsuspend_expert(
    expert_id: int,
    request: UnsuspendExpertRequest,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    UC-31: Unsuspend expert account
    - Updates status to ACTIVE
    - Sends restoration email
    - Logs action
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.execute(select(User).where(User.id == expert_id))
    expert = result.scalars().first()
    
    if not expert:
        raise HTTPException(status_code=404, detail="Expert not found")
    
    if expert.account_status != UserStatus.SUSPENDED:
        raise HTTPException(status_code=400, detail="Expert is not suspended")
    
    # Update status
    expert.account_status = UserStatus.ACTIVE
    db.add(expert)
    
    # Log action
    action = AccountAction(
        action_type=AccountActionType.UNSUSPEND_EXPERT,
        target_user_id=expert_id,
        admin_id=current_user.id,
        reason="Account restored",
        notes=request.notes
    )
    db.add(action)
    
    await db.commit()
    await db.refresh(expert)
    
    # Send restoration email
    subject, body = get_unsuspension_email(expert.full_name or "User")
    await send_email(to=expert.email, subject=subject, body=body, db=db)
    
    return {"message": "Expert unsuspended successfully"}

@router.post("/users/{user_id}/ban")
async def ban_user(
    user_id: int,
    request: BanUserRequest,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    UC-33: Ban user account
    - Updates status to BANNED
    - Sets is_active = False (force logout)
    - Optionally forfeits credits
    - Adds to blacklist
    - Cancels pending bookings
    - Logs action
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.account_status == UserStatus.BANNED:
        raise HTTPException(status_code=400, detail="User already banned")
    
    # Update user status
    user.account_status = UserStatus.BANNED
    user.is_active = False  # Force logout
    
    if request.forfeit_credits:
        user.credits = 0
    
    db.add(user)
    
    # Add to blacklist
    blacklist_entry = Blacklist(
        email=user.email,
        phone_number=user.phone_number,
        reason=request.reason,
        banned_user_id=user_id
    )
    db.add(blacklist_entry)
    
    # Cancel pending bookings as student
    pending_bookings_query = select(Booking).where(
        Booking.student_id == user_id,
        Booking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED])
    )
    pending_result = await db.execute(pending_bookings_query)
    pending_bookings = pending_result.scalars().all()
    
    for booking in pending_bookings:
        booking.status = BookingStatus.CANCELLED_BY_ADMIN
        db.add(booking)
        # Handle refunds based on reason - TODO: implement proper logic
    
    # Log action
    action = AccountAction(
        action_type=AccountActionType.BAN_USER,
        target_user_id=user_id,
        admin_id=current_user.id,
        reason=request.reason,
        notes=request.notes
    )
    db.add(action)
    
    await db.commit()
    
    # Send ban notification email
    subject, body = get_ban_email(user.full_name or "User", request.reason)
    await send_email(to=user.email, subject=subject, body=body, db=db)
    
    return {"message": "User banned successfully", "cancelled_bookings": len(pending_bookings)}

@router.post("/users/{user_id}/unban")
async def unban_user(
    user_id: int,
    request: UnbanUserRequest,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    UC-36: Unban user account
    - Updates status to ACTIVE
    - Sets is_active = True
    - Optionally restores credits
    - Removes from blacklist
    - Logs action
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.account_status != UserStatus.BANNED:
        raise HTTPException(status_code=400, detail="User is not banned")
    
    # Update user status
    user.account_status = UserStatus.ACTIVE
    user.is_active = True
    
    if request.restore_credits:
        user.credits = request.previous_balance
    
    db.add(user)
    
    # Remove from blacklist
    await db.execute(
        select(Blacklist).where(Blacklist.banned_user_id == user_id)
    )
    blacklist_result = await db.execute(select(Blacklist).where(Blacklist.banned_user_id == user_id))
    blacklist_entries = blacklist_result.scalars().all()
    for entry in blacklist_entries:
        await db.delete(entry)
    
    # Log action
    action = AccountAction(
        action_type=AccountActionType.UNBAN_USER,
        target_user_id=user_id,
        admin_id=current_user.id,
        reason="Account restore",
        notes=request.notes
    )
    db.add(action)
    
    await db.commit()
    
    # Send restoration email
    subject, body = get_unban_email(user.full_name or "User")
    await send_email(to=user.email, subject=subject, body=body, db=db)
    
    return {"message": "User unbanned successfully"}
