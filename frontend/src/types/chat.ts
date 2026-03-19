import { User } from './user';

export interface Message {
    id: number;
    sender_id: number;
    receiver_id: number;
    content: string;
    is_read: boolean;
    created_at: string;
    sender?: User;
}

export interface MessageCreate {
    receiver_id: number;
    content: string;
}

export interface TypingEvent {
    type: 'typing';
    sender_id: number;
    is_typing: boolean;
}

export interface UnreadCount {
    count: number;
}

export interface ConversationPreview {
    contact: User;
    lastMessage?: Message;
    unreadCount: number;
}
