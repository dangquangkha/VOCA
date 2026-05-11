import pytest
from unittest.mock import AsyncMock, patch
from backend.app.api.v1.endpoints.support import create_support_ticket
from backend.app.schemas.support import SupportTicketCreate
from backend.app.domains.identity.models import User

@pytest.mark.asyncio
async def test_create_support_ticket_api():
    """
    Test that the support ticket API correctly saves the ticket and triggers notifications.
    """
    # Mock DB
    db = AsyncMock()
    
    # Mock current user
    user = User(id=10, email="student@test.com", full_name="Student Test")
    
    # Mock input
    ticket_in = SupportTicketCreate(subject="Need Help", message="Help me please")
    
    # Mock notify_all_admins to avoid actually sending notifications during unit test
    with patch("backend.app.api.v1.endpoints.support.notify_all_admins", new_callable=AsyncMock) as mock_notify:
        response = await create_support_ticket(
            db=db,
            current_user=user,
            ticket_in=ticket_in
        )
        
        # Verify ticket was added and committed
        assert db.add.call_count == 1
        db.commit.assert_called_once()
        
        # Verify notification was triggered for admins
        mock_notify.assert_called_once()
        kwargs = mock_notify.call_args[1]
        assert "Need Help" in kwargs["message"]
        assert "Student Test" in kwargs["message"]
        
        # Verify response contains input data
        assert response.subject == "Need Help"
        assert response.user_id == 10
