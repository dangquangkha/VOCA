import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi import HTTPException

from backend.app.domains.booking.group_session_models import (
    GroupSession, GroupSessionParticipant, GroupSessionStatus, GroupParticipantStatus
)
from backend.app.domains.marketplace.models import ExpertProfile
from backend.app.domains.identity.models import User
from backend.app.schemas.group_session import GroupSessionCreate, GroupSessionUpdate
from backend.app.services.business.group_session_service import GroupSessionService


@pytest.mark.asyncio
async def test_create_group_session():
    """
    Test creating a new group session.
    """
    db = AsyncMock()
    
    # Mock expert profile
    expert = ExpertProfile(id=1, user_id=10)
    db_result = MagicMock()
    db_result.scalars.return_value.first.return_value = expert
    db.execute.return_value = db_result
    
    # Schema input
    schema = GroupSessionCreate(
        title="Test Workshop",
        description="Learn Python",
        session_date="2026-06-15",
        start_time="09:00",
        end_time="10:00",
        max_participants=5,
        price_per_participant=50
    )
    
    # Mock get_session_by_id call within create_session
    mocked_session = GroupSession(
        id=42,
        expert_id=1,
        title="Test Workshop",
        session_date="2026-06-15",
        start_time="09:00",
        end_time="10:00",
        max_participants=5,
        price_per_participant=50,
        status=GroupSessionStatus.OPEN,
        participants=[]
    )
    
    with patch("backend.app.services.business.group_session_service.GroupSessionService.get_session_by_id", new_callable=AsyncMock) as mock_get_by_id:
        mock_get_by_id.return_value = mocked_session
        
        result = await GroupSessionService.create_session(db, 10, schema)
        
        assert result.id == 42
        assert result.title == "Test Workshop"
        assert result.session_date == "2026-06-15"
        db.commit.assert_called_once()
        db.add.assert_called_once()


@pytest.mark.asyncio
async def test_join_group_session_success():
    """
    Test joining a group session when slots are available and credits are deducted.
    """
    db = AsyncMock()
    
    # Mock Group Session
    session = GroupSession(
        id=42,
        title="AI Masterclass",
        status=GroupSessionStatus.OPEN,
        max_participants=5,
        price_per_participant=100,
        participants=[]
    )
    
    db_result1 = MagicMock()
    db_result1.scalars.return_value.first.return_value = session
    
    participant = GroupSessionParticipant(
        id=99,
        session_id=42,
        student_id=20,
        status=GroupParticipantStatus.CONFIRMED,
        amount_paid=100
    )
    db_result2 = MagicMock()
    db_result2.scalars.return_value.first.return_value = participant
    
    db.execute.side_effect = [db_result1, db_result2]
    
    # Mock BookingService deduct credits
    with patch("backend.app.services.business.booking_service.BookingService.deduct_credits_atomic", new_callable=AsyncMock) as mock_deduct:
        res = await GroupSessionService.join_session(db, 20, 42, "Note")
        
        # Verify credits were deducted
        mock_deduct.assert_called_once_with(
            db=db,
            user_id=20,
            amount=100,
            booking_id=None,
            description="Register Group Session: AI Masterclass"
        )
        
        assert res.id == 99
        assert res.amount_paid == 100
        db.commit.assert_called_once()


@pytest.mark.asyncio
async def test_join_group_session_full():
    """
    Test that joining a group session fails when it is full.
    """
    db = AsyncMock()
    
    # Mock session already having 2 participants out of max 2
    session = GroupSession(
        id=42,
        status=GroupSessionStatus.OPEN,
        max_participants=2,
        price_per_participant=100,
        participants=[
            GroupSessionParticipant(student_id=1, status=GroupParticipantStatus.CONFIRMED),
            GroupSessionParticipant(student_id=2, status=GroupParticipantStatus.CONFIRMED)
        ]
    )
    
    db_result = MagicMock()
    db_result.scalars.return_value.first.return_value = session
    db.execute.return_value = db_result
    
    with pytest.raises(HTTPException) as exc_info:
        await GroupSessionService.join_session(db, 3, 42)
        
    assert exc_info.value.status_code == 400
    assert "already full" in exc_info.value.detail


@pytest.mark.asyncio
async def test_cancel_group_session_refund():
    """
    Test cancelling a session which refunds credits back to registered students.
    """
    db = AsyncMock()
    
    # Mock expert
    expert = ExpertProfile(id=1, user_id=10)
    db_result1 = MagicMock()
    db_result1.scalars.return_value.first.return_value = expert
    
    # Mock session with participants
    student1 = User(id=101, credits=20)
    student2 = User(id=102, credits=50)
    
    session = GroupSession(
        id=42,
        expert_id=1,
        title="Cancel Me",
        status=GroupSessionStatus.OPEN,
        max_participants=5,
        participants=[
            GroupSessionParticipant(student_id=101, amount_paid=100, status=GroupParticipantStatus.CONFIRMED, student=student1),
            GroupSessionParticipant(student_id=102, amount_paid=100, status=GroupParticipantStatus.CONFIRMED, student=student2)
        ]
    )
    db_result2 = MagicMock()
    db_result2.scalars.return_value.first.return_value = session
    
    # For get_session_by_id return in cancel_session
    db_result3 = MagicMock()
    db_result3.scalars.return_value.first.return_value = session
    
    db.execute.side_effect = [db_result1, db_result2, db_result3]
    
    # Cancel the session
    res = await GroupSessionService.cancel_session(db, 10, 42)
    
    # Verify credits are refunded
    assert student1.credits == 120  # 20 + 100
    assert student2.credits == 150  # 50 + 100
    
    # Verify participant status updated
    assert session.participants[0].status == GroupParticipantStatus.CANCELLED
    assert session.participants[1].status == GroupParticipantStatus.CANCELLED
    assert session.status == GroupSessionStatus.CANCELLED
    
    db.commit.assert_called_once()
