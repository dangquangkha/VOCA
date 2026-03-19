import asyncio
import os
import sys
import requests
from datetime import timedelta

# Add project root to path
sys.path.append(os.getcwd())

from backend.app.core import security
from backend.app.core.config import settings
from backend.app.db.session import AsyncSessionLocal
from backend.app.models.user import User
from sqlalchemy import select

async def test_admin_access(email: str):
    # 1. Get User and verify Superuser status
    print(f"Checking user: {email}")
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalars().first()
        
        if not user:
            print("User not found!")
            return
            
        print(f"User found: ID={user.id}, Role={user.role}, Superuser={user.is_superuser}")
        
        if not user.is_superuser:
            print("WARNING: User is NOT a superuser. Promoting temporarilly for test...")
            user.is_superuser = True
            session.add(user)
            await session.commit()
    
    # 2. Create Token Manually
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = security.create_access_token(
        subject=email, expires_delta=access_token_expires
    )
    print(f"Generated Token: {token[:10]}...")
    
    # 3. Request Admin Stats
    headers = {"Authorization": f"Bearer {token}"}
    url = "http://localhost:8000/api/v1/admin/stats"
    
    try:
        print(f"Requesting {url}...")
        response = requests.get(url, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("SUCCESS: Admin access verified.")
        elif response.status_code == 401:
            print("FAILURE: 401 Unauthorized - Backend rejected token.")
        elif response.status_code == 403:
            print("FAILURE: 403 Forbidden - Not enough privileges.")
            
    except Exception as e:
        print(f"Error making request: {e}")

if __name__ == "__main__":
    # Use the email we promoted earlier
    email = "thanh@email.com" 
    if len(sys.argv) > 1:
        email = sys.argv[1]
    asyncio.run(test_admin_access(email))
