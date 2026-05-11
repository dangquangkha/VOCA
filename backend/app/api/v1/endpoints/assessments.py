from typing import Any, List, Dict
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload, joinedload

from backend.app.api import deps
from backend.app.domains.identity.models import User
from backend.app.models.assessment import Assessment, Question, UserAssessmentResult
from backend.app.schemas.assessment import AssessmentRead, UserResultCreate, UserResultRead
from backend.app.domains.marketplace.models import ExpertProfile

router = APIRouter()

# --- Mock Data Seeder (Helper) ---
# In real app, this should be a migration or admin tool
async def ensure_assessments(db: AsyncSession):
    # Check if Holland exists
    res = await db.execute(select(Assessment).where(Assessment.code == "HOLLAND"))
    holland = res.scalars().first()
    
    if not holland:
        holland = Assessment(
            title="Holland Code Test (RIASEC)",
            description="Discover your career interests based on 6 personality types.",
            code="HOLLAND",
            image_url="/assets/holland.png"
        )
        db.add(holland)
        await db.commit()
        await db.refresh(holland)
        
        # Add sample questions (Simplified)
        questions = [
            Question(assessment_id=holland.id, content="I like to repair things.", question_type="LIKERT", order=1, scoring_logic='{"R": 1}'),
            Question(assessment_id=holland.id, content="I like to analyze data.", question_type="LIKERT", order=2, scoring_logic='{"I": 1}'),
            Question(assessment_id=holland.id, content="I like painting or writing.", question_type="LIKERT", order=3, scoring_logic='{"A": 1}'),
            Question(assessment_id=holland.id, content="I like teaching others.", question_type="LIKERT", order=4, scoring_logic='{"S": 1}'),
            Question(assessment_id=holland.id, content="I like leading a team.", question_type="LIKERT", order=5, scoring_logic='{"E": 1}'),
            Question(assessment_id=holland.id, content="I like organizing files.", question_type="LIKERT", order=6, scoring_logic='{"C": 1}'),
             # Add more to make it realistic if needed, but keeping simple for demo
        ]
        db.add_all(questions)
        await db.commit()

@router.post("/seed")
async def seed_assessments(db: AsyncSession = Depends(deps.get_db)):
    """Secret endpoint to seed data"""
    await ensure_assessments(db)
    return {"msg": "Seeded"}

@router.get("/", response_model=List[AssessmentRead])
async def get_assessments(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    List all available assessments.
    """
    await ensure_assessments(db) # Ensure data exists for demo
    
    result = await db.execute(select(Assessment))
    assessments = result.scalars().all()
    return assessments

@router.get("/{id}", response_model=AssessmentRead)
async def get_assessment_details(
    id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get assessment details including questions.
    """
    result = await db.execute(select(Assessment).where(Assessment.id == id).options(selectinload(Assessment.questions)))
    assessment = result.scalars().first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return assessment

@router.post("/{id}/submit", response_model=UserResultRead)
async def submit_assessment(
    id: int,
    submission: UserResultCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Submit answers and calculate results.
    """
    result = await db.execute(select(Assessment).where(Assessment.id == id).options(selectinload(Assessment.questions)))
    assessment = result.scalars().first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    # --- Scoring Logic ---
    scores = {} # e.g. {"R": 10, "I": 5}
    
    # Pre-load questions map
    q_map = {q.id: q for q in assessment.questions}
    
    for q_id, answer_value in submission.answers.items():
        if q_id in q_map:
            q = q_map[q_id]
            # Parse scoring logic string to dict if needed, or assume it's dict from JSON column
            import json
            logic = q.scoring_logic
            if isinstance(logic, str):
                logic = json.loads(logic)
            
            # Simple scoring: Score += AnswerValue * Weight
            # Assuming AnswerValue is Int (1-5) for Likert
            # Logic: {"R": 1} means this question contributes to R
            if isinstance(answer_value, int):
                for category, weight in logic.items():
                    scores[category] = scores.get(category, 0) + (answer_value * weight)
    
    # Calculate Result Code
    # Holland: Top 3
    result_code = "UNKNOWN"
    if assessment.code == "HOLLAND":
        sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        top_3 = [x[0] for x in sorted_scores[:3]]
        result_code = "-".join(top_3)
    
    # Save Result
    user_result = UserAssessmentResult(
        user_id=current_user.id,
        assessment_id=id,
        scores=scores,
        result_code=result_code
    )
    db.add(user_result)
    await db.commit()
    await db.refresh(user_result)
    
    return user_result

@router.get("/results/{result_id}", response_model=UserResultRead)
async def get_result(
    result_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get a specific result with suggested experts.
    """
    result = await db.execute(select(UserAssessmentResult).where(UserAssessmentResult.id == result_id).options(selectinload(UserAssessmentResult.assessment)))
    user_result = result.scalars().first()
    
    if not user_result:
        raise HTTPException(status_code=404, detail="Result not found")
        
    if user_result.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # --- Upsell Logic: Find Experts ---
    suggested_experts = []
    
    # Mapper for Holland Code
    TYPE_MAPPING = {
        "R": ["Engineering", "Mechanics", "Agriculture", "Construction"],
        "I": ["IT", "Science", "Data", "Analysis", "Research"],
        "A": ["Design", "Media", "Writing", "Art", "Music"],
        "S": ["Education", "Healthcare", "Counseling", "Social Work"],
        "E": ["Business", "Sales", "Management", "Startup"],
        "C": ["Finance", "Accounting", "Admin", "Logistics"]
    }
    
    search_tags = []
    if user_result.assessment.code == "HOLLAND" and user_result.result_code:
        # result_code is like "R-I-E"
        types = user_result.result_code.split("-")
        for t in types:
            if t in TYPE_MAPPING:
                search_tags.extend(TYPE_MAPPING[t])
    elif user_result.assessment.code == "MBTI" and user_result.result_code:
        # Just use the code itself or some generic mapping
        search_tags.append(user_result.result_code)
    
    # Query Experts
    # If we have tags, search using OR
    from sqlalchemy import or_
    query = select(ExpertProfile).join(User).where(ExpertProfile.kyc_status == "APPROVED")
    
    if search_tags:
        # Construct simplified OR query on tags
        # ExpertProfile.tags is a string, so we use ILIKE
        filters = [ExpertProfile.tags.ilike(f"%{tag}%") for tag in search_tags]
        query = query.where(or_(*filters))
    
    # Limit to 3 experts
    query = query.options(joinedload(ExpertProfile.user)).limit(3)
    
    # Helper to mask info (reused from experts.py but easier to just inline or ignore for now)
    # We really should reuse the code. For now, let's just fetch.
    
    exp_res = await db.execute(query)
    experts = exp_res.scalars().all()
    
    # Attach to result object (Pydantic will pick this up via orm_mode)
    user_result.suggested_experts = experts
        
    return user_result

@router.get("/me/results", response_model=List[UserResultRead])
async def get_my_results(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get all assessment results for the current user.
    """
    result = await db.execute(
        select(UserAssessmentResult)
        .where(UserAssessmentResult.user_id == current_user.id)
        .options(selectinload(UserAssessmentResult.assessment))
        .order_by(UserAssessmentResult.created_at.desc())
    )
    return result.scalars().all()
