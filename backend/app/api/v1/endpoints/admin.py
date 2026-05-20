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
from backend.app.schemas.expert import ExpertProfileRead, ExpertProfileShort, AdminExpertCreate, PaginatedExpertResponse, ExpertProfileUpdate
from backend.app.models.email_log import EmailLog
from backend.app.schemas.email_log import EmailLogRead
from pydantic import BaseModel

router = APIRouter()

class AdminStats(BaseModel):
    total_users: int
    total_experts: int
    total_bookings: int
    total_revenue: int
    pending_withdrawals: int
    pending_refunds: int
    open_disputes: int
    open_support_tickets: int
    pending_experts: int

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
    
    try:
        result = await db.execute(select(EmailLog).order_by(EmailLog.sent_at.desc()).offset(skip).limit(limit))
        return result.scalars().all()
    except Exception as e:
        # Log error but don't crash the whole API
        print(f"ERROR fetching email logs: {e}")
        return []

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
    
    async def get_stat(query):
        try:
            return await db.scalar(query)
        except Exception as e:
            print(f"Error fetching stat: {e}")
            return 0

    # Count Users
    users_count = await get_stat(select(func.count(User.id)))
    
    # Count Experts
    experts_count = await get_stat(select(func.count(ExpertProfile.id)))
    
    # Count Bookings
    bookings_count = await get_stat(select(func.count(Booking.id)))
    
    # Calc Revenue: sum of platform commission (SERVICE_PAYMENT = 20% per booking)
    from backend.app.domains.payments.models import TransactionType, TransactionStatus
    revenue = await get_stat(
        select(func.sum(PaymentTransaction.amount)).where(
            PaymentTransaction.type == TransactionType.SERVICE_PAYMENT,
            PaymentTransaction.status == TransactionStatus.COMPLETED,
        )
    )

    # Pending Withdrawals
    pending_withdrawals = await get_stat(
        select(func.count(PaymentTransaction.id)).where(
            PaymentTransaction.type == TransactionType.WITHDRAWAL,
            PaymentTransaction.status == TransactionStatus.PENDING_PAYOUT
        )
    )

    # Pending Refunds
    pending_refunds = await get_stat(
        select(func.count(PaymentTransaction.id)).where(
            PaymentTransaction.type == TransactionType.REFUND_REQUEST,
            PaymentTransaction.status == TransactionStatus.PENDING
        )
    )

    # Open Disputes
    from backend.app.domains.booking.models import BookingDispute, DisputeStatus
    open_disputes = await get_stat(
        select(func.count(BookingDispute.id)).where(
            BookingDispute.status == DisputeStatus.PENDING
        )
    )

    # Open Support Tickets
    try:
        from backend.app.models.support import SupportTicket, SupportStatus
        open_support_tickets = await db.scalar(
            select(func.count(SupportTicket.id)).where(
                SupportTicket.status == SupportStatus.OPEN
            )
        )
    except Exception as e:
        print(f"Error fetching support tickets: {e}")
        open_support_tickets = 0

    # Pending Experts
    pending_experts = await get_stat(
        select(func.count(ExpertProfile.id)).where(
            ExpertProfile.kyc_status == KYCStatus.PENDING
        )
    )

    return {
        "total_users": users_count or 0,
        "total_experts": experts_count or 0,
        "total_bookings": bookings_count or 0,
        "total_revenue": revenue or 0,
        "pending_withdrawals": pending_withdrawals or 0,
        "pending_refunds": pending_refunds or 0,
        "open_disputes": open_disputes or 0,
        "open_support_tickets": open_support_tickets or 0,
        "pending_experts": pending_experts or 0,
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

@router.post("/experts", response_model=ExpertProfileShort)
async def create_expert_admin(
    expert_in: AdminExpertCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Admin manually creates an Expert account.
    Requires Superuser.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough privileges")
        
    from backend.app.schemas.expert import AdminExpertCreate
    from backend.app.core import security
    
    # Check if user already exists
    existing_user = await db.scalar(select(User).where(User.email == expert_in.email))
    if existing_user:
        raise HTTPException(status_code=400, detail="Email này đã được sử dụng bởi một người dùng khác.")
        
    # Create User
    new_user = User(
        email=expert_in.email,
        full_name=expert_in.full_name,
        hashed_password=security.get_password_hash(expert_in.password),
        role=UserRole.EXPERT,
        is_active=True
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    # Create ExpertProfile
    new_profile = ExpertProfile(
        user_id=new_user.id,
        kyc_status=KYCStatus.APPROVED,
        experience_years=0,
        hourly_rate=50
    )
    db.add(new_profile)
    await db.commit()
    
    # Reload with relations to match response_model
    result = await db.execute(
        select(ExpertProfile)
        .where(ExpertProfile.id == new_profile.id)
        .options(
            selectinload(ExpertProfile.user).selectinload(User.expert_profile),
            selectinload(ExpertProfile.availabilities)
        )
    )
    return result.scalars().first()

class ExpertStats(BaseModel):
    total_bookings: int
    completed_bookings: int
    total_revenue: float
    average_rating: float

class AdminExpertFull(BaseModel):
    profile: ExpertProfileShort
    stats: ExpertStats

@router.get("/experts", response_model=PaginatedExpertResponse)
async def list_experts(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    status: KYCStatus | None = None,
    search: str | None = None,
    skip: int = 0,
    limit: int = 20,
) -> Any:
    """
    List experts with pagination and search. Requires Superuser.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough privileges")
    
    # Base query
    query = select(ExpertProfile).join(User)
    
    # Filters
    if status:
        query = query.where(ExpertProfile.kyc_status == status)
    if search:
        query = query.where(
            (User.full_name.ilike(f"%{search}%")) |
            (User.email.ilike(f"%{search}%"))
        )
        
    # Count Total
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)
    
    # Pagination & Relations
    query = query.options(
        selectinload(ExpertProfile.user).selectinload(User.expert_profile),
        selectinload(ExpertProfile.availabilities)
    ).order_by(ExpertProfile.id.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    experts = result.scalars().all()
    
    return {
        "items": experts,
        "total": total or 0,
        "page": (skip // limit) + 1,
        "page_size": limit,
        "total_pages": ((total or 0) + limit - 1) // limit
    }

@router.get("/experts/{expert_id}/full")
async def get_expert_full(
    expert_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    try:
        expert = await db.execute(
            select(ExpertProfile)
            .where(ExpertProfile.id == expert_id)
            .options(
                selectinload(ExpertProfile.user)
            )
        )
        expert = expert.scalars().first()
        if not expert:
            raise HTTPException(status_code=404, detail="Expert not found")
            
        # Stats calculation using raw SQL for maximum stability
        from sqlalchemy import text
        
        # 1. Total bookings (including fallbacks for ID)
        total_bookings_q = await db.execute(
            text("SELECT count(id) FROM bookings WHERE expert_id = :eid OR expert_id = :uid"),
            {"eid": expert_id, "uid": expert.user_id}
        )
        total_bookings_val = total_bookings_q.scalar() or 0
        
        # 2. Completed bookings
        completed_bookings_q = await db.execute(
            text("SELECT count(id) FROM bookings WHERE (expert_id = :eid OR expert_id = :uid) AND status IN ('COMPLETED', 'RATED')"),
            {"eid": expert_id, "uid": expert.user_id}
        )
        completed_bookings_val = completed_bookings_q.scalar() or 0
        
        # 3. Revenue
        total_revenue_q = await db.execute(
            text("SELECT sum(total_amount) FROM bookings WHERE (expert_id = :eid OR expert_id = :uid) AND status IN ('COMPLETED', 'RATED')"),
            {"eid": expert_id, "uid": expert.user_id}
        )
        total_revenue_val = total_revenue_q.scalar() or 0
        
        # 4. Average Rating
        avg_rating_q = await db.execute(
            text("SELECT avg(rating) FROM reviews WHERE expert_id = :eid OR expert_id = :uid"),
            {"eid": expert_id, "uid": expert.user_id}
        )
        avg_rating_val = avg_rating_q.scalar() or expert.rating or 0.0

        return {
            "profile": {
                "id": expert.id,
                "user_id": expert.user_id,
                "bio": expert.bio,
                "kyc_status": expert.kyc_status,
                "hourly_rate": float(expert.hourly_rate) if expert.hourly_rate else 0.0,
                "experience_years": expert.experience_years,
                "rating": float(expert.rating) if expert.rating else 0.0,
                "user": {
                    "id": expert.user.id,
                    "full_name": expert.user.full_name,
                    "email": expert.user.email,
                    "avatar_url": expert.user.avatar_url
                }
            },
            "stats": {
                "total_bookings": int(total_bookings_val),
                "completed_bookings": int(completed_bookings_val),
                "total_revenue": float(total_revenue_val),
                "average_rating": float(avg_rating_val)
            }
        }
    except Exception as e:
        print(f"Error in get_expert_full: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/experts/{expert_id}", response_model=ExpertProfileShort)
async def update_expert_admin(
    expert_id: int,
    expert_in: ExpertProfileUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update expert profile information. Requires Superuser.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough privileges")
        
    expert = await db.get(ExpertProfile, expert_id)
    if not expert:
        raise HTTPException(status_code=404, detail="Expert not found")
        
    update_data = expert_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(expert, field, value)
        
    db.add(expert)
    await db.commit()
    
    # Reload
    result = await db.execute(
        select(ExpertProfile)
        .where(ExpertProfile.id == expert_id)
        .options(
            selectinload(ExpertProfile.user),
            selectinload(ExpertProfile.availabilities)
        )
    )
    return result.scalars().first()

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

