from typing import Optional
from pydantic import BaseModel, EmailStr
from backend.app.domains.identity.models import UserRole, UserStatus

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    password: str
    phone_number: str
    role: UserRole = UserRole.STUDENT
    years_of_experience: Optional[int] = 0

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    avatar_url: Optional[str] = None
    password: Optional[str] = None
    email: Optional[EmailStr] = None

class UserInDBBase(UserBase):
    id: int
    role: UserRole
    account_status: UserStatus
    credits: int
    is_active: bool
    is_superuser: bool

    class Config:
        from_attributes = True

from backend.app.domains.marketplace.models import KYCStatus

class ExpertProfileNested(BaseModel):
    id: int
    kyc_status: KYCStatus
    bio: Optional[str] = None
    linkedin_url: Optional[str] = None
    experience_years: Optional[int] = 0
    hourly_rate: Optional[int] = 0
    tags: Optional[str] = None
    kyc_documents: Optional[str] = None
    
    class Config:
        from_attributes = True

class User(UserInDBBase):
    expert_profile: Optional[ExpertProfileNested] = None



class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

from typing import List
class PaginatedUserResponse(BaseModel):
    items: List[User]
    total: int
    page: int
    page_size: int
    total_pages: int

