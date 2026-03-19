from pydantic import BaseModel
from datetime import datetime

class EmailLogRead(BaseModel):
    id: int
    to_email: str
    subject: str
    body: str
    sent_at: datetime

    class Config:
        from_attributes = True
