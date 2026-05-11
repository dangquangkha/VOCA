import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationBell } from '../NotificationBell';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useAuthStore } from '@/store/useAuthStore';

// Mock stores
vi.mock('@/store/useNotificationStore', () => ({
    useNotificationStore: vi.fn()
}));

vi.mock('@/store/useAuthStore', () => ({
    useAuthStore: vi.fn()
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn()
    })
}));

const mockNotifications = [
    {
        id: 1,
        title: 'Khiếu nại mới',
        message: 'User A đã khiếu nại',
        type: 'admin_alert',
        priority: 'high',
        is_read: false,
        created_at: new Date().toISOString(),
        link: '/dashboard/admin/disputes',
        data: JSON.stringify({ user_id: 123 })
    }
];

describe('NotificationBell', () => {
    it('renders admin alert with quick actions', () => {
        (useNotificationStore as any).mockReturnValue({
            notifications: mockNotifications,
            unreadCount: 1,
            fetchNotifications: vi.fn(),
            fetchUnreadCount: vi.fn(),
            connectWebSocket: vi.fn(),
            disconnectWebSocket: vi.fn(),
            markAsRead: vi.fn(),
        });
        (useAuthStore as any).mockReturnValue({ token: 'test-token' });

        render(<NotificationBell />);
        
        // Open bell
        // The button has lucide Bell icon, we can find it by its container or icon
        const bellButton = screen.getByRole('button');
        fireEvent.click(bellButton);

        // Check for quick action buttons
        expect(screen.getByText('Chat với User')).toBeDefined();
        expect(screen.getByText('Xử lý ngay')).toBeDefined();
        
        // Check for title and message
        expect(screen.getByText('Khiếu nại mới')).toBeDefined();
        expect(screen.getByText('User A đã khiếu nại')).toBeDefined();
    });
});
