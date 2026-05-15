from enum import Enum
from datetime import datetime
from typing import Optional, List
from sqlalchemy import Integer, String, ForeignKey, Text, JSON, DateTime, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base_class import Base

class MBTIQuestion(Base):
    __tablename__ = "mbti_questions"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    order: Mapped[int] = mapped_column(Integer, unique=True, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    option_a_text: Mapped[str] = mapped_column(Text, nullable=True)
    option_b_text: Mapped[str] = mapped_column(Text, nullable=True)
    dimension: Mapped[str] = mapped_column(String(5), nullable=False) # EI, SN, TF, JP
    option_a_value: Mapped[str] = mapped_column(String(5), nullable=False) # E, S, T, J
    option_b_value: Mapped[str] = mapped_column(String(5), nullable=False) # I, N, F, P

class MBTIType(Base):
    __tablename__ = "mbti_types"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(4), unique=True, nullable=False) # e.g., "INTJ"
    title: Mapped[str] = mapped_column(String(100), nullable=False) # e.g., "The Analyst"
    vietnamese_title: Mapped[str] = mapped_column(String(100), nullable=False) # e.g., "Người Phân Tích"
    description: Mapped[str] = mapped_column(Text, nullable=False)
    pros: Mapped[List[str]] = mapped_column(JSON, nullable=False) # List of strengths
    cons: Mapped[List[str]] = mapped_column(JSON, nullable=False) # List of weaknesses
    population_pct: Mapped[str] = mapped_column(String(20), nullable=True) # e.g., "3%"
    suggested_careers: Mapped[str] = mapped_column(Text, nullable=True)

class UserMBTIResult(Base):
    __tablename__ = "user_mbti_results"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("user.id"), nullable=False)
    
    mbti_code: Mapped[str] = mapped_column(String(4), nullable=False)
    gender: Mapped[str] = mapped_column(String(10), nullable=True) # "Nam" or "Nữ"
    
    # Detailed breakdown percentages
    score_e: Mapped[int] = mapped_column(Integer, default=0)
    score_i: Mapped[int] = mapped_column(Integer, default=0)
    score_s: Mapped[int] = mapped_column(Integer, default=0)
    score_n: Mapped[int] = mapped_column(Integer, default=0)
    score_t: Mapped[int] = mapped_column(Integer, default=0)
    score_f: Mapped[int] = mapped_column(Integer, default=0)
    score_j: Mapped[int] = mapped_column(Integer, default=0)
    score_p: Mapped[int] = mapped_column(Integer, default=0)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", backref="mbti_results")
