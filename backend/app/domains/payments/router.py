from fastapi import APIRouter, Depends, HTTPException, Request, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Any, List
from datetime import datetime, timezone, timedelta
import re
import logging
import traceback

logger = logging.getLogger(__name__)

from backend.app.domains.booking.models import Booking, BookingStatus
from backend.app.api import deps
from backend.app.domains.identity.models import User
from backend.app.domains.marketplace.models import ExpertProfile
from .models import PaymentTransaction, TransactionType, TransactionStatus
from .schemas import (
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
from backend.app.services.admin_notification_service import notify_all_admins

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
    
    # 1. OPTIMIZATION: Check for existing PENDING deposit of the same amount
    # This prevents flooding the transaction history if the user clicks "Top Up" multiple times.
    # We only reuse if it was created in the last 15 minutes (BR-17.1 Hardening).
    fifteen_mins_ago = datetime.now(timezone.utc) - timedelta(minutes=15)
    
    stmt = select(PaymentTransaction).where(
        PaymentTransaction.user_id == current_user.id,
        PaymentTransaction.type == TransactionType.DEPOSIT,
        PaymentTransaction.status == TransactionStatus.PENDING,
        PaymentTransaction.amount == payment_in.amount,
        PaymentTransaction.created_at >= fifteen_mins_ago
    ).order_by(PaymentTransaction.created_at.desc()).limit(1)
    
    result = await db.execute(stmt)
    transaction = result.scalars().first()
    
    if transaction:
        logger.info(f"Reusing existing pending transaction {transaction.id} for user {current_user.id}")
        # Update timestamp to show it's still active
        transaction.updated_at = datetime.now(timezone.utc)
        db.add(transaction)
    else:
        # Create new Transaction Record
        transaction = PaymentTransaction(
            user_id=current_user.id,
            amount=payment_in.amount,
            type=TransactionType.DEPOSIT,
            status=TransactionStatus.PENDING,
            description=f"Top up {payment_in.amount} credits via SePay",
            payment_gateway_id=None
        )
        db.add(transaction)
        logger.info(f"Created new pending transaction for user {current_user.id}")

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
    Supports both JSON and Form data (SePay can send either).
    """
    try:
        # 1. Parse Data (Flexible)
        content_type = request.headers.get("Content-Type", "")
        if "application/json" in content_type:
            data = await request.json()
        else:
            # Fallback to form data
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
            logger.info("No transaction ID found in content, ignored")
            return {"success": True, "message": "OK - No transaction ID found in content, ignored"}
        
        transaction_id = int(match.group(1))
        logger.info(f"Processing transaction CP{transaction_id}...")
        
        result = await db.execute(
            select(PaymentTransaction).where(
                PaymentTransaction.id == transaction_id,
                PaymentTransaction.type == TransactionType.DEPOSIT,
                PaymentTransaction.status == TransactionStatus.PENDING,
            )
        )
        transaction = result.scalars().first()
        
        if not transaction:
            logger.info(f"Transaction CP{transaction_id} already processed or not found")
            return {"success": True, "message": f"OK - Transaction CP{transaction_id} already processed or not found"}
        
        # Standardize amount
        try:
            amount_vnd_int = int(amount_vnd)
        except (ValueError, TypeError):
            amount_vnd_int = 0
            
        expected_vnd = transaction.amount * 1000
        if amount_vnd_int != expected_vnd:
            actual_credits = amount_vnd_int // 1000
            logger.warning(f"Amount mismatch for CP{transaction_id}: expected {expected_vnd}, got {amount_vnd_int}. Adjusting credits.")
            transaction.amount = actual_credits
        
        transaction.status = TransactionStatus.COMPLETED
        transaction.payment_gateway_id = str(data.get("id", ""))
        db.add(transaction)
        
        user_result = await db.execute(select(User).where(User.id == transaction.user_id))
        user = user_result.scalars().first()
        if user:
            user.credits += transaction.amount
            db.add(user)
            logger.info(f"Added {transaction.amount} credits to user {user.id}")
        
        await db.commit()
        
        # UC-38.1: Notify User of successful top-up
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


# ─── UC-17: Debug / Mock Payment (Dev Only) ──────────────────────────────────

@router.post("/debug/complete/{transaction_id}")
async def debug_complete_payment(
    transaction_id: int,
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    """
    DEV ONLY: Manually trigger completion of a payment.
    Only works if ALLOW_MOCK_LOGIN is True.
    """
    if not getattr(settings, "ALLOW_MOCK_LOGIN", False):
        raise HTTPException(status_code=403, detail="Only allowed in development mode")
        
    result = await db.execute(
        select(PaymentTransaction).where(
            PaymentTransaction.id == transaction_id,
            PaymentTransaction.type == TransactionType.DEPOSIT,
            PaymentTransaction.status == TransactionStatus.PENDING,
        )
    )
    transaction = result.scalars().first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Pending transaction not found")
        
    # Mock SePay webhook behavior
    transaction.status = TransactionStatus.COMPLETED
    transaction.payment_gateway_id = f"MOCK_{transaction_id}"
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
                title="Nạp tiền thành công (MOCK)",
                message=f"Bạn đã nạp thành công {transaction.amount} credits (Mô phỏng).",
                type=NotificationType.PAYMENT,
                priority=NotificationPriority.HIGH,
                link="/dashboard/wallet"
            )
        except Exception as e:
            logger.error(f"Failed to create notification: {e}")

    return {"success": True, "message": f"Transaction {transaction_id} completed manually"}

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

    # UC-38.2: Notify Admins of new refund request
    try:
        await notify_all_admins(
            db=db,
            title="Yêu cầu hoàn tiền mới",
            message=f"Học viên {current_user.full_name or current_user.email} yêu cầu hoàn {refund_in.amount} credits về ngân hàng {refund_in.bank_name}.",
            link="/dashboard/admin/payments",
            priority=NotificationPriority.HIGH,
            data={"transaction_id": trx.id, "type": "refund"}
        )
    except Exception as e:
        logger.error(f"Failed to notify admins of refund: {e}")

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
    - PRE-1: Balance >= requested amount AND >= 5 (BR-19.1)
    - PRE-2: Expert must have bank_account set in their profile
    - Immediately deducts credits to prevent double-withdrawal
    """
    # Check user is an expert or mentor
    if current_user.role.value not in ["EXPERT", "MENTOR"]:
        raise HTTPException(status_code=403, detail="Only experts/mentors can request withdrawals")

    # BR-19.1: Minimum withdrawal
    MIN_WITHDRAWAL = 5
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
    # PRINCIPAL FIX: Use row-level lock (with_for_update) to prevent race condition.
    user_result = await db.execute(
        select(User).where(User.id == current_user.id).with_for_update()
    )
    locked_user = user_result.scalars().first()
    if not locked_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if locked_user.credits < withdrawal_in.amount:
        raise HTTPException(status_code=400, detail="Insufficient credits")

    locked_user.credits -= withdrawal_in.amount
    db.add(locked_user)

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

    # UC-38.2: Notify Admins of new withdrawal request
    try:
        await notify_all_admins(
            db=db,
            title="Yêu cầu rút tiền mới",
            message=f"Chuyên gia {current_user.full_name or current_user.email} yêu cầu rút {withdrawal_in.amount} credits về {expert.bank_name} ({expert.bank_account}).",
            link="/dashboard/admin/payments",
            priority=NotificationPriority.HIGH,
            data={"transaction_id": trx.id, "type": "withdrawal"}
        )
    except Exception as e:
        logger.error(f"Failed to notify admins of withdrawal: {e}")

    return trx


@router.get("/withdrawal-requests", response_model=List[WithdrawalRead])
async def list_withdrawal_requests(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_superuser),
) -> Any:
    """Admin: List all expert withdrawal requests."""
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(PaymentTransaction)
        .where(PaymentTransaction.type == TransactionType.WITHDRAWAL)
        .options(selectinload(PaymentTransaction.user).selectinload(User.expert_profile))
        .order_by(PaymentTransaction.created_at.desc())
    )
    return result.scalars().all()


@router.patch("/withdrawal-requests/{transaction_id}", response_model=WithdrawalRead)
async def resolve_withdrawal_request(
    transaction_id: int,
    body: WithdrawalAction,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_superuser),
) -> Any:
    """
    Admin: Approve or reject an expert withdrawal request.
    - approve → status COMPLETED (admin has transferred money manually)
    - reject  → status REJECTED_PAYOUT, credits refunded back to expert
    """
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(PaymentTransaction).where(
            PaymentTransaction.id == transaction_id,
            PaymentTransaction.type == TransactionType.WITHDRAWAL,
        ).options(selectinload(PaymentTransaction.user).selectinload(User.expert_profile))
    )
    trx = result.scalars().first()
    if not trx:
        raise HTTPException(status_code=404, detail="Withdrawal request not found")
    if trx.status != TransactionStatus.PENDING_PAYOUT:
        raise HTTPException(status_code=400, detail="Request already processed")

    if body.action == "approve":
        if not body.payout_reference:
            raise HTTPException(status_code=400, detail="Payout reference is required for approval")
        trx.status = TransactionStatus.COMPLETED
        trx.admin_note = body.admin_note
        trx.payout_reference = body.payout_reference
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

    # 3. Notify User (Offload to BackgroundTasks to avoid timeout/blocking)
    try:
        from backend.app.models.notification import NotificationPriority, NotificationType
        status_text = "đã được chấp nhận" if body.action == "approve" else "đã bị từ chối"
        background_tasks.add_task(
            create_notification,
            recipient_id=trx.user_id,
            title=f"Yêu cầu rút tiền {status_text}",
            message=f"Yêu cầu rút tiền {trx.amount} Credits của bạn {status_text}. {f'Mã giao dịch: {trx.payout_reference}' if trx.payout_reference and body.action == 'approve' else ''} {f'Ghi chú: {body.admin_note}' if body.admin_note else ''}",
            type=NotificationType.PAYMENT,
            priority=NotificationPriority.HIGH, 
            link="/dashboard/expert/wallet",
            data=f"withdrawal:{trx.id}:{body.action}"
        )
    except Exception as e:
        logger.error(f"Failed to schedule notification for withdrawal {trx.id}: {e}")

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
    if current_user.role.value not in ["EXPERT", "MENTOR"]:
        raise HTTPException(status_code=403, detail="Only experts/mentors can view these stats")

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



# ─── MENTOR (PWYW): Student Support / Donate ────────────────────────────────

@router.post("/bookings/{booking_id}/support-mentor")
async def support_mentor(
    booking_id: int,
    amount: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    PWYW: Học viên gửi tiền ủng hộ Cố vấn sau buổi tư vấn.
    - Booking phải ở trạng thái COMPLETED và là is_pwyw=True.
    - 100% số tiền chuyển cho Mentor (không thu phí platform).
    - Học viên có thể ủng hộ 0 credits.
    """
    from backend.app.domains.booking.models import Booking, BookingStatus
    from backend.app.domains.marketplace.models import ExpertProfile
    from backend.app.domains.payments.models import TransactionType, TransactionStatus

    if amount < 0:
        raise HTTPException(status_code=400, detail="Số tiền ủng hộ không hợp lệ")

    # Load booking
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalars().first()
    if not booking:
        raise HTTPException(status_code=404, detail="Không tìm thấy lịch hẹn")
    if booking.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền thực hiện hành động này")
    if not booking.is_pwyw:
        raise HTTPException(status_code=400, detail="Lịch hẹn này không phải chế độ tùy hỷ")
    if booking.status != BookingStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Chỉ có thể ủng hộ sau khi buổi tư vấn đã hoàn thành")
    if booking.pwyw_amount > 0:
        raise HTTPException(status_code=400, detail="Bạn đã ủng hộ cho lịch hẹn này rồi")

    if amount > 0:
        # Deduct from student with row-level lock
        from sqlalchemy import select as sa_select
        student_result = await db.execute(
            sa_select(User).where(User.id == current_user.id).with_for_update()
        )
        student = student_result.scalars().first()
        if student.credits < amount:
            raise HTTPException(
                status_code=400,
                detail=f"Số dư không đủ. Bạn có {student.credits} credits, cần {amount} credits."
            )
        student.credits -= amount
        db.add(student)

        # Credit 100% to mentor
        expert_result = await db.execute(
            select(ExpertProfile).where(ExpertProfile.id == booking.expert_id)
        )
        expert = expert_result.scalars().first()
        if not expert:
            raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ cố vấn")

        mentor_result = await db.execute(select(User).where(User.id == expert.user_id))
        mentor = mentor_result.scalars().first()
        mentor.credits += amount
        db.add(mentor)

        # Record student's outgoing transaction
        student_trx = PaymentTransaction(
            user_id=current_user.id,
            booking_id=booking_id,
            amount=amount,
            type=TransactionType.SERVICE_PAYMENT,
            status=TransactionStatus.COMPLETED,
            description=f"Ủng hộ Cố vấn #{booking_id} (PWYW)",
        )
        db.add(student_trx)

        # Record mentor's incoming transaction (100%)
        mentor_trx = PaymentTransaction(
            user_id=mentor.id,
            booking_id=booking_id,
            amount=amount,
            type=TransactionType.BOOKING_RELEASE,
            status=TransactionStatus.COMPLETED,
            description=f"Nhận ủng hộ từ học viên cho buổi #{booking_id} (PWYW 100%)",
        )
        db.add(mentor_trx)

    # Mark booking as paid
    booking.pwyw_amount = amount
    db.add(booking)
    await db.commit()

    # Notify mentor
    if amount > 0:
        try:
            await create_notification(
                recipient_id=mentor.id,
                sender_id=current_user.id,
                title="Bạn nhận được ủng hộ mới!",
                message=f"{current_user.full_name or 'Học viên'} đã ủng hộ {amount} credits cho buổi tư vấn #{booking_id}.",
                type=NotificationType.PAYMENT,
                priority=NotificationPriority.HIGH,
                link="/dashboard/expert/wallet"
            )
        except Exception as e:
            logger.warning(f"PWYW notification failed (non-critical): {e}")

    return {
        "success": True,
        "booking_id": booking_id,
        "amount_sent": amount,
        "message": f"Cảm ơn bạn đã ủng hộ {amount} credits cho Cố vấn!" if amount > 0 else "Đã ghi nhận phản hồi của bạn."
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

