import api from '@/lib/api';
import { ExpertStats } from '@/types/payment';
import { Expert } from '@/types/expert';

export const expertService = {
    /**
     * Get financial statistics for the expert dashboard
     */
    getFinancialStats: async (): Promise<ExpertStats> => {
        console.log("expertService: Calling hardcoded absolute URL");
        const response = await api.get('http://127.0.0.1:8000/api/v1/payments/expert/stats');
        console.log("expertService: Response received:", response.status);
        return response.data;
    },

    /**
     * Get current user's expert profile
     */
    getProfile: async (): Promise<Expert> => {
        const response = await api.get('/experts/me');
        return response.data;
    },

    /**
     * Create a withdrawal request
     */
    createWithdrawal: async (amount: number): Promise<any> => {
        const response = await api.post('payments/withdrawal-request', { amount });
        return response.data;
    }
};
