from enum import Enum
from sqlalchemy import Integer, String, ForeignKey, Float, Enum as SQLAlchemyEnum, Text
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
