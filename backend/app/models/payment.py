from enum import Enum
from datetime import datetime
from sqlalchemy import Integer, String, ForeignKey, DateTime, Enum as SQLAlchemyEnum, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base_class import Base

class TransactionType(str, Enum):
    DEPOSIT = "DEPOSIT"                     # Money in -> Credits
    WITHDRAWAL = "WITHDRAWAL"               # Credits -> Money out (UC-19)
    BOOKING_HOLD = "BOOKING_HOLD"           # Credits held for booking
    BOOKING_RELEASE = "BOOKING_RELEASE"     # Credits paid to expert
    BOOKING_REFUND = "BOOKING_REFUND"       # Credits returned to student
    SERVICE_PAYMENT = "SERVICE_PAYMENT"     # Pay for AI service
    REFUND_REQUEST = "REFUND_REQUEST"       # UC-36: User requests bank withdrawal

class TransactionStatus(str, Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"                   # UC-36: Bank refund paid out by admin
    PENDING_PAYOUT = "PENDING_PAYOUT"       # UC-19: Expert withdrawal awaiting admin payout
    REJECTED_PAYOUT = "REJECTED_PAYOUT"    # UC-19: Admin rejected → credits refunded to expert

class PaymentTransaction(Base):
    __tablename__ = "transactions"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("user.id"), nullable=False)
    booking_id: Mapped[int] = mapped_column(Integer, ForeignKey("bookings.id"), nullable=True)
    
    amount: Mapped[int] = mapped_column(Integer, nullable=False) # Credits
    type: Mapped[TransactionType] = mapped_column(SQLAlchemyEnum(TransactionType), nullable=False)
    status: Mapped[TransactionStatus] = mapped_column(SQLAlchemyEnum(TransactionStatus), default=TransactionStatus.PENDING)
    
    description: Mapped[str] = mapped_column(String, nullable=True)
    payment_gateway_id: Mapped[str] = mapped_column(String, nullable=True) # For external tracking
    
    # UC-19: Snapshot of bank info at time of withdrawal request
    bank_name: Mapped[str] = mapped_column(String, nullable=True)
    bank_account: Mapped[str] = mapped_column(String, nullable=True)
    bank_holder_name: Mapped[str] = mapped_column(String, nullable=True)
    
    # UC-19: Admin verdict note when approving/rejecting
    admin_note: Mapped[str] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", backref="transactions")
    booking = relationship("Booking", backref="transactions")
