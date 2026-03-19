from typing import Any, List
from datetime import datetime
import random

from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.api import deps
from backend.app.models.user import User
from backend.app.models.ai_service import CVAnalysis, MockInterview
from backend.app.schemas.ai import CVAnalysis as CVSchema, MockInterview as InterviewSchema

router = APIRouter()

@router.post("/cv-analyze", response_model=CVSchema)
async def analyze_cv(
    file: UploadFile = File(...),
    job_description: str = Form(...),
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Upload CV and Job Description for AI Analysis.
    (Mock Implementation)
    """
    # Mocking file upload - in real app, upload to S3/Cloudinary and get URL
    fake_url = f"https://storage.example.com/cvs/{current_user.id}/{file.filename}"
    
    # Mocking AI Analysis
    mock_score = random.randint(60, 95)
    mock_feedback = {
        "summary": "Strong candidate for the role.",
        "skills_match": ["Python", "FastAPI", "SQL"],
        "missing_skills": ["Kubernetes", "GraphQL"],
        "suggestions": "Highlight your system design experience more."
    }
    
    cv_entry = CVAnalysis(
        user_id=current_user.id,
        cv_file_url=fake_url,
        job_description=job_description,
        score=mock_score,
        analysis_result=mock_feedback
    )
    
    db.add(cv_entry)
    await db.commit()
    await db.refresh(cv_entry)
    
    # Deduct credits? Assuming free for MVP or already paid via Transaction?
    # Requirement doesn't strictly say it costs credits per use, but it implies.
    # For now, let's keep it free or separate transaction step.
    
    return cv_entry

@router.post("/interview-simulate", response_model=InterviewSchema)
async def simulate_interview(
    job_description: str,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Start a mock interview session based on Job Description.
    """
    # Mock AI generating questions
    mock_questions = [
        "Tell me about a time you solved a complex bug.",
        "How do you handle disagreements with colleagues?",
        "Explain Dependency Injection."
    ]
    
    interview = MockInterview(
        user_id=current_user.id,
        job_description=job_description,
        transcript=None,
        feedback={"questions": mock_questions, "status": "STARTED"}
    )
    
    db.add(interview)
    await db.commit()
    await db.refresh(interview)
    return interview

@router.post("/interview-submit/{interview_id}", response_model=InterviewSchema)
async def submit_interview_results(
    interview_id: int,
    transcript: str,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Submit interview answers/transcript for AI Feedback.
    """
    result = await db.execute(select(MockInterview).where(MockInterview.id == interview_id))
    interview = result.scalars().first()
    
    if not interview:
        raise HTTPException(status_code=404, detail="Interview session not found")
        
    if interview.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    # Mock Analysis
    mock_score = random.randint(70, 90)
    mock_feedback = {
        "clarity": "Excellent",
        "technical_depth": "Good",
        "improvement_areas": "Could be more concise."
    }
    
    interview.transcript = transcript
    interview.score = mock_score
    interview.feedback = mock_feedback # properties will be overwritten or merged depending on logic
    # Actually feedback previously held questions. We overwrite here for result.
    
    db.add(interview)
    await db.commit()
    await db.refresh(interview)
    return interview
@router.get("/cv-analysis/me", response_model=List[CVSchema])
async def get_my_cv_analysis(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get CV analysis history for the current user.
    """
    result = await db.execute(
        select(CVAnalysis)
        .where(CVAnalysis.user_id == current_user.id)
        .order_by(CVAnalysis.created_at.desc())
    )
    return result.scalars().all()
