import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdminDashboardPage from '@/app/dashboard/admin/page';
import { adminService } from '@/services/adminService';
import { useAuthStore } from '@/store/useAuthStore';

// Mock services and stores
vi.mock('@/services/adminService', () => ({
    adminService: {
        getStats: vi.fn()
    }
}));

vi.mock('@/store/useAuthStore', () => ({
    useAuthStore: vi.fn()
}));

// Mock Next.js Link and icons
vi.mock('next/link', () => ({
    default: ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    )
}));

const mockStats = {
    total_users: 100,
    total_experts: 20,
    total_bookings: 50,
    total_revenue: 5000000,
    pending_withdrawals: 5,
    pending_refunds: 2,
    open_disputes: 1,
    open_support_tickets: 3,
    pending_experts: 4
};

describe('AdminDashboardPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders dynamic action counts correctly from backend stats', async () => {
        (adminService.getStats as any).mockResolvedValue(mockStats);
        (useAuthStore as any).mockReturnValue({ token: 'test-token' });

        render(<AdminDashboardPage />);

        // Check if dynamic counts are rendered in the "Action Required" section
        // We use findByText because the component fetches data in useEffect
        expect(await screen.findByText('5')).toBeDefined(); // Withdrawals
        expect(await screen.findByText('1')).toBeDefined(); // Disputes
        expect(await screen.findByText('2')).toBeDefined(); // Refunds
        expect(await screen.findByText('3')).toBeDefined(); // Support Tickets
        expect(await screen.findByText('4')).toBeDefined(); // Pending Experts
        
        // Verify titles are present
        expect(screen.getByText('Withdrawal Claims Pending')).toBeDefined();
        expect(screen.getByText('Disputes Awaiting Action')).toBeDefined();
        expect(screen.getByText('Open Support Tickets')).toBeDefined();
    });
});
