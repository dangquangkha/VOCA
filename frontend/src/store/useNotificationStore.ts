import { create } from 'zustand';
import { Notification } from '@/types/notification';
import { notificationService } from '@/services/notificationService';
import { useAuthStore } from '@/store/useAuthStore';

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    socket: WebSocket | null;
    connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';

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
    connectionStatus: 'disconnected',

    fetchNotifications: async () => {
        const { token } = useAuthStore.getState();
        if (!token) return;

        set({ isLoading: true });
        try {
            const data = await notificationService.getNotifications();
            set({ notifications: data, isLoading: false });
        } catch (error: any) {
            if (error.response?.status !== 401) {
                console.error('Failed to fetch notifications', error);
            }
            set({ isLoading: false });
        }
    },

    fetchUnreadCount: async () => {
        const { token } = useAuthStore.getState();
        if (!token) return;

        try {
            const { count } = await notificationService.getUnreadCount();
            set({ unreadCount: count });
        } catch (error: any) {
            if (error.response?.status !== 401) {
                console.error('Failed to fetch unread count', error);
            }
        }
    },

    markAsRead: async (id: number) => {
        // Handle test notifications (ID > 2000000000) locally only
        if (id > 2000000000) {
            set((state) => ({
                notifications: state.notifications.map((n) =>
                    n.id === id ? { ...n, is_read: true } : n
                ),
                unreadCount: Math.max(0, state.unreadCount - 1),
            }));
            return;
        }

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
    },

    connectWebSocket: (token: string) => {
        const { socket } = get();
        if (socket?.readyState === WebSocket.OPEN || socket?.readyState === WebSocket.CONNECTING) return;

        if (socket) socket.close();

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        let host = window.location.host;
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001/api/v1';
            const urlObj = new URL(apiUrl);
            host = urlObj.host;
            if (host.includes('127.0.0.1') && window.location.hostname === 'localhost') {
                host = host.replace('127.0.0.1', 'localhost');
            }
        } catch (e) {
            console.error('❌ [NotificationStore] Invalid NEXT_PUBLIC_API_URL', e);
        }

        const wsUrl = `${protocol}//${host}/api/v1/notifications/ws?token=${encodeURIComponent(token)}`;
        console.log(`🔌 [NotificationStore] Connecting to ${wsUrl}`);

        const newSocket = new WebSocket(wsUrl);
        set({ socket: newSocket, connectionStatus: 'connecting' });

        newSocket.onopen = () => {
            console.log('✅ [NotificationStore] WebSocket Connected');
            set({ connectionStatus: 'connected' });
        };

        newSocket.onmessage = (event) => {
            try {
                const notification = JSON.parse(event.data);
                get().addNotification(notification);
            } catch (error) {
                console.error('❌ [NotificationStore] Error parsing message', error);
            }
        };

        // Start fallback polling if not already started
        let isPolling = false;
        const pollInterval = setInterval(async () => {
            if (get().connectionStatus !== 'connected' && !isPolling) {
                isPolling = true;
                try {
                    await get().fetchUnreadCount();
                } finally {
                    isPolling = false;
                }
            }
        }, 10000);

        newSocket.onclose = (event) => {
            clearInterval(pollInterval);
            console.log(`📡 [NotificationStore] WebSocket closed (code: ${event.code})`);
            set({ socket: null, connectionStatus: 'disconnected' });

            // Retry after 5s
            setTimeout(() => {
                const currentToken = useAuthStore.getState().token;
                if (currentToken) {
                    get().connectWebSocket(currentToken);
                }
            }, 5000);
        };

        newSocket.onerror = (error) => {
            console.warn('⚠️ [NotificationStore] WebSocket Connection Attempt Failed.');
            set({ connectionStatus: 'error' });
        };
    },

    disconnectWebSocket: () => {
        const { socket } = get();
        if (socket) {
            socket.close();
            set({ socket: null, connectionStatus: 'disconnected' });
        }
    }
}));

if (typeof window !== 'undefined') {
    (window as any).useNotificationStore = useNotificationStore;
}
