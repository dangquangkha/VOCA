import asyncio
import sys
import os

# Add project root to sys.path
sys.path.append(os.getcwd())

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select

from backend.app.db.base import Base
from backend.app.models.user import User, UserRole, UserStatus
from backend.app.models.expert import ExpertProfile, KYCStatus
from backend.app.core.security import get_password_hash
from backend.app.core.config import settings

async def seed_users():
    print("Seeding users...")
    url = settings.DATABASE_URL
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://")
        
    engine = create_async_engine(url, echo=True)
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    users_to_create = [
        {
            "email": "admin@careerpath.com",
            "password": "123456",
            "full_name": "System Admin",
            "role": UserRole.ADMIN,
            "is_superuser": True
        },
        {
            "email": "expert@careerpath.com",
            "password": "123456",
            "full_name": "Dr. Expert",
            "role": UserRole.EXPERT,
            "is_superuser": False,
            "expert_data": {
                "bio": "Experienced career counselor with 10 years of experience.",
                "linkedin_url": "https://linkedin.com/in/expert",
                "experience_years": 10,
                "hourly_rate": 100,
                "tags": "IT, Career Coaching",
                "kyc_status": KYCStatus.APPROVED
            }
        },
        {
            "email": "student@careerpath.com",
            "password": "123456",
            "full_name": "Alice Student",
            "role": UserRole.STUDENT,
            "is_superuser": False
        }
    ]

    async with async_session() as session:
        for user_data in users_to_create:
            email = user_data["email"]
            print(f"Checking {email}...")
            
            # Check if user exists
            result = await session.execute(select(User).where(User.email == email))
            existing_user = result.scalars().first()
            
            if existing_user:
                print(f"User {email} already exists. Updating...")
                existing_user.hashed_password = get_password_hash(user_data["password"])
                existing_user.full_name = user_data["full_name"]
                existing_user.role = user_data["role"]
                existing_user.is_superuser = user_data["is_superuser"]
                existing_user.is_active = True
                
                # If expert, ensure profile exists
                if user_data["role"] == UserRole.EXPERT and "expert_data" in user_data:
                    res_expert = await session.execute(select(ExpertProfile).where(ExpertProfile.user_id == existing_user.id))
                    existing_profile = res_expert.scalars().first()
                    ed = user_data["expert_data"]
                    
                    if existing_profile:
                         existing_profile.bio = ed["bio"]
                         existing_profile.kyc_status = ed["kyc_status"]
                    else:
                        new_profile = ExpertProfile(
                            user_id=existing_user.id,
                            bio=ed["bio"],
                            linkedin_url=ed["linkedin_url"],
                            experience_years=ed["experience_years"],
                            hourly_rate=ed["hourly_rate"],
                            tags=ed["tags"],
                            kyc_status=ed["kyc_status"]
                        )
                        session.add(new_profile)

                session.add(existing_user)
            
            else:
                print(f"Creating {email}...")
                new_user = User(
                    email=email,
                    hashed_password=get_password_hash(user_data["password"]),
                    full_name=user_data["full_name"],
                    phone_number="0123456789",
                    role=user_data["role"],
                    account_status=UserStatus.ACTIVE,
                    is_active=True,
                    is_superuser=user_data["is_superuser"]
                )
                session.add(new_user)
                await session.flush() # to get ID
                
                if user_data["role"] == UserRole.EXPERT and "expert_data" in user_data:
                    ed = user_data["expert_data"]
                    new_profile = ExpertProfile(
                        user_id=new_user.id,
                        bio=ed["bio"],
                        linkedin_url=ed["linkedin_url"],
                        experience_years=ed["experience_years"],
                        hourly_rate=ed["hourly_rate"],
                        tags=ed["tags"],
                        kyc_status=ed["kyc_status"]
                    )
                    session.add(new_profile)
            
        await session.commit()
        print("✅ Users seeded successfully.")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed_users())
