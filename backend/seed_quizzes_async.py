import asyncio
import sys
import os
from datetime import datetime

sys.path.append(os.getcwd())

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select

from backend.app.db.base import Base
from backend.app.domains.marketplace.models import ExpertQuiz
from backend.app.core.config import settings

async def seed_more_quizzes():
    url = settings.DATABASE_URL
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://")

    engine = create_async_engine(url, echo=False)
    AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with AsyncSessionLocal() as session:
        # Get one quiz to copy its questions and expert_id
        res = await session.execute(select(ExpertQuiz).limit(1))
        quiz_template = res.scalars().first()

        if not quiz_template:
            print("No existing quizzes found to use as template.")
            return

        print(f"Found template quiz '{quiz_template.title}' from expert {quiz_template.expert_id}")
        
        # We need to insert 4 more
        for i in range(4, 8):
            new_quiz = ExpertQuiz(
                expert_id=quiz_template.expert_id,
                title=f"Khám phá Vùng Thiên Tài (Bản mở rộng {i})",
                description=f"Bài khảo sát mở rộng số {i} giúp bạn định vị bản thân một cách chi tiết và chính xác hơn.",
                questions=quiz_template.questions,
                is_public=True,
                is_required_for_booking=False,
                is_active=True,
                total_attempts=0,
                created_at=datetime.utcnow()
            )
            session.add(new_quiz)
        
        await session.commit()
        print("Successfully added 4 new quizzes for pagination testing.")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed_more_quizzes())
