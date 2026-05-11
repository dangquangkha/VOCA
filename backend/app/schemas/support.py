from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from backend.app.models.support import SupportStatus

class SupportTicketBase(BaseModel):
    subject: str
    message: str

class SupportTicketCreate(SupportTicketBase):
    pass

class SupportTicketUpdate(BaseModel):
    status: Optional[SupportStatus] = None
    admin_notes: Optional[str] = None

class SupportTicketRead(SupportTicketBase):
    id: int
    user_id: int
    status: SupportStatus
    admin_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
