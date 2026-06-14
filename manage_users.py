import asyncio
import sys
import os

# Add project root to sys.path to ensure imports work
sys.path.append(os.getcwd())

from backend.app.db.session import AsyncSessionLocal
from backend.app.domains.identity.models import User
from backend.app.domains.marketplace.models import ExpertProfile
import backend.app.db.base
from sqlalchemy import select, text

async def list_users():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User))
        users = result.scalars().all()
        print(f"{'ID':<5} {'Role':<10} {'Email'}")
        print("-" * 40)
        for user in users:
            print(f"{user.id:<5} {user.role.value:<10} {user.email}")

async def delete_user(email: str):
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalars().first()
        if user:
            user_id = user.id
            
            # Xóa các ràng buộc liên quan để tránh lỗi khóa ngoại và NotNullConstraint
            await db.execute(text("DELETE FROM booking_quiz_responses WHERE booking_id IN (SELECT id FROM bookings WHERE student_id = :uid OR expert_id = (SELECT id FROM expert_profiles WHERE user_id = :uid))"), {"uid": user_id})
            await db.execute(text("DELETE FROM booking_disputes WHERE booking_id IN (SELECT id FROM bookings WHERE student_id = :uid OR expert_id = (SELECT id FROM expert_profiles WHERE user_id = :uid))"), {"uid": user_id})
            await db.execute(text("DELETE FROM transactions WHERE user_id = :uid OR booking_id IN (SELECT id FROM bookings WHERE student_id = :uid OR expert_id IN (SELECT id FROM expert_profiles WHERE user_id = :uid))"), {"uid": user_id})
            await db.execute(text("DELETE FROM reviews WHERE student_id = :uid OR booking_id IN (SELECT id FROM bookings WHERE student_id = :uid OR expert_id IN (SELECT id FROM expert_profiles WHERE user_id = :uid))"), {"uid": user_id})
            await db.execute(text("DELETE FROM group_session_participants WHERE session_id IN (SELECT id FROM group_sessions WHERE expert_id IN (SELECT id FROM expert_profiles WHERE user_id = :uid))"), {"uid": user_id})
            await db.execute(text("DELETE FROM group_session_participants WHERE student_id = :uid"), {"uid": user_id})
            await db.execute(text("DELETE FROM group_sessions WHERE expert_id IN (SELECT id FROM expert_profiles WHERE user_id = :uid)"), {"uid": user_id})
            await db.execute(text("DELETE FROM bookings WHERE student_id = :uid OR expert_id IN (SELECT id FROM expert_profiles WHERE user_id = :uid)"), {"uid": user_id})
            await db.execute(text("DELETE FROM expert_availabilities WHERE expert_id IN (SELECT id FROM expert_profiles WHERE user_id = :uid)"), {"uid": user_id})
            await db.execute(text("DELETE FROM expert_quizzes WHERE expert_id IN (SELECT id FROM expert_profiles WHERE user_id = :uid)"), {"uid": user_id})
            await db.execute(text("DELETE FROM expert_posts WHERE expert_id IN (SELECT id FROM expert_profiles WHERE user_id = :uid)"), {"uid": user_id})
            await db.execute(text("DELETE FROM expert_profiles WHERE user_id = :uid"), {"uid": user_id})
            await db.execute(text("DELETE FROM user_assessment_results WHERE user_id = :uid"), {"uid": user_id})
            await db.execute(text("DELETE FROM user_mbti_results WHERE user_id = :uid"), {"uid": user_id})
            await db.execute(text("DELETE FROM notifications WHERE recipient_id = :uid OR sender_id = :uid"), {"uid": user_id})
            await db.execute(text("DELETE FROM messages WHERE sender_id = :uid OR receiver_id = :uid"), {"uid": user_id})
            await db.execute(text("DELETE FROM cv_analyses WHERE user_id = :uid"), {"uid": user_id})
            await db.execute(text("DELETE FROM mock_interviews WHERE user_id = :uid"), {"uid": user_id})
            await db.execute(text("DELETE FROM roadmap_history WHERE user_id = :uid"), {"uid": user_id})
            await db.execute(text("DELETE FROM daily_progress WHERE user_id = :uid"), {"uid": user_id})
            await db.execute(text("DELETE FROM support_tickets WHERE user_id = :uid"), {"uid": user_id})
            await db.execute(text("DELETE FROM accountaction WHERE target_user_id = :uid OR admin_id = :uid"), {"uid": user_id})
            await db.execute(text("DELETE FROM blacklist WHERE banned_user_id = :uid"), {"uid": user_id})
            await db.execute(text("DELETE FROM public_quiz_responses WHERE user_id = :uid"), {"uid": user_id})
            await db.execute(text("DELETE FROM email_logs WHERE to_email = :email"), {"email": email})
            await db.execute(text("DELETE FROM \"user\" WHERE id = :uid"), {"uid": user_id})
            
            await db.commit()
            print(f"✅ User deleted: {email}")
        else:
            print(f"❌ User not found: {email}")

if __name__ == "__main__":
    if len(sys.argv) == 1:
        print("Usage:")
        print("  List users:   python manage_users.py list")
        print("  Delete user:  python manage_users.py delete <email>")
        sys.exit(0)
    
    command = sys.argv[1]
    
    if command == "list":
        asyncio.run(list_users())
    elif command == "delete" and len(sys.argv) == 3:
        email = sys.argv[2]
        asyncio.run(delete_user(email))
    else:
        print("Invalid command.")
        print("  List users:   python manage_users.py list")
        print("  Delete user:  python manage_users.py delete <email>")
