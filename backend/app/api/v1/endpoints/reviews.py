from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from backend.app.api import deps
from backend.app.models.user import User
from backend.app.models.expert import ExpertProfile
from backend.app.models.booking import Booking, BookingStatus
from backend.app.models.review import Review
from backend.app.schemas.review import ReviewCreate, Review as ReviewSchema
from backend.app.core.config import settings

router = APIRouter()

# Simple profanity filter
BAD_WORDS = ["chửi", "bậy", "tục", "ngu", "dốt", "fake", "scam"] # Simplified example

def filter_profanity(text: str) -> str:
    if not text:
        return text
    filtered_text = text
    for word in BAD_WORDS:
        if word.lower() in filtered_text.lower():
            # In real system, would use a library or block the request
            # For this MVP, we just report an error to follow UC-34 rule E1
            return None
    return filtered_text

@router.post("/", response_model=ReviewSchema)
async def create_review(
    *,
    db: AsyncSession = Depends(deps.get_db),
    review_in: ReviewCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create a new review for an expert after a completed booking.
    """
    # 1. Fetch booking
    query = select(Booking).where(Booking.id == review_in.booking_id).options(selectinload(Booking.expert))
    result = await db.execute(query)
    booking = result.scalars().first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    # 2. Preconditions check
    if booking.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to rate this booking")
        
    if booking.status != BookingStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Can only rate completed bookings")
        
    # Check if already rated (UC-34.0.E2)
    # Note: RATED status or searching Review table. Using Review table is safer.
    check_query = select(Review).where(Review.booking_id == review_in.booking_id)
    check_res = await db.execute(check_query)
    if check_res.scalars().first():
        raise HTTPException(status_code=400, detail="You have already rated this consultancy")

    # 3. Profanity Filter (UC-34.0.E1)
    filtered_comment = filter_profanity(review_in.comment)
    if review_in.comment and filtered_comment is None:
        raise HTTPException(status_code=400, detail="Comment contains inappropriate language. Please edit.")

    # 4. Create Review
    db_review = Review(
        booking_id=booking.id,
        student_id=current_user.id,
        expert_id=booking.expert_id,
        rating=review_in.rating,
        comment=review_in.comment
    )
    db.add(db_review)
    
    # 5. Update Expert Rating (BR-31)
    expert = booking.expert
    total_stars = (expert.rating * expert.total_reviews) + review_in.rating
    expert.total_reviews += 1
    expert.rating = round(total_stars / expert.total_reviews, 2)
    db.add(expert)
    
    # 6. Update Booking Status
    booking.status = BookingStatus.RATED
    db.add(booking)
    
    await db.commit()
    await db.refresh(db_review)
    return db_review
