from enum import Enum
from datetime import datetime
from sqlalchemy import Integer, String, ForeignKey, DateTime, Enum as SQLAlchemyEnum, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base_class import Base

class DayStatus(str, Enum):
    LOCKED = "LOCKED"
    UNLOCKED = "UNLOCKED"
    COMPLETED = "COMPLETED"

class DailyProgress(Base):
    __tablename__ = "daily_progress"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("user.id"), nullable=False)
    
    day_number: Mapped[int] = mapped_column(Integer, nullable=False) # 1 to 30
    status: Mapped[DayStatus] = mapped_column(SQLAlchemyEnum(DayStatus), default=DayStatus.LOCKED)
    
    content_data: Mapped[dict] = mapped_column(JSON, nullable=True) # Stores user answers, journal text, or checkbox state
    
    completed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", backref="daily_progress")
