import { Expert } from './expert';
import { User } from './user';

export enum BookingStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    IN_PROGRESS = 'IN_PROGRESS',                        // UC-37: both checked in
    CANCELLED = 'CANCELLED',
    CANCELLED_EXPERT_NO_SHOW = 'CANCELLED_EXPERT_NO_SHOW',  // UC-37
    CANCELLED_USER_NO_SHOW = 'CANCELLED_USER_NO_SHOW',      // UC-37
    CANCELLED_MUTUAL_NO_SHOW = 'CANCELLED_MUTUAL_NO_SHOW',  // UC-37
    COMPLETED = 'COMPLETED',
    REJECTED = 'REJECTED',
    RATED = 'RATED',
    DISPUTED = 'DISPUTED',
    REFUNDED = 'REFUNDED',
}

export interface Booking {
    id: number;
    student_id: number;
    expert_id: number;
    status: BookingStatus;
    total_amount: number;
    start_time: string;
    end_time: string;
    student_note?: string;
    expert_note?: string;
    rejection_reason?: string;          // UC-13
    meeting_url?: string;
    student_checked_in_at?: string;     // UC-37
    expert_checked_in_at?: string;      // UC-37
    created_at: string;
    updated_at: string;

    student?: User;
    expert?: Expert;
}

export interface BookingCreate {
    expert_id: number;
    start_time: string;
    end_time: string;
    student_note?: string;
}

export interface BookingUpdate {
    status?: BookingStatus;
    expert_note?: string;
    meeting_url?: string;
    rejection_reason?: string;  // UC-13
}
