import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RegisterPage from './page';
import { useRouter } from 'next/navigation';

// Mock framer-motion
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
        h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
        p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
        button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
    useRouter: vi.fn(),
    usePathname: vi.fn(),
    useSearchParams: vi.fn(() => new URLSearchParams()),
}));

describe('RegisterPage Integration', () => {
    const mockPush = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useRouter as any).mockReturnValue({
            push: mockPush,
        });
    });

    it('should render the registration form', () => {
        render(<RegisterPage />);
        expect(screen.getByPlaceholderText(/Nguyễn Văn A/i)).toBeInTheDocument();
    });

    it('should switch role and update button text', async () => {
        render(<RegisterPage />);

        const expertButton = screen.getByRole('button', { name: /Chuyên gia/i });
        fireEvent.click(expertButton);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /ĐĂNG KÝ CHUYÊN GIA/i })).toBeInTheDocument();
        });
    });

    it('should show error if passwords do not match', async () => {
        render(<RegisterPage />);

        fireEvent.change(screen.getByPlaceholderText(/Nguyễn Văn A/i), { target: { value: 'Test User' } });
        fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), { target: { value: 'test@voca.vn' } });
        fireEvent.change(screen.getByPlaceholderText(/09xx xxx xxx/i), { target: { value: '0987654321' } });

        const passwordInput = screen.getByPlaceholderText(/Tối thiểu 8 ký tự/i);
        const confirmInput = screen.getByPlaceholderText(/Lặp lại mật khẩu/i);

        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.change(confirmInput, { target: { value: 'different123' } });

        fireEvent.submit(screen.getByRole('button', { name: /ĐĂNG KÝ HỌC VIÊN/i }));

        expect(await screen.findByText(/Mật khẩu nhập lại không khớp/i)).toBeInTheDocument();
    });

    it('should redirect to login page on successful registration', async () => {
        render(<RegisterPage />);

        fireEvent.change(screen.getByPlaceholderText(/Nguyễn Văn A/i), { target: { value: 'Test User' } });
        fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), { target: { value: 'test@voca.vn' } });
        fireEvent.change(screen.getByPlaceholderText(/09xx xxx xxx/i), { target: { value: '0987654321' } });

        const passwordInput = screen.getByPlaceholderText(/Tối thiểu 8 ký tự/i);
        const confirmInput = screen.getByPlaceholderText(/Lặp lại mật khẩu/i);

        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.change(confirmInput, { target: { value: 'password123' } });

        fireEvent.submit(screen.getByRole('button', { name: /ĐĂNG KÝ HỌC VIÊN/i }));

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/login');
        });
    });
});
