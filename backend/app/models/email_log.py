from datetime import datetime
from sqlalchemy import Integer, String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.db.base_class import Base

class EmailLog(Base):
    __tablename__ = "email_logs"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    to_email: Mapped[str] = mapped_column(String, index=True, nullable=False)
    subject: Mapped[str] = mapped_column(String, nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    sent_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
