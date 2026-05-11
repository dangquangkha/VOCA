from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from backend.app.api import deps
from backend.app.domains.identity.models import User
from backend.app.models.account_action import AccountAction
from backend.app.schemas.account_action import AccountActionRead
from backend.app.utils.csv_export import export_actions_to_csv

router = APIRouter()

@router.get("/actions/{user_id}", response_model=List[AccountActionRead])
async def get_user_account_actions(
    user_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, le=100),
) -> Any:
    """
    Get account action history for a specific user.
    Admin only.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = (
        select(AccountAction)
        .where(AccountAction.target_user_id == user_id)
        .options(selectinload(AccountAction.admin), selectinload(AccountAction.target_user))
        .order_by(AccountAction.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    
    result = await db.execute(query)
    actions = result.scalars().all()
    
    return actions


@router.get("/actions", response_model=List[AccountActionRead])
async def get_all_account_actions(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=200),
) -> Any:
    """
    Get all account actions (audit log).
    Admin only. Useful for compliance and monitoring.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = (
        select(AccountAction)
        .options(selectinload(AccountAction.admin), selectinload(AccountAction.target_user))
        .order_by(AccountAction.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    
    result = await db.execute(query)
    actions = result.scalars().all()
    
    return actions


@router.get("/export/csv")
async def export_account_actions_csv(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    limit: int = Query(1000, le=10000),
) -> Response:
    """
    Export account actions to CSV format.
    Admin only. Maximum 10,000 records.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = (
        select(AccountAction)
        .options(selectinload(AccountAction.admin), selectinload(AccountAction.target_user))
        .order_by(AccountAction.created_at.desc())
        .limit(limit)
    )
    
    result = await db.execute(query)
    actions = result.scalars().all()
    
    csv_content = export_actions_to_csv(actions)
    
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=account_actions_export.csv"
        }
    )
