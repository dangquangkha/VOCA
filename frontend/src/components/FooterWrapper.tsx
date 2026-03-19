'use client';

import { usePathname } from 'next/navigation';
import { Footer } from './Footer';

export function FooterWrapper() {
    const pathname = usePathname();

    // Hide footer on specific routes
    const isExpertDashboard = pathname === '/dashboard/expert' || pathname?.startsWith('/dashboard/expert/');
    const isChat = pathname === '/dashboard/chat';
    const isAuth = pathname?.startsWith('/login') || pathname?.startsWith('/register');

    if (isExpertDashboard || isChat || isAuth) {
        return null;
    }

    return <Footer />;
}
