from enum import Enum
from datetime import datetime
from sqlalchemy import Integer, String, ForeignKey, Float, Boolean, Enum as SQLAlchemyEnum, Text, JSON, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base_class import Base

class KYCStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class ExpertProfile(Base):
    __tablename__ = "expert_profiles"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("user.id"), unique=True, nullable=False)
    
    bio: Mapped[str] = mapped_column(Text, nullable=True)
    linkedin_url: Mapped[str] = mapped_column(String, nullable=True)
    experience_years: Mapped[int] = mapped_column(Integer, default=0)
    
    hourly_rate: Mapped[int] = mapped_column(Integer, default=50) # In Credits
    rating: Mapped[float] = mapped_column(Float, default=0.0)
    total_reviews: Mapped[int] = mapped_column(Integer, default=0)
    tags: Mapped[str] = mapped_column(String, nullable=True) # Comma separated tags: "IT, Marketing"
    
    kyc_status: Mapped[KYCStatus] = mapped_column(SQLAlchemyEnum(KYCStatus), default=KYCStatus.PENDING)
    kyc_documents: Mapped[str] = mapped_column(Text, nullable=True) # JSON string of URLs

    # UC-19: Bank account info for withdrawals
    bank_name: Mapped[str] = mapped_column(String, nullable=True)
    bank_account: Mapped[str] = mapped_column(String, nullable=True)
    bank_holder_name: Mapped[str] = mapped_column(String, nullable=True)
    # MENTOR: QR code URL for direct bank transfer (shown to students after session)
    qr_code_url: Mapped[str] = mapped_column(String, nullable=True)

    # Penalty tracking for cancellations
    cancellation_count: Mapped[int] = mapped_column(Integer, default=0)           # Total cancellations
    late_cancellation_count: Mapped[int] = mapped_column(Integer, default=0)      # Cancellations < 12h before session
    
    # Relationships
    user = relationship("User", back_populates="expert_profile")
    availabilities = relationship("ExpertAvailability", back_populates="expert")
    # bookings defined via backref in Booking

class ExpertAvailability(Base):
    __tablename__ = "expert_availabilities"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    expert_id: Mapped[int] = mapped_column(Integer, ForeignKey("expert_profiles.id"), nullable=False)
    
    day_of_week: Mapped[int] = mapped_column(Integer) # 0=Monday, 6=Sunday
    start_time: Mapped[str] = mapped_column(String) # HH:MM
    end_time: Mapped[str] = mapped_column(String) # HH:MM
    
    expert = relationship("ExpertProfile", back_populates="availabilities")

class ExpertQuiz(Base):
    __tablename__ = "expert_quizzes"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    expert_id: Mapped[int] = mapped_column(Integer, ForeignKey("expert_profiles.id"), nullable=False)
    
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    questions: Mapped[dict] = mapped_column(JSON, nullable=False) # List of questions [{id, type, label, options}]
    
    # Quiz visibility & requirement flags
    is_public: Mapped[bool] = mapped_column(Boolean, default=False)                # Visible on public Quizzes tab
    is_required_for_booking: Mapped[bool] = mapped_column(Boolean, default=False)  # Must complete before booking
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)                 # Expert can toggle on/off
    total_attempts: Mapped[int] = mapped_column(Integer, default=0)                # Number of attempts
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    expert = relationship("ExpertProfile", backref="quizzes")
    public_responses = relationship("PublicQuizResponse", back_populates="quiz")

class BookingQuizResponse(Base):
    __tablename__ = "booking_quiz_responses"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    booking_id: Mapped[int] = mapped_column(Integer, ForeignKey("bookings.id"), nullable=False)
    quiz_id: Mapped[int] = mapped_column(Integer, ForeignKey("expert_quizzes.id"), nullable=False)
    
    responses: Mapped[dict] = mapped_column(JSON, nullable=False) # {question_id: answer}
    score: Mapped[float] = mapped_column(Float, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    booking = relationship("Booking", backref="quiz_responses")
    quiz = relationship("ExpertQuiz")

class PublicQuizResponse(Base):
    """Stores responses for public quiz attempts (not tied to a booking)."""
    __tablename__ = "public_quiz_responses"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("user.id"), nullable=False)
    quiz_id: Mapped[int] = mapped_column(Integer, ForeignKey("expert_quizzes.id"), nullable=False)
    
    responses: Mapped[dict] = mapped_column(JSON, nullable=False)  # {question_id: answer}
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    user = relationship("User")
    quiz = relationship("ExpertQuiz", back_populates="public_responses")
