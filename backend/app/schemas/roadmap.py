from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from backend.app.models.roadmap import DayStatus

class DailyProgressBase(BaseModel):
    day_number: int
    status: DayStatus
    content_data: Optional[Dict[str, Any]] = None

class DailyProgressCreate(DailyProgressBase):
    pass

class DailyProgressUpdate(BaseModel):
    content_data: Dict[str, Any]
    status: Optional[DayStatus] = None

class DailyProgress(DailyProgressBase):
    id: int
    user_id: int
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class DayContent(BaseModel):
    day_number: int
    topic: str
    interaction_type: str # "Journaling", "Checklist", "Scoring", "Selection"
    prompt: str
    requirements: Optional[Dict[str, Any]] = None # e.g. min_length: 50
