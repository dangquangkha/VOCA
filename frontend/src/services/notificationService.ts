import api from '@/lib/api';
import { Notification, UnreadCount } from '@/types/notification';

export const notificationService = {
    /**
     * Get paginated notifications for current user
     */
    getNotifications: async (skip = 0, limit = 50): Promise<Notification[]> => {
        const response = await api.get('notifications/', {
            params: { skip, limit }
        });
        return response.data;
    },

    /**
     * Get unread notifications count
     */
    getUnreadCount: async (): Promise<UnreadCount> => {
        const response = await api.get('notifications/unread-count');
        return response.data;
    },

    /**
     * Mark a specific notification as read
     */
    markAsRead: async (notificationId: number): Promise<Notification> => {
        const response = await api.put(`notifications/${notificationId}/read`);
        return response.data;
    },

    /**
     * Mark all notifications as read
     */
    markAllAsRead: async (): Promise<{ status: string }> => {
        const response = await api.post('notifications/read-all');
        return response.data;
    }
};
