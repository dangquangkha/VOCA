export enum TransactionType {
    DEPOSIT = "DEPOSIT",
    WITHDRAWAL = "WITHDRAWAL",
    BOOKING_HOLD = "BOOKING_HOLD",
    BOOKING_RELEASE = "BOOKING_RELEASE",
    BOOKING_REFUND = "BOOKING_REFUND",
    SERVICE_PAYMENT = "SERVICE_PAYMENT",
    REFUND_REQUEST = "REFUND_REQUEST",   // UC-36
}

export enum TransactionStatus {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    REFUNDED = "REFUNDED",              // UC-36: bank transfer done
    PENDING_PAYOUT = "PENDING_PAYOUT",  // UC-19: awaiting admin payout
    REJECTED_PAYOUT = "REJECTED_PAYOUT", // UC-19: admin rejected
}

export interface PaymentTransaction {
    id: number;
    amount: number;
    type: TransactionType;
    status: TransactionStatus;
    created_at: string;
    description?: string;
    bank_name?: string;
    bank_account?: string;
    bank_holder_name?: string;
    admin_note?: string;
    payout_reference?: string;
    user?: {
        id: number;
        email: string;
        full_name?: string;
        credits: number;
        expert_profile?: {
            id: number;
            kyc_status: string;
        };
    };
}

export interface PaymentCreate {
    amount: number;
}

export interface PaymentDepositResponse {
    transaction_id: number;
    qr_url: string;
    amount_vnd: number;
    content: string;
}

export interface PaginatedPaymentResponse {
    items: PaymentTransaction[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

// UC-36
export interface RefundRequestCreate {
    amount: number;
    bank_name: string;
    bank_account: string;
    account_holder: string;
}

// UC-19: Expert Withdrawal
export interface WithdrawalCreate {
    amount: number;
}

export interface WithdrawalRequest extends PaymentTransaction {
    user_id: number;
}

export interface ExpertStats {
    available: number;
    escrow: number;
    monthly_total: number;
    trend: number;
}
