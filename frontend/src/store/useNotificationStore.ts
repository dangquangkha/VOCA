import { create } from 'zustand';
import { Notification } from '@/types/notification';
import { notificationService } from '@/services/notificationService';
import { useAuthStore } from '@/store/useAuthStore';

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    socket: WebSocket | null;

    // Actions
    fetchNotifications: () => Promise<void>;
    fetchUnreadCount: () => Promise<void>;
    markAsRead: (id: number) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    addNotification: (notification: Notification) => void;

    // WebSocket
    connectWebSocket: (token: string) => void;
    disconnectWebSocket: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    socket: null,

    fetchNotifications: async () => {
        const { token } = useAuthStore.getState();
        if (!token) return;

        set({ isLoading: true });
        try {
            const data = await notificationService.getNotifications();
            set({ notifications: data, isLoading: false });
        } catch (error) {
            console.error('Failed to fetch notifications', error);
            set({ isLoading: false });
        }
    },

    fetchUnreadCount: async () => {
        const { token } = useAuthStore.getState();
        if (!token) return;

        try {
            const { count } = await notificationService.getUnreadCount();
            set({ unreadCount: count });
        } catch (error) {
            console.error('Failed to fetch unread count', error);
        }
    },

    markAsRead: async (id: number) => {
        try {
            await notificationService.markAsRead(id);
            set((state) => ({
                notifications: state.notifications.map((n) =>
                    n.id === id ? { ...n, is_read: true } : n
                ),
                unreadCount: Math.max(0, state.unreadCount - 1),
            }));
        } catch (error) {
            console.error('Failed to mark notification as read', error);
        }
    },

    markAllAsRead: async () => {
        try {
            await notificationService.markAllAsRead();
            set((state) => ({
                notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
                unreadCount: 0,
            }));
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
    },

    addNotification: (notification: Notification) => {
        set((state) => ({
            notifications: [notification, ...state.notifications],
            unreadCount: state.unreadCount + 1,
        }));

        // Optional: Play sound or show toast
        if (notification.priority === 'high') {
            // Logic for high priority alerts could go here
        }
    },

    connectWebSocket: (token: string) => {
        const { socket } = get();
        if (socket?.readyState === WebSocket.OPEN || socket?.readyState === WebSocket.CONNECTING) return;

        // Cleanup existing socket if any stale one exists
        if (socket) socket.close();

        // Determine WS protocol and host
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

        // Use a more robust way to derive the WS host from NEXT_PUBLIC_API_URL
        let host = window.location.host;
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001/api/v1';
            const urlObj = new URL(apiUrl);
            // If API is on a different domain, use that. If it's localhost/127.0.0.1, 
            // maybe use window.location.host to match browser context
            host = urlObj.host;

            if (host.includes('127.0.0.1') && window.location.hostname === 'localhost') {
                host = host.replace('127.0.0.1', 'localhost');
            }
        } catch (e) {
            console.error('❌ [NotificationStore] Invalid NEXT_PUBLIC_API_URL', e);
        }

        const wsUrl = `${protocol}//${host}/api/v1/notifications/ws?token=${encodeURIComponent(token)}`;
        console.log(`🔌 [NotificationStore] Connecting: ${protocol}//${host}/api/v1/notifications/ws (Encoded Token)`);

        const newSocket = new WebSocket(wsUrl);

        newSocket.onopen = () => {
            console.log('✅ [NotificationStore] WebSocket Connected');
        };

        newSocket.onmessage = (event) => {
            try {
                const notification = JSON.parse(event.data);
                get().addNotification(notification);
            } catch (error) {
                console.error('❌ [NotificationStore] Error parsing message', error);
            }
        };

        newSocket.onclose = (event) => {
            set({ socket: null });
            console.log(`📡 [NotificationStore] WebSocket closed (code: ${event.code}). Retrying in 5s...`);

            // Adaptive retry logic
            setTimeout(() => {
                const currentToken = useAuthStore.getState().token;
                if (currentToken) {
                    get().connectWebSocket(currentToken);
                }
            }, 5000);
        };

        newSocket.onerror = (error) => {
            console.warn('⚠️ [NotificationStore] WebSocket Connection Attempt Failed. Common causes: Backend down, Invalid token (JWT expired), or Port mismatch.');
            console.debug('Error Details:', error);
        };

        set({ socket: newSocket });
    },

    disconnectWebSocket: () => {
        const { socket } = get();
        if (socket) {
            socket.close();
            set({ socket: null });
        }
    }
}));
