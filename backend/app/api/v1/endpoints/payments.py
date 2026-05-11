import re
import logging
import traceback
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Any, List
from datetime import datetime, timezone

from backend.app.domains.booking.models import Booking, BookingStatus

from backend.app.api import deps
from backend.app.domains.identity.models import User
from backend.app.domains.marketplace.models import ExpertProfile
from backend.app.domains.payments.models import PaymentTransaction, TransactionType, TransactionStatus
from backend.app.schemas.payment import (
    PaymentCreate, PaymentRead, PaymentDepositResponse,
    PaginatedPaymentResponse,
    RefundRequestCreate, RefundRequestRead,
    WithdrawalCreate, WithdrawalRead, WithdrawalAction,
    ExpertStats
)
from backend.app.services.payment_gateway import sepay_service
from backend.app.core.config import settings
from backend.app.services.notification_service import create_notification
from backend.app.models.notification import NotificationType, NotificationPriority

logger = logging.getLogger(__name__)
router = APIRouter()

# ─── UC-17: Top Up (Deposit) ───────────────────────────────────────────────────

@router.post("/topup", response_model=PaymentDepositResponse)
async def top_up_credits(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    payment_in: PaymentCreate,
) -> Any:
    """
    Initiate top up via SePay (VietQR).
    Returns QR Code URL for the user to scan.
    """
    if payment_in.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Amount must be positive",
        )

    # Conversion Rate: 1 Credit = 1000 VND
    amount_vnd = payment_in.amount * 1000
    
    # 1. Create Transaction Record (PENDING)
    transaction = PaymentTransaction(
        user_id=current_user.id,
        amount=payment_in.amount,
        type=TransactionType.DEPOSIT,
        status=TransactionStatus.PENDING,
        description=f"Top up {payment_in.amount} credits via SePay",
        payment_gateway_id=None
    )
    db.add(transaction)
    await db.commit()
    await db.refresh(transaction)
    
    # 2. Generate content and QR
    transfer_content = f"CP{transaction.id}"
    qr_url = sepay_service.generate_qr_url(amount_vnd, transfer_content)
    
    return PaymentDepositResponse(
        transaction_id=transaction.id,
        qr_url=qr_url,
        amount_vnd=amount_vnd,
        content=transfer_content
    )


# ─── UC-17: SePay Webhook ──────────────────────────────────────────────────────

@router.post("/webhook/sepay")
async def sepay_webhook(
    request: Request,
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    """
    Webhook to receive payment confirmation from SePay.
    """
    try:
        # 1. Parse Data (Flexible)
        content_type = request.headers.get("Content-Type", "")
        if "application/json" in content_type:
            data = await request.json()
        else:
            form_data = await request.form()
            data = dict(form_data)
        
        logger.info(f"Received SePay webhook: {data}")
        
        auth_header = request.headers.get("Authorization")
        if not sepay_service.verify_webhook_data(data, auth_header):
            logger.warning(f"Unauthorized or invalid SePay webhook: {data}")
            raise HTTPException(status_code=400, detail="Invalid Webhook Data or Unauthorized")
        
        transfer_content = str(data.get("content", ""))
        amount_vnd = data.get("transferAmount") or data.get("amount") or 0
        
        match = re.search(r'CP(\d+)', transfer_content, re.IGNORECASE)
        if not match:
            return {"success": True, "message": "OK - No transaction ID found in content, ignored"}
        
        transaction_id = int(match.group(1))
        
        result = await db.execute(
            select(PaymentTransaction).where(
                PaymentTransaction.id == transaction_id,
                PaymentTransaction.type == TransactionType.DEPOSIT,
                PaymentTransaction.status == TransactionStatus.PENDING,
            )
        )
        transaction = result.scalars().first()
        
        if not transaction:
            return {"success": True, "message": f"OK - Transaction CP{transaction_id} already processed or not found"}
        
        try:
            amount_vnd_int = int(amount_vnd)
        except (ValueError, TypeError):
            amount_vnd_int = 0

        expected_vnd = transaction.amount * 1000
        if amount_vnd_int != expected_vnd:
            actual_credits = amount_vnd_int // 1000
            logger.warning(f"Amount mismatch for CP{transaction_id}: expected {expected_vnd}, got {amount_vnd_int}")
            transaction.amount = actual_credits
        
        transaction.status = TransactionStatus.COMPLETED
        transaction.payment_gateway_id = str(data.get("id", ""))
        db.add(transaction)
        
        user_result = await db.execute(select(User).where(User.id == transaction.user_id))
        user = user_result.scalars().first()
        if user:
            user.credits += transaction.amount
            db.add(user)
        
        await db.commit()
        
        if user:
            try:
                await create_notification(
                    recipient_id=user.id,
                    title="Nạp tiền thành công",
                    message=f"Bạn đã nạp thành công {transaction.amount} credits vào tài khoản.",
                    type=NotificationType.PAYMENT,
                    priority=NotificationPriority.HIGH,
                    link="/dashboard/student/wallet"
                )
            except Exception as e:
                logger.error(f"Failed to create notification: {e}")

        return {"success": True, "message": f"Credits added: {transaction.amount}"}

    except Exception as e:
        logger.error(f"Error processing SePay webhook: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Internal Server Error during webhook processing")

# Rest of the file remains the same...
