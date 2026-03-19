from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Any, List
from datetime import datetime, timezone
import re

from backend.app.models.booking import Booking, BookingStatus

from backend.app.api import deps
from backend.app.models.user import User
from backend.app.models.expert import ExpertProfile
from backend.app.models.payment import PaymentTransaction, TransactionType, TransactionStatus
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
    data: dict,
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    """
    Webhook to receive payment confirmation from SePay.
    """
    auth_header = request.headers.get("Authorization")

    if not sepay_service.verify_webhook_data(data, auth_header):
        raise HTTPException(status_code=400, detail="Invalid Webhook Data or Unauthorized")
    
    transfer_content = data.get("content", "")
    amount_vnd = data.get("transferAmount", 0)
    
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
    
    expected_vnd = transaction.amount * 1000
    if int(amount_vnd) != expected_vnd:
        actual_credits = int(amount_vnd) // 1000
        transaction.amount = actual_credits
    
    transaction.status = TransactionStatus.COMPLETED
    transaction.payment_gateway_id = data.get("id", "")
    db.add(transaction)
    
    user_result = await db.execute(select(User).where(User.id == transaction.user_id))
    user = user_result.scalars().first()
    if user:
        user.credits += transaction.amount
        db.add(user)
    
    await db.commit()
    
    # UC-38.1: Notify User of successful top-up
    try:
        await create_notification(
            recipient_id=user.id,
            title="Nạp tiền thành công",
            message=f"Bạn đã nạp thành công {transaction.amount} credits vào tài khoản.",
            type=NotificationType.PAYMENT,
            priority=NotificationPriority.HIGH,
            link="/dashboard/student/wallet" # Assuming student wallet for now
        )
    except Exception as e:
        print(f"WARNING: create_notification failed (non-critical): {e}")

    return {"success": True, "message": f"Credits added: {transaction.amount}"}


# ─── Payment History ───────────────────────────────────────────────────────────

@router.get("/history", response_model=PaginatedPaymentResponse)
async def get_payment_history(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 10,
) -> Any:
    """Get paginated payment history for the current user."""
    total_result = await db.execute(
        select(func.count(PaymentTransaction.id)).where(
            PaymentTransaction.user_id == current_user.id
        )
    )
    total = total_result.scalar_one()
    
    stmt = select(PaymentTransaction).where(
        PaymentTransaction.user_id == current_user.id
    ).order_by(PaymentTransaction.created_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(stmt)
    transactions = result.scalars().all()
    
    return {
        "items": transactions,
        "total": total or 0,
        "page": (skip // limit) + 1,
        "page_size": limit,
        "total_pages": ((total or 0) + limit - 1) // limit
    }


# ─── UC-36: Bank Refund Request (Student) ──────────────────────────────────────
# IMPORTANT: These routes MUST be before GET /{id} to avoid FastAPI routing conflicts.

@router.post("/refund-request", response_model=RefundRequestRead)
async def create_refund_request(
    refund_in: RefundRequestCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """UC-36: Request bank refund of purchased credits."""
    if refund_in.amount <= 0:
        raise HTTPException(status_code=400, detail="Refund amount must be positive")
    if current_user.credits < refund_in.amount:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient credits. You have {current_user.credits} credits available."
        )

    current_user.credits -= refund_in.amount
    db.add(current_user)

    desc = (
        f"Bank refund request: {refund_in.amount} credits → "
        f"{refund_in.account_holder} | {refund_in.bank_name} | {refund_in.bank_account}"
    )
    trx = PaymentTransaction(
        user_id=current_user.id,
        amount=refund_in.amount,
        type=TransactionType.REFUND_REQUEST,
        status=TransactionStatus.PENDING,
        description=desc,
    )
    db.add(trx)
    await db.commit()
    await db.refresh(trx)
    return trx


@router.get("/refund-requests", response_model=List[RefundRequestRead])
async def list_refund_requests(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_superuser),
) -> Any:
    """Admin: List all bank refund requests (UC-36)."""
    result = await db.execute(
        select(PaymentTransaction)
        .where(PaymentTransaction.type == TransactionType.REFUND_REQUEST)
        .order_by(PaymentTransaction.created_at.desc())
    )
    return result.scalars().all()


@router.patch("/refund-requests/{transaction_id}", response_model=RefundRequestRead)
async def resolve_refund_request(
    transaction_id: int,
    action: str,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_superuser),
    admin_note: str | None = None,
) -> Any:
    """Admin: Approve (REFUNDED) or reject (FAILED + refund credits) a refund request."""
    result = await db.execute(
        select(PaymentTransaction).where(
            PaymentTransaction.id == transaction_id,
            PaymentTransaction.type == TransactionType.REFUND_REQUEST,
        )
    )
    trx = result.scalars().first()
    if not trx:
        raise HTTPException(status_code=404, detail="Refund request not found")
    if trx.status != TransactionStatus.PENDING:
        raise HTTPException(status_code=400, detail="Request already processed")

    if action == "approve":
        trx.status = TransactionStatus.REFUNDED
    elif action == "reject":
        trx.status = TransactionStatus.FAILED
        user_result = await db.execute(select(User).where(User.id == trx.user_id))
        user = user_result.scalars().first()
        if user:
            user.credits += trx.amount
            db.add(user)
    else:
        raise HTTPException(status_code=400, detail="action must be 'approve' or 'reject'")

    if admin_note:
        trx.admin_note = admin_note

    db.add(trx)
    await db.commit()
    await db.refresh(trx)

    # UC-38.1: Notify User of refund status
    try:
        status_text = "đã được chấp nhận" if action == "approve" else "đã bị từ chối"
        await create_notification(
            recipient_id=trx.user_id,
            title=f"Yêu cầu hoàn tiền {status_text}",
            message=f"Yêu cầu hoàn tiền {trx.amount} credits của bạn {status_text}. {f'Lý do: {admin_note}' if admin_note else ''}",
            type=NotificationType.PAYMENT,
            priority=NotificationPriority.HIGH,
            link="/dashboard/student/wallet"
        )
    except Exception as e:
        print(f"WARNING: create_notification failed (non-critical): {e}")

    return trx


# ─── UC-19: Expert Withdrawal ──────────────────────────────────────────────────

@router.post("/withdrawal-request", response_model=WithdrawalRead)
async def create_withdrawal_request(
    withdrawal_in: WithdrawalCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    UC-19: Expert requests to withdraw credits to their bank account.
    - PRE-1: Balance >= requested amount AND >= 200 (BR-19.1)
    - PRE-2: Expert must have bank_account set in their profile
    - Immediately deducts credits to prevent double-withdrawal
    """
    # Check user is an expert
    if current_user.role.value != "EXPERT":
        raise HTTPException(status_code=403, detail="Only experts can request withdrawals")

    # BR-19.1: Minimum withdrawal
    MIN_WITHDRAWAL = 200
    if withdrawal_in.amount < MIN_WITHDRAWAL:
        raise HTTPException(
            status_code=400,
            detail=f"Minimum withdrawal is {MIN_WITHDRAWAL} credits (≈ {MIN_WITHDRAWAL:,}₫)"
        )

    # Check balance
    if current_user.credits < withdrawal_in.amount:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient credits. You have {current_user.credits} credits available."
        )

    # PRE-2: Check expert has bank info
    expert_result = await db.execute(
        select(ExpertProfile).where(ExpertProfile.user_id == current_user.id)
    )
    expert = expert_result.scalars().first()
    if not expert:
        raise HTTPException(status_code=404, detail="Expert profile not found")
    if not expert.bank_account or not expert.bank_name or not expert.bank_holder_name:
        raise HTTPException(
            status_code=400,
            detail="Vui lòng cập nhật thông tin tài khoản ngân hàng trong hồ sơ KYC trước khi rút tiền."
        )

    # Deduct credits immediately (POST-2: prevents double-withdrawal)
    current_user.credits -= withdrawal_in.amount
    db.add(current_user)

    trx = PaymentTransaction(
        user_id=current_user.id,
        amount=withdrawal_in.amount,
        type=TransactionType.WITHDRAWAL,
        status=TransactionStatus.PENDING_PAYOUT,
        description=f"Withdrawal request: {withdrawal_in.amount} credits → {expert.bank_holder_name} | {expert.bank_name} | {expert.bank_account}",
        # Snapshot bank info at time of request
        bank_name=expert.bank_name,
        bank_account=expert.bank_account,
        bank_holder_name=expert.bank_holder_name,
    )
    db.add(trx)
    await db.commit()
    await db.refresh(trx)
    return trx


@router.get("/withdrawal-requests", response_model=List[WithdrawalRead])
async def list_withdrawal_requests(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_superuser),
) -> Any:
    """Admin: List all expert withdrawal requests."""
    result = await db.execute(
        select(PaymentTransaction)
        .where(PaymentTransaction.type == TransactionType.WITHDRAWAL)
        .order_by(PaymentTransaction.created_at.desc())
    )
    return result.scalars().all()


@router.patch("/withdrawal-requests/{transaction_id}", response_model=WithdrawalRead)
async def resolve_withdrawal_request(
    transaction_id: int,
    body: WithdrawalAction,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_superuser),
) -> Any:
    """
    Admin: Approve or reject an expert withdrawal request.
    - approve → status COMPLETED (admin has transferred money manually)
    - reject  → status REJECTED_PAYOUT, credits refunded back to expert
    """
    result = await db.execute(
        select(PaymentTransaction).where(
            PaymentTransaction.id == transaction_id,
            PaymentTransaction.type == TransactionType.WITHDRAWAL,
        )
    )
    trx = result.scalars().first()
    if not trx:
        raise HTTPException(status_code=404, detail="Withdrawal request not found")
    if trx.status != TransactionStatus.PENDING_PAYOUT:
        raise HTTPException(status_code=400, detail="Request already processed")

    if body.action == "approve":
        trx.status = TransactionStatus.COMPLETED
        trx.admin_note = body.admin_note
    elif body.action == "reject":
        trx.status = TransactionStatus.REJECTED_PAYOUT
        trx.admin_note = body.admin_note
        # Refund credits back to expert
        user_result = await db.execute(select(User).where(User.id == trx.user_id))
        user = user_result.scalars().first()
        if user:
            user.credits += trx.amount
            db.add(user)
    else:
        raise HTTPException(status_code=400, detail="action must be 'approve' or 'reject'")

    db.add(trx)
    await db.commit()
    await db.refresh(trx)
    return trx



# ─── UC-19: Expert Dashboard Stats ───────────────────────────────────────────

@router.get("/expert/stats", response_model=ExpertStats)
async def get_expert_stats(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    print(f"DEBUG: Incoming request for expert stats from {current_user.email}")
    """
    Get summary of expert's financial status.
    """
    if current_user.role.value != "EXPERT":
        raise HTTPException(status_code=403, detail="Only experts can view these stats")

    try:
        # 1. Available Credits
        available = current_user.credits

        # 2. Escrow Credits (Total from CONFIRMED or IN_PROGRESS bookings)
        # Get expert profile id
        expert_result = await db.execute(select(ExpertProfile).where(ExpertProfile.user_id == current_user.id))
        expert = expert_result.scalars().first()
        if not expert:
            raise HTTPException(status_code=404, detail="Expert profile not found")

        escrow_result = await db.execute(
            select(func.sum(Booking.total_amount)).where(
                Booking.expert_id == expert.id,
                Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS])
            )
        )
        escrow = escrow_result.scalar() or 0

        # 3. Monthly Total (Total released this month)
        now = datetime.now(timezone.utc)
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        monthly_result = await db.execute(
            select(func.sum(PaymentTransaction.amount)).where(
                PaymentTransaction.user_id == current_user.id,
                PaymentTransaction.type == TransactionType.BOOKING_RELEASE,
                PaymentTransaction.status == TransactionStatus.COMPLETED,
                PaymentTransaction.created_at >= start_of_month
            )
        )
        monthly_total = monthly_result.scalar() or 0

        return {
            "available": available,
            "escrow": escrow,
            "monthly_total": monthly_total,
            "trend": 12.5 # Mock trend for now
        }
    except Exception as e:
        print(f"ERROR in get_expert_stats: {str(e)}")
        # Fallback to mock data to avoid connection drop
        return {
            "available": current_user.credits,
            "escrow": 0,
            "monthly_total": 0,
            "trend": 0.0
        }


# ─── Parameterized route /{id} — MUST be LAST ──────────────────────────────────

@router.get("/{id}", response_model=PaymentRead)
async def get_transaction(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    id: int,
) -> Any:
    """Get specific transaction status."""
    stmt = select(PaymentTransaction).where(
        PaymentTransaction.id == id,
        PaymentTransaction.user_id == current_user.id
    )
    result = await db.execute(stmt)
    transaction = result.scalars().first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction

