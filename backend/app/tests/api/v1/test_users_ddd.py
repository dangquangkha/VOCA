import pytest
from unittest.mock import AsyncMock, MagicMock
from backend.app.domains.identity.users_router import read_user_by_id
from backend.app.domains.identity.models import User

@pytest.mark.asyncio
async def test_read_user_by_id_unit():
    """
    Unit test for read_user_by_id endpoint.
    """
    db = AsyncMock()
    # Mock database result
    mock_user = User(id=42, email="test@example.com", full_name="Test User")
    
    # Configure the mock result
    # await db.execute() -> result
    # result.scalars() -> scalars_obj
    # scalars_obj.first() -> mock_user
    mock_result = MagicMock() # result itself is not async, only the execute call is
    mock_scalars = MagicMock()
    mock_result.scalars.return_value = mock_scalars
    mock_scalars.first.return_value = mock_user
    
    db.execute.return_value = mock_result
    
    current_user = User(id=10) # requester
    
    response = await read_user_by_id(user_id=42, current_user=current_user, db=db)
    
    assert response.id == 42
    assert response.email == "test@example.com"
    assert response.full_name == "Test User"

@pytest.mark.asyncio
async def test_read_user_by_id_not_found_unit():
    """
    Unit test for read_user_by_id endpoint when user is not found.
    """
    from fastapi import HTTPException
    db = AsyncMock()
    
    mock_result = MagicMock()
    mock_scalars = MagicMock()
    mock_result.scalars.return_value = mock_scalars
    mock_scalars.first.return_value = None
    
    db.execute.return_value = mock_result
    
    current_user = User(id=10)
    
    with pytest.raises(HTTPException) as excinfo:
        await read_user_by_id(user_id=999, current_user=current_user, db=db)
    
    assert excinfo.value.status_code == 404
    assert excinfo.value.detail == "User not found"
