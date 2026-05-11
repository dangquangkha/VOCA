import re
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, and_, func
from sqlalchemy.orm import selectinload, joinedload

from backend.app.api import deps
from backend.app.domains.marketplace.models import ExpertProfile, KYCStatus, ExpertAvailability
from backend.app.domains.identity.models import User, UserRole
from backend.app.schemas.expert import (
    ExpertProfile as ExpertProfileSchema,
    ExpertProfileShort,
    ExpertProfileCreate,
    ExpertProfileUpdate,
    ExpertBankUpdate,
    ExpertAvailabilityCreate,
    ExpertAvailability as ExpertAvailabilitySchema,
    PaginatedExpertResponse,
)

router = APIRouter()


def mask_sensitive_info(text: str) -> str:
    if not text:
        return text
    # Mask Email
    text = re.sub(r'[\w\.-]+@[\w\.-]+\.\w+', '[HIDDEN EMAIL]', text)
    # Mask Phone (Generic 10-11 digits)
    text = re.sub(r'\b\d{10,11}\b', '[HIDDEN PHONE]', text)
    return text

@router.put("/me", response_model=ExpertProfileSchema)
async def update_expert_profile(
    profile_in: ExpertProfileUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update or create expert profile for current user.
    """
    if current_user.role != UserRole.EXPERT:
        raise HTTPException(status_code=400, detail="User is not an expert")
        
    query = select(ExpertProfile).where(ExpertProfile.user_id == current_user.id)
    result = await db.execute(query)
    expert_profile = result.scalars().first()
    
    try:
        if not expert_profile:
            # Create
            expert_profile = ExpertProfile(
                user_id=current_user.id,
                bio=profile_in.bio,
                experience_years=profile_in.experience_years or 0,
                hourly_rate=profile_in.hourly_rate or 0,
                linkedin_url=profile_in.linkedin_url,
                tags=profile_in.tags,
                kyc_status=KYCStatus.PENDING 
            )
            db.add(expert_profile)
        else:
            # Update
            update_data = profile_in.dict(exclude_unset=True)
            for field in update_data:
                setattr(expert_profile, field, update_data[field])
            db.add(expert_profile)
            
        await db.commit()

        # Reload with comprehensive options to avoid lazy loading crash
        from backend.app.models.review import Review
        query = (
            select(ExpertProfile)
            .where(ExpertProfile.id == expert_profile.id)
            .options(
                selectinload(ExpertProfile.availabilities),
                selectinload(ExpertProfile.user).selectinload(User.expert_profile),
                selectinload(ExpertProfile.reviews).selectinload(Review.student),
            )
        )
        result = await db.execute(query)
        expert_profile = result.scalars().first()

        # Populate student info for reviews
        for r in expert_profile.reviews:
            r.student_full_name = r.student.full_name
            r.student_avatar_url = r.student.avatar_url
            
    except Exception as e:
        print(f"Error updating expert profile: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    return expert_profile

@router.put("/me/kyc", response_model=ExpertProfileSchema)
async def submit_kyc(
    profile_in: ExpertProfileUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Submit KYC documents and update profile.
    Sets status to PENDING for review.
    """
    if current_user.role != UserRole.EXPERT:
        raise HTTPException(status_code=400, detail="User is not an expert")
        
    query = select(ExpertProfile).where(ExpertProfile.user_id == current_user.id)
    result = await db.execute(query)
    expert_profile = result.scalars().first()
    
    if not expert_profile:
        # Create if not exists (should have been created at register, but safe fallback)
        expert_profile = ExpertProfile(
            user_id=current_user.id,
            kyc_status=KYCStatus.PENDING
        )
        db.add(expert_profile)
    
    # Update fields
    update_data = profile_in.dict(exclude_unset=True)
    for field in update_data:
        setattr(expert_profile, field, update_data[field])
        
    # Always set status to PENDING on submission/resubmission
    expert_profile.kyc_status = KYCStatus.PENDING
    
    db.add(expert_profile)
    await db.commit()
    
    # Reload for response with comprehensive options
    from backend.app.models.review import Review
    query = (
        select(ExpertProfile)
        .where(ExpertProfile.id == expert_profile.id)
        .options(
            selectinload(ExpertProfile.availabilities),
            selectinload(ExpertProfile.user).selectinload(User.expert_profile),
            selectinload(ExpertProfile.reviews).selectinload(Review.student),
        )
    )
    result = await db.execute(query)
    expert_profile = result.scalars().first()

    # Populate student info for reviews
    for r in expert_profile.reviews:
        r.student_full_name = r.student.full_name
        r.student_avatar_url = r.student.avatar_url
    
    return expert_profile



@router.patch("/me/bank", response_model=ExpertProfileSchema)
async def update_bank_info(
    bank_in: ExpertBankUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    UC-19 PRE-2: Expert updates their bank account info for withdrawals.
    This endpoint saves the bank info to the expert's profile.
    """
    from backend.app.models.review import Review

    # 1. Tìm expert profile (chỉ cần id)
    result = await db.execute(
        select(ExpertProfile).where(ExpertProfile.user_id == current_user.id)
    )
    expert = result.scalars().first()
    if not expert:
        raise HTTPException(status_code=404, detail="Expert profile not found")

    # 2. Cập nhật bank info
    expert.bank_name = bank_in.bank_name.strip()
    expert.bank_account = bank_in.bank_account.strip()
    expert.bank_holder_name = bank_in.bank_holder_name.strip()
    db.add(expert)
    await db.commit()

    # 3. Re-query với full eager load để tránh lazy load crash trong async SQLAlchemy
    result = await db.execute(
        select(ExpertProfile)
        .where(ExpertProfile.id == expert.id)
        .options(
            selectinload(ExpertProfile.availabilities),
            selectinload(ExpertProfile.user).selectinload(User.expert_profile),
            selectinload(ExpertProfile.reviews).selectinload(Review.student),
        )
    )
    expert = result.scalars().first()

    for r in expert.reviews:
        r.student_full_name = r.student.full_name
        r.student_avatar_url = r.student.avatar_url

    return expert


@router.get("/me", response_model=ExpertProfileSchema)
async def get_current_expert_profile(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get current user's expert profile.
    """
    from backend.app.models.review import Review
    query = (
        select(ExpertProfile)
        .where(ExpertProfile.user_id == current_user.id)
        .options(
            selectinload(ExpertProfile.availabilities),
            selectinload(ExpertProfile.user).selectinload(User.expert_profile),
            selectinload(ExpertProfile.reviews).selectinload(Review.student),
        )
    )
    result = await db.execute(query)
    expert_profile = result.scalars().first()
    
    if not expert_profile:
        raise HTTPException(status_code=404, detail="Expert profile not found")

    # Populate student info for reviews
    for r in expert_profile.reviews:
        r.student_full_name = r.student.full_name
        r.student_avatar_url = r.student.avatar_url

    return expert_profile

@router.post("/me/availability", response_model=List[ExpertAvailabilitySchema])
async def update_availability(
    availabilities: List[ExpertAvailabilityCreate],
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update expert availability. Replaces old slots.
    """
    if current_user.role != UserRole.EXPERT:
        raise HTTPException(status_code=400, detail="User is not an expert")
        
    query = select(ExpertProfile).where(ExpertProfile.user_id == current_user.id)
    result = await db.execute(query)
    expert_profile = result.scalars().first()
    
    if not expert_profile:
        raise HTTPException(status_code=404, detail="Expert profile not found")
        
    # Clear existing
    # Note: delete() with 'in_' or similar
    # Or just delete all for this expert
    # Using execute(delete(ExpertAvailability).where(ExpertAvailability.expert_id == expert_profile.id))
    from sqlalchemy import delete
    await db.execute(delete(ExpertAvailability).where(ExpertAvailability.expert_id == expert_profile.id))
    
    # Add new
    new_slots = []
    for slot in availabilities:
        db_slot = ExpertAvailability(
            expert_id=expert_profile.id,
            day_of_week=slot.day_of_week,
            start_time=slot.start_time,
            end_time=slot.end_time
        )
        db.add(db_slot)
        new_slots.append(db_slot)
        
    await db.commit()
    
    # Return list (need to refresh or just return objects)
    # We need IDs? 
    # Let's query them back to be safe and ordered
    result = await db.execute(
        select(ExpertAvailability)
        .where(ExpertAvailability.expert_id == expert_profile.id)
        .order_by(ExpertAvailability.day_of_week, ExpertAvailability.start_time)
    )
    return result.scalars().all()

@router.get("/me/availability", response_model=List[ExpertAvailabilitySchema])
async def get_availability(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get current user's availability.
    """
    if current_user.role not in [UserRole.EXPERT, UserRole.MENTOR]:
        # Maybe allowed for UI logic? But specific to ME.
        raise HTTPException(status_code=400, detail="User is not an expert or mentor")
        
    query = select(ExpertProfile).where(ExpertProfile.user_id == current_user.id)
    result = await db.execute(query)
    expert_profile = result.scalars().first()
    
    if not expert_profile:
        return []
        
    result = await db.execute(
        select(ExpertAvailability)
        .where(ExpertAvailability.expert_id == expert_profile.id)
        .order_by(ExpertAvailability.day_of_week, ExpertAvailability.start_time)
    )
    return result.scalars().all()

@router.get("/", response_model=PaginatedExpertResponse)
async def search_experts(
    db: AsyncSession = Depends(deps.get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=100),
    q: Optional[str] = None,
    tag: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    min_rating: Optional[float] = None,
) -> Any:
    """
    Search for experts with filters.
    Only returns active experts (KYC Approved and account ACTIVE).
    """
    from backend.app.domains.identity.models import UserStatus
    
    skip = (page - 1) * limit
    try:
        # Base filter and count
        # UPDATE (BL-07): Only return APPROVED experts — PENDING experts excluded from
        # the marketplace to prevent students from booking unvetted advisors.
        base_filters = [
            ExpertProfile.kyc_status == KYCStatus.APPROVED,
            User.account_status == UserStatus.ACTIVE
        ]
        
        if min_price:
            base_filters.append(ExpertProfile.hourly_rate >= min_price)
        if max_price:
            base_filters.append(ExpertProfile.hourly_rate <= max_price)
        if min_rating:
            base_filters.append(ExpertProfile.rating >= min_rating)
        if tag:
            base_filters.append(ExpertProfile.tags.ilike(f"%{tag}%"))
        if q:
            search_filter = or_(
                User.full_name.ilike(f"%{q}%"),
                ExpertProfile.bio.ilike(f"%{q}%"),
                ExpertProfile.tags.ilike(f"%{q}%")
            )
            base_filters.append(search_filter)

        # Count total
        count_query = select(func.count(ExpertProfile.id)).join(User).where(and_(*base_filters))
        total = await db.scalar(count_query) or 0

        # Fetch items
        query = select(ExpertProfile).join(User).where(and_(*base_filters))
        query = query.order_by(ExpertProfile.rating.desc(), ExpertProfile.hourly_rate.asc())
        query = query.options(
            selectinload(ExpertProfile.user).selectinload(User.expert_profile), 
            selectinload(ExpertProfile.availabilities)
        )
        query = query.offset(skip).limit(limit)
        
        result = await db.execute(query)
        experts = result.scalars().all()
        
        # Mask info
        for expert in experts:
            if expert.bio:
                expert.bio = mask_sensitive_info(expert.bio)
                
        return {
            "items": experts,
            "total": total,
            "page": page,
            "page_size": limit,
            "total_pages": (total + limit - 1) // limit
        }
    except Exception as e:
        print(f"Error searching experts: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{id}", response_model=ExpertProfileSchema)
async def get_expert_detail(
    id: int,
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    """
    Get generic expert profile details.
    """
    from backend.app.domains.identity.models import UserStatus
    
    # UPDATE (BL-07): detail page also only shows APPROVED experts
    from backend.app.models.review import Review
    query = select(ExpertProfile).join(User).where(
        and_(
            ExpertProfile.id == id,
            ExpertProfile.kyc_status == KYCStatus.APPROVED,
            User.account_status == UserStatus.ACTIVE
        )
    ).options(
        selectinload(ExpertProfile.user).selectinload(User.expert_profile), 
        selectinload(ExpertProfile.availabilities),
        selectinload(ExpertProfile.reviews).selectinload(Review.student)
    )
    result = await db.execute(query)
    expert = result.scalars().first()
    
    if not expert:
        raise HTTPException(status_code=404, detail="Expert not found or not available.")
        
    # Populate student info for schemas
    for r in expert.reviews:
        r.student_full_name = r.student.full_name
        r.student_avatar_url = r.student.avatar_url

    if expert.bio:
        expert.bio = mask_sensitive_info(expert.bio)
        
    return expert
