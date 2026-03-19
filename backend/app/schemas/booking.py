from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from backend.app.models.booking import BookingStatus
from backend.app.models.payment import TransactionType, TransactionStatus
from backend.app.schemas.user import User
from backend.app.schemas.expert import ExpertProfile, ExpertProfileShort

# --- Transaction Schemas ---
class TransactionBase(BaseModel):
    amount: int
    type: TransactionType
    description: Optional[str] = None

class TransactionCreate(TransactionBase):
    pass

class Transaction(TransactionBase):
    id: int
    user_id: int
    booking_id: Optional[int] = None
    status: TransactionStatus
    created_at: datetime

    class Config:
        from_attributes = True

# --- Booking Schemas ---
class BookingBase(BaseModel):
    start_time: datetime
    end_time: datetime
    student_note: Optional[str] = None

class BookingCreate(BookingBase):
    expert_id: int

class BookingUpdate(BaseModel):
    status: Optional[BookingStatus] = None
    expert_note: Optional[str] = None
    meeting_url: Optional[str] = None
    rejection_reason: Optional[str] = None  # UC-13: expert rejection reason

class Booking(BookingBase):
    id: int
    student_id: int
    expert_id: int
    status: BookingStatus
    total_amount: int
    meeting_url: Optional[str] = None
    expert_note: Optional[str] = None
    rejection_reason: Optional[str] = None        # UC-13
    student_checked_in_at: Optional[datetime] = None  # UC-37
    expert_checked_in_at: Optional[datetime] = None   # UC-37
    created_at: datetime
    updated_at: datetime
    
    student: Optional[User] = None
    expert: Optional[ExpertProfileShort] = None

    class Config:
        from_attributes = True

