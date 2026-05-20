import pytest
from unittest.mock import AsyncMock
from backend.app.api.v1.endpoints.support import get_support_admin_id

@pytest.mark.asyncio
async def test_get_support_admin_id_unit():
    """
    Unit test for get_support_admin_id endpoint.
    """
    db = AsyncMock()
    user = AsyncMock() # any active user
    
    response = await get_support_admin_id(db=db, current_user=user)
    
    assert response == {"admin_id": 2}
