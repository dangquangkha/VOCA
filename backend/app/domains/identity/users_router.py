"""
DDD Migration: User profile and admin user management endpoints.
Migrated from: backend/app/api/v1/endpoints/users.py

Routes:
    GET  /users/me                  — Get current user profile
    PUT  /users/me                  — Update own profile / password
    POST /users/upload-avatar       — Upload and resize avatar image
    GET  /users/admin/users         — Admin: paginated user list with filters
    POST /users/admin/users         — Admin: create user
    PUT  /users/admin/users/{id}    — Admin: update user by ID
    DELETE /users/admin/users/{id}  — Admin: delete (soft/hard) user by ID
    GET  /users/                    — Legacy: list all users (admin only)
"""

from typing import Any, List, Optional
from math import ceil

from fastapi import APIRouter, Body, Depends, HTTPException, Query, File, UploadFile
from fastapi.encoders import jsonable_encoder
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, func
from sqlalchemy.orm import selectinload

from backend.app.api import deps
from backend.app.core import security
from backend.app.domains.identity.models import User, UserRole, UserStatus
from backend.app.schemas.user import User as UserSchema, UserUpdate
from backend.app.schemas.user_crud import (
    UserCreate as UserCreateSchema,
    UserUpdate as UserUpdateSchema,
    UserRead,
    PaginatedUserResponse,
)

router = APIRouter()


# ─── Current User Endpoints ────────────────────────────────────────────────────

@router.get("/me", response_model=UserSchema)
async def read_user_me(
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Get current user profile."""
    return current_user


@router.get("/{user_id}", response_model=UserSchema)
async def read_user_by_id(
    user_id: int,
    current_user: User = Depends(deps.get_current_active_user),
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    """Get user profile by ID."""
    result = await db.execute(
        select(User)
        .where(User.id == user_id)
        .options(selectinload(User.expert_profile))
    )
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/me", response_model=UserSchema)
async def update_user_me(
    *,
    db: AsyncSession = Depends(deps.get_db),
    user_in: UserUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Update own profile. If 'password' is provided, it will be hashed and stored."""
    current_user_data = jsonable_encoder(current_user)
    user_in_data = user_in.dict(exclude_unset=True)

    if "password" in user_in_data and user_in_data["password"]:
        user_in_data["hashed_password"] = security.get_password_hash(user_in_data["password"])
        del user_in_data["password"]

    for field in current_user_data:
        if field in user_in_data:
            setattr(current_user, field, user_in_data[field])

    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.post("/upload-avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Upload an avatar image. Image will be center-cropped to square and
    resized to 500x500 JPEG before saving.
    """
    import uuid
    import os

    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    upload_dir = os.path.join(os.getcwd(), "backend", "uploads", "avatars")
    os.makedirs(upload_dir, exist_ok=True)

    extension = os.path.splitext(file.filename)[1] or ".jpg"
    filename = f"{uuid.uuid4()}{extension}"
    file_path = os.path.join(upload_dir, filename)

    try:
        from PIL import Image
        import io
        from starlette.concurrency import run_in_threadpool
        import anyio

        content = await file.read()

        def process_image(img_content: bytes) -> bytes:
            img = Image.open(io.BytesIO(img_content))
            if img.mode != "RGB":
                img = img.convert("RGB")
            width, height = img.size
            min_dim = min(width, height)
            left  = (width  - min_dim) / 2
            top   = (height - min_dim) / 2
            right = (width  + min_dim) / 2
            bottom= (height + min_dim) / 2
            img = img.crop((left, top, right, bottom))
            img = img.resize((500, 500), Image.Resampling.LANCZOS)
            output = io.BytesIO()
            img.save(output, format="JPEG", quality=85)
            return output.getvalue()

        final_content = await run_in_threadpool(process_image, content)

        async with await anyio.open_file(file_path, "wb") as f:
            await f.write(final_content)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save avatar: {str(e)}")

    avatar_url = f"/uploads/avatars/{filename}"
    current_user.avatar_url = avatar_url
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)

    return {"avatar_url": avatar_url}


# ─── Admin — User Management ───────────────────────────────────────────────────

@router.get("/admin/users", response_model=PaginatedUserResponse)
async def get_users_admin(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_superuser),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    role: Optional[str] = Query(None, description="Filter by role: STUDENT, EXPERT, ADMIN"),
    account_status: Optional[str] = Query(None, description="Filter by status: ACTIVE, SUSPENDED, BANNED"),
    is_active: Optional[bool] = Query(None),
    search: Optional[str] = Query(None, description="Search by email, full_name, or phone_number"),
    sort_by: str = Query("created_at"),
    sort_desc: bool = Query(True),
) -> Any:
    """Admin: Retrieve users with pagination, filtering, search, and sorting."""
    query = select(User).options(selectinload(User.expert_profile))

    if role:
        try:
            query = query.where(User.role == UserRole(role.upper()))
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid role: {role}")

    if account_status:
        try:
            query = query.where(User.account_status == UserStatus(account_status.upper()))
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid account_status: {account_status}")

    if is_active is not None:
        query = query.where(User.is_active == is_active)

    if search:
        pattern = f"%{search}%"
        query = query.where(
            or_(
                User.email.ilike(pattern),
                User.full_name.ilike(pattern),
                User.phone_number.ilike(pattern),
            )
        )

    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar()

    sort_column = getattr(User, sort_by, User.id)
    query = query.order_by(sort_column.desc() if sort_desc else sort_column.asc())
    query = query.offset(skip).limit(limit)

    users = (await db.execute(query)).scalars().all()

    page_size = limit
    page = (skip // page_size) + 1
    total_pages = ceil(total / page_size) if total > 0 else 0

    return PaginatedUserResponse(
        items=users, total=total, page=page,
        page_size=page_size, total_pages=total_pages,
    )


@router.post("/admin/users", response_model=UserRead)
async def create_user_admin(
    *,
    db: AsyncSession = Depends(deps.get_db),
    user_in: UserCreateSchema,
    current_user: User = Depends(deps.get_current_superuser),
) -> Any:
    """Admin: Create new user."""
    existing = (await db.execute(select(User).where(User.email == user_in.email))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="A user with this email already exists.")

    user_data = user_in.dict(exclude={"password"})
    user_data["hashed_password"] = security.get_password_hash(user_in.password)
    db_user = User(**user_data)
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user, attribute_names=["expert_profile"])
    return db_user


@router.put("/admin/users/{user_id}", response_model=UserRead)
async def update_user_admin(
    *,
    db: AsyncSession = Depends(deps.get_db),
    user_id: int,
    user_in: UserUpdateSchema,
    current_user: User = Depends(deps.get_current_superuser),
) -> Any:
    """Admin: Update user by ID."""
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user_in.email and user_in.email != user.email:
        conflict = (await db.execute(select(User).where(User.email == user_in.email))).scalar_one_or_none()
        if conflict:
            raise HTTPException(status_code=400, detail="A user with this email already exists.")

    for field, value in user_in.dict(exclude_unset=True).items():
        setattr(user, field, value)

    db.add(user)
    await db.commit()
    await db.refresh(user, attribute_names=["expert_profile"])
    return user


@router.delete("/admin/users/{user_id}")
async def delete_user_admin(
    *,
    db: AsyncSession = Depends(deps.get_db),
    user_id: int,
    hard_delete: bool = Query(False, description="Permanently delete if True; soft-delete (deactivate) if False"),
    current_user: User = Depends(deps.get_current_superuser),
) -> Any:
    """Admin: Delete user by ID. Default is soft-delete (is_active=False)."""
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    if hard_delete:
        await db.delete(user)
        await db.commit()
        return {"detail": "User permanently deleted", "user_id": user_id}
    else:
        user.is_active = False
        db.add(user)
        await db.commit()
        return {"detail": "User deactivated", "user_id": user_id}


# ─── Legacy Endpoint ──────────────────────────────────────────────────────────

@router.get("/", response_model=List[UserSchema])
async def read_users(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Legacy: Retrieve all users. Admin only. Use /admin/users instead."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="The user doesn't have enough privileges")
    result = await db.execute(
        select(User)
        .offset(skip)
        .limit(limit)
        .options(selectinload(User.expert_profile))
    )
    return result.scalars().all()
