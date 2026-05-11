import asyncio
import json
from sqlalchemy.future import select
from backend.app.db.session import AsyncSessionLocal
from backend.app.db import base # Ensure all models are registered
from backend.app.domains.marketplace.models import ExpertProfile, ExpertQuiz
from backend.app.domains.identity.models import User

QUIZZES = [
    {
        "title": "Định hướng Nghề nghiệp trong Kỷ nguyên AI",
        "description": "Bài khảo sát giúp bạn hiểu rõ mức độ sẵn sàng thích nghi với các công cụ AI trong công việc.",
        "questions": [
            {"id": "q1", "type": "radio", "label": "Bạn đã từng sử dụng ChatGPT hay các công cụ AI khác trong công việc chưa?", "options": ["Thường xuyên", "Thỉnh thoảng", "Chưa bao giờ"], "required": True},
            {"id": "q2", "type": "text", "label": "Nỗi sợ lớn nhất của bạn khi AI phát triển là gì?", "required": True},
            {"id": "q3", "type": "checkbox", "label": "Những kỹ năng nào bạn muốn nâng cấp?", "options": ["Prompt Engineering", "Data Analysis", "Critical Thinking", "Soft Skills"], "required": False}
        ]
    },
    {
        "title": "Khám phá Vùng Thiên Tài (Zone of Genius)",
        "description": "Dành cho những ai đang cảm thấy mệt mỏi với công việc hiện tại và muốn tìm lại đam mê.",
        "questions": [
            {"id": "q1", "type": "text", "label": "Việc gì bạn có thể làm liên tục trong 4 tiếng mà không cảm thấy mệt mỏi?", "required": True},
            {"id": "q2", "type": "scale", "label": "Mức độ hài lòng với công việc hiện tại của bạn (1-10)?", "required": True},
            {"id": "q3", "type": "radio", "label": "Bạn thích làm việc độc lập hay làm việc nhóm hơn?", "options": ["Độc lập", "Nhóm", "Cả hai đều được"], "required": True}
        ]
    },
    {
        "title": "Trắc nghiệm Kỹ năng Lãnh đạo Trẻ",
        "description": "Bạn có tố chất của một nhà lãnh đạo tương lai không? Hãy cùng kiểm tra nhé.",
        "questions": [
            {"id": "q1", "type": "radio", "label": "Khi xảy ra mâu thuẫn trong nhóm, bạn thường làm gì?", "options": ["Giải quyết trực tiếp", "Quan sát và đợi", "Nhờ cấp trên hỗ trợ"], "required": True},
            {"id": "q2", "type": "text", "label": "Định nghĩa của bạn về một người sếp tốt là gì?", "required": True}
        ]
    },
    {
        "title": "Kỹ năng Giao tiếp Thấu cảm",
        "description": "Kiểm tra mức độ thấu cảm và khả năng kết nối của bạn với mọi người xung quanh.",
        "questions": [
            {"id": "q1", "type": "scale", "label": "Bạn tự tin bao nhiêu vào khả năng lắng nghe của mình?", "required": True},
            {"id": "q2", "type": "text", "label": "Kể lại một lần bạn giải quyết được hiểu lầm với người khác.", "required": True}
        ]
    },
    {
        "title": "Khảo sát Tư duy Tài chính Cá nhân",
        "description": "Bạn đang quản lý tiền bạc theo cảm xúc hay theo kế hoạch?",
        "questions": [
            {"id": "q1", "type": "radio", "label": "Bạn có ghi chép chi tiêu hàng ngày không?", "options": ["Có, rất chi tiết", "Chỉ ghi các khoản lớn", "Không bao giờ"], "required": True},
            {"id": "q2", "type": "text", "label": "Mục tiêu tài chính lớn nhất của bạn trong 5 năm tới là gì?", "required": True}
        ]
    }
]

async def seed():
    async with AsyncSessionLocal() as db:
        # Get experts
        res = await db.execute(select(ExpertProfile))
        experts = res.scalars().all()
        
        if not experts:
            print("No experts found to seed quizzes.")
            return

        for i, quiz_data in enumerate(QUIZZES):
            expert = experts[i % len(experts)]
            
            # Check if quiz with same title already exists for this expert
            existing = await db.execute(select(ExpertQuiz).where(ExpertQuiz.expert_id == expert.id, ExpertQuiz.title == quiz_data['title']))
            if existing.scalars().first():
                print(f"Skipping existing quiz: {quiz_data['title']}")
                continue

            quiz = ExpertQuiz(
                expert_id=expert.id,
                title=quiz_data['title'],
                description=quiz_data['description'],
                questions=quiz_data['questions'],
                is_public=True,
                is_active=True,
                is_required_for_booking=False
            )
            db.add(quiz)
            print(f"Seeded quiz: {quiz.title} for expert_id: {expert.id}")
            
        await db.commit()

if __name__ == "__main__":
    asyncio.run(seed())
