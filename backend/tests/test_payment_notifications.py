import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from backend.app.domains.payments.router import create_refund_request, create_withdrawal_request
from backend.app.schemas.payment import RefundRequestCreate, WithdrawalCreate
from backend.app.domains.identity.models import User
from backend.app.domains.marketplace.models import ExpertProfile

@pytest.mark.asyncio
async def test_refund_request_triggers_notification():
    """
    Ensure creating a refund request still works and triggers admin notification.
    """
    db = AsyncMock()
    user = User(id=1, email="student@test.com", full_name="Student A", credits=100)
    
    refund_in = RefundRequestCreate(
        amount=50, 
        bank_name="MB Bank", 
        bank_account="123456", 
        account_holder="Student A"
    )
    
    with patch("backend.app.domains.payments.router.notify_all_admins", new_callable=AsyncMock) as mock_notify:
        await create_refund_request(refund_in=refund_in, db=db, current_user=user)
        
        # Verify credit deduction (Integrity check)
        assert user.credits == 50
        
        # Verify admin notification was called with correct data
        mock_notify.assert_called_once()
        kwargs = mock_notify.call_args[1]
        assert "Yêu cầu hoàn tiền mới" in kwargs["title"]
        assert "Student A" in kwargs["message"]
        assert "50" in kwargs["message"]

@pytest.mark.asyncio
async def test_withdrawal_request_triggers_notification():
    """
    Ensure expert withdrawal request still works and triggers admin notification.
    """
    db = AsyncMock()
    user = User(id=2, email="expert@test.com", full_name="Expert B", credits=100, role=AsyncMock(value="EXPERT"))
    
    # Mock ExpertProfile for bank info
    expert_profile = ExpertProfile(
        user_id=2,
        bank_name="VCB",
        bank_account="999",
        bank_holder_name="Expert B"
    )
    
    # Mock DB queries (sequentially for expert profile then user lock)
    mock_result_expert = MagicMock()
    mock_result_expert.scalars.return_value.first.return_value = expert_profile
    
    mock_result_user = MagicMock()
    mock_result_user.scalars.return_value.first.return_value = user
    
    db.execute.side_effect = [mock_result_expert, mock_result_user]
    
    withdrawal_in = WithdrawalCreate(amount=50)
    
    with patch("backend.app.domains.payments.router.notify_all_admins", new_callable=AsyncMock) as mock_notify:
        # Mock current_user for the router
        await create_withdrawal_request(withdrawal_in=withdrawal_in, db=db, current_user=user)
        
        # Verify credit deduction
        assert user.credits == 50
        
        # Verify admin notification
        mock_notify.assert_called_once()
        kwargs = mock_notify.call_args[1]
        assert "Yêu cầu rút tiền mới" in kwargs["title"]
        assert "Expert B" in kwargs["message"]
