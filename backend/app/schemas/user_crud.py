import re
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
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Mật khẩu phải có ít nhất 8 ký tự')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Mật khẩu phải có ít nhất 1 chữ in hoa')
        if not re.search(r'[^a-zA-Z0-9\s]', v):
            raise ValueError('Mật khẩu phải có ít nhất 1 ký tự đặc biệt')
        if ' ' in v:
            raise ValueError('Mật khẩu không được chứa dấu cách')
        return v
    
    @validator('email')
    def validate_email(cls, v):
        v = v.lower()
        if not v.endswith('@gmail.com'):
            raise ValueError('Email phải có đuôi @gmail.com')
        return v

    @validator('phone_number')
    def validate_phone(cls, v):
        if not re.match(r'^(0|\+84)(3|5|7|8|9)[0-9]{8}$', v):
            raise ValueError('Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam')
        return v


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


from datetime import datetime

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
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class PaginatedUserResponse(BaseModel):
    """Paginated response for user list"""
    items: List[UserRead]
    total: int
    page: int
    page_size: int
    total_pages: int
