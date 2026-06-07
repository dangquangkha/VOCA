import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FloatingContactMenu } from '../ContactSupport';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

// Mock Next.js router
vi.mock('next/navigation', () => ({
    useRouter: vi.fn(),
}));

// Mock Auth Store
vi.mock('@/store/useAuthStore', () => ({
    useAuthStore: vi.fn(),
}));

describe('FloatingContactMenu', () => {
    const mockPush = vi.fn();

    beforeEach(() => {
        // @ts-ignore
        vi.mocked(useRouter).mockReturnValue({
            push: mockPush,
        });
        // @ts-ignore
        vi.mocked(useAuthStore).mockReturnValue({
            user: null,
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
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
        // @ts-ignore
        vi.mocked(useAuthStore).mockReturnValue({
            user: { id: 1, full_name: 'Test User' },
        });

        render(<FloatingContactMenu />);
        fireEvent.click(screen.getByLabelText(/Mở menu liên hệ/i));
        
        const adminButton = screen.getByLabelText(/Chat với Admin/i);
        fireEvent.click(adminButton);
        
        expect(mockPush).toHaveBeenCalledWith('/dashboard/chat?with=2');
    });
});
