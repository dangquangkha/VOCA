import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from backend.app.services.admin_notification_service import notify_all_admins
from backend.app.domains.identity.models import User, UserRole
from backend.app.models.notification import NotificationType

@pytest.mark.asyncio
async def test_notify_all_admins():
    """
    Test that notify_all_admins correctly identifies admins and sends notifications.
    """
    # Mock DB session
    db = AsyncMock()
    
    # Mock admins
    admin1 = User(id=1, email="admin1@test.com", role=UserRole.ADMIN, is_superuser=True)
    admin2 = User(id=2, email="admin2@test.com", role=UserRole.ADMIN, is_superuser=False)
    
    # Mock result from db.execute - Use MagicMock for standard methods
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [admin1, admin2]
    db.execute.return_value = mock_result
    
    with patch("backend.app.services.admin_notification_service.notification_manager") as mock_manager, \
         patch("backend.app.services.admin_notification_service.send_telegram_message", new_callable=AsyncMock) as mock_telegram:
        mock_manager.send_notification = AsyncMock()
        
        await notify_all_admins(
            db=db,
            title="Test Alert",
            message="Test Message",
            link="/test",
            data={"key": "value"}
        )
        
        # Verify db.add was called for each admin
        # (Notification objects are added to session)
        assert db.add.call_count == 2
        
        # Verify commit was called
        db.commit.assert_called_once()
        
        # Verify socket push was called for each admin
        assert mock_manager.send_notification.call_count == 2
        
        # Check call arguments for the first admin
        # call_args_list[index][0] contains positional args, [1] contains kwargs
        args, user_id = mock_manager.send_notification.call_args_list[0][0]
        assert args["title"] == "Test Alert"
        assert user_id == 1
        
        # Verify Telegram was called
        mock_telegram.assert_called_once()
