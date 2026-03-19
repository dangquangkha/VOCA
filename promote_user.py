import asyncio
import sys
import os

# Add project root to path
sys.path.append(os.getcwd())

from sqlalchemy import select
from backend.app.db.session import AsyncSessionLocal
from backend.app.models.user import User, UserRole

async def promote(email: str):
    print(f"Connecting to database to promote {email}...")
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalars().first()
        if not user:
            print(f"Error: User with email '{email}' not found.")
            return

        user.is_superuser = True
        user.role = UserRole.ADMIN # Cast to enum if needed, usually string works if Enum is string-based, but safe to just set property
        # Actually UserRole is an Enum in postgres usually mapped. 
        # Check simple string assignment first, or import Enum if model uses python Enum.
        # User model definition step 16 showed 'role' type: 'userrole' enum.
        # Let's verify model definition if needed, but 'ADMIN' string usually works with SQLAlchemy Enums if not strict python enum object.
        # To be safe, let's just set is_superuser. The error check was `if not current_user.is_superuser`.
        
        db.add(user)
        await db.commit()
        print(f"Success: User '{email}' promoted to Superuser.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python promote_user.py <email>")
        sys.exit(1)
    
    email = sys.argv[1]
    asyncio.run(promote(email))
