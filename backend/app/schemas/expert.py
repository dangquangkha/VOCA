from typing import List, Optional
from pydantic import BaseModel
from backend.app.domains.marketplace.models import KYCStatus
from backend.app.schemas.user import User
from backend.app.schemas.review import ReviewWithUser

class ExpertAvailabilityBase(BaseModel):
    day_of_week: int # 0-6
    start_time: str # HH:MM
    end_time: str # HH:MM

class ExpertAvailabilityCreate(ExpertAvailabilityBase):
    pass

class ExpertAvailability(ExpertAvailabilityBase):
    id: int
    expert_id: int

    class Config:
        from_attributes = True

class ExpertProfileBase(BaseModel):
    bio: Optional[str] = None
    linkedin_url: Optional[str] = None
    experience_years: Optional[int] = 0
    specialization: Optional[str] = None
    hourly_rate: Optional[int] = 50
    kyc_documents: Optional[str] = None
    tags: Optional[str] = None

class ExpertProfileCreate(ExpertProfileBase):
    pass

class ExpertProfileUpdate(BaseModel):
    bio: Optional[str] = None
    linkedin_url: Optional[str] = None
    experience_years: Optional[int] = None
    specialization: Optional[str] = None
    hourly_rate: Optional[int] = None
    tags: Optional[str] = None
    kyc_documents: Optional[str] = None

# UC-19: Schema for updating bank account info
class ExpertBankUpdate(BaseModel):
    bank_name: str
    bank_account: str
    bank_holder_name: str

class ExpertProfileShort(ExpertProfileBase):
    id: int
    user_id: int
    rating: float
    total_reviews: int
    kyc_status: KYCStatus
    
    # UC-19: Bank account fields
    bank_name: Optional[str] = None
    bank_account: Optional[str] = None
    bank_holder_name: Optional[str] = None
    
    user: Optional[User] = None
    availabilities: List[ExpertAvailability] = []

    class Config:
        from_attributes = True

class ExpertProfile(ExpertProfileShort):
    reviews: List["ReviewWithUser"] = []

    class Config:
        from_attributes = True

ExpertProfileRead = ExpertProfile

class PaginatedExpertResponse(BaseModel):
    items: List[ExpertProfileShort]
    total: int
    page: int
    page_size: int
    total_pages: int

class AdminExpertCreate(BaseModel):
    full_name: str
    email: str
    password: str
