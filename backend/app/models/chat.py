from datetime import datetime
from sqlalchemy import Integer, String, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base_class import Base

class Message(Base):
    __tablename__ = "messages"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    sender_id: Mapped[int] = mapped_column(Integer, ForeignKey("user.id"), nullable=False)
    receiver_id: Mapped[int] = mapped_column(Integer, ForeignKey("user.id"), nullable=False)
    
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])
