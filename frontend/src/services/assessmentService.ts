import api from '@/lib/api';

export interface UserAssessmentResult {
    id: number;
    assessment_id: number;
    result_code: string;
    scores: Record<string, number>;
    created_at: string;
    assessment: {
        title: string;
        code: string;
    };
}

export const assessmentService = {
    /**
     * Get current user's assessment results
     */
    getMyResults: async (): Promise<UserAssessmentResult[]> => {
        const response = await api.get('assessments/me/results');
        return response.data;
    }
};
