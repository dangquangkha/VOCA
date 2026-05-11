from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum as SqlEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum

from backend.app.db.base_class import Base

class NotificationType(str, enum.Enum):
    BOOKING = "booking"
    PAYMENT = "payment"
    CHAT = "chat"
    SYSTEM = "system"
    MARKETING = "marketing"
    ADMIN_ALERT = "admin_alert"

class NotificationPriority(str, enum.Enum):
    HIGH = "high"
    LOW = "low"

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    recipient_id = Column(Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey("user.id", ondelete="SET NULL"), nullable=True)
    
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    type = Column(SqlEnum(NotificationType), default=NotificationType.SYSTEM)
    priority = Column(SqlEnum(NotificationPriority), default=NotificationPriority.LOW)
    
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    # Deep Link for BR-38.2
    link = Column(String, nullable=True)
    
    # Metadata for additional context
    data = Column(String, nullable=True) # JSON string if needed

    recipient = relationship("User", foreign_keys=[recipient_id], back_populates="notifications")
    sender = relationship("User", foreign_keys=[sender_id])
