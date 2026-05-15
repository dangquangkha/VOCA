import asyncio
import sys
import os

# Thêm đường dẫn dự án vào sys.path
sys.path.append(os.getcwd())

from sqlalchemy import select, func
from backend.app.db.session import AsyncSessionLocal
from backend.app.domains.marketplace.models import ExpertProfile
from backend.app.domains.booking.models import Booking, BookingStatus
from backend.app.domains.marketplace.review_models import Review # Giả định model review nằm đây

from backend.app.domains.marketplace.review_models import Review

async def test_stats_logic(expert_id: int):
    async with AsyncSessionLocal() as db:
        print(f"--- Testing Stats for Expert ID: {expert_id} ---")
        
        # 1. Total Bookings
        total_bookings = await db.scalar(
            select(func.count(Booking.id)).where(Booking.expert_id == expert_id)
        )
        print(f"Total Bookings: {total_bookings}")
        
        # 2. Completed Bookings (Completed + Rated)
        completed_statuses = [BookingStatus.COMPLETED, BookingStatus.RATED]
        completed_bookings = await db.scalar(
            select(func.count(Booking.id)).where(
                Booking.expert_id == expert_id,
                Booking.status.in_(completed_statuses)
            )
        )
        print(f"Completed Bookings: {completed_bookings}")
        
        # 3. Total Revenue
        total_revenue = await db.scalar(
            select(func.sum(Booking.total_amount)).where(
                Booking.expert_id == expert_id,
                Booking.status.in_(completed_statuses)
            )
        ) or 0
        print(f"Total Revenue: {total_revenue}")
        
        # 4. Average Rating from Reviews
        avg_rating = await db.scalar(
            select(func.avg(Review.rating)).where(Review.expert_id == expert_id)
        ) or 0.0
        print(f"Average Rating from Reviews: {float(avg_rating)}")
        
        # 5. Average Rating from Expert Profile (Fallback)
        expert = await db.get(ExpertProfile, expert_id)
        print(f"Rating in Profile: {expert.rating if expert else 'N/A'}")

if __name__ == "__main__":
    # Thay ID chuyên gia bạn muốn test vào đây (ví dụ: 1)
    asyncio.run(test_stats_logic(expert_id=1))
