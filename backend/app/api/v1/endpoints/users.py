from typing import Any, List, Optional
from math import ceil

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from fastapi.encoders import jsonable_encoder
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, func

from backend.app.api import deps
from backend.app.core import security
from backend.app.core.config import settings
from backend.app.models.user import User, UserRole, UserStatus
from backend.app.schemas.user import User as UserSchema, UserUpdate
from backend.app.schemas.user_crud import (
    UserCreate as UserCreateSchema,
    UserUpdate as UserUpdateSchema,
    UserRead,
    PaginatedUserResponse
)

router = APIRouter()

@router.get("/me", response_model=UserSchema)
async def read_user_me(
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get current user.
    """
    return current_user

@router.put("/me", response_model=UserSchema)
async def update_user_me(
    *,
    db: AsyncSession = Depends(deps.get_db),
    user_in: UserUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update own user.
    """
    current_user_data = jsonable_encoder(current_user)
    user_in_data = user_in.dict(exclude_unset=True)
    
    # If password is provided, hash it
    if "password" in user_in_data and user_in_data["password"]:
        user_in_data["hashed_password"] = security.get_password_hash(user_in_data["password"])
        del user_in_data["password"]
    
    # Update fields
    for field in current_user_data:
        if field in user_in_data:
            setattr(current_user, field, user_in_data[field])
            
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return current_user


# ==================== ADMIN ENDPOINTS ====================

@router.get("/admin/users", response_model=PaginatedUserResponse)
async def get_users_admin(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_superuser),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Max number of records to return"),
    role: Optional[str] = Query(None, description="Filter by role: STUDENT, EXPERT, ADMIN"),
    account_status: Optional[str] = Query(None, description="Filter by status: ACTIVE, SUSPENDED, BANNED"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search by email, full_name, or phone_number"),
    sort_by: str = Query("created_at", description="Field to sort by"),
    sort_desc: bool = Query(True, description="Sort descending if True"),
) -> Any:
    """
    Retrieve users with pagination, filtering, search, and sorting.
    Admin only.
    """
    # Build base query
    query = select(User)
    
    # Apply filters
    if role:
        try:
            role_enum = UserRole(role.upper())
            query = query.where(User.role == role_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid role: {role}")
    
    if account_status:
        try:
            status_enum = UserStatus(account_status.upper())
            query = query.where(User.account_status == status_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid account_status: {account_status}")
    
    if is_active is not None:
        query = query.where(User.is_active == is_active)
    
    # Apply search
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                User.email.ilike(search_pattern),
                User.full_name.ilike(search_pattern),
                User.phone_number.ilike(search_pattern)
            )
        )
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply sorting
    sort_column = getattr(User, sort_by, User.created_at)
    if sort_desc:
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())
    
    # Apply pagination
    query = query.offset(skip).limit(limit)
    
    # Execute query
    result = await db.execute(query)
    users = result.scalars().all()
    
    # Calculate pagination metadata
    page_size = limit
    page = (skip // page_size) + 1
    total_pages = ceil(total / page_size) if total > 0 else 0
    
    return PaginatedUserResponse(
        items=users,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.post("/admin/users", response_model=UserRead)
async def create_user_admin(
    *,
    db: AsyncSession = Depends(deps.get_db),
    user_in: UserCreateSchema,
    current_user: User = Depends(deps.get_current_superuser),
) -> Any:
    """
    Create new user. Admin only.
    """
    # Check if user with this email already exists
    result = await db.execute(select(User).where(User.email == user_in.email))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="A user with this email already exists."
        )
    
    # Create user
    user_data = user_in.dict(exclude={"password"})
    user_data["hashed_password"] = security.get_password_hash(user_in.password)
    
    db_user = User(**user_data)
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    
    return db_user


@router.put("/admin/users/{user_id}", response_model=UserRead)
async def update_user_admin(
    *,
    db: AsyncSession = Depends(deps.get_db),
    user_id: int,
    user_in: UserUpdateSchema,
    current_user: User = Depends(deps.get_current_superuser),
) -> Any:
    """
    Update user by ID. Admin only.
    """
    # Get user
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check email uniqueness if email is being updated
    if user_in.email and user_in.email != user.email:
        result = await db.execute(select(User).where(User.email == user_in.email))
        existing_user = result.scalar_one_or_none()
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="A user with this email already exists."
            )
    
    # Update user
    update_data = user_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    return user


@router.delete("/admin/users/{user_id}")
async def delete_user_admin(
    *,
    db: AsyncSession = Depends(deps.get_db),
    user_id: int,
    hard_delete: bool = Query(False, description="Permanently delete user if True"),
    current_user: User = Depends(deps.get_current_superuser),
) -> Any:
    """
    Delete user by ID. Admin only.
    Default is soft delete (set is_active = False).
    """
    # Get user
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent self-deletion
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    if hard_delete:
        # Hard delete - permanently remove from database
        await db.delete(user)
        await db.commit()
        return {"detail": "User permanently deleted", "user_id": user_id}
    else:
        # Soft delete - set is_active to False
        user.is_active = False
        db.add(user)
        await db.commit()
        return {"detail": "User deactivated", "user_id": user_id}


# Legacy endpoint for backward compatibility
@router.get("/", response_model=List[UserSchema])
async def read_users(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve users. Only Admin should access this.
    (Legacy endpoint - use /admin/users instead)
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="The user doesn't have enough privileges")
    
    result = await db.execute(select(User).offset(skip).limit(limit))
    users = result.scalars().all()
    return users
