from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from backend.app.api import deps
from backend.app.domains.identity.models import User, UserRole
from backend.app.models.support import SupportTicket, SupportStatus
from backend.app.schemas.support import SupportTicketCreate, SupportTicketRead, SupportTicketUpdate
from backend.app.services.admin_notification_service import notify_all_admins
from backend.app.models.notification import NotificationPriority
from backend.app.schemas.user_crud import UserRead

router = APIRouter()

@router.post("/", response_model=SupportTicketRead)
async def create_support_ticket(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    ticket_in: SupportTicketCreate,
) -> Any:
    """
    Create a new support ticket.
    """
    ticket = SupportTicket(
        user_id=current_user.id,
        subject=ticket_in.subject,
        message=ticket_in.message,
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)
    
    # Notify Admins
    try:
        await notify_all_admins(
            db=db,
            title="Yêu cầu hỗ trợ mới",
            message=f"Người dùng {current_user.full_name or current_user.email} đã gửi yêu cầu hỗ trợ: {ticket_in.subject}",
            link="/dashboard/admin/support",
            priority=NotificationPriority.LOW,
            data={"ticket_id": ticket.id}
        )
    except Exception as e:
        print(f"WARNING: Admin notification for support failed: {e}")
        
    return ticket

@router.get("/my", response_model=List[SupportTicketRead])
async def get_my_tickets(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get all support tickets for the current user.
    """
    result = await db.execute(
        select(SupportTicket).where(SupportTicket.user_id == current_user.id).order_by(SupportTicket.created_at.desc())
    )
    return result.scalars().all()

@router.get("/all", response_model=List[SupportTicketRead])
async def get_all_tickets(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_superuser),
) -> Any:
    """
    Get all support tickets (Admin only).
    """
    result = await db.execute(
        select(SupportTicket).order_by(SupportTicket.created_at.desc())
    )
    return result.scalars().all()

@router.patch("/{ticket_id}", response_model=SupportTicketRead)
async def update_support_ticket(
    ticket_id: int,
    ticket_update: SupportTicketUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_superuser),
) -> Any:
    """
    Update a support ticket (Admin only).
    """
    ticket = await db.get(SupportTicket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Support ticket not found")
        
    if ticket_update.status is not None:
        ticket.status = ticket_update.status
    if ticket_update.admin_notes is not None:
        ticket.admin_notes = ticket_update.admin_notes
        
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)
    return ticket

@router.get("/admin-profile", response_model=UserRead)
async def get_support_admin_profile(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get the profile of the primary support admin.
    Searches for the first user with ADMIN role or specific admin email.
    """
    # 1. Try by role
    result = await db.execute(
        select(User)
        .where(User.role == UserRole.ADMIN)
        .options(selectinload(User.expert_profile))
        .order_by(User.id)
    )
    admin = result.scalars().first()
    
    # 2. Try by known email
    if not admin:
        result = await db.execute(
            select(User)
            .where(User.email == "admin@careerpath.com")
            .options(selectinload(User.expert_profile))
        )
        admin = result.scalars().first()
        
    # 3. Fallback to ID 2 (legacy)
    if not admin:
        result = await db.execute(
            select(User)
            .where(User.id == 2)
            .options(selectinload(User.expert_profile))
        )
        admin = result.scalars().first()
        
    # 4. Fallback to any superuser
    if not admin:
        result = await db.execute(
            select(User)
            .where(User.is_superuser == True)
            .options(selectinload(User.expert_profile))
            .order_by(User.id)
        )
        admin = result.scalars().first()
        
    if not admin:
        raise HTTPException(status_code=404, detail="Support Admin not found")
    return admin
