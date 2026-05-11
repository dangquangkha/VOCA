from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from backend.app.models.roadmap import DayStatus

class DailyProgressBase(BaseModel):
    day_number: int
    status: DayStatus
    content_data: Optional[Any] = None

class DailyProgressCreate(DailyProgressBase):
    pass

class DailyProgressUpdate(BaseModel):
    content_data: Any
    status: Optional[DayStatus] = None

class RoadmapHistoryBase(BaseModel):
    snapshot_data: dict
    is_premium: bool = False

class RoadmapHistoryCreate(RoadmapHistoryBase):
    user_id: int

class RoadmapHistory(RoadmapHistoryBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class DailyProgress(DailyProgressBase):
    id: int
    user_id: int
    completed_at: Optional[datetime] = None
    reward_earned: Optional[int] = 0

    class Config:
        from_attributes = True

class DayContent(BaseModel):
    day_number: int
    topic: str
    interaction_type: str # "Journaling", "Checklist", "Scoring", "Selection"
    prompt: str
    requirements: Optional[Dict[str, Any]] = None # e.g. min_length: 50
