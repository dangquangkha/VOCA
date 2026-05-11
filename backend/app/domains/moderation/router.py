from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from backend.app.api import deps
from backend.app.domains.identity.models import User, UserRole, UserStatus
from backend.app.domains.marketplace.models import ExpertProfile, KYCStatus
from backend.app.domains.booking.models import Booking
from backend.app.domains.payments.models import PaymentTransaction
from backend.app.schemas.user import User as UserSchema, PaginatedUserResponse
from backend.app.schemas.expert import ExpertProfileRead, ExpertProfileShort
from backend.app.models.email_log import EmailLog
from backend.app.schemas.email_log import EmailLogRead
from pydantic import BaseModel

router = APIRouter()

class AdminStats(BaseModel):
    total_users: int
    total_experts: int
    total_bookings: int
    total_revenue: int

@router.get("/emails", response_model=List[EmailLogRead])
async def get_email_logs(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Get email logs. Requires Superuser.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough privileges")
    
    result = await db.execute(select(EmailLog).order_by(EmailLog.sent_at.desc()).offset(skip).limit(limit))
    return result.scalars().all()

@router.get("/stats", response_model=AdminStats)
async def get_admin_stats(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get platform statistics. Requires Superuser.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough privileges")
    
    # Count Users
    users_count = await db.scalar(select(func.count(User.id)))
    
    # Count Experts
    experts_count = await db.scalar(select(func.count(ExpertProfile.id)))
    
    # Count Bookings
    bookings_count = await db.scalar(select(func.count(Booking.id)))
    
    # Calc Revenue: sum of platform commission (SERVICE_PAYMENT = 20% per booking)
    # UPDATE (ARCH-11 + BL-03): Revenue is now computable from SERVICE_PAYMENT transactions
    from backend.app.domains.payments.models import TransactionType, TransactionStatus
    revenue = await db.scalar(
        select(func.sum(PaymentTransaction.amount)).where(
            PaymentTransaction.type == TransactionType.SERVICE_PAYMENT,
            PaymentTransaction.status == TransactionStatus.COMPLETED,
        )
    )

    return {
        "total_users": users_count or 0,
        "total_experts": experts_count or 0,
        "total_bookings": bookings_count or 0,
        "total_revenue": revenue or 0,
    }

@router.get("/users", response_model=PaginatedUserResponse)
async def list_users(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 100,
    role: UserRole | None = None,
    account_status: UserStatus | None = None,
    is_active: bool | None = None,
    search: str | None = None,
    sort_by: str = "created_at",
    sort_desc: bool = True,
) -> Any:
    """
    List all users with pagination and filtering. Requires Superuser.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough privileges")
    
    # Base query
    query = select(User)
    
    # Filters
    if role:
        query = query.where(User.role == role)
    if account_status:
        query = query.where(User.account_status == account_status)
    if is_active is not None:
        query = query.where(User.is_active == is_active)
    if search:
        # Search by email or full_name
        query = query.where(
            (User.email.ilike(f"%{search}%")) | 
            (User.full_name.ilike(f"%{search}%"))
        )
        
    # Count Total
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)
    
    # UPDATE (ARCH-11): Now sorts by real User.created_at field (was using User.id as proxy)
    sort_column = User.created_at if sort_by == "created_at" else User.id
    query = query.order_by(sort_column.desc() if sort_desc else sort_column.asc())
            
    # Pagination
    query = query.options(selectinload(User.expert_profile)).offset(skip).limit(limit)
    
    result = await db.execute(query)
    users = result.scalars().all()
    
    return {
        "items": users,
        "total": total or 0,
        "page": (skip // limit) + 1,
        "page_size": limit,
        "total_pages": ((total or 0) + limit - 1) // limit
    }


@router.get("/experts", response_model=List[ExpertProfileShort])
async def list_experts(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    status: KYCStatus | None = None,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    List experts (optionally filter by KYC status). Requires Superuser.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough privileges")
    
    query = select(ExpertProfile).options(
        selectinload(ExpertProfile.user).selectinload(User.expert_profile), # Deep load for circular schema
        selectinload(ExpertProfile.availabilities)
    )
    if status:
        query = query.where(ExpertProfile.kyc_status == status)
        
    result = await db.execute(query.offset(skip).limit(limit))
    return result.scalars().all()

@router.put("/experts/{expert_id}/kyc", response_model=ExpertProfileShort)
async def update_kyc_status(
    expert_id: int,
    status: KYCStatus,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Approve or Reject Expert KYC. Requires Superuser.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough privileges")
    
    expert = await db.get(ExpertProfile, expert_id)
    if not expert:
        raise HTTPException(status_code=404, detail="Expert not found")
        
    expert.kyc_status = status
    db.add(expert)
    await db.commit()
    
    # Re-fetch with eager load to return valid schema
    result = await db.execute(
        select(ExpertProfile)
        .where(ExpertProfile.id == expert_id)
        .options(
            selectinload(ExpertProfile.user),
            selectinload(ExpertProfile.availabilities)
        )
    )
    expert = result.scalars().first()
    
    return expert

@router.put("/experts/{expert_id}/approve", response_model=ExpertProfileShort)
async def approve_expert(
    expert_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Approve Expert KYC. Requires Superuser.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough privileges")
    
    expert = await db.get(ExpertProfile, expert_id)
    if not expert:
        raise HTTPException(status_code=404, detail="Expert not found")
        
    expert.kyc_status = KYCStatus.APPROVED
    db.add(expert)
    await db.commit()
    
    # Send Notification (Email/Chat) placeholder
    
    query = select(ExpertProfile).where(ExpertProfile.id == expert_id).options(
        selectinload(ExpertProfile.user).selectinload(User.expert_profile), 
        selectinload(ExpertProfile.availabilities)
    )
    result = await db.execute(query)
    return result.scalars().first()

@router.put("/experts/{expert_id}/reject", response_model=ExpertProfileShort)
async def reject_expert(
    expert_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Reject Expert KYC. Requires Superuser.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough privileges")
    
    expert = await db.get(ExpertProfile, expert_id)
    if not expert:
        raise HTTPException(status_code=404, detail="Expert not found")
        
    expert.kyc_status = KYCStatus.REJECTED
    db.add(expert)
    await db.commit()
    
    query = select(ExpertProfile).where(ExpertProfile.id == expert_id).options(
         selectinload(ExpertProfile.user).selectinload(User.expert_profile), 
         selectinload(ExpertProfile.availabilities)
    )
    result = await db.execute(query)
    return result.scalars().first()

