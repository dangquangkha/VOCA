import re
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, and_, func
from sqlalchemy.orm import selectinload, joinedload

from backend.app.api import deps
from .models import ExpertProfile, KYCStatus, ExpertAvailability
from backend.app.domains.identity.models import User, UserRole, UserStatus
from .schemas import (
    ExpertProfile as ExpertProfileSchema,
    ExpertProfileShort,
    ExpertProfileCreate,
    ExpertProfileUpdate,
    ExpertBankUpdate,
    ExpertAvailabilityCreate,
    ExpertAvailability as ExpertAvailabilitySchema,
    PaginatedExpertResponse,
)
from .quiz_router import router as quiz_router
from .portfolio_router import router as portfolio_router

router = APIRouter()
router.include_router(quiz_router, prefix="/quizzes", tags=["expert-quizzes"])
router.include_router(portfolio_router, prefix="", tags=["expert-portfolio"])


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
    if current_user.role not in [UserRole.EXPERT, UserRole.MENTOR]:
        raise HTTPException(status_code=400, detail="User is not an expert or mentor")
        
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

        # Populate student info for reviews handled by @property
            
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
    if current_user.role not in [UserRole.EXPERT, UserRole.MENTOR]:
        raise HTTPException(status_code=400, detail="User is not an expert or mentor")
        
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

    # Populate student info for reviews handled by @property
    
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

    return expert


# ─── MENTOR: Update QR Code URL ──────────────────────────────────────────────

@router.patch("/me/qr-code", response_model=ExpertProfileSchema)
async def update_qr_code(
    qr_in: "ExpertQRCodeUpdate",
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    MENTOR: Update QR code URL for direct bank transfer.
    Học viên sẽ quét mã QR này để chuyển khoản sau buổi tư vấn.
    """
    from backend.app.domains.marketplace.schemas import ExpertQRCodeUpdate
    from backend.app.models.review import Review

    if current_user.role.value not in ["MENTOR", "EXPERT"]:
        raise HTTPException(status_code=403, detail="Chỉ Cố vấn hoặc Chuyên gia mới có thể cập nhật QR code.")

    result = await db.execute(select(ExpertProfile).where(ExpertProfile.user_id == current_user.id))
    expert = result.scalars().first()
    if not expert:
        raise HTTPException(status_code=404, detail="Hồ sơ chuyên gia không tìm thấy")

    expert.qr_code_url = qr_in.qr_code_url
    db.add(expert)
    await db.commit()

    result = await db.execute(
        select(ExpertProfile).where(ExpertProfile.id == expert.id).options(
            selectinload(ExpertProfile.availabilities),
            selectinload(ExpertProfile.user).selectinload(User.expert_profile),
            selectinload(ExpertProfile.reviews).selectinload(Review.student),
        )
    )
    expert = result.scalars().first()
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
        # Tự động tạo hồ sơ nếu người dùng là EXPERT hoặc MENTOR nhưng bị thiếu bản ghi profile
        if current_user.role in [UserRole.EXPERT, UserRole.MENTOR]:
            new_profile = ExpertProfile(
                user_id=current_user.id,
                kyc_status=KYCStatus.APPROVED if current_user.role == UserRole.MENTOR else KYCStatus.PENDING,
                experience_years=0
            )
            db.add(new_profile)
            await db.commit()
            # Truy vấn lại để lấy đầy đủ thông tin (availabilities, reviews...)
            result = await db.execute(query)
            expert_profile = result.scalars().first()
        else:
            raise HTTPException(status_code=404, detail="Expert profile not found")

    # Populate student info for reviews handled by @property

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
    if current_user.role not in [UserRole.EXPERT, UserRole.MENTOR]:
        raise HTTPException(status_code=400, detail="User is not an expert or mentor")
        
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
            end_time=slot.end_time,
            max_participants=slot.max_participants if slot.max_participants is not None else 1
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

@router.get("", response_model=PaginatedExpertResponse)
async def search_experts(
    db: AsyncSession = Depends(deps.get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=100),
    q: Optional[str] = None,
    tag: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    min_rating: Optional[float] = None,
    role: Optional[str] = None,
) -> Any:
    """
    Search for experts/mentors. Simplified for stability.
    """
    from backend.app.domains.identity.models import UserStatus, UserRole
    from sqlalchemy import or_, and_, func
    from sqlalchemy.orm import selectinload, contains_eager
    
    skip = (page - 1) * limit
    try:
        # 1. Chuẩn hóa Role Enum
        role_enum = None
        if role:
            try:
                role_enum = UserRole(role) if isinstance(role, str) else role
            except ValueError:
                pass

        # 2. Xây dựng bộ lọc cơ bản
        base_filters = [User.account_status == UserStatus.ACTIVE]
        
        if role_enum:
            base_filters.append(User.role == role_enum)
            if role_enum == UserRole.EXPERT:
                base_filters.append(ExpertProfile.kyc_status == KYCStatus.APPROVED)
        else:
            # Nếu tìm tất cả: (Expert + Approved) HOẶC (Mentor)
            base_filters.append(or_(
                User.role == UserRole.MENTOR,
                and_(User.role == UserRole.EXPERT, ExpertProfile.kyc_status == KYCStatus.APPROVED)
            ))

        # 3. Lọc theo từ khóa (nếu có)
        if q:
            q_filter = or_(
                User.full_name.ilike(f"%{q}%"),
                ExpertProfile.bio.ilike(f"%{q}%"),
                ExpertProfile.tags.ilike(f"%{q}%")
            )
            base_filters.append(q_filter)

        # 4. Thực thi Query đếm tổng
        count_query = select(func.count(ExpertProfile.id)).join(User, ExpertProfile.user_id == User.id).where(and_(*base_filters))
        total = await db.scalar(count_query) or 0

        # 5. Thực thi Query lấy dữ liệu (Nạp đủ mọi cấp độ để tránh MissingGreenlet)
        query = (
            select(ExpertProfile)
            .join(User, ExpertProfile.user_id == User.id)
            .where(and_(*base_filters))
            .options(
                contains_eager(ExpertProfile.user).selectinload(User.expert_profile),
                selectinload(ExpertProfile.availabilities)
            )
            .offset(skip)
            .limit(limit)
        )
        
        result = await db.execute(query)
        experts = result.scalars().all()
        
        # 6. Xử lý hậu kỳ (masking)
        for e in experts:
            if e.bio:
                e.bio = mask_sensitive_info(e.bio)
                
        return {
            "items": experts,
            "total": total,
            "page": page,
            "page_size": limit,
            "total_pages": (total + limit - 1) // limit
        }
    except Exception as e:
        print(f"❌ Error in search_experts: {e}")
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
    from backend.app.models.review import Review
    
    query = select(ExpertProfile).join(User).where(
        and_(
            ExpertProfile.id == id,
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
        raise HTTPException(status_code=404, detail="Expert not found.")
        
    if expert.bio:
        expert.bio = mask_sensitive_info(expert.bio)
        
    return expert

@router.get("/students/{student_id}/profile")
async def get_student_profile_for_expert(
    student_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get student profile (MBTI, Roadmap, Survey) for expert to view before a session.
    Only allows access if the expert has a booking with the student.
    """
    if current_user.role not in [UserRole.EXPERT, UserRole.MENTOR]:
        raise HTTPException(status_code=403, detail="Only experts can access student profiles")

    # Fetch expert profile
    query = select(ExpertProfile).where(ExpertProfile.user_id == current_user.id)
    result = await db.execute(query)
    expert_profile = result.scalars().first()
    if not expert_profile:
        raise HTTPException(status_code=404, detail="Expert profile not found")

    # Check if they have a valid booking
    from backend.app.domains.booking.models import Booking, BookingStatus
    booking_query = select(Booking).where(
        and_(
            Booking.expert_id == expert_profile.id,
            Booking.student_id == student_id,
            Booking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED])
        )
    )
    booking_result = await db.execute(booking_query)
    booking = booking_result.scalars().first()

    if not booking:
        raise HTTPException(status_code=403, detail="You do not have access to this student's profile.")

    # Fetch student User
    student_query = select(User).where(User.id == student_id)
    student_res = await db.execute(student_query)
    student = student_res.scalars().first()
    
    if not student:
         raise HTTPException(status_code=404, detail="Student not found")

    # Fetch Latest Roadmap History
    from backend.app.models.roadmap import RoadmapHistory
    from backend.app.schemas.roadmap import RoadmapHistory as HistorySchema
    history_query = select(RoadmapHistory).where(RoadmapHistory.user_id == student_id).order_by(RoadmapHistory.created_at.desc())
    history_res = await db.execute(history_query)
    roadmap_histories = history_res.scalars().all()
    history_schemas = [HistorySchema.model_validate(h).model_dump() for h in roadmap_histories]
    
    # Fetch MBTI Data
    from backend.app.domains.mbti.models import UserMBTIResult, MBTIType
    mbti_query = select(UserMBTIResult).where(UserMBTIResult.user_id == student_id).order_by(UserMBTIResult.id.desc()).limit(1)
    mbti_res = await db.execute(mbti_query)
    last_mbti = mbti_res.scalars().first()
    mbti_data = None
    if last_mbti:
        type_res = await db.execute(select(MBTIType).where(MBTIType.code == last_mbti.mbti_code))
        mbti_type = type_res.scalars().first()
        mbti_data = {
            "mbti_code": last_mbti.mbti_code,
            "vietnamese_title": mbti_type.vietnamese_title if mbti_type else "N/A",
            "description": mbti_type.description if mbti_type else "N/A",
            "scores": {
                "E": last_mbti.score_e, "I": last_mbti.score_i,
                "S": last_mbti.score_s, "N": last_mbti.score_n,
                "T": last_mbti.score_t, "F": last_mbti.score_f,
                "J": last_mbti.score_j, "P": last_mbti.score_p
            }
        }

    return {
        "student": {
            "id": student.id,
            "full_name": student.full_name,
            "email": student.email,
        },
        "booking_note": booking.student_note,
        "mbti": mbti_data,
        "roadmap_histories": history_schemas
    }
