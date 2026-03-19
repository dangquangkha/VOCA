import asyncio
import sys
import os

# Add project root to sys.path to ensure imports work
sys.path.append(os.getcwd())

from backend.app.db.session import AsyncSessionLocal
from backend.app.models.user import User
from backend.app.models.expert import ExpertProfile
from sqlalchemy import select

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
            await db.delete(user)
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
