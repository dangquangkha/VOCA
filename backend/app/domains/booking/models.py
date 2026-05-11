from enum import Enum
import enum
from typing import Optional, List
from datetime import datetime
from sqlalchemy import Integer, String, ForeignKey, DateTime, Enum as SQLAlchemyEnum, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base_class import Base

# --- ENUMS ---
class QuizStatus(str, enum.Enum):
    NONE = "NONE"
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"

class BookingStatus(str, Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    IN_PROGRESS = "IN_PROGRESS"
    REJECTED = "REJECTED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    CANCELLED_BY_EXPERT = "CANCELLED_BY_EXPERT"
    CANCELLED_EXPERT_NO_SHOW = "CANCELLED_EXPERT_NO_SHOW"
    CANCELLED_USER_NO_SHOW = "CANCELLED_USER_NO_SHOW"
    CANCELLED_MUTUAL_NO_SHOW = "CANCELLED_MUTUAL_NO_SHOW"
    DISPUTED = "DISPUTED"
    REFUNDED = "REFUNDED"
    RATED = "RATED"

class DisputeStatus(str, Enum):
    PENDING = "PENDING"
    RESOLVED = "RESOLVED"
    REJECTED = "REJECTED"

# --- MODELS ---
class Booking(Base):
    __tablename__ = "bookings"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(Integer, ForeignKey("user.id"), nullable=False)
    expert_id: Mapped[int] = mapped_column(Integer, ForeignKey("expert_profiles.id"), nullable=False)
    
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    
    status: Mapped[BookingStatus] = mapped_column(SQLAlchemyEnum(BookingStatus), default=BookingStatus.PENDING)
    total_amount: Mapped[int] = mapped_column(Integer, nullable=False) # In Credits
    
    is_pwyw: Mapped[bool] = mapped_column(Boolean, default=False)
    pwyw_amount: Mapped[int] = mapped_column(Integer, default=0)

    meeting_url: Mapped[str] = mapped_column(String, nullable=True)
    student_note: Mapped[str] = mapped_column(String, nullable=True)
    expert_note: Mapped[str] = mapped_column(String, nullable=True)
    rejection_reason: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    student_checked_in_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    expert_checked_in_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    student = relationship("User", foreign_keys=[student_id], backref="bookings_as_student")
    expert = relationship("ExpertProfile", foreign_keys=[expert_id], backref="bookings")
    disputes = relationship("BookingDispute", back_populates="booking", cascade="all, delete-orphan")

class BookingDispute(Base):
    __tablename__ = "booking_disputes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    booking_id: Mapped[int] = mapped_column(Integer, ForeignKey("bookings.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("user.id"), nullable=False)
    
    reason: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    contact_info: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    status: Mapped[DisputeStatus] = mapped_column(SQLAlchemyEnum(DisputeStatus), default=DisputeStatus.PENDING)
    admin_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    booking = relationship("Booking", back_populates="disputes")
    user = relationship("User", backref="user_disputes")
