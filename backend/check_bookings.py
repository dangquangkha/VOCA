import asyncio
from backend.app.db.session import AsyncSessionLocal
from backend.app.domains.booking.models import Booking
from backend.app.domains.marketplace.models import ExpertProfile
from sqlalchemy import select

async def check():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(Booking).order_by(Booking.id.desc()).limit(5))
        bookings = res.scalars().all()
        for b in bookings:
            # Get expert user_id
            ep_res = await db.execute(select(ExpertProfile).where(ExpertProfile.id == b.expert_id))
            ep = ep_res.scalars().first()
            expert_user_id = ep.user_id if ep else "N/A"
            print(f"Booking ID: {b.id}, Student: {b.student_id}, ExpertProfileID: {b.expert_id}, ExpertUserID: {expert_user_id}, Status: {b.status}, Created: {b.created_at}")

if __name__ == '__main__':
    asyncio.run(check())
