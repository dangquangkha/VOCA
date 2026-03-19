from typing import Any, List, Dict
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.api import deps
from backend.app.models.user import User
from backend.app.models.roadmap import DailyProgress, DayStatus
from backend.app.schemas.roadmap import DailyProgress as DailyProgressSchema, DailyProgressUpdate, DayContent

router = APIRouter()

# Mock content based on UC-08
DAY_CONTENTS: Dict[int, DayContent] = {
    1: DayContent(day_number=1, topic="Reason for waking up", interaction_type="Journaling", prompt="What is your reason for waking up?", requirements={"min_length": 50}),
    2: DayContent(day_number=2, topic="What is Ikigai?", interaction_type="Journaling", prompt="Write your understanding of Ikigai.", requirements={"min_length": 50}),
    # ... Add more days as needed, keeping it simple for now
    6: DayContent(day_number=6, topic="4 Steps to Choose Core Value", interaction_type="Selection", prompt="Select 5 core values.", requirements={"max_selection": 5}),
}

@router.get("/", response_model=List[DailyProgressSchema])
async def get_roadmap(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get all daily progress for current user. 
    If not exists, initialize day 1 as UNLOCKED.
    """
    result = await db.execute(select(DailyProgress).where(DailyProgress.user_id == current_user.id).order_by(DailyProgress.day_number))
    progress_list = result.scalars().all()
    
    if not progress_list:
        # Initialize Day 1
        first_day = DailyProgress(user_id=current_user.id, day_number=1, status=DayStatus.UNLOCKED)
        db.add(first_day)
        # Initialize others as LOCKED (optional, or just do strictly 1 by 1)
        # For simplicity, let's just return what we have. 
        # Actually, UI expects 30 days. We might want to generate them or return sparse list.
        await db.commit()
        await db.refresh(first_day)
        return [first_day]
        
    return progress_list

@router.get("/{day_number}/content", response_model=DayContent)
async def get_day_content(
    day_number: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get static content and prompt for a specific day.
    """
    if day_number not in DAY_CONTENTS:
        # Fallback
        return DayContent(day_number=day_number, topic=f"Day {day_number}", interaction_type="Journaling", prompt="Reflect on today.")
    return DAY_CONTENTS[day_number]

@router.post("/{day_number}/submit", response_model=DailyProgressSchema)
async def submit_day_progress(
    day_number: int,
    submission: DailyProgressUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Submit answer for a day. If valid, mark COMPLETED and unlock next day.
    """
    # Check if day is unlocked
    result = await db.execute(select(DailyProgress).where(DailyProgress.user_id == current_user.id, DailyProgress.day_number == day_number))
    progress = result.scalars().first()
    
    if not progress:
        # Should restrict random submission, but for now create if Day 1
        if day_number == 1:
            progress = DailyProgress(user_id=current_user.id, day_number=1, status=DayStatus.UNLOCKED)
            db.add(progress)
        else:
            raise HTTPException(status_code=400, detail="Day is locked or previous day not completed.")
            
    if progress.status == DayStatus.LOCKED:
        raise HTTPException(status_code=400, detail="Day is locked.")
        
    # Validate content (Basic check)
    content_data = submission.content_data
    # TODO: Implement BR-16 validation logic based on DAY_CONTENTS requirements
    
    # Save
    progress.content_data = content_data
    progress.status = DayStatus.COMPLETED
    progress.completed_at = datetime.utcnow()
    db.add(progress)
    
    # Unlock next day
    next_day_num = day_number + 1
    if next_day_num <= 30:
        res_next = await db.execute(select(DailyProgress).where(DailyProgress.user_id == current_user.id, DailyProgress.day_number == next_day_num))
        next_day = res_next.scalars().first()
        if not next_day:
            next_day = DailyProgress(user_id=current_user.id, day_number=next_day_num, status=DayStatus.UNLOCKED)
            db.add(next_day)
        elif next_day.status == DayStatus.LOCKED:
            next_day.status = DayStatus.UNLOCKED
            db.add(next_day)
            
    await db.commit()
    await db.refresh(progress)
    return progress
