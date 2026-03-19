from datetime import datetime
from enum import Enum
from sqlalchemy import String, Integer, Enum as SQLAlchemyEnum, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from backend.app.db.base_class import Base

class AccountActionType(str, Enum):
    SUSPEND_EXPERT = "SUSPEND_EXPERT"
    UNSUSPEND_EXPERT = "UNSUSPEND_EXPERT"
    BAN_USER = "BAN_USER"
    UNBAN_USER = "UNBAN_USER"

class AccountAction(Base):
    """Audit log for all account moderation actions"""
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    action_type: Mapped[AccountActionType] = mapped_column(SQLAlchemyEnum(AccountActionType), nullable=False)
    target_user_id: Mapped[int] = mapped_column(ForeignKey("user.id"), nullable=False)
    admin_id: Mapped[int] = mapped_column(ForeignKey("user.id"), nullable=False)
    reason: Mapped[str] = mapped_column(String, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=func.now(), nullable=False)
    
    # Relationships
    target_user = relationship("User", foreign_keys=[target_user_id], backref="actions_received")
    admin = relationship("User", foreign_keys=[admin_id], backref="actions_performed")
