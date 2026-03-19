from datetime import datetime
from sqlalchemy import Integer, String, ForeignKey, DateTime, JSON, Text, Float
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.db.base_class import Base

class CVAnalysis(Base):
    __tablename__ = "cv_analyses"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("user.id"), nullable=False)
    
    cv_file_url: Mapped[str] = mapped_column(String, nullable=False)
    job_description: Mapped[str] = mapped_column(Text, nullable=True)
    
    score: Mapped[int] = mapped_column(Integer, nullable=True)
    analysis_result: Mapped[dict] = mapped_column(JSON, nullable=True) # JSON output from AI
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class MockInterview(Base):
    __tablename__ = "mock_interviews"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("user.id"), nullable=False)
    
    job_description: Mapped[str] = mapped_column(Text, nullable=False)
    recording_url: Mapped[str] = mapped_column(String, nullable=True)
    
    score: Mapped[int] = mapped_column(Integer, nullable=True)
    transcript: Mapped[str] = mapped_column(Text, nullable=True)
    feedback: Mapped[dict] = mapped_column(JSON, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
