import api from '@/lib/api';

export interface CVAnalysis {
    id: number;
    cv_file_url: string;
    job_description: string;
    score: number;
    analysis_result: {
        summary: string;
        skills_match: string[];
        missing_skills: string[];
        suggestions: string;
    };
    created_at: string;
}

export const aiService = {
    /**
     * Get CV analysis history for the current user
     */
    getMyCvAnalysis: async (): Promise<CVAnalysis[]> => {
        const response = await api.get('ai/cv-analysis/me');
        return response.data;
    },

    /**
     * Analyze a new CV
     */
    analyzeCv: async (file: File, jobDescription: string): Promise<CVAnalysis> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('job_description', jobDescription);
        const response = await api.post('ai/cv-analyze', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }
};
