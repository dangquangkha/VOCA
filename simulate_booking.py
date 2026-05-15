import asyncio
import json
from datetime import datetime, timedelta, timezone
from backend.app.db.session import AsyncSessionLocal
from backend.app.domains.booking.router import create_booking
from backend.app.domains.booking.schemas import BookingCreate
from backend.app.domains.identity.models import User
from backend.app.domains.marketplace.models import ExpertProfile
from sqlalchemy.future import select

async def simulate_booking():
    async with AsyncSessionLocal() as db:
        # Get a student (User ID 1 is usually admin, let's find a student)
        result = await db.execute(select(User).where(User.email == "student@careerpath.com"))
        student = result.scalars().first()
        if not student:
            # Fallback to any user
            result = await db.execute(select(User).limit(1))
            student = result.scalars().first()
        
        # Get an expert
        result = await db.execute(select(ExpertProfile).limit(1))
        expert_profile = result.scalars().first()
        
        if not student or not expert_profile:
            print("Student or Expert not found.")
            return

        print(f"Simulating booking from Student {student.id} to Expert {expert_profile.id}")
        
        booking_in = BookingCreate(
            expert_id=expert_profile.id,
            start_time=datetime.now(timezone.utc) + timedelta(days=1),
            end_time=datetime.now(timezone.utc) + timedelta(days=1, hours=1),
            student_note="Test booking for notification"
        )
        
        try:
            # We need to mock 'current_user' for the Depends(deps.get_current_active_user)
            # Since we are calling the function directly, we just pass the objects.
            # But create_booking is an async function that uses Depends, 
            # so we should call it with resolved dependencies.
            
            # Actually, let's just call the service and then the notification directly to test.
            from backend.app.domains.booking.service import booking_service
            from backend.app.services.notification_service import create_notification
            from backend.app.models.notification import NotificationType, NotificationPriority

            booking = await booking_service.create_booking(
                db=db,
                student_id=student.id,
                expert_id=expert_profile.id,
                start_time=booking_in.start_time,
                end_time=booking_in.end_time,
                total_cost=0, # PWYW for test
                student_note=booking_in.student_note,
                is_pwyw=True
            )
            print(f"Booking created: {booking.id}")
            
            await create_notification(
                recipient_id=expert_profile.user_id,
                sender_id=student.id,
                title="Yêu cầu đặt lịch mới (SIMULATED)",
                message=f"{student.full_name or 'Học viên'} đã gửi yêu cầu tư vấn.",
                type=NotificationType.BOOKING,
                priority=NotificationPriority.HIGH,
                link=f"/dashboard/manage/bookings?booking={booking.id}"
            )
            print("Notification call completed.")
            
        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(simulate_booking())
