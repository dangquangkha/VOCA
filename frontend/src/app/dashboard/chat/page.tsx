import { Suspense } from 'react';
import ChatContent from './ChatContent';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

// Loading component for Suspense fallback
function ChatLoading() {
    return (
        <div className="flex h-full bg-[#FAF7F2] items-center justify-center">
            <div className="flex flex-col items-center gap-8">
                <div className="w-12 h-12 border border-[#C9A84C]/20 border-t-[#C9A84C] rounded-full animate-spin" />
                <p className="text-[#0A1018]/40 font-normal uppercase tracking-[0.4em] text-[10px] font-sans">Đang truy vấn tâm giao…</p>
            </div>
        </div>
    );
}

// Main page component - wraps ChatContent with Suspense
export default function ChatPage() {
    return (
        <Suspense fallback={<ChatLoading />}>
            <ChatContent />
        </Suspense>
    );
}
