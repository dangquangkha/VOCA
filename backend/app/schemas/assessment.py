from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime

class QuestionBase(BaseModel):
    content: str
    question_type: str
    order: int
    assessment_id: int

class QuestionRead(QuestionBase):
    id: int

    class Config:
        from_attributes = True

# --- Assessment Schema ---
class AssessmentBase(BaseModel):
    title: str
    description: str
    code: str
    image_url: Optional[str] = None

class AssessmentRead(AssessmentBase):
    id: int
    questions: List[QuestionRead] = []

    class Config:
        from_attributes = True

# --- Result Schema ---
class UserResultBase(BaseModel):
    assessment_id: int
    
class UserResultCreate(UserResultBase):
    # Answers map: {question_id: answer_value}
    # For Holland: {1: 5, 2: 1...} (Likert)
    # For MBTI: {1: "A", 2: "B"...}
    answers: Dict[int, Any] 

from backend.app.schemas.expert import ExpertProfile

class UserResultRead(UserResultBase):
    id: int
    user_id: int
    scores: Dict[str, Any]
    result_code: str
    created_at: datetime
    suggested_experts: List[ExpertProfile] = []

    class Config:
        from_attributes = True
