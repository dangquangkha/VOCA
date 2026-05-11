export enum DayStatus {
    LOCKED = "LOCKED",
    UNLOCKED = "UNLOCKED",
    COMPLETED = "COMPLETED",
    SKIPPED = "SKIPPED"
}

export interface DayContent {
    day_number: number;
    topic: string;
    interaction_type: string;
    prompt: string;
    requirements?: Record<string, unknown>;
}

export interface DailyProgress {
    id: number;
    user_id: number;
    day_number: number;
    status: DayStatus;
    content_data?: Record<string, unknown>;
    completed_at?: string;
    reward_earned?: number;
}

export interface DailyProgressUpdate {
    content_data: Record<string, unknown>;
}

export interface RoadmapHistory {
    id: number;
    user_id: number;
    snapshot_data: Record<string, any>;
    is_premium: boolean;
    created_at: string;
}
