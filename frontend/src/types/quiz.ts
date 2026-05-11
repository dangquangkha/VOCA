export interface QuizQuestion {
    id: string;
    type: 'text' | 'radio' | 'checkbox' | 'scale';
    label: string;
    options?: string[];
    required: boolean;
}

export interface ExpertQuiz {
    id: number;
    expert_id: number;
    title: string;
    description?: string;
    questions: QuizQuestion[];
    is_public: boolean;
    is_required_for_booking: boolean;
    is_active: boolean;
    total_attempts: number;
    created_at: string;
}

export interface ExpertQuizPublic extends ExpertQuiz {
    expert_name?: string;
    expert_avatar?: string;
    expert_tags?: string;
}

export interface PublicQuizResponse {
    id: number;
    user_id: number;
    quiz_id: number;
    responses: Record<string, any>;
    created_at: string;
}

export interface QuizSubmission {
    responses: Record<string, any>;
}
