import api from '@/lib/api';
import { PaymentTransaction, PaymentDepositResponse, PaginatedPaymentResponse } from '@/types/payment';

// Local interface removed, imported from types

export const paymentService = {
    topUp: async (amount: number): Promise<PaymentDepositResponse> => {
        const response = await api.post<PaymentDepositResponse>('payments/topup', { amount });
        return response.data;
    },

    getHistory: async (page = 1, pageSize = 10): Promise<PaginatedPaymentResponse> => {
        const response = await api.get('payments/history', {
            params: {
                skip: (page - 1) * pageSize,
                limit: pageSize
            }
        });
        return response.data;
    }
};
