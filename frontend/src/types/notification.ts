export type NotificationType = 'booking' | 'payment' | 'chat' | 'system' | 'marketing' | 'admin_alert';
export type NotificationPriority = 'high' | 'low';

export interface Notification {
    id: number;
    recipient_id: number;
    sender_id?: number;
    title: string;
    message: string;
    type: NotificationType;
    priority: NotificationPriority;
    is_read: boolean;
    created_at: string;
    link?: string;
    data?: string;
    sender?: {
        id: number;
        full_name: string;
        avatar_url?: string;
    };
}

export interface UnreadCount {
    count: number;
}
