from typing import List, Optional
from pydantic import BaseModel
from backend.app.domains.marketplace.models import KYCStatus
from backend.app.schemas.user import User
from backend.app.schemas.review import ReviewWithUser

class ExpertAvailabilityBase(BaseModel):
    day_of_week: int # 0-6
    start_time: str # HH:MM
    end_time: str # HH:MM
    max_participants: Optional[int] = 1

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

# MENTOR: Schema for updating QR code URL
class ExpertQRCodeUpdate(BaseModel):
    qr_code_url: Optional[str] = None


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
    # MENTOR: QR code for direct bank transfer
    qr_code_url: Optional[str] = None
    
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

# --- Portfolio / Post Schemas ---
from datetime import datetime
from backend.app.domains.marketplace.models import PostType, PostStatus

class PostAttachmentBase(BaseModel):
    file_url: str
    file_name: str
    file_type: Optional[str] = None

class PostAttachmentCreate(PostAttachmentBase):
    pass

class PostAttachmentSchema(PostAttachmentBase):
    id: int
    post_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class ExpertPostBase(BaseModel):
    title: str
    content: Optional[str] = None
    type: PostType = PostType.ARTICLE
    status: PostStatus = PostStatus.DRAFT

class ExpertPostCreate(ExpertPostBase):
    attachments: Optional[List[PostAttachmentCreate]] = []

class ExpertPostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    type: Optional[PostType] = None
    status: Optional[PostStatus] = None
    attachments: Optional[List[PostAttachmentCreate]] = None

class ExpertPostSchema(ExpertPostBase):
    id: int
    expert_id: int
    slug: str
    views_count: int
    created_at: datetime
    updated_at: datetime
    attachments: List[PostAttachmentSchema] = []

    class Config:
        from_attributes = True

class PaginatedPostResponse(BaseModel):
    items: List[ExpertPostSchema]
    total: int
    page: int
    page_size: int
    total_pages: int

# --- Public Feed Schema ---

class ExpertPostFeedItem(BaseModel):
    """Schema for a post in the public feed, includes expert info."""
    id: int
    expert_id: int           # expert_profiles.id — used for link /experts/{expert_id}/post/{slug}
    title: str
    slug: str
    type: PostType
    content: Optional[str] = None
    views_count: int
    created_at: datetime
    expert_name: str
    expert_avatar: Optional[str] = None

    class Config:
        from_attributes = True

class PaginatedFeedResponse(BaseModel):
    items: List[ExpertPostFeedItem]
    total: int
    page: int
    page_size: int
    total_pages: int
