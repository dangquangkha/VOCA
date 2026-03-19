from typing import Optional, Any
from datetime import datetime
from pydantic import BaseModel
from backend.app.models.notification import NotificationType, NotificationPriority

class NotificationBase(BaseModel):
    title: str
    message: str
    type: NotificationType = NotificationType.SYSTEM
    priority: NotificationPriority = NotificationPriority.LOW
    link: Optional[str] = None
    data: Optional[str] = None

class NotificationCreate(NotificationBase):
    recipient_id: int
    sender_id: Optional[int] = None

class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = None

class Notification(NotificationBase):
    id: int
    recipient_id: int
    sender_id: Optional[int]
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# For providing sender info in the frontend
from backend.app.schemas.user import User as UserSchema

class NotificationWithSender(Notification):
    sender: Optional[UserSchema] = None
