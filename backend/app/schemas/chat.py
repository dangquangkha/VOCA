from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from backend.app.schemas.user import User

class MessageBase(BaseModel):
    content: str

class MessageCreate(MessageBase):
    receiver_id: int

class Message(MessageBase):
    id: int
    sender_id: int
    receiver_id: int
    is_read: bool
    created_at: datetime
    
    sender: Optional[User] = None

    class Config:
        from_attributes = True
