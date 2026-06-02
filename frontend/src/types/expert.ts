export interface ExpertAvailability {
    id: number;
    expert_id: number;
    day_of_week: number; // 0-6
    start_time: string; // HH:MM
    end_time: string; // HH:MM
    max_participants?: number;
}

export interface ExpertUser {
    id: number;
    email: string;
    full_name: string;
    avatar_url?: string;
    role?: string;   // MENTOR | EXPERT | STUDENT
}

export interface Review {
    id: number;
    booking_id: number;
    student_id: number;
    expert_id: number;
    rating: number;
    comment?: string;
    created_at: string;
    student_full_name: string;
    student_avatar_url?: string;
}

export interface Expert {
    id: number;
    user_id: number;
    bio?: string;
    linkedin_url?: string;
    experience_years: number;
    hourly_rate: number;
    tags?: string;
    rating: number;
    total_reviews: number;
    kyc_status: string;
    bank_name?: string;
    bank_account?: string;
    bank_holder_name?: string;
    qr_code_url?: string;           // MENTOR: QR code for direct bank transfer
    user?: ExpertUser;
    availabilities: ExpertAvailability[];
    reviews: Review[];
}

export interface ExpertSearchFilters {
    q?: string;
    tag?: string;
    min_price?: number;
    max_price?: number;
    min_rating?: number;
}
