'use client';

import React from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ExpertDashboardLayout from '@/components/dashboard/ExpertDashboardLayout';

export default function ChatLayoutWrapper({ children }: { children: React.ReactNode }) {
    const { user } = useAuthStore();
    
    const isExpert = user?.role === 'EXPERT' || user?.role === 'MENTOR';
    
    if (isExpert) {
        return <ExpertDashboardLayout>{children}</ExpertDashboardLayout>;
    }
    
    return <DashboardLayout>{children}</DashboardLayout>;
}
