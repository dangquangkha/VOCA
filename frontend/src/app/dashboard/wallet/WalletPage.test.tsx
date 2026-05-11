import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WalletPage from './page';
import { useAuthStore } from '@/store/useAuthStore';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/server';

// Mock next/navigation
vi.mock('next/navigation', () => ({
    useRouter: vi.fn(() => ({ push: vi.fn() })),
    usePathname: vi.fn(),
    useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('WalletPage Integration', () => {
    const mockUser = {
        id: 1,
        email: 'test@voca.vn',
        full_name: 'Test User',
        role: 'STUDENT',
        credits: 500,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        useAuthStore.setState({ user: mockUser as any, token: 'mock-token' });
    });

    it('should render the current balance', () => {
        render(<WalletPage />);
        // balance is 500. Using exact match to avoid matching 500.000 VND
        expect(screen.getByText('500')).toBeInTheDocument();
        expect(screen.getAllByText(/Credits/i)[0]).toBeInTheDocument();
    });

    it('should show QR code when starting top-up', async () => {
        const mockQR = 'https://api.sepay.vn/qr/test';
        server.use(
            http.get('*/users/me', () => {
                return HttpResponse.json(mockUser);
            }),
            http.post('*/payments/topup', () => {
                return HttpResponse.json({
                    transaction_id: 'trx_123',
                    qr_url: mockQR,
                    amount_vnd: 20000,
                    content: 'VOCA123',
                });
            })
        );

        render(<WalletPage />);

        // Default value in WalletPage is 10, not 100
        const amountInput = screen.getByDisplayValue('10');
        fireEvent.change(amountInput, { target: { value: '20' } });

        // Check if the VND display updates (optional)
        // expect(screen.getByText(/200.000/)).toBeInTheDocument();

        const topUpButton = screen.getByRole('button', { name: /NẠP QUA QR CODE/i });
        fireEvent.click(topUpButton);

        await waitFor(() => {
            const qrImage = screen.getByAltText(/VietQR Code/i);
            expect(qrImage).toHaveAttribute('src', mockQR);
            expect(screen.getByText(/VOCA123/)).toBeInTheDocument();
        });
    });
});
