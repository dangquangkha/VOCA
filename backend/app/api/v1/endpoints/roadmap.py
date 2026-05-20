from typing import Any, List, Dict
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.api import deps
from backend.app.domains.identity.models import User
from backend.app.models.roadmap import DailyProgress, DayStatus, RoadmapHistory
from backend.app.schemas.roadmap import DailyProgress as DailyProgressSchema, DailyProgressUpdate, DayContent, RoadmapHistory as HistorySchema

router = APIRouter()

# Mock content based on UC-08
DAY_CONTENTS: Dict[int, DayContent] = {
    1: DayContent(day_number=1, topic="4 Lưu Ý Trước Khi Bước Vào Hành Trình", interaction_type="Journaling", prompt="Bạn cam kết sẽ đi đến cùng hành trình này chứ? Hãy viết 'Tôi cam kết' và chia sẻ kỳ vọng của bạn.", requirements={"min_length": 10}),
    2: DayContent(day_number=2, topic="Ikigai Là Gì?", interaction_type="Journaling", prompt="Công việc hiện tại của bạn có mang lại cảm giác hưng phấn để thức dậy mỗi sáng không? Tại sao?", requirements={"min_length": 30}),
    3: DayContent(day_number=3, topic="Sơ Đồ Đi Tìm Ikigai", interaction_type="Journaling", prompt="Trong 6 yếu tố (Giá trị, Thế mạnh, Vùng thiên tài, Giá trị sống, Ikigai, Phương tiện), bạn tò mò về yếu tố nào nhất?", requirements={"min_length": 20}),
    4: DayContent(day_number=4, topic="Ngược Dòng Thời Gian Tìm Lại Đứa Trẻ Bên Trong", interaction_type="Journaling", prompt="Nếu được bắt đầu lại với đầy đủ điều kiện, bạn sẽ làm gì? Hãy mô tả chi tiết các hoạt động bạn muốn thực hiện.", requirements={"min_length": 100}),
    5: DayContent(day_number=5, topic="Điều Quan Trọng Nhất Với Bạn", interaction_type="Journaling", prompt="Hãy liên tục hỏi: 'Điều gì quan trọng nhất với tôi?' trong 30 phút và ghi lại những câu trả lời sâu sắc nhất.", requirements={"min_length": 50}),
    6: DayContent(day_number=6, topic="Lựa Chọn Giá Trị Cốt Lõi", interaction_type="Selection", prompt="Từ danh sách 270 giá trị, hãy chọn ra 10 giá trị khiến bạn cảm thấy đồng điệu nhất.", requirements={"max_selection": 10}),
    7: DayContent(day_number=7, topic="Định Nghĩa Giá Trị Cốt Lõi", interaction_type="Journaling", prompt="Với mỗi giá trị đã chọn, hành động cụ thể nào gắn liền với nó trong cuộc sống của bạn?", requirements={"min_length": 50}),
    8: DayContent(day_number=8, topic="Đánh Giá Giá Trị Cốt Lõi", interaction_type="Journaling", prompt="Hiện tại bạn đang sống đúng với các giá trị này bao nhiêu %? Yếu tố nào đang cản trở bạn?", requirements={"min_length": 30}),
    9: DayContent(day_number=9, topic="Mô Tả Giá Trị Cốt Lõi (Scripting)", interaction_type="Journaling", prompt="Sẽ thế nào nếu bạn được sống trọn vẹn 100% với các giá trị này? Hãy viết kịch bản cho tương lai đó.", requirements={"min_length": 150}),
    10: DayContent(day_number=10, topic="Dùng Tiền Mua Hạnh Phúc", interaction_type="Journaling", prompt="Nếu có số tiền không giới hạn, bạn sẽ chi dùng vào việc gì để thực sự cảm thấy hạnh phúc bền vững?", requirements={"min_length": 50}),
    11: DayContent(day_number=11, topic="Đi Tìm Thế Mạnh Bản Thân", interaction_type="Journaling", prompt="Những việc gì bạn làm thấy dễ dàng hơn người khác? Những lời khen ngợi nào bạn thường nhận được?", requirements={"min_length": 50}),
    12: DayContent(day_number=12, topic="Sinh Trắc Vân Tay & Trắc Nghiệm", interaction_type="Journaling", prompt="Kết quả các bài trắc nghiệm (MBTI, Enneagram, Sinh trắc...) nói gì về xu hướng tự nhiên của bạn?", requirements={"min_length": 30}),
    13: DayContent(day_number=13, topic="Xác Định 5 Thế Mạnh Bản Thân", interaction_type="Selection", prompt="Chốt lại 5 thế mạnh lớn nhất mà bạn tự tin nhất.", requirements={"max_selection": 5}),
    14: DayContent(day_number=14, topic="Phương Pháp Gieo Hạt Thành Công", interaction_type="Journaling", prompt="Bạn có thể giúp ai đó đạt được điều họ muốn (liên quan đến thế mạnh của bạn) như thế nào?", requirements={"min_length": 50}),
    15: DayContent(day_number=15, topic="Lắng Nghe Chỉ Dẫn Từ Vũ Trụ", interaction_type="Journaling", prompt="Ghi lại những 'sự trùng hợp ngẫu nhiên' hoặc chỉ dẫn mà bạn nhận được gần đây.", requirements={"min_length": 30}),
    16: DayContent(day_number=16, topic="50 Câu Hỏi Thức Tỉnh Mục Đích Sống", interaction_type="Journaling", prompt="Chọn ra 3 câu hỏi khiến bạn 'đứng hình' nhất và trả lời chúng.", requirements={"min_length": 100}),
    17: DayContent(day_number=17, topic="Dẫn Thiền 100 Triệu USD", interaction_type="Journaling", prompt="Nếu tiền bạc không còn là vấn đề, bạn sẽ cống hiến giá trị gì cho thế giới mỗi ngày?", requirements={"min_length": 100}),
    18: DayContent(day_number=18, topic="Bài Tập Bão Não", interaction_type="Journaling", prompt="Liệt kê tất cả các ý tưởng công việc/dự án kết hợp được thế mạnh và đam mê của bạn.", requirements={"min_length": 50}),
    19: DayContent(day_number=19, topic="Cấu Trúc 3 Phần Của IKIGAI", interaction_type="Journaling", prompt="Phân tích mô hình Ikigai của bạn: Bạn thích gì? Giỏi gì? Thế giới cần gì? Kiếm tiền từ đâu?", requirements={"min_length": 100}),
    20: DayContent(day_number=20, topic="Vùng Thiên Tài (Bài tập 1)", interaction_type="Journaling", prompt="Kết hợp Giá trị và Thế mạnh để tìm ra điểm giao thoa độc bản của bạn.", requirements={"min_length": 50}),
    21: DayContent(day_number=21, topic="Vùng Thiên Tài (Bài tập 2)", interaction_type="Journaling", prompt="Mô tả một tình huống bạn làm việc mà quên hết thời gian (trạng thái Flow).", requirements={"min_length": 50}),
    22: DayContent(day_number=22, topic="Vùng Thiên Tài (Bài tập 3)", interaction_type="Journaling", prompt="Kỹ năng đặc biệt nào bạn có thể làm tốt hơn 90% mọi người xung quanh?", requirements={"min_length": 50}),
    23: DayContent(day_number=23, topic="Đi Tìm Ý Nghĩa Cuộc Sống (1)", interaction_type="Journaling", prompt="Thông điệp lớn nhất bạn muốn để lại cho thế hệ sau là gì?", requirements={"min_length": 100}),
    24: DayContent(day_number=24, topic="Đi Tìm Ý Nghĩa Cuộc Sống (2)", interaction_type="Journaling", prompt="Nếu hôm nay là ngày cuối cùng, bạn hối tiếc điều gì chưa kịp thực hiện/chia sẻ?", requirements={"min_length": 100}),
    25: DayContent(day_number=25, topic="Phương Tiện Vận Chuyển IKIGAI", interaction_type="Journaling", prompt="Công cụ nào (Video, Viết, Kinh doanh, Giảng dạy...) giúp bạn lan tỏa Ikigai tốt nhất?", requirements={"min_length": 50}),
    26: DayContent(day_number=26, topic="Đây Là IKIGAI Của Bạn", interaction_type="Journaling", prompt="Viết xuống câu tuyên ngôn Ikigai hoàn chỉnh của bạn theo cấu trúc đã học.", requirements={"min_length": 20}),
    27: DayContent(day_number=27, topic="Quy Tắc 10.000 Giờ", interaction_type="Journaling", prompt="Bạn sẽ lập kế hoạch rèn luyện Vùng Thiên Tài của mình như thế nào trong 1 năm tới?", requirements={"min_length": 50}),
    28: DayContent(day_number=28, topic="Kỹ Năng Ra Quyết Định", interaction_type="Journaling", prompt="Sử dụng hệ giá trị cốt lõi để đưa ra một quyết định quan trọng bạn đang trì hoãn.", requirements={"min_length": 50}),
    29: DayContent(day_number=29, topic="5 Cách Vận Dụng Luật Hấp Dẫn", interaction_type="Journaling", prompt="Bạn sẽ duy trì tần số rung động tích cực với Ikigai của mình như thế nào mỗi ngày?", requirements={"min_length": 50}),
    30: DayContent(day_number=30, topic="Những Điều Nhiệm Màu", interaction_type="Journaling", prompt="Tổng kết hành trình 30 ngày: Bạn đã thay đổi như thế nào? Lời hứa với chính mình.", requirements={"min_length": 100}),
}

@router.get("/grit-status")
async def get_grit_status(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Check if user is 'Grit Verified' (completed >= 7 days) and return discount info.
    """
    from sqlalchemy import func
    result = await db.execute(
        select(func.count(DailyProgress.id))
        .where(DailyProgress.user_id == current_user.id)
        .where(DailyProgress.status == DayStatus.COMPLETED)
    )
    completed_days = result.scalar() or 0
    is_grit_verified = completed_days >= 7
    return {
        "completed_days": completed_days,
        "is_grit_verified": is_grit_verified,
        "discount_rate": 0.10 if is_grit_verified else 0.0,
        "threshold": 7
    }

@router.get("/", response_model=List[DailyProgressSchema])
async def get_roadmap(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get all daily progress for current user. 
    If not exists, initialize day 1 as UNLOCKED.
    """
    result = await db.execute(select(DailyProgress).where(DailyProgress.user_id == current_user.id).order_by(DailyProgress.day_number))
    progress_list = result.scalars().all()
    
    if not progress_list:
        # Initialize Day 1
        first_day = DailyProgress(user_id=current_user.id, day_number=1, status=DayStatus.UNLOCKED)
        db.add(first_day)
        # Initialize others as LOCKED (optional, or just do strictly 1 by 1)
        # For simplicity, let's just return what we have. 
        # Actually, UI expects 30 days. We might want to generate them or return sparse list.
        await db.commit()
        await db.refresh(first_day)
        return [first_day]
        
    return progress_list

@router.get("/{day_number}/content", response_model=DayContent)
async def get_day_content(
    day_number: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get static content and prompt for a specific day.
    """
    if day_number not in DAY_CONTENTS:
        # Fallback
        return DayContent(day_number=day_number, topic=f"Day {day_number}", interaction_type="Journaling", prompt="Reflect on today.")
    return DAY_CONTENTS[day_number]

from backend.app.domains.payments.service import credit_service
from backend.app.domains.payments.models import TransactionType, PaymentTransaction

@router.post("/{day_number}/submit", response_model=DailyProgressSchema)
async def submit_day_progress(
    day_number: int,
    submission: DailyProgressUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Submit answer for a day. If valid, mark COMPLETED and unlock next day.
    Also grants credit rewards on milestones (7, 15, 30 days).
    """
    # Check if day is already completed to avoid double rewards
    result = await db.execute(
        select(DailyProgress).where(
            DailyProgress.user_id == current_user.id, 
            DailyProgress.day_number == day_number
        )
    )
    progress = result.scalars().first()
    
    is_new_completion = False
    
    if not progress:
        if day_number == 1:
            progress = DailyProgress(user_id=current_user.id, day_number=1, status=DayStatus.UNLOCKED)
            db.add(progress)
        else:
            raise HTTPException(status_code=400, detail="Day is locked or previous day not completed.")
            
    if progress.status == DayStatus.LOCKED:
        raise HTTPException(status_code=400, detail="Day is locked.")
    
    if progress.status != DayStatus.COMPLETED:
        is_new_completion = True
        
    # Save submission
    progress.content_data = submission.content_data
    progress.status = DayStatus.COMPLETED
    progress.completed_at = datetime.utcnow()
    db.add(progress)
    
    # Milestone Rewards
    reward_amount = 0
    if is_new_completion:
        # Count total completed days (including this one)
        from sqlalchemy import func
        result_count = await db.execute(
            select(func.count(DailyProgress.id))
            .where(DailyProgress.user_id == current_user.id)
            .where(DailyProgress.status == DayStatus.COMPLETED)
        )
        total_completed = result_count.scalar() or 0
        
        milestone = 0
        if total_completed == 7:
            milestone = 7
            reward_amount = 5
        elif total_completed == 15:
            milestone = 15
            reward_amount = 5
        elif total_completed == 30:
            milestone = 30
            reward_amount = 10
            
        if reward_amount > 0:
            # Prevent double reward check
            check_trx = await db.execute(
                select(PaymentTransaction).where(
                    PaymentTransaction.user_id == current_user.id,
                    PaymentTransaction.type == TransactionType.ROADMAP_REWARD,
                    PaymentTransaction.description.like(f"%Ngày {milestone}%")
                )
            )
            if not check_trx.scalars().first():
                await credit_service.add_credits(
                    db=db,
                    user_id=current_user.id,
                    amount=reward_amount,
                    trx_type=TransactionType.ROADMAP_REWARD,
                    description=f"Thưởng cột mốc Roadmap: Ngày {milestone}"
                )
    
    # Unlock next day
    next_day_num = day_number + 1
    if next_day_num <= 30:
        res_next = await db.execute(select(DailyProgress).where(DailyProgress.user_id == current_user.id, DailyProgress.day_number == next_day_num))
        next_day = res_next.scalars().first()
        if not next_day:
            next_day = DailyProgress(user_id=current_user.id, day_number=next_day_num, status=DayStatus.UNLOCKED)
            db.add(next_day)
        elif next_day.status == DayStatus.LOCKED:
            next_day.status = DayStatus.UNLOCKED
            db.add(next_day)
            
    await db.commit()
    await db.refresh(progress)
    
    # Attach reward info for the frontend
    progress.reward_earned = reward_amount
    return progress

@router.post("/generate-report", response_model=HistorySchema)
async def generate_roadmap_report(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Take a snapshot of all completed days and create a history report.
    Costs 50 credits.
    """
    # Charge credits
    try:
        await credit_service.deduct_credits(
            db=db,
            user_id=current_user.id,
            amount=50,
            trx_type=TransactionType.ROADMAP_REPORT,
            description="Phí xuất bản báo cáo hành trình Roadmap"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    result = await db.execute(
        select(DailyProgress).where(DailyProgress.user_id == current_user.id).order_by(DailyProgress.day_number)
    )
    progress_list = result.scalars().all()
    
    snapshot = {
        "days": {
            p.day_number: {
                "topic": DAY_CONTENTS.get(p.day_number).topic if p.day_number in DAY_CONTENTS else f"Day {p.day_number}",
                "content": p.content_data,
                "completed_at": p.completed_at.isoformat() if p.completed_at else None
            } for p in progress_list if p.status == DayStatus.COMPLETED
        }
    }
    
    # Include Latest MBTI if available
    from backend.app.domains.mbti.models import UserMBTIResult, MBTIType
    mbti_res = await db.execute(
        select(UserMBTIResult).where(UserMBTIResult.user_id == current_user.id).order_by(UserMBTIResult.id.desc()).limit(1)
    )
    last_mbti = mbti_res.scalars().first()
    if last_mbti:
        type_res = await db.execute(select(MBTIType).where(MBTIType.code == last_mbti.mbti_code))
        mbti_type = type_res.scalars().first()
        snapshot["mbti"] = {
            "mbti_code": last_mbti.mbti_code,
            "vietnamese_title": mbti_type.vietnamese_title if mbti_type else "N/A",
            "description": mbti_type.description if mbti_type else "N/A",
            "scores": {
                "E": last_mbti.score_e, "I": last_mbti.score_i,
                "S": last_mbti.score_s, "N": last_mbti.score_n,
                "T": last_mbti.score_t, "F": last_mbti.score_f,
                "J": last_mbti.score_j, "P": last_mbti.score_p
            }
        }
    
    history = RoadmapHistory(
        user_id=current_user.id,
        snapshot_data=snapshot,
        is_premium=True # For now
    )
    db.add(history)
    await db.commit()
    await db.refresh(history)
    return history

@router.get("/history", response_model=List[HistorySchema])
async def get_roadmap_history(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    result = await db.execute(
        select(RoadmapHistory).where(RoadmapHistory.user_id == current_user.id).order_by(RoadmapHistory.created_at.desc())
    )
    return result.scalars().all()
