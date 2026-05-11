from typing import List, Optional
from pydantic import BaseModel, EmailStr, validator
from backend.app.domains.identity.models import UserRole, UserStatus


class UserCreate(BaseModel):
    """Schema for creating a new user (admin only)"""
    email: EmailStr
    password: str
    full_name: str
    phone_number: str
    role: UserRole = UserRole.STUDENT
    credits: int = 0
    is_active: bool = True
    is_superuser: bool = False
    account_status: UserStatus = UserStatus.ACTIVE
    
    @validator('password')
    def password_min_length(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v
    
    @validator('email')
    def email_lowercase(cls, v):
        return v.lower()


class UserUpdate(BaseModel):
    """Schema for updating user (admin only)"""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    role: Optional[UserRole] = None
    credits: Optional[int] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None
    account_status: Optional[UserStatus] = None
    
    @validator('email')
    def email_lowercase(cls, v):
        return v.lower() if v else v


class UserRead(BaseModel):
    """Schema for reading user data"""
    id: int
    email: str
    full_name: str
    phone_number: Optional[str] = None
    role: UserRole
    credits: int
    is_active: bool
    is_superuser: bool
    account_status: UserStatus
    created_at: Optional[str] = None
    
    class Config:
        from_attributes = True


class PaginatedUserResponse(BaseModel):
    """Paginated response for user list"""
    items: List[UserRead]
    total: int
    page: int
    page_size: int
    total_pages: int
