export enum UserRole {
    STUDENT = 'STUDENT',
    EXPERT = 'EXPERT',
    MENTOR = 'MENTOR',   // Cố vấn: tư vấn tùy hỷ
    ADMIN = 'ADMIN'
}

export interface User {
    id: number;
    email: string;
    full_name: string;
    avatar_url?: string;
    role: UserRole;
    account_status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
    credits: number;
    is_active: boolean;
    is_superuser?: boolean;
    expert_profile?: {
        id: number;
        kyc_status: 'PENDING' | 'APPROVED' | 'REJECTED';
        bio?: string;
        linkedin_url?: string;
        experience_years?: number;
        hourly_rate?: number;
        tags?: string;
        kyc_documents?: string;
    };
}
