from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class ReviewBase(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class ReviewCreate(ReviewBase):
    booking_id: int

class Review(ReviewBase):
    id: int
    booking_id: int
    student_id: int
    expert_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ReviewWithUser(Review):
    student_full_name: str
    student_avatar_url: Optional[str] = None

    class Config:
        from_attributes = True
