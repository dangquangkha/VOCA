from enum import Enum
from typing import Optional
from datetime import datetime
from sqlalchemy import Integer, String, ForeignKey, DateTime, Enum as SQLAlchemyEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base_class import Base

class BookingStatus(str, Enum):
    PENDING = "PENDING"                             # Student requested, awaiting expert
    CONFIRMED = "CONFIRMED"                         # Expert accepted
    IN_PROGRESS = "IN_PROGRESS"                     # UC-37: Both parties checked in
    REJECTED = "REJECTED"                           # Expert rejected
    COMPLETED = "COMPLETED"                         # Successfully finished
    CANCELLED = "CANCELLED"                         # Cancelled before start
    CANCELLED_EXPERT_NO_SHOW = "CANCELLED_EXPERT_NO_SHOW"   # UC-37: Expert didn't check in
    CANCELLED_USER_NO_SHOW = "CANCELLED_USER_NO_SHOW"       # UC-37: User didn't check in
    CANCELLED_MUTUAL_NO_SHOW = "CANCELLED_MUTUAL_NO_SHOW"   # UC-37: Both didn't check in
    DISPUTED = "DISPUTED"                           # User raised issue
    REFUNDED = "REFUNDED"                           # Admin returned money
    RATED = "RATED"                                 # User successfully rated

class Booking(Base):
    __tablename__ = "bookings"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(Integer, ForeignKey("user.id"), nullable=False)
    expert_id: Mapped[int] = mapped_column(Integer, ForeignKey("expert_profiles.id"), nullable=False)
    
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    
    status: Mapped[BookingStatus] = mapped_column(SQLAlchemyEnum(BookingStatus), default=BookingStatus.PENDING)
    total_amount: Mapped[int] = mapped_column(Integer, nullable=False) # In Credits
    
    meeting_url: Mapped[str] = mapped_column(String, nullable=True)
    student_note: Mapped[str] = mapped_column(String, nullable=True)
    expert_note: Mapped[str] = mapped_column(String, nullable=True)
    rejection_reason: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # UC-13

    # UC-37: Check-in timestamps
    student_checked_in_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    expert_checked_in_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    student = relationship("User", foreign_keys=[student_id], backref="bookings_as_student")
    expert = relationship("ExpertProfile", foreign_keys=[expert_id], backref="bookings")
    # transactions defined via backref in PaymentTransaction
