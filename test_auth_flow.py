import asyncio
from sqlalchemy import select
from backend.app.db.session import AsyncSessionLocal
from backend.app.domains.identity.models import User
from backend.app.core import security
from backend.app.core.config import settings
from jose import jwt

async def test_flow():
    email = "sarah.ml@careerpath.com"
    async with AsyncSessionLocal() as db:
        # 1. Login step
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalars().first()
        if not user:
            print(f"FAILED: User {email} not found in DB")
            return
        
        print(f"SUCCESS: User found in DB. ID={user.id}, Role={user.role}")
        
        # 2. Token creation
        token = security.create_access_token(user.email)
        print(f"SUCCESS: Token created: {token[:20]}...")
        
        # 3. Validation step (simulate deps.py)
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            decoded_email = payload.get("sub")
            print(f"SUCCESS: Token decoded. Sub={decoded_email}")
            
            if decoded_email != email:
                print(f"FAILED: Decoded email mismatch! {decoded_email} != {email}")
                return
            
            # 4. Fetch user again (simulate deps.py)
            result2 = await db.execute(select(User).where(User.email == decoded_email))
            user2 = result2.scalars().first()
            if not user2:
                print(f"FAILED: User not found in second fetch!")
            else:
                print(f"SUCCESS: User found in second fetch. ID={user2.id}")
                
        except Exception as e:
            print(f"FAILED: Token validation failed: {str(e)}")
            print(f"DEBUG: SECRET_KEY used: {settings.SECRET_KEY}")
            print(f"DEBUG: ALGORITHM used: {settings.ALGORITHM}")

if __name__ == "__main__":
    asyncio.run(test_flow())
