'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

export default function DashboardRedirectPage() {
    const { user } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (!user) {
            router.replace('/login');
            return;
        }

        if (user.role === 'EXPERT' || user.role === 'MENTOR') {
            router.replace('/dashboard/expert');
        } else {
            router.replace('/dashboard/student');
        }
    }, [user, router]);

    return (
        <div className="flex bg-white items-center justify-center min-h-screen">
            <div className="w-8 h-8 border border-[#0046EA]/20 border-t-[#0046EA] rounded-full animate-spin" />
        </div>
    );
}
