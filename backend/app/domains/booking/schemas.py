from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from backend.app.domains.booking.models import BookingStatus
from backend.app.domains.payments.models import TransactionType, TransactionStatus
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
    is_pwyw: bool = False           # MENTOR: pay-what-you-want booking
    pwyw_amount: int = 0            # MENTOR: amount student donated after session
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

# --- Dispute Schemas ---
class BookingDisputeBase(BaseModel):
    reason: str
    description: str
    contact_info: Optional[str] = None

class BookingDisputeCreate(BookingDisputeBase):
    pass

class BookingDispute(BookingDisputeBase):
    id: int
    booking_id: int
    user_id: int
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class BookingDisputeUpdate(BaseModel):
    status: str
    admin_note: Optional[str] = None
