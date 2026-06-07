"""
Group Session Service
Chứa logic nghiệp vụ quản lý Lớp học chuyên đề (Group Sessions / Workshops).
"""
from datetime import datetime
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from fastapi import HTTPException

from backend.app.domains.booking.group_session_models import (
    GroupSession, GroupSessionParticipant, GroupSessionStatus, GroupParticipantStatus
)
from backend.app.domains.marketplace.models import ExpertProfile
from backend.app.domains.identity.models import User
from backend.app.schemas.group_session import GroupSessionCreate, GroupSessionUpdate
from backend.app.services.business.booking_service import BookingService


class GroupSessionService:
    @staticmethod
    async def _get_expert_profile(db: AsyncSession, user: User) -> ExpertProfile:
        result = await db.execute(
            select(ExpertProfile).where(ExpertProfile.user_id == user.id)
        )
        expert = result.scalars().first()
        if not expert:
            raise HTTPException(status_code=404, detail="Expert profile not found")
        return expert

    @staticmethod
    async def create_session(db: AsyncSession, expert_user_id: int, schema: GroupSessionCreate) -> GroupSession:
        # Tìm Expert Profile tương ứng
        expert = await GroupSessionService._get_expert_profile(db, User(id=expert_user_id))
        
        session = GroupSession(
            expert_id=expert.id,
            title=schema.title,
            description=schema.description,
            session_date=schema.session_date,
            start_time=schema.start_time,
            end_time=schema.end_time,
            max_participants=schema.max_participants,
            price_per_participant=schema.price_per_participant,
            status=GroupSessionStatus.OPEN,
            meeting_url=schema.meeting_url
        )
        db.add(session)
        await db.commit()
        await db.refresh(session)
        
        # Load relationships
        return await GroupSessionService.get_session_by_id(db, session.id)

    @staticmethod
    async def get_session_by_id(db: AsyncSession, session_id: int) -> GroupSession:
        query = select(GroupSession).where(GroupSession.id == session_id).options(
            selectinload(GroupSession.expert).selectinload(ExpertProfile.user),
            selectinload(GroupSession.participants).selectinload(GroupSessionParticipant.student)
        )
        result = await db.execute(query)
        session = result.scalars().first()
        if not session:
            raise HTTPException(status_code=404, detail="Group session not found")
            
        active_participants = [p for p in session.participants if p.status != GroupParticipantStatus.CANCELLED]
        session.current_participants = len(active_participants)
        session.available_slots = max(0, session.max_participants - session.current_participants)
        return session

    @staticmethod
    async def list_sessions(
        db: AsyncSession,
        expert_id: Optional[int] = None,
        student_id: Optional[int] = None,
        status: Optional[GroupSessionStatus] = None,
        exclude_cancelled: bool = True
    ) -> List[GroupSession]:
        query = select(GroupSession).options(
            selectinload(GroupSession.expert).selectinload(ExpertProfile.user),
            selectinload(GroupSession.participants).selectinload(GroupSessionParticipant.student)
        )
        
        conditions = []
        if expert_id is not None:
            conditions.append(GroupSession.expert_id == expert_id)
        if status is not None:
            conditions.append(GroupSession.status == status)
        elif exclude_cancelled:
            conditions.append(GroupSession.status != GroupSessionStatus.CANCELLED)
            
        if student_id is not None:
            query = query.join(GroupSessionParticipant, GroupSessionParticipant.session_id == GroupSession.id)
            conditions.append(GroupSessionParticipant.student_id == student_id)
            conditions.append(GroupSessionParticipant.status != GroupParticipantStatus.CANCELLED)
            
        if conditions:
            query = query.where(and_(*conditions))
            
        query = query.order_by(GroupSession.session_date.asc(), GroupSession.start_time.asc())
        
        result = await db.execute(query)
        sessions = result.scalars().unique().all()
        
        # Điền các trường tính toán
        for s in sessions:
            active_participants = [p for p in s.participants if p.status != GroupParticipantStatus.CANCELLED]
            s.current_participants = len(active_participants)
            s.available_slots = max(0, s.max_participants - s.current_participants)
            
        return sessions

    @staticmethod
    async def update_session(
        db: AsyncSession, expert_user_id: int, session_id: int, schema: GroupSessionUpdate
    ) -> GroupSession:
        expert = await GroupSessionService._get_expert_profile(db, User(id=expert_user_id))
        
        query = select(GroupSession).where(
            GroupSession.id == session_id,
            GroupSession.expert_id == expert.id
        ).options(
            selectinload(GroupSession.participants)
        )
        result = await db.execute(query)
        session = result.scalars().first()
        
        if not session:
            raise HTTPException(status_code=404, detail="Group session not found or you are not the owner")
            
        if session.status == GroupSessionStatus.CANCELLED:
            raise HTTPException(status_code=400, detail="Cannot update a cancelled session")
            
        update_data = schema.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(session, key, value)
            
        # Tính toán lại trạng thái nếu số lượng max_participants đổi
        active_participants = [p for p in session.participants if p.status != GroupParticipantStatus.CANCELLED]
        current_count = len(active_participants)
        if current_count >= session.max_participants:
            session.status = GroupSessionStatus.FULL
        elif session.status == GroupSessionStatus.FULL and current_count < session.max_participants:
            session.status = GroupSessionStatus.OPEN
            
        db.add(session)
        await db.commit()
        
        return await GroupSessionService.get_session_by_id(db, session.id)

    @staticmethod
    async def join_session(
        db: AsyncSession, student_user_id: int, session_id: int, student_note: Optional[str] = None
    ) -> GroupSessionParticipant:
        # Query session cùng danh sách participants
        query = select(GroupSession).where(GroupSession.id == session_id).options(
            selectinload(GroupSession.participants)
        )
        result = await db.execute(query)
        session = result.scalars().first()
        
        if not session:
            raise HTTPException(status_code=404, detail="Group session not found")
            
        if session.status != GroupSessionStatus.OPEN:
            raise HTTPException(status_code=400, detail="This group session is not open for registration")
            
        # Kiểm tra giới hạn tham gia
        active_participants = [p for p in session.participants if p.status != GroupParticipantStatus.CANCELLED]
        current_count = len(active_participants)
        if current_count >= session.max_participants:
            raise HTTPException(status_code=400, detail="This group session is already full")
            
        # Kiểm tra nếu học viên đã đăng ký từ trước
        already_joined = any(
            p.student_id == student_user_id and p.status != GroupParticipantStatus.CANCELLED 
            for p in session.participants
        )
        if already_joined:
            raise HTTPException(status_code=400, detail="You have already registered for this session")
            
        # Thực hiện trừ Credit học viên một cách atomic
        price = session.price_per_participant
        if price > 0:
            await BookingService.deduct_credits_atomic(
                db=db,
                user_id=student_user_id,
                amount=price,
                booking_id=None,
                description=f"Register Group Session: {session.title}"
            )
            
        # Tạo bản ghi participant
        participant = GroupSessionParticipant(
            session_id=session.id,
            student_id=student_user_id,
            status=GroupParticipantStatus.CONFIRMED,
            amount_paid=price,
            student_note=student_note
        )
        db.add(participant)
        
        # Nếu đã đủ người, cập nhật trạng thái session thành FULL
        if current_count + 1 >= session.max_participants:
            session.status = GroupSessionStatus.FULL
            db.add(session)
            
        await db.commit()
        await db.refresh(participant)
        
        # Load student relationship
        q = select(GroupSessionParticipant).where(GroupSessionParticipant.id == participant.id).options(
            selectinload(GroupSessionParticipant.student)
        )
        r = await db.execute(q)
        return r.scalars().first()

    @staticmethod
    async def cancel_session(db: AsyncSession, expert_user_id: int, session_id: int) -> GroupSession:
        expert = await GroupSessionService._get_expert_profile(db, User(id=expert_user_id))
        
        query = select(GroupSession).where(
            GroupSession.id == session_id,
            GroupSession.expert_id == expert.id
        ).options(
            selectinload(GroupSession.participants).selectinload(GroupSessionParticipant.student)
        )
        result = await db.execute(query)
        session = result.scalars().first()
        
        if not session:
            raise HTTPException(status_code=404, detail="Group session not found or you are not the owner")
            
        if session.status == GroupSessionStatus.CANCELLED:
            raise HTTPException(status_code=400, detail="This session is already cancelled")
            
        # Hoàn tiền cho tất cả học viên đã đăng ký
        from backend.app.domains.payments.models import PaymentTransaction, TransactionType, TransactionStatus
        
        for participant in session.participants:
            if participant.status in [GroupParticipantStatus.CONFIRMED, GroupParticipantStatus.PENDING]:
                amount = participant.amount_paid
                if amount > 0:
                    student = participant.student
                    student.credits += amount
                    db.add(student)
                    
                    # Log giao dịch hoàn tiền
                    trx = PaymentTransaction(
                        user_id=student.id,
                        booking_id=None,
                        amount=amount,
                        type=TransactionType.BOOKING_REFUND,
                        status=TransactionStatus.COMPLETED,
                        description=f"Refund for cancelled Group Session: {session.title}"
                    )
                    db.add(trx)
                
                participant.status = GroupParticipantStatus.CANCELLED
                db.add(participant)
                
        session.status = GroupSessionStatus.CANCELLED
        db.add(session)
        await db.commit()
        
        return await GroupSessionService.get_session_by_id(db, session.id)

    @staticmethod
    async def list_my_students(
        db: AsyncSession,
        current_user: User,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> dict:
        expert = await GroupSessionService._get_expert_profile(db, current_user)
        
        # 1. Lấy tất cả participants của expert (từ Group Sessions)
        group_p_query = select(GroupSessionParticipant).join(
            GroupSession, GroupSessionParticipant.session_id == GroupSession.id
        ).where(
            GroupSession.expert_id == expert.id,
            GroupSessionParticipant.status != GroupParticipantStatus.CANCELLED
        ).options(
            selectinload(GroupSessionParticipant.student),
            selectinload(GroupSessionParticipant.session)
        )
        result = await db.execute(group_p_query)
        group_participants = result.scalars().all()
        
        # 2. Lấy tất cả 1-1 bookings của expert
        from backend.app.domains.booking.models import Booking, BookingStatus
        bookings_query = select(Booking).where(
            Booking.expert_id == expert.id,
            Booking.status.in_([
                BookingStatus.CONFIRMED,
                BookingStatus.IN_PROGRESS,
                BookingStatus.COMPLETED
            ])
        ).options(
            selectinload(Booking.student)
        )
        result = await db.execute(bookings_query)
        bookings = result.scalars().all()
        
        # 3. Hợp nhất danh sách và tính tổng số buổi
        students_dict = {}
        
        for gp in group_participants:
            student = gp.student
            if not student:
                continue
            if search and search.lower() not in student.email.lower() and (not student.full_name or search.lower() not in student.full_name.lower()):
                continue
            s_id = student.id
            if s_id not in students_dict:
                students_dict[s_id] = {
                    "student": student,
                    "group_sessions_count": 0,
                    "bookings_count": 0,
                    "last_interaction": gp.joined_at
                }
            students_dict[s_id]["group_sessions_count"] += 1
            if gp.joined_at > students_dict[s_id]["last_interaction"]:
                students_dict[s_id]["last_interaction"] = gp.joined_at
                
        for bk in bookings:
            student = bk.student
            if not student:
                continue
            if search and search.lower() not in student.email.lower() and (not student.full_name or search.lower() not in student.full_name.lower()):
                continue
            s_id = student.id
            if s_id not in students_dict:
                students_dict[s_id] = {
                    "student": student,
                    "group_sessions_count": 0,
                    "bookings_count": 0,
                    "last_interaction": bk.created_at
                }
            students_dict[s_id]["bookings_count"] += 1
            if bk.created_at > students_dict[s_id]["last_interaction"]:
                students_dict[s_id]["last_interaction"] = bk.created_at
                
        # Phân trang
        all_students = list(students_dict.values())
        all_students.sort(key=lambda x: x["last_interaction"], reverse=True)
        
        total = len(all_students)
        start = (page - 1) * page_size
        end = start + page_size
        paginated_students = all_students[start:end]
        
        return {
            "items": [
                {
                    "student": {
                        "id": item["student"].id,
                        "full_name": item["student"].full_name,
                        "email": item["student"].email,
                        "avatar_url": item["student"].avatar_url,
                    },
                    "group_sessions_count": item["group_sessions_count"],
                    "bookings_count": item["bookings_count"],
                    "total_sessions": item["group_sessions_count"] + item["bookings_count"],
                    "last_interaction": item["last_interaction"]
                }
                for item in paginated_students
            ],
            "total": total,
            "page": page,
            "page_size": page_size
        }