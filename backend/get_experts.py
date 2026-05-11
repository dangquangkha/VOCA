import sys
sys.path.append('.')

import asyncio
from backend.app.db.session import async_sessionmaker, engine
from backend.app.domains.marketplace.models import ExpertProfile, ExpertQuiz
from sqlalchemy.future import select

async def get_experts():
    async with async_sessionmaker() as session:
        result = await session.execute(select(ExpertProfile))
        experts = result.scalars().all()
        for exp in experts:
            print(f"Expert ID: {exp.id}, User ID: {exp.user_id}")

        print("---")
        result_q = await session.execute(select(ExpertQuiz))
        quizzes = result_q.scalars().all()
        for q in quizzes:
            print(f"Quiz ID: {q.id}, Title: {q.title}, Expert ID: {q.expert_id}")

if __name__ == "__main__":
    asyncio.run(get_experts())
