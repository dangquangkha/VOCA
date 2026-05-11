import api from '@/lib/api';
import { ExpertStats, WithdrawalRequest } from '@/types/payment';
import { Expert } from '@/types/expert';

export const expertService = {
    /**
     * Get financial statistics for the expert dashboard
     */
    getFinancialStats: async (): Promise<ExpertStats> => {
        const response = await api.get('payments/expert/stats');
        return response.data;
    },

    /**
     * Get current user's expert profile
     */
    getProfile: async (): Promise<Expert> => {
        const response = await api.get('experts/me');
        return response.data;
    },

    /**
     * Create a withdrawal request
     */
    createWithdrawal: async (amount: number): Promise<WithdrawalRequest> => {
        const response = await api.post('payments/withdrawal-request', { amount });
        return response.data;
    }
};
