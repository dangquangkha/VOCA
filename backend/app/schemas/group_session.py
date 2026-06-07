"""
Pydantic schemas cho Group Session (Workshop) API.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

from backend.app.domains.booking.group_session_models import (
    GroupSessionStatus,
    GroupParticipantStatus,
)


# ─── Participant Schemas ──────────────────────────────────────────────────────

class ParticipantStudentInfo(BaseModel):
    """Thông tin học viên trong participant response."""
    id: int
    full_name: Optional[str] = None
    email: str
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True


class GroupSessionParticipantBase(BaseModel):
    student_note: Optional[str] = None


class GroupSessionParticipantCreate(GroupSessionParticipantBase):
    """Student dùng để join session."""
    pass


class GroupSessionParticipant(GroupSessionParticipantBase):
    id: int
    session_id: int
    student_id: int
    status: GroupParticipantStatus
    amount_paid: int
    checked_in_at: Optional[datetime] = None
    joined_at: datetime

    student: Optional[ParticipantStudentInfo] = None

    class Config:
        from_attributes = True


# ─── Expert Schemas ───────────────────────────────────────────────────────────

class GroupSessionExpertInfo(BaseModel):
    id: int
    user_id: int
    user: Optional[ParticipantStudentInfo] = None

    class Config:
        from_attributes = True


# ─── Group Session Schemas ────────────────────────────────────────────────────

class GroupSessionBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    session_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$", description="YYYY-MM-DD")
    start_time: str = Field(..., pattern=r"^\d{2}:\d{2}$", description="HH:MM")
    end_time: str = Field(..., pattern=r"^\d{2}:\d{2}$", description="HH:MM")
    max_participants: int = Field(default=5, ge=2, le=50)
    price_per_participant: int = Field(default=0, ge=0, description="Giá bằng Credits")
    meeting_url: Optional[str] = Field(None, max_length=500, description="Link phòng họp trực tuyến (Meet, Zoom...)")


class GroupSessionCreate(GroupSessionBase):
    """Payload tạo Workshop mới."""
    pass


class GroupSessionUpdate(BaseModel):
    """Payload cập nhật thông tin Workshop."""
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = None
    session_date: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    start_time: Optional[str] = Field(None, pattern=r"^\d{2}:\d{2}$")
    end_time: Optional[str] = Field(None, pattern=r"^\d{2}:\d{2}$")
    max_participants: Optional[int] = Field(None, ge=2, le=50)
    price_per_participant: Optional[int] = Field(None, ge=0)
    meeting_url: Optional[str] = Field(None, max_length=500)
    status: Optional[GroupSessionStatus] = None


class GroupSessionResponse(GroupSessionBase):
    """Dữ liệu trả về cho thông tin Workshop."""
    id: int
    expert_id: int
    status: GroupSessionStatus
    meeting_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    # Calculated fields
    current_participants: int = 0
    available_slots: int = 0

    expert: Optional[GroupSessionExpertInfo] = None
    participants: Optional[List[GroupSessionParticipant]] = None

    class Config:
        from_attributes = True