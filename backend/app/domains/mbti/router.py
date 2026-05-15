from typing import List, Any
from datetime import datetime
import logging
import traceback
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel

from backend.app.api import deps
from backend.app.domains.identity.models import User
from backend.app.domains.mbti.models import MBTIQuestion, MBTIType, UserMBTIResult
from backend.app.models.roadmap import RoadmapHistory

router = APIRouter()

# --- Schemas ---
class MBTIQuestionSchema(BaseModel):
    id: int
    order: int
    text: str
    option_a_text: str | None
    option_b_text: str | None
    option_a_value: str
    option_b_value: str
    dimension: str

class MBTITypeSchema(BaseModel):
    code: str
    title: str
    vietnamese_title: str
    description: str
    pros: List[str]
    cons: List[str]
    population_pct: str
    suggested_careers: str

class MBTISubmission(BaseModel):
    answers: dict # {question_order: "A" or "B"}
    gender: str

class MBTIResultResponse(BaseModel):
    mbti_code: str
    type_details: MBTITypeSchema
    scores: dict

# --- Endpoints ---

@router.get("/questions", response_model=List[MBTIQuestionSchema])
async def get_questions(db: AsyncSession = Depends(deps.get_db)):
    result = await db.execute(select(MBTIQuestion).order_by(MBTIQuestion.order))
    return result.scalars().all()

@router.get("/my-result", response_model=Any)
async def get_my_result(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    try:
        result = await db.execute(
            select(UserMBTIResult)
            .where(UserMBTIResult.user_id == current_user.id)
            .order_by(UserMBTIResult.id.desc())
        )
        last_result = result.scalars().first()
        
        if not last_result:
            return None
            
        mbti_type = None
        if last_result.mbti_code:
            type_result = await db.execute(select(MBTIType).where(MBTIType.code == last_result.mbti_code))
            mbti_type = type_result.scalars().first()
        
        created_at_str = last_result.created_at.isoformat() if last_result.created_at else None

        return {
            "mbti_code": last_result.mbti_code or "UNKNOWN",
            "gender": getattr(last_result, 'gender', 'Other'),
            "created_at": created_at_str,
            "type_details": mbti_type or {
                "code": last_result.mbti_code or "UNKNOWN",
                "vietnamese_title": "Đang cập nhật...",
                "description": "Kết quả của bạn đã được ghi nhận thành công.",
                "pros": [], "cons": [], "population_pct": "N/A", "suggested_careers": ""
            },
            "scores": {
                "E": getattr(last_result, 'score_e', 0) or 0,
                "I": getattr(last_result, 'score_i', 0) or 0,
                "S": getattr(last_result, 'score_s', 0) or 0,
                "N": getattr(last_result, 'score_n', 0) or 0,
                "T": getattr(last_result, 'score_t', 0) or 0,
                "F": getattr(last_result, 'score_f', 0) or 0,
                "J": getattr(last_result, 'score_j', 0) or 0,
                "P": getattr(last_result, 'score_p', 0) or 0
            }
        }
    except Exception as e:
        logging.error(f"MBTI GET ERROR: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/submit", response_model=MBTIResultResponse)
async def submit_quiz(
    submission: MBTISubmission,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    try:
        # 1. Fetch questions
        result = await db.execute(select(MBTIQuestion))
        questions = {q.order: q for q in result.scalars().all()}
        
        # 2. Calculate scores
        scores = {"E": 0, "I": 0, "S": 0, "N": 0, "T": 0, "F": 0, "J": 0, "P": 0}
        for q_order, choice in submission.answers.items():
            try:
                q_obj = questions.get(int(q_order))
                if q_obj:
                    val = q_obj.option_a_value if choice == "A" else q_obj.option_b_value
                    if val in scores: scores[val] += 1
            except: continue
        
        # 3. Determine code
        mbti_code = (
            ("E" if scores["E"] >= scores["I"] else "I") +
            ("S" if scores["S"] >= scores["N"] else "N") +
            ("T" if scores["T"] >= scores["F"] else "F") +
            ("J" if scores["J"] >= scores["P"] else "P")
        )
        
        # 4. Fetch type details
        type_result = await db.execute(select(MBTIType).where(MBTIType.code == mbti_code))
        mbti_type = type_result.scalars().first()
        
        # 5. Create objects
        user_result = UserMBTIResult(
            user_id=current_user.id,
            mbti_code=mbti_code,
            gender=submission.gender,
            score_e=scores["E"], score_i=scores["I"],
            score_s=scores["S"], score_n=scores["N"],
            score_t=scores["T"], score_f=scores["F"],
            score_j=scores["J"], score_p=scores["P"]
        )
        
        heritage_snapshot = {
            "type": "MBTI_REPORT",
            "mbti_code": mbti_code,
            "vietnamese_title": mbti_type.vietnamese_title if mbti_type else "Chưa xác định",
            "description": mbti_type.description if mbti_type else "Kết quả đã ghi nhận.",
            "scores": scores,
            "gender": submission.gender,
            "completed_at": datetime.utcnow().isoformat()
        }
        
        heritage = RoadmapHistory(
            user_id=current_user.id,
            snapshot_data=heritage_snapshot,
            is_premium=False
        )

        # 6. Unified Transaction
        db.add(user_result)
        db.add(heritage)
        await db.commit()
        await db.refresh(user_result)
        
        return {
            "mbti_code": mbti_code,
            "type_details": mbti_type or {
                "code": mbti_code,
                "vietnamese_title": "Đang cập nhật...",
                "description": "Kết quả trắc nghiệm của bạn đã được hệ thống ghi nhận.",
                "pros": [], "cons": [], "population_pct": "N/A", "suggested_careers": ""
            },
            "scores": scores
        }
    except Exception as e:
        await db.rollback()
        logging.error(f"MBTI SUBMIT ERROR: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
