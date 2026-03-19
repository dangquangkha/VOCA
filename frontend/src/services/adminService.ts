import api from '@/lib/api';
import { Expert } from '@/types/expert';

export interface AdminStats {
    total_users: number;
    total_experts: number;
    total_bookings: number;
    total_revenue: number;
}

export interface EmailLog {
    id: number;
    to_email: string;
    subject: string;
    body: string;
    sent_at: string;
}

export const adminService = {
    getStats: async (): Promise<AdminStats> => {
        const response = await api.get('admin/stats');
        return response.data;
    },

    getExperts: async (status?: string): Promise<Expert[]> => {
        const url = status ? `admin/experts?status=${status}` : 'admin/experts';
        const response = await api.get(url);
        return response.data;
    },

    approveExpert: async (expertId: number): Promise<Expert> => {
        const response = await api.put(`admin/experts/${expertId}/approve`);
        return response.data;
    },

    rejectExpert: async (expertId: number): Promise<Expert> => {
        const response = await api.put(`admin/experts/${expertId}/reject`);
        return response.data;
    },

    updateKYC: async (expertId: number, status: 'APPROVED' | 'REJECTED'): Promise<Expert | null> => {
        if (status === 'APPROVED') return adminService.approveExpert(expertId);
        if (status === 'REJECTED') return adminService.rejectExpert(expertId);
        return null;
    },

    getEmailLogs: async (): Promise<EmailLog[]> => {
        const response = await api.get('admin/emails');
        return response.data;
    }
};
