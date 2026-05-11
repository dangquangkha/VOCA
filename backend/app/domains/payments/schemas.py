from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from enum import Enum

class TransactionType(str, Enum):
    DEPOSIT = "DEPOSIT"
    WITHDRAWAL = "WITHDRAWAL"
    BOOKING_HOLD = "BOOKING_HOLD"
    BOOKING_RELEASE = "BOOKING_RELEASE"
    BOOKING_REFUND = "BOOKING_REFUND"
    SERVICE_PAYMENT = "SERVICE_PAYMENT"
    REFUND_REQUEST = "REFUND_REQUEST"       # UC-36

class TransactionStatus(str, Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"                   # UC-36: bank refund paid out
    PENDING_PAYOUT = "PENDING_PAYOUT"       # UC-19: awaiting admin payout
    REJECTED_PAYOUT = "REJECTED_PAYOUT"    # UC-19: admin rejected, credits refunded

class PaymentCreate(BaseModel):
    amount: int  # Amount of credits to top up

class PaymentDepositResponse(BaseModel):
    transaction_id: int
    qr_url: str
    amount_vnd: int
    content: str

class PaymentRead(BaseModel):
    id: int
    amount: int
    type: TransactionType
    status: TransactionStatus
    created_at: datetime
    description: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account: Optional[str] = None
    bank_holder_name: Optional[str] = None
    admin_note: Optional[str] = None
    payout_reference: Optional[str] = None

    class Config:
        from_attributes = True

class PaginatedPaymentResponse(BaseModel):
    items: List[PaymentRead]
    total: int
    page: int
    page_size: int
    total_pages: int

# UC-36: Bank Refund Request (Student requests refund of purchased credits)
class RefundRequestCreate(BaseModel):
    amount: int             # Credits to refund
    bank_name: str          # "MB Bank", "Vietcombank", etc.
    bank_account: str       # Account number
    account_holder: str     # Account holder full name

class RefundRequestRead(BaseModel):
    id: int
    user_id: int
    amount: int
    status: TransactionStatus
    description: Optional[str] = None
    admin_note: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# UC-19: Expert Withdrawal Request
class WithdrawalCreate(BaseModel):
    amount: int  # Credits to withdraw (minimum 200 per BR-19.1)

class ExpertProfileMinimal(BaseModel):
    id: int
    kyc_status: str
    
    class Config:
        from_attributes = True

class WithdrawalUserRead(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    credits: int
    expert_profile: Optional[ExpertProfileMinimal] = None
    
    class Config:
        from_attributes = True

class WithdrawalRead(BaseModel):
    id: int
    user_id: int
    amount: int
    status: TransactionStatus
    description: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account: Optional[str] = None
    bank_holder_name: Optional[str] = None
    admin_note: Optional[str] = None
    payout_reference: Optional[str] = None
    created_at: datetime
    user: Optional[WithdrawalUserRead] = None

    class Config:
        from_attributes = True

# UC-19: Admin action to approve or reject a withdrawal
class WithdrawalAction(BaseModel):
    action: str     # "approve" | "reject"
    admin_note: Optional[str] = None
    payout_reference: Optional[str] = None

class ExpertStats(BaseModel):
    available: int
    escrow: int
    monthly_total: int
    trend: float = 0.0
