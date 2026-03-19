from datetime import datetime
from pydantic import BaseModel
from backend.app.models.account_action import AccountActionType

class AccountActionBase(BaseModel):
    action_type: AccountActionType
    target_user_id: int
    reason: str
    notes: str | None = None

class AccountActionRead(AccountActionBase):
    id: int
    admin_id: int
    created_at: datetime
    
    # Nested user info
    admin_email: str | None = None
    target_user_email: str | None = None
    
    class Config:
        from_attributes = True
        
        @staticmethod
        def from_orm(obj):
            data = {
                "id": obj.id,
                "action_type": obj.action_type,
                "target_user_id": obj.target_user_id,
                "admin_id": obj.admin_id,
                "reason": obj.reason,
                "notes": obj.notes,
                "created_at": obj.created_at,
                "admin_email": obj.admin.email if obj.admin else None,
                "target_user_email": obj.target_user.email if obj.target_user else None,
            }
            return AccountActionRead(**data)
