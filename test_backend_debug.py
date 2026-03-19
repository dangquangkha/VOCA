import sys
import os
import asyncio

# Add project root to path
sys.path.append(os.getcwd())

from backend.app.db.session import AsyncSessionLocal
from backend.app.models.expert import ExpertProfile, KYCStatus
from backend.app.models.user import User
from backend.app.schemas.expert import ExpertProfile as ExpertProfileSchema
from sqlalchemy import select
from sqlalchemy.orm import selectinload, joinedload

async def test_query():
    # Helper for masking (mimic endpoint logic)
    def mask_sensitive_info(text: str) -> str:
        if not text:
            return text
        return "[HIDDEN]"

    async with AsyncSessionLocal() as db:
        try:
            print("Testing Expert Search Query...")
            query = select(ExpertProfile).join(User).where(ExpertProfile.kyc_status == KYCStatus.APPROVED)
            
            # Mimic the sort
            query = query.order_by(ExpertProfile.rating.desc(), ExpertProfile.hourly_rate.asc())
            query = query.options(joinedload(ExpertProfile.user), selectinload(ExpertProfile.availabilities))
            query = query.offset(0).limit(20)
            
            result = await db.execute(query)
            experts = result.scalars().all()
            print(f"Successfully fetched {len(experts)} experts.")
            
            for e in experts:
                if e.bio:
                    e.bio = mask_sensitive_info(e.bio)
                
                print(f" - {e.user.full_name} (ID: {e.id})")
                
                # Validate with Pydantic
                try:
                    schema_obj = ExpertProfileSchema.model_validate(e)
                    print(f"   [OK] Validated Pydantic Schema for ID {e.id}")
                except Exception as pydantic_err:
                    print(f"   [FAIL] Pydantic Validation Error for ID {e.id}: {pydantic_err}")
                    raise pydantic_err
                
        except Exception as e:
            print("CRITICAL ERROR:")
            print(e)
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_query())
