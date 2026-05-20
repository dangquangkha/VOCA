import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FloatingContactMenu } from '../ContactSupport';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

// Mock Next.js router
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

// Mock Auth Store
jest.mock('@/store/useAuthStore', () => ({
    useAuthStore: jest.fn(),
}));

describe('FloatingContactMenu', () => {
    const mockPush = jest.fn();

    beforeEach(() => {
        (useRouter as jest.fn()).mockReturnValue({
            push: mockPush,
        });
        (useAuthStore as unknown as jest.Mock).mockReturnValue({
            user: null,
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('renders the toggle button', () => {
        render(<FloatingContactMenu />);
        expect(screen.getByLabelText(/Mở menu liên hệ/i)).toBeInTheDocument();
    });

    it('opens the menu when clicked', () => {
        render(<FloatingContactMenu />);
        const toggleButton = screen.getByLabelText(/Mở menu liên hệ/i);
        fireEvent.click(toggleButton);
        
        expect(screen.getByLabelText(/Chat với Admin/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Chat qua Facebook Messenger/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Chat qua Zalo/i)).toBeInTheDocument();
    });

    it('redirects to login when "Chat với Admin" is clicked and user is not logged in', () => {
        render(<FloatingContactMenu />);
        fireEvent.click(screen.getByLabelText(/Mở menu liên hệ/i));
        
        const adminButton = screen.getByLabelText(/Chat với Admin/i);
        fireEvent.click(adminButton);
        
        expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/login?redirect=/dashboard/chat?with=2'));
    });

    it('redirects to chat directly when user is logged in', () => {
        (useAuthStore as unknown as jest.Mock).mockReturnValue({
            user: { id: 1, full_name: 'Test User' },
        });

        render(<FloatingContactMenu />);
        fireEvent.click(screen.getByLabelText(/Mở menu liên hệ/i));
        
        const adminButton = screen.getByLabelText(/Chat với Admin/i);
        fireEvent.click(adminButton);
        
        expect(mockPush).toHaveBeenCalledWith('/dashboard/chat?with=2');
    });
});
