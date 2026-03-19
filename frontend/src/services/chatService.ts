import api from '@/lib/api';
import { Message, MessageCreate, UnreadCount } from '@/types/chat';
import { User } from '@/types/user';

export const chatService = {
    /**
     * Get chat history with another user
     */
    getChatHistory: async (otherUserId: number, limit = 50, skip = 0): Promise<Message[]> => {
        const response = await api.get('chat/', {
            params: { other_user_id: otherUserId, limit, skip }
        });
        return response.data;
    },

    /**
     * Send a new message
     */
    sendMessage: async (data: MessageCreate): Promise<Message> => {
        const response = await api.post('chat/', data);
        return response.data;
    },

    /**
     * Get list of users with conversations
     */
    getConversations: async (): Promise<User[]> => {
        const response = await api.get('chat/conversations');
        return response.data;
    },

    /**
     * Mark all messages from a sender as read
     */
    markAsRead: async (senderId: number): Promise<{ status: string }> => {
        const response = await api.post(`chat/read/${senderId}`);
        return response.data;
    },

    /**
     * Get total unread messages count
     */
    getUnreadCount: async (): Promise<UnreadCount> => {
        const response = await api.get('chat/unread-count');
        return response.data;
    }
};
