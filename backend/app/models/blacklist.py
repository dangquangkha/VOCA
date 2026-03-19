from datetime import datetime
from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from backend.app.db.base_class import Base

class Blacklist(Base):
    """Blacklist for banned users to prevent re-registration"""
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    phone_number: Mapped[str | None] = mapped_column(String, index=True, nullable=True)
    reason: Mapped[str] = mapped_column(String, nullable=False)
    banned_user_id: Mapped[int | None] = mapped_column(ForeignKey("user.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=func.now(), nullable=False)
    
    # Relationship
    banned_user = relationship("User", foreign_keys=[banned_user_id], backref="blacklist_entries")
