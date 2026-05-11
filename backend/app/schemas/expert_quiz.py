from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel

class QuizQuestion(BaseModel):
    id: str
    type: str # text, radio, checkbox, scale
    label: str
    options: Optional[List[str]] = None
    required: bool = True

class ExpertQuizBase(BaseModel):
    title: str
    description: Optional[str] = None
    questions: List[QuizQuestion]

class ExpertQuizCreate(ExpertQuizBase):
    is_public: bool = False
    is_required_for_booking: bool = False

class ExpertQuizUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    questions: Optional[List[QuizQuestion]] = None
    is_public: Optional[bool] = None
    is_required_for_booking: Optional[bool] = None
    is_active: Optional[bool] = None

class ExpertQuiz(ExpertQuizBase):
    id: int
    expert_id: int
    is_public: bool = False
    is_required_for_booking: bool = False
    is_active: bool = True
    total_attempts: int = 0
    created_at: datetime

    class Config:
        from_attributes = True

class ExpertQuizPublic(ExpertQuiz):
    """Extended schema for public quiz listing — includes expert name."""
    expert_name: Optional[str] = None
    expert_avatar: Optional[str] = None
    expert_tags: Optional[str] = None

class BookingQuizResponseBase(BaseModel):
    responses: dict # {question_id: answer}

class BookingQuizResponseCreate(BookingQuizResponseBase):
    booking_id: int
    quiz_id: int

class BookingQuizResponse(BookingQuizResponseBase):
    id: int
    booking_id: int
    quiz_id: int
    score: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Public Quiz Response Schemas ---

class PublicQuizResponseCreate(BaseModel):
    responses: dict  # {question_id: answer}

class PublicQuizResponseRead(BaseModel):
    id: int
    user_id: int
    quiz_id: int
    responses: dict
    created_at: datetime

    class Config:
        from_attributes = True
