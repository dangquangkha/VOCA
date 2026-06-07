"""
Group Session REST API Endpoints.
Prefix: /group-sessions
"""
from typing import Any, Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api import deps
from backend.app.domains.identity.models import User, UserRole
from backend.app.domains.booking.group_session_models import GroupSessionStatus
from backend.app.schemas.group_session import (
    GroupSessionResponse,
    GroupSessionCreate,
    GroupSessionUpdate,
    GroupSessionParticipant as ParticipantSchema,
    GroupSessionParticipantCreate,
)
from backend.app.services.business.group_session_service import GroupSessionService

router = APIRouter()


# ─── Public / Shared: List & Get ──────────────────────────────────────────────

@router.get("/", response_model=List[GroupSessionResponse])
async def list_group_sessions(
    expert_id: Optional[int] = Query(None, description="Lọc theo expert id"),
    student_id: Optional[int] = Query(None, description="Lọc theo student id"),
    status: Optional[GroupSessionStatus] = Query(None, description="Lọc theo trạng thái"),
    db: AsyncSession = Depends(deps.get_db)
) -> Any:
    """
    Lấy danh sách các lớp học chuyên đề / Workshop.
    """
    return await GroupSessionService.list_sessions(
        db=db, expert_id=expert_id, student_id=student_id, status=status
    )


@router.get("/my-sessions", response_model=List[GroupSessionResponse])
async def list_my_sessions_as_expert(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Lấy danh sách các lớp học chuyên đề do Chuyên gia hiện tại làm chủ.
    """
    # Tìm expert profile
    from backend.app.domains.marketplace.models import ExpertProfile
    result = await db.execute(
        ExpertProfile.__table__.select().where(ExpertProfile.user_id == current_user.id)
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=403, detail="Only experts can view their created sessions")
    
    expert_id = row[0]  # First column is id
    return await GroupSessionService.list_sessions(db=db, expert_id=expert_id)


@router.get("/my-registrations", response_model=List[GroupSessionResponse])
async def list_my_registrations_as_student(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Lấy danh sách các lớp học chuyên đề mà Học viên hiện tại đã đăng ký.
    """
    return await GroupSessionService.list_sessions(db=db, student_id=current_user.id)


@router.get("/{session_id}", response_model=GroupSessionResponse)
async def get_group_session_details(
    session_id: int,
    db: AsyncSession = Depends(deps.get_db)
) -> Any:
    """
    Lấy chi tiết một lớp học chuyên đề.
    """
    return await GroupSessionService.get_session_by_id(db=db, session_id=session_id)


# ─── Expert: Tạo, Cập nhật, Hủy ───────────────────────────────────────────────

@router.post("/", response_model=GroupSessionResponse, status_code=201)
async def create_group_session(
    data: GroupSessionCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Chuyên gia tạo một lớp học chuyên đề / Workshop mới.
    """
    return await GroupSessionService.create_session(
        db=db, expert_user_id=current_user.id, schema=data
    )


@router.put("/{session_id}", response_model=GroupSessionResponse)
async def update_group_session(
    session_id: int,
    data: GroupSessionUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Chuyên gia cập nhật thông tin lớp học chuyên đề.
    """
    return await GroupSessionService.update_session(
        db=db, expert_user_id=current_user.id, session_id=session_id, schema=data
    )


@router.post("/{session_id}/cancel", response_model=GroupSessionResponse)
async def cancel_group_session(
    session_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Chuyên gia hủy lớp chuyên đề và tự động hoàn lại tiền (credits) cho tất cả học viên đã đăng ký.
    """
    return await GroupSessionService.cancel_session(
        db=db, expert_user_id=current_user.id, session_id=session_id
    )


# ─── Student: Đăng ký (Join) ──────────────────────────────────────────────────

@router.post("/{session_id}/join", response_model=ParticipantSchema)
async def join_group_session(
    session_id: int,
    data: GroupSessionParticipantCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Học viên đăng ký tham gia lớp chuyên đề. 
    Hệ thống tự động kiểm tra slot và thực hiện trừ Credits.
    """
    return await GroupSessionService.join_session(
        db=db,
        student_user_id=current_user.id,
        session_id=session_id,
        student_note=data.student_note
    )


# ─── Expert: Quản lý học viên ─────────────────────────────────────────────────

@router.get("/expert/my-students", response_model=dict)
async def list_my_students_as_expert(
    search: Optional[str] = Query(None, description="Tìm theo tên/email"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Lấy danh sách các học viên đã đăng ký lịch (bao gồm cả 1-1 và Group Sessions).
    """
    return await GroupSessionService.list_my_students(
        db=db, current_user=current_user, search=search, page=page, page_size=page_size
    )