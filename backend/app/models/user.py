from enum import Enum
from sqlalchemy import Boolean, String, Integer, Enum as SQLAlchemyEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base_class import Base

class UserRole(str, Enum):
    STUDENT = "STUDENT"
    EXPERT = "EXPERT"
    ADMIN = "ADMIN"

class UserStatus(str, Enum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"  # Temporary, can be restored
    BANNED = "BANNED"  # Permanent, requires admin unban

class User(Base):
    # Không cần khai báo __tablename__ vì đã tự động hóa ở Base
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    full_name: Mapped[str] = mapped_column(String, index=True, nullable=True)
    phone_number: Mapped[str] = mapped_column(String, nullable=True)
    avatar_url: Mapped[str] = mapped_column(String, nullable=True)
    
    role: Mapped[UserRole] = mapped_column(SQLAlchemyEnum(UserRole), default=UserRole.STUDENT)
    account_status: Mapped[UserStatus] = mapped_column(SQLAlchemyEnum(UserStatus), default=UserStatus.ACTIVE)
    credits: Mapped[int] = mapped_column(Integer, default=0)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    expert_profile = relationship("ExpertProfile", back_populates="user", uselist=False)
    # bookings_as_student is defined via backref in Booking (DO NOT UNCOMMENT)
    # bookings_as_expert = relationship("Booking", back_populates="expert", foreign_keys="Booking.expert_id") # ExpertProfile handles this usually via backref
    
    # transactions defined via backref in PaymentTransaction
    
    assessment_results = relationship("UserAssessmentResult", back_populates="user")
    notifications = relationship("Notification", back_populates="recipient", cascade="all, delete-orphan", foreign_keys="Notification.recipient_id")