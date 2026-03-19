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
    requirements?: Record<string, any>;
}

export interface DailyProgress {
    id: number;
    user_id: number;
    day_number: number;
    status: DayStatus;
    content_data?: Record<string, any>;
    completed_at?: string;
}

export interface DailyProgressUpdate {
    content_data: Record<string, any>;
}
