import os
import shutil
import uuid
from typing import Any, List, Optional
import unicodedata
import re

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, and_, func, delete, desc
from sqlalchemy.orm import selectinload

from backend.app.api import deps
from backend.app.domains.identity.models import User, UserRole, UserStatus
from backend.app.domains.marketplace.models import ExpertProfile, ExpertPost, PostAttachment, PostStatus, PostType, PostLike, PostBookmark, PostComment
from backend.app.domains.marketplace.schemas import (
    ExpertPostCreate,
    ExpertPostUpdate,
    ExpertPostSchema,
    PaginatedPostResponse,
    PostAttachmentSchema,
    ExpertPostFeedItem,
    PaginatedFeedResponse,
    ExpertPostDetailSchema,
    PostCommentSchema,
    PostCommentCreate,
)

router = APIRouter()

def slugify(text: str) -> str:
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('utf-8')
    text = re.sub(r'[^\w\s-]', '', text).strip().lower()
    return re.sub(r'[-\s]+', '-', text)

def generate_slug(title: str, unique_id: str) -> str:
    base_slug = slugify(title)
    return f"{base_slug}-{unique_id[:8]}"

@router.post("/me/upload-file")
async def upload_portfolio_file(
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Upload an image or PDF for a post/portfolio.
    Saved to local /uploads/portfolio directory.
    """
    if current_user.role not in [UserRole.EXPERT, UserRole.MENTOR]:
        raise HTTPException(status_code=403, detail="Only experts can upload portfolio files")

    upload_dir = os.path.join(os.getcwd(), "backend", "uploads", "portfolio")
    os.makedirs(upload_dir, exist_ok=True)

    ext = file.filename.split(".")[-1] if "." in file.filename else ""
    unique_filename = f"{uuid.uuid4().hex}.{ext}"
    file_path = os.path.join(upload_dir, unique_filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")

    file_url = f"/uploads/portfolio/{unique_filename}"
    
    return {
        "url": file_url,
        "name": file.filename,
        "type": file.content_type
    }

@router.post("/me/posts", response_model=ExpertPostSchema)
async def create_post(
    post_in: ExpertPostCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """Create a new post for the current expert."""
    if current_user.role not in [UserRole.EXPERT, UserRole.MENTOR]:
        raise HTTPException(status_code=403, detail="Not authorized")

    expert_result = await db.execute(select(ExpertProfile).where(ExpertProfile.user_id == current_user.id))
    expert = expert_result.scalars().first()
    if not expert:
        raise HTTPException(status_code=404, detail="Expert profile not found")

    new_post = ExpertPost(
        expert_id=expert.id,
        title=post_in.title,
        slug=generate_slug(post_in.title, uuid.uuid4().hex),
        type=post_in.type,
        content=post_in.content,
        status=post_in.status
    )
    db.add(new_post)
    await db.flush() # To get new_post.id

    if post_in.attachments:
        for att in post_in.attachments:
            db_att = PostAttachment(
                post_id=new_post.id,
                file_url=att.file_url,
                file_name=att.file_name,
                file_type=att.file_type
            )
            db.add(db_att)

    await db.commit()
    await db.refresh(new_post)
    
    # Reload with attachments
    query = select(ExpertPost).where(ExpertPost.id == new_post.id).options(selectinload(ExpertPost.attachments))
    res = await db.execute(query)
    return res.scalars().first()

@router.get("/me/posts", response_model=PaginatedPostResponse)
async def get_my_posts(
    page: int = 1,
    limit: int = 10,
    status: Optional[PostStatus] = None,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """Get posts for the current expert."""
    expert_result = await db.execute(select(ExpertProfile).where(ExpertProfile.user_id == current_user.id))
    expert = expert_result.scalars().first()
    if not expert:
        return {"items": [], "total": 0, "page": page, "page_size": limit, "total_pages": 0}

    filters = [ExpertPost.expert_id == expert.id]
    if status:
        filters.append(ExpertPost.status == status)

    skip = (page - 1) * limit
    
    total = await db.scalar(select(func.count(ExpertPost.id)).where(and_(*filters)))
    
    query = select(ExpertPost).where(and_(*filters)).options(selectinload(ExpertPost.attachments)).order_by(ExpertPost.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    posts = result.scalars().all()

    return {
        "items": posts,
        "total": total or 0,
        "page": page,
        "page_size": limit,
        "total_pages": (total + limit - 1) // limit if total else 0
    }

@router.get("/me/posts/{post_id}", response_model=ExpertPostSchema)
async def get_my_post_by_id(
    post_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    expert_result = await db.execute(select(ExpertProfile).where(ExpertProfile.user_id == current_user.id))
    expert = expert_result.scalars().first()
    
    query = select(ExpertPost).where(and_(ExpertPost.id == post_id, ExpertPost.expert_id == expert.id)).options(selectinload(ExpertPost.attachments))
    res = await db.execute(query)
    post = res.scalars().first()
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

@router.put("/me/posts/{post_id}", response_model=ExpertPostSchema)
async def update_post(
    post_id: int,
    post_in: ExpertPostUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    expert_result = await db.execute(select(ExpertProfile).where(ExpertProfile.user_id == current_user.id))
    expert = expert_result.scalars().first()

    query = select(ExpertPost).where(and_(ExpertPost.id == post_id, ExpertPost.expert_id == expert.id)).options(selectinload(ExpertPost.attachments))
    res = await db.execute(query)
    post = res.scalars().first()
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if post_in.title is not None and post_in.title != post.title:
        post.title = post_in.title
        post.slug = generate_slug(post_in.title, uuid.uuid4().hex)
    if post_in.content is not None:
        post.content = post_in.content
    if post_in.type is not None:
        post.type = post_in.type
    if post_in.status is not None:
        post.status = post_in.status

    if post_in.attachments is not None:
        await db.execute(delete(PostAttachment).where(PostAttachment.post_id == post.id))
        for att in post_in.attachments:
            db_att = PostAttachment(
                post_id=post.id,
                file_url=att.file_url,
                file_name=att.file_name,
                file_type=att.file_type
            )
            db.add(db_att)

    db.add(post)
    await db.commit()
    
    # Reload
    res = await db.execute(select(ExpertPost).where(ExpertPost.id == post_id).options(selectinload(ExpertPost.attachments)))
    return res.scalars().first()

@router.delete("/me/posts/{post_id}")
async def delete_post(
    post_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    expert_result = await db.execute(select(ExpertProfile).where(ExpertProfile.user_id == current_user.id))
    expert = expert_result.scalars().first()

    query = select(ExpertPost).where(and_(ExpertPost.id == post_id, ExpertPost.expert_id == expert.id))
    res = await db.execute(query)
    post = res.scalars().first()
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    await db.delete(post)
    await db.commit()
    return {"message": "Post deleted successfully"}


# --- PUBLIC ENDPOINTS ---

@router.get("/{expert_id}/posts", response_model=PaginatedPostResponse)
async def get_public_expert_posts(
    expert_id: int,
    page: int = 1,
    limit: int = 10,
    db: AsyncSession = Depends(deps.get_db)
) -> Any:
    """Get published posts for a specific expert profile (Public)."""
    filters = [ExpertPost.expert_id == expert_id, ExpertPost.status == PostStatus.PUBLISHED]
    skip = (page - 1) * limit
    
    total = await db.scalar(select(func.count(ExpertPost.id)).where(and_(*filters)))
    
    query = select(ExpertPost).where(and_(*filters)).options(selectinload(ExpertPost.attachments)).order_by(ExpertPost.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    posts = result.scalars().all()

    return {
        "items": posts,
        "total": total or 0,
        "page": page,
        "page_size": limit,
        "total_pages": (total + limit - 1) // limit if total else 0
    }

from fastapi import Request

@router.get("/posts/slug/{slug}", response_model=ExpertPostDetailSchema)
async def get_public_post_by_slug(
    slug: str,
    request: Request,
    db: AsyncSession = Depends(deps.get_db)
) -> Any:
    """Get a single published post by its slug (Public)."""
    query = select(ExpertPost).where(and_(ExpertPost.slug == slug, ExpertPost.status == PostStatus.PUBLISHED)).options(selectinload(ExpertPost.attachments))
    res = await db.execute(query)
    post = res.scalars().first()
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found or not published")
        
    # Optional: increment view count
    post.views_count += 1
    db.add(post)
    await db.commit()
    await db.refresh(post)
    
    # Parse optional authentication token from request headers
    auth_header = request.headers.get("Authorization")
    current_user = None
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            from jose import jwt
            from backend.app.core.config import settings
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            email = payload.get("sub")
            if email:
                user_res = await db.execute(select(User).where(User.email == email))
                current_user = user_res.scalars().first()
        except Exception:
            pass  # Ignore invalid token and treat as guest
            
    # Calculate counts
    likes_count = await db.scalar(
        select(func.count(PostLike.id)).where(PostLike.post_id == post.id)
    )
    bookmarks_count = await db.scalar(
        select(func.count(PostBookmark.id)).where(PostBookmark.post_id == post.id)
    )
    comments_count = await db.scalar(
        select(func.count(PostComment.id)).where(PostComment.post_id == post.id)
    )
    
    is_liked = False
    is_bookmarked = False
    if current_user:
        is_liked = await db.scalar(
            select(func.count(PostLike.id)).where(
                and_(PostLike.post_id == post.id, PostLike.user_id == current_user.id)
            )
        ) > 0
        is_bookmarked = await db.scalar(
            select(func.count(PostBookmark.id)).where(
                and_(PostBookmark.post_id == post.id, PostBookmark.user_id == current_user.id)
            )
        ) > 0
        
    return ExpertPostDetailSchema(
        id=post.id,
        expert_id=post.expert_id,
        title=post.title,
        content=post.content,
        slug=post.slug,
        type=post.type,
        status=post.status,
        views_count=post.views_count,
        created_at=post.created_at,
        updated_at=post.updated_at,
        attachments=post.attachments,
        likes_count=likes_count or 0,
        bookmarks_count=bookmarks_count or 0,
        comments_count=comments_count or 0,
        is_liked=is_liked,
        is_bookmarked=is_bookmarked,
    )


# --- PUBLIC FEED --- (All experts' posts)

@router.get("/feed", response_model=PaginatedFeedResponse)
async def get_experts_posts_feed(
    page: int = Query(1, ge=1),
    limit: int = Query(8, ge=1, le=50),
    sort_by: str = Query("newest", regex="^(newest|most_viewed)$"),
    post_type: Optional[PostType] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(deps.get_db)
) -> Any:
    """Get all PUBLISHED posts from all experts — Public Feed.
    Supports sorting by newest/most_viewed, filtering by type, and search.
    """
    from sqlalchemy.orm import joinedload

    filters = [ExpertPost.status == PostStatus.PUBLISHED]

    if post_type:
        filters.append(ExpertPost.type == post_type)

    if search and search.strip():
        filters.append(ExpertPost.title.ilike(f"%{search.strip()}%"))

    total = await db.scalar(
        select(func.count(ExpertPost.id)).where(and_(*filters))
    )

    order_col = ExpertPost.created_at.desc() if sort_by == "newest" else ExpertPost.views_count.desc()

    skip = (page - 1) * limit
    query = (
        select(ExpertPost)
        .where(and_(*filters))
        .options(
            selectinload(ExpertPost.expert).selectinload(ExpertProfile.user)
        )
        .order_by(order_col)
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(query)
    posts = result.scalars().all()

    feed_items = []
    for post in posts:
        expert = post.expert
        user = expert.user if expert else None
        feed_items.append(ExpertPostFeedItem(
            id=post.id,
            expert_id=post.expert_id,
            title=post.title,
            slug=post.slug,
            type=post.type,
            content=post.content,
            views_count=post.views_count,
            created_at=post.created_at,
            expert_name=user.full_name if user else "Chuyên gia",
            expert_avatar=user.avatar_url if user else None,
        ))

    return {
        "items": feed_items,
        "total": total or 0,
        "page": page,
        "page_size": limit,
        "total_pages": (total + limit - 1) // limit if total else 0,
    }


# --- SOCIAL INTERACTIONS ---

@router.post("/posts/{id}/like")
async def toggle_like_post(
    id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """Toggle like state on a post."""
    post_res = await db.execute(select(ExpertPost).where(ExpertPost.id == id))
    post = post_res.scalars().first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    like_res = await db.execute(
        select(PostLike).where(and_(PostLike.post_id == id, PostLike.user_id == current_user.id))
    )
    existing_like = like_res.scalars().first()
    
    if existing_like:
        await db.delete(existing_like)
        liked = False
    else:
        new_like = PostLike(post_id=id, user_id=current_user.id)
        db.add(new_like)
        liked = True
        
    await db.commit()
    
    likes_count = await db.scalar(
        select(func.count(PostLike.id)).where(PostLike.post_id == id)
    )
    return {"liked": liked, "likes_count": likes_count or 0}


@router.post("/posts/{id}/bookmark")
async def toggle_bookmark_post(
    id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """Toggle bookmark state on a post."""
    post_res = await db.execute(select(ExpertPost).where(ExpertPost.id == id))
    post = post_res.scalars().first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    bookmark_res = await db.execute(
        select(PostBookmark).where(and_(PostBookmark.post_id == id, PostBookmark.user_id == current_user.id))
    )
    existing_bookmark = bookmark_res.scalars().first()
    
    if existing_bookmark:
        await db.delete(existing_bookmark)
        bookmarked = False
    else:
        new_bookmark = PostBookmark(post_id=id, user_id=current_user.id)
        db.add(new_bookmark)
        bookmarked = True
        
    await db.commit()
    return {"bookmarked": bookmarked}


@router.get("/posts/{id}/comments", response_model=List[PostCommentSchema])
async def get_post_comments(
    id: int,
    page: int = 1,
    limit: int = 20,
    db: AsyncSession = Depends(deps.get_db)
) -> Any:
    """Get all comments for a post, paginated. Formatted in 2 levels."""
    skip = (page - 1) * limit
    
    query = (
        select(PostComment)
        .where(and_(PostComment.post_id == id, PostComment.parent_id == None))
        .options(
            selectinload(PostComment.user),
            selectinload(PostComment.replies).selectinload(PostComment.user)
        )
        .order_by(PostComment.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(query)
    comments = result.scalars().all()
    return comments


@router.post("/posts/{id}/comments", response_model=PostCommentSchema)
async def create_post_comment(
    id: int,
    comment_in: PostCommentCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """Create a new comment or reply to an existing top-level comment."""
    post_res = await db.execute(select(ExpertPost).where(ExpertPost.id == id))
    post = post_res.scalars().first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    if comment_in.parent_id:
        parent_res = await db.execute(
            select(PostComment).where(and_(PostComment.id == comment_in.parent_id, PostComment.post_id == id))
        )
        parent = parent_res.scalars().first()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent comment not found")
        if parent.parent_id is not None:
            raise HTTPException(status_code=400, detail="Cannot reply to a sub-comment. 2 levels max.")
            
    new_comment = PostComment(
        post_id=id,
        user_id=current_user.id,
        parent_id=comment_in.parent_id,
        content=comment_in.content
    )
    db.add(new_comment)
    await db.commit()
    await db.refresh(new_comment)
    
    query = (
        select(PostComment)
        .where(PostComment.id == new_comment.id)
        .options(
            selectinload(PostComment.user),
            selectinload(PostComment.replies).selectinload(PostComment.user)
        )
    )
    res = await db.execute(query)
    return res.scalars().first()


@router.delete("/comments/{comment_id}")
async def delete_post_comment(
    comment_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """Delete a comment (Allowed for owner, post expert, or admin)."""
    query = select(PostComment).where(PostComment.id == comment_id).options(selectinload(PostComment.post))
    res = await db.execute(query)
    comment = res.scalars().first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
        
    is_owner = comment.user_id == current_user.id
    
    post = comment.post
    is_post_expert = False
    if post:
        expert_res = await db.execute(select(ExpertProfile).where(ExpertProfile.id == post.expert_id))
        expert = expert_res.scalars().first()
        if expert and expert.user_id == current_user.id:
            is_post_expert = True
            
    is_admin = current_user.is_superuser or current_user.role == UserRole.ADMIN
    
    if not (is_owner or is_post_expert or is_admin):
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")
        
    await db.delete(comment)
    await db.commit()
    return {"message": "Comment deleted successfully"}
