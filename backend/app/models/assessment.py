from sqlalchemy import Column, Integer, String, ForeignKey, JSON, DateTime, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.app.db.base_class import Base

class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, unique=True, index=True) # e.g., "Holland Code", "MBTI"
    description = Column(String)
    code = Column(String, unique=True, index=True) # e.g., "HOLLAND", "MBTI"
    image_url = Column(String, nullable=True)
    
    questions = relationship("Question", back_populates="assessment", cascade="all, delete-orphan")
    results = relationship("UserAssessmentResult", back_populates="assessment")

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"))
    content = Column(String)
    question_type = Column(String) # "LIKERT", "CHOICE"
    order = Column(Integer)
    # For Holland: {"R": 1, "I": 0, ...} or just category "R"
    # For MBTI: {"E": 1, "I": 0} 
    scoring_logic = Column(JSON) 
    
    assessment = relationship("Assessment", back_populates="questions")

class UserAssessmentResult(Base):
    __tablename__ = "user_assessment_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"))
    assessment_id = Column(Integer, ForeignKey("assessments.id"))
    
    # Store detailed scores, e.g., {"R": 20, "I": 15, "E": 5...}
    scores = Column(JSON) 
    # Final result code, e.g., "R-I-E" or "INTJ"
    result_code = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="assessment_results")
    assessment = relationship("Assessment", back_populates="results")
