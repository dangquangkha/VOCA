import { Suspense } from 'react';
import ChatContent from './ChatContent';
import ChatLayoutWrapper from './ChatLayoutWrapper';

// Loading component for Suspense fallback
function ChatLoading() {
    return (
        <div className="flex h-full bg-white items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-8">
                <div className="w-12 h-12 border border-[#0046EA]/20 border-t-[#0046EA] rounded-full animate-spin" />
                <p className="text-[#0F0C17]/40 font-normal uppercase tracking-[0.4em] text-[10px] font-sans">Đang truy vấn tâm giao…</p>
            </div>
        </div>
    );
}

// Main page component - wraps ChatContent with Suspense
export default function ChatPage() {
    return (
        <ChatLayoutWrapper>
            <Suspense fallback={<ChatLoading />}>
                <ChatContent />
            </Suspense>
        </ChatLayoutWrapper>
    );
}
