'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar';

export function NavbarWrapper() {
    const pathname = usePathname();

    // Hide navbar on dashboard and auth routes
    const isDashboard = pathname?.startsWith('/dashboard');
    const isAuth = pathname?.startsWith('/login') || pathname?.startsWith('/register');

    if (isDashboard || isAuth) {
        return null;
    }

    return <Navbar />;
}
