import asyncio
import os
import sys

# Add project root to path
sys.path.append(os.getcwd())

from sqlalchemy import select, func
from backend.app.db.session import AsyncSessionLocal
from backend.app.domains.marketplace.models import ExpertProfile
from backend.app.domains.booking.models import Booking
from backend.app.domains.identity.models import User

async def debug_sarah_data():
    async with AsyncSessionLocal() as db:
        # 1. Find Sarah's profile
        result = await db.execute(
            select(ExpertProfile).join(User).where(User.email.ilike("sarah.ml@careerpath.com"))
        )
        expert = result.scalars().first()
        
        if not expert:
            print("Sarah expert profile not found!")
            return
            
        print(f"Expert: {expert.user.full_name} (ID: {expert.id})")
        
        # 2. Check bookings
        bookings_count = await db.scalar(
            select(func.count(Booking.id)).where(Booking.expert_id == expert.id)
        )
        print(f"Actual bookings count in DB for ID {expert.id}: {bookings_count}")
        
        # 3. List some bookings if any
        if bookings_count > 0:
            b_result = await db.execute(select(Booking).where(Booking.expert_id == expert.id).limit(5))
            for b in b_result.scalars():
                print(f" - Booking ID: {b.id}, Status: {b.status}, Amount: {b.total_amount}")

if __name__ == "__main__":
    asyncio.run(debug_sarah_data())
