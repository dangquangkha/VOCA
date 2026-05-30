from datetime import datetime
from sqlalchemy import Integer, ForeignKey, DateTime, Text, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base_class import Base

class Review(Base):
    __tablename__ = "reviews"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    booking_id: Mapped[int] = mapped_column(Integer, ForeignKey("bookings.id"), unique=True, nullable=False)
    student_id: Mapped[int] = mapped_column(Integer, ForeignKey("user.id"), nullable=False)
    expert_id: Mapped[int] = mapped_column(Integer, ForeignKey("expert_profiles.id"), nullable=False)
    
    rating: Mapped[int] = mapped_column(Integer, nullable=False) # 1-5
    comment: Mapped[str] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    booking = relationship("Booking", backref="review")
    student = relationship("User", foreign_keys=[student_id], backref="reviews_sent")
    expert = relationship("ExpertProfile", foreign_keys=[expert_id], backref="reviews")

    @property
    def student_full_name(self) -> str:
        return self.student.full_name if self.student else "Học viên ẩn danh"

    @property
    def student_avatar_url(self) -> str | None:
        return self.student.avatar_url if self.student else None

