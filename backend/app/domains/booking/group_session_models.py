"""
Group Session Domain Models
UC-GS: Expert tạo phiên tư vấn nhóm, nhiều students cùng tham gia một meeting.
Đây là flow riêng biệt, không ảnh hưởng đến Booking 1-1 hiện tại.
"""
from enum import Enum
from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    Integer, String, ForeignKey, DateTime, Enum as SQLAlchemyEnum,
    Boolean, Text, func
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base_class import Base


# ─── Enums ───────────────────────────────────────────────────────────────────

class GroupSessionStatus(str, Enum):
    OPEN = "OPEN"               # Đang nhận đăng ký
    FULL = "FULL"               # Đã đủ người
    ONGOING = "ONGOING"         # Đang diễn ra
    COMPLETED = "COMPLETED"     # Đã kết thúc
    CANCELLED = "CANCELLED"     # Đã hủy bởi expert


class GroupParticipantStatus(str, Enum):
    PENDING = "PENDING"         # Đã đăng ký, chờ expert xác nhận
    CONFIRMED = "CONFIRMED"     # Expert đã xác nhận
    CANCELLED = "CANCELLED"     # Đã hủy (student rút lui hoặc expert kick)
    COMPLETED = "COMPLETED"     # Buổi đã hoàn thành


# ─── Models ──────────────────────────────────────────────────────────────────

class GroupSession(Base):
    """
    Phiên tư vấn nhóm do chuyên gia tạo ra.
    Nhiều students có thể tham gia, chia sẻ cùng một meeting room.
    """
    __tablename__ = "group_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    expert_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("expert_profiles.id"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Specific date YYYY-MM-DD instead of weekly recurring day_of_week
    session_date: Mapped[str] = mapped_column(String(10), nullable=False)
    
    start_time: Mapped[str] = mapped_column(String(5), nullable=False)  # HH:MM
    end_time: Mapped[str] = mapped_column(String(5), nullable=False)    # HH:MM
    max_participants: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    price_per_participant: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    
    status: Mapped[GroupSessionStatus] = mapped_column(
        SQLAlchemyEnum(GroupSessionStatus), nullable=False, default=GroupSessionStatus.OPEN
    )
    meeting_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    expert = relationship("ExpertProfile", backref="group_sessions")
    participants = relationship(
        "GroupSessionParticipant",
        back_populates="session",
        cascade="all, delete-orphan"
    )


class GroupSessionParticipant(Base):
    """
    Bảng trung gian lưu vết học viên đăng ký tham gia lớp chuyên đề.
    """
    __tablename__ = "group_session_participants"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    session_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("group_sessions.id", ondelete="CASCADE"), nullable=False
    )
    student_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("user.id"), nullable=False
    )
    status: Mapped[GroupParticipantStatus] = mapped_column(
        SQLAlchemyEnum(GroupParticipantStatus), nullable=False, default=GroupParticipantStatus.CONFIRMED
    )
    amount_paid: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    student_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    checked_in_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # Relationships
    session = relationship("GroupSession", back_populates="participants")
    student = relationship("User", backref="group_session_participations")