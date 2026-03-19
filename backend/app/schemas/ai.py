from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel

# --- CV Analysis Schemas ---
class CVAnalysisBase(BaseModel):
    job_description: Optional[str] = None

class CVAnalysisCreate(CVAnalysisBase):
    # File upload handling is separate, this might just carry metadata
    pass

class CVAnalysis(CVAnalysisBase):
    id: int
    user_id: int
    cv_file_url: str
    score: Optional[int] = None
    analysis_result: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Mock Interview Schemas ---
class MockInterviewBase(BaseModel):
    job_description: str

class MockInterviewCreate(MockInterviewBase):
    pass

class MockInterview(MockInterviewBase):
    id: int
    user_id: int
    recording_url: Optional[str] = None
    score: Optional[int] = None
    transcript: Optional[str] = None
    feedback: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True
