import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginPage from './page';
import { useRouter } from 'next/navigation';

// Mock next/navigation
vi.mock('next/navigation', () => ({
    useRouter: vi.fn(),
    usePathname: vi.fn(),
    useSearchParams: vi.fn(() => new URLSearchParams()),
}));

describe('LoginPage Integration', () => {
    const mockPush = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useRouter as any).mockReturnValue({
            push: mockPush,
        });
    });

    it('should render the login form', () => {
        render(<LoginPage />);
        expect(screen.getByLabelText(/Địa chỉ Email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Mật khẩu/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Đăng nhập/i })).toBeInTheDocument();
    });

    it('should show "Authenticating..." when submitting', async () => {
        render(<LoginPage />);

        fireEvent.change(screen.getByLabelText(/Địa chỉ Email/i), { target: { value: 'test@voca.vn' } });
        fireEvent.change(screen.getByLabelText(/Mật khẩu/i), { target: { value: 'password123' } });

        fireEvent.submit(screen.getByRole('button', { name: /Đăng nhập/i }));

        expect(screen.getByText(/Authenticating.../i)).toBeInTheDocument();
    });

    it('should redirect to home page on successful student login', async () => {
        render(<LoginPage />);

        fireEvent.change(screen.getByLabelText(/Địa chỉ Email/i), { target: { value: 'test@voca.vn' } });
        fireEvent.change(screen.getByLabelText(/Mật khẩu/i), { target: { value: 'password123' } });

        fireEvent.submit(screen.getByRole('button', { name: /Đăng nhập/i }));

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/');
        });
    });
});
