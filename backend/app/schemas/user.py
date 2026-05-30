import re
from typing import Optional
from pydantic import BaseModel, EmailStr, validator
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

    @validator('email')
    def validate_email(cls, v):
        if not v.endswith('@gmail.com'):
            raise ValueError('Email phải có đuôi @gmail.com')
        return v
    
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
        
    @validator('phone_number')
    def validate_phone(cls, v):
        if not re.match(r'^(0|\+84)(3|5|7|8|9)[0-9]{8}$', v):
            raise ValueError('Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam')
        return v

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
    specialization: Optional[str] = None
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

    @validator('new_password')
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

from typing import List
class PaginatedUserResponse(BaseModel):
    items: List[User]
    total: int
    page: int
    page_size: int
    total_pages: int

