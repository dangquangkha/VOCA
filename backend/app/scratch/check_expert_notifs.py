import asyncio
import sys
import os

# Thêm đường dẫn để import được backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../")))

from sqlalchemy.future import select
from backend.app.db.session import AsyncSessionLocal
from backend.app.domains.identity.models import User
from backend.app.models.notification import Notification

async def check():
    async with AsyncSessionLocal() as db:
        # 1. Tìm chuyên gia tên "Nguyễn" hoặc người vừa đăng nhập
        result = await db.execute(select(User).order_by(User.id.desc()).limit(5))
        users = result.scalars().all()
        
        print("-" * 50)
        print("DANH SÁCH NGƯỜI DÙNG GẦN ĐÂY:")
        for u in users:
            print(f"ID: {u.id} | Email: {u.email} | Name: {u.full_name} | Role: {u.role}")
        
        # 2. Kiểm tra thông báo của người dùng mới nhất (giả định là chuyên gia đang test)
        latest_user = users[0]
        print("-" * 50)
        print(f"KIỂM TRA THÔNG BÁO CHO USER ID: {latest_user.id} ({latest_user.full_name})")
        
        notif_result = await db.execute(
            select(Notification)
            .where(Notification.recipient_id == latest_user.id)
            .order_by(Notification.created_at.desc())
            .limit(5)
        )
        notifs = notif_result.scalars().all()
        
        if not notifs:
            print("❌ KHÔNG TÌM THẤY THÔNG BÁO NÀO TRONG DATABASE!")
        else:
            for n in notifs:
                print(f"[{n.created_at}] Title: {n.title} | Read: {n.is_read} | Message: {n.message[:30]}...")
        print("-" * 50)

if __name__ == "__main__":
    asyncio.run(check())
