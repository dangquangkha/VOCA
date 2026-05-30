from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload, joinedload

from backend.app.api import deps
from backend.app.domains.identity.models import User, UserRole
from backend.app.domains.marketplace.models import ExpertProfile, ExpertQuiz, BookingQuizResponse, PublicQuizResponse
from backend.app.domains.booking.models import Booking, QuizStatus
from backend.app.schemas.expert_quiz import (
    ExpertQuiz as ExpertQuizSchema,
    ExpertQuizCreate,
    ExpertQuizUpdate,
    ExpertQuizPublic,
    BookingQuizResponse as ResponseSchema,
    BookingQuizResponseCreate,
    PublicQuizResponseCreate,
    PublicQuizResponseRead,
)

router = APIRouter()

# ──────────────────────────────────────────────────────────────────────────────
# PUBLIC ENDPOINTS (for students)
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/public", response_model=List[ExpertQuizPublic])
async def get_public_quizzes(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Get all public quizzes from all experts — shown on the Roadmap tab."""
    result = await db.execute(
        select(ExpertQuiz)
        .where(ExpertQuiz.is_public == True, ExpertQuiz.is_active == True, ExpertQuiz.is_deleted == False)
        .options(joinedload(ExpertQuiz.expert).joinedload(ExpertProfile.user))
        .order_by(ExpertQuiz.created_at.desc())
    )
    quizzes = result.scalars().unique().all()

    # Enrich with expert info
    enriched = []
    for quiz in quizzes:
        quiz_data = ExpertQuizPublic.model_validate(quiz)
        if quiz.expert and quiz.expert.user:
            quiz_data.expert_name = quiz.expert.user.full_name
            quiz_data.expert_avatar = quiz.expert.user.avatar_url
            quiz_data.expert_tags = quiz.expert.tags
        enriched.append(quiz_data)

    return enriched

@router.post("/seed-test-quizzes")
async def seed_test_quizzes(
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    """Temporary endpoint to seed 4 extra quizzes for pagination testing."""
    # Find any expert to own the quizzes
    expert_result = await db.execute(select(ExpertProfile).limit(1))
    expert = expert_result.scalars().first()
    
    if not expert:
        raise HTTPException(status_code=400, detail="No experts found in DB")
        
    for i in range(4, 8):
        quiz = ExpertQuiz(
            expert_id=expert.id,
            title=f"Khám phá Vùng Thiên Tài (Bản mở rộng {i})",
            description=f"Bài khảo sát số {i} giúp bạn định vị bản thân một cách chi tiết và chính xác hơn trên hành trình sự nghiệp.",
            questions=[
                {
                    "id": "q1",
                    "type": "text",
                    "label": "Bạn mong muốn đạt được điều gì trong 5 năm tới?",
                    "options": []
                }
            ],
            is_public=True,
            is_required_for_booking=False,
            is_active=True,
            total_attempts=0
        )
        db.add(quiz)
        
    await db.commit()
    return {"message": "Successfully seeded 4 new quizzes"}



@router.get("/{quiz_id}/check-completed")
async def check_quiz_completed(
    quiz_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Check if the current user has completed a specific quiz."""
    result = await db.execute(
        select(PublicQuizResponse).where(
            PublicQuizResponse.user_id == current_user.id,
            PublicQuizResponse.quiz_id == quiz_id,
        )
    )
    response = result.scalars().first()
    return {"completed": response is not None, "response_id": response.id if response else None}


@router.post("/{quiz_id}/public-submit", response_model=PublicQuizResponseRead)
async def submit_public_quiz(
    quiz_id: int,
    submission: PublicQuizResponseCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Submit a public quiz response (requires login)."""
    # Verify quiz exists and is active
    result = await db.execute(select(ExpertQuiz).where(ExpertQuiz.id == quiz_id))
    quiz = result.scalars().first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if not quiz.is_active:
        raise HTTPException(status_code=400, detail="This quiz is currently inactive")

    # Check if already completed
    existing = await db.execute(
        select(PublicQuizResponse).where(
            PublicQuizResponse.user_id == current_user.id,
            PublicQuizResponse.quiz_id == quiz_id,
        )
    )
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Bạn đã hoàn thành khảo sát này rồi")

    # Save response
    response = PublicQuizResponse(
        user_id=current_user.id,
        quiz_id=quiz_id,
        responses=submission.responses,
    )
    db.add(response)

    # Increment total_attempts
    quiz.total_attempts = (quiz.total_attempts or 0) + 1
    db.add(quiz)

    await db.commit()
    await db.refresh(response)
    return response


@router.get("/{quiz_id}/responses", response_model=List[PublicQuizResponseRead])
async def get_quiz_responses(
    quiz_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Expert views all responses for their quiz."""
    # Verify quiz ownership
    result = await db.execute(
        select(ExpertQuiz).where(ExpertQuiz.id == quiz_id)
        .options(joinedload(ExpertQuiz.expert))
    )
    quiz = result.scalars().first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if quiz.expert.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    responses = await db.execute(
        select(PublicQuizResponse)
        .where(PublicQuizResponse.quiz_id == quiz_id)
        .order_by(PublicQuizResponse.created_at.desc())
    )
    return responses.scalars().all()


# ──────────────────────────────────────────────────────────────────────────────
# EXPERT MANAGEMENT ENDPOINTS
# ──────────────────────────────────────────────────────────────────────────────

@router.post("/", response_model=ExpertQuizSchema)
async def create_quiz(
    quiz_in: ExpertQuizCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    if current_user.role not in [UserRole.EXPERT, UserRole.MENTOR]:
        raise HTTPException(status_code=403, detail="Only experts or mentors can create quizzes")
    
    expert_profile_result = await db.execute(select(ExpertProfile).where(ExpertProfile.user_id == current_user.id))
    expert = expert_profile_result.scalars().first()
    if not expert:
        raise HTTPException(status_code=404, detail="Expert profile not found")
    
    # If is_required_for_booking, ensure no other quiz has this flag
    if quiz_in.is_required_for_booking:
        existing = await db.execute(
            select(ExpertQuiz).where(
                ExpertQuiz.expert_id == expert.id,
                ExpertQuiz.is_required_for_booking == True,
                ExpertQuiz.is_active == True,
                ExpertQuiz.is_deleted == False,
            )
        )
        if existing.scalars().first():
            raise HTTPException(
                status_code=400,
                detail="Bạn đã có 1 bài khảo sát bắt buộc. Vui lòng tắt bài cũ trước khi tạo mới."
            )

    quiz = ExpertQuiz(
        expert_id=expert.id,
        title=quiz_in.title,
        description=quiz_in.description,
        questions=[q.dict() for q in quiz_in.questions],
        is_public=quiz_in.is_public,
        is_required_for_booking=quiz_in.is_required_for_booking,
    )
    db.add(quiz)
    await db.commit()
    await db.refresh(quiz)
    return quiz

@router.get("/me", response_model=List[ExpertQuizSchema])
async def get_my_quizzes(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    if current_user.role not in [UserRole.EXPERT, UserRole.MENTOR]:
        raise HTTPException(status_code=403, detail="Only experts or mentors can view their quizzes")
    
    expert_profile_result = await db.execute(select(ExpertProfile).where(ExpertProfile.user_id == current_user.id))
    expert = expert_profile_result.scalars().first()
    if not expert:
        return []
    
    result = await db.execute(select(ExpertQuiz).where(ExpertQuiz.expert_id == expert.id, ExpertQuiz.is_deleted == False))
    return result.scalars().all()


@router.put("/{quiz_id}", response_model=ExpertQuizSchema)
async def update_quiz(
    quiz_id: int,
    quiz_in: ExpertQuizUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Update a quiz's settings (title, questions, public/required flags)."""
    result = await db.execute(
        select(ExpertQuiz).where(ExpertQuiz.id == quiz_id, ExpertQuiz.is_deleted == False)
        .options(joinedload(ExpertQuiz.expert))
    )
    quiz = result.scalars().first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if quiz.expert.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    # If enabling is_required_for_booking, check no other quiz has it
    if quiz_in.is_required_for_booking is True and not quiz.is_required_for_booking:
        existing = await db.execute(
            select(ExpertQuiz).where(
                ExpertQuiz.expert_id == quiz.expert_id,
                ExpertQuiz.is_required_for_booking == True,
                ExpertQuiz.is_active == True,
                ExpertQuiz.is_deleted == False,
                ExpertQuiz.id != quiz_id,
            )
        )
        if existing.scalars().first():
            raise HTTPException(
                status_code=400,
                detail="Bạn đã có 1 bài khảo sát bắt buộc khác. Vui lòng tắt bài cũ trước."
            )

    update_data = quiz_in.dict(exclude_unset=True)
    if "questions" in update_data and update_data["questions"] is not None:
        update_data["questions"] = [q.dict() if hasattr(q, 'dict') else q for q in update_data["questions"]]
    
    for field, value in update_data.items():
        setattr(quiz, field, value)
    
    db.add(quiz)
    await db.commit()
    await db.refresh(quiz)
    return quiz

@router.delete("/{quiz_id}")
async def delete_quiz(
    quiz_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    result = await db.execute(
        select(ExpertQuiz).where(ExpertQuiz.id == quiz_id)
        .options(joinedload(ExpertQuiz.expert))
    )
    quiz = result.scalars().first()
    if not quiz or quiz.is_deleted:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if quiz.expert.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    quiz.is_deleted = True
    quiz.is_active = False # Deactivate it as well
    db.add(quiz)
    await db.commit()
    return {"message": "Quiz deleted successfully"}


@router.get("/expert/{expert_id}", response_model=List[ExpertQuizSchema])
async def get_expert_quizzes(
    expert_id: int,
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    result = await db.execute(select(ExpertQuiz).where(ExpertQuiz.expert_id == expert_id, ExpertQuiz.is_deleted == False))
    return result.scalars().all()

@router.get("/{quiz_id}", response_model=ExpertQuizSchema)
async def get_quiz(
    quiz_id: int,
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    result = await db.execute(select(ExpertQuiz).where(ExpertQuiz.id == quiz_id, ExpertQuiz.is_deleted == False))
    quiz = result.scalars().first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return quiz

@router.post("/submit", response_model=ResponseSchema)
async def submit_quiz_response(
    response_in: BookingQuizResponseCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    # Check booking ownership
    result = await db.execute(select(Booking).where(Booking.id == response_in.booking_id))
    booking = result.scalars().first()
    if not booking or booking.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Booking not found or access denied")
    
    response = BookingQuizResponse(
        booking_id=response_in.booking_id,
        quiz_id=response_in.quiz_id,
        responses=response_in.responses
    )
    db.add(response)
    
    # Update booking quiz status
    booking.quiz_status = QuizStatus.COMPLETED
    db.add(booking)
    
    await db.commit()
    await db.refresh(response)
    return response

@router.get("/booking/{booking_id}/response", response_model=ResponseSchema)
async def get_booking_response(
    booking_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    result = await db.execute(
        select(BookingQuizResponse).where(BookingQuizResponse.booking_id == booking_id)
    )
    response = result.scalars().first()
    if not response:
        raise HTTPException(status_code=404, detail="Response not found")
    
    return response
