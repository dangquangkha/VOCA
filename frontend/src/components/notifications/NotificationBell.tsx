'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Bell, Check, ExternalLink, MessageSquare, Calendar, CreditCard, Info, ShieldCheck, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Notification } from '@/types/notification';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export const NotificationBell: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const {
        notifications,
        unreadCount,
        fetchNotifications,
        fetchUnreadCount,
        connectWebSocket,
        disconnectWebSocket,
        markAsRead,
        markAllAsRead,
        connectionStatus
    } = useNotificationStore();

    const { token, _hasHydrated } = useAuthStore();

    useEffect(() => {
        if (!_hasHydrated || !token) return;

        fetchNotifications();
        fetchUnreadCount();
        connectWebSocket(token);

        return () => disconnectWebSocket();
    }, [_hasHydrated, token, fetchNotifications, fetchUnreadCount, connectWebSocket, disconnectWebSocket]);

    // Re-fetch on connection recovery
    useEffect(() => {
        if (connectionStatus === 'connected') {
            fetchNotifications();
            fetchUnreadCount();
        }
    }, [connectionStatus, fetchNotifications, fetchUnreadCount]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.is_read) markAsRead(notification.id);
        setIsOpen(false);

        // Resolve link
        let link = notification.link;
        // Force booking notifications to management page even if link is old or missing
        if (notification.type === 'booking' || notification.title?.toLowerCase().includes('đặt lịch')) {
            link = '/dashboard/manage/bookings';
            // If the original link has a booking ID, try to preserve it
            const bookingMatch = notification.link?.match(/booking=(\d+)/);
            if (bookingMatch) {
                link += `?booking=${bookingMatch[1]}`;
            }
        }

        if (link && link !== '#') {
            router.push(link);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative w-12 h-12 flex items-center justify-center transition-all duration-300 active:scale-95 border-[2px] ${
                    isOpen 
                    ? 'bg-black border-black text-white' 
                    : 'bg-white border-[#00A4FD]/20 text-[#00A4FD] hover:border-[#00A4FD] hover:bg-[#F5F8FF]'
                } ${connectionStatus === 'error' ? 'ring-2 ring-red-500' : ''}`}
                title={`Connection: ${connectionStatus}`}
            >
                <Bell size={24} strokeWidth={2.5} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-6 min-w-[24px] items-center justify-center bg-red-600 px-1 text-[11px] font-black text-white border-[2px] border-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        className="absolute right-0 mt-4 w-80 md:w-96 bg-white shadow-2xl border-[6px] border-[#00A4FD] overflow-hidden z-50 flex flex-col rounded-0"
                    >
                        {/* Header */}
                        <div className="px-6 py-5 flex items-center justify-between border-b-[2px] border-[#00A4FD]/10 bg-[#F5F8FF]">
                            <div>
                                <h3 className="font-black text-black text-lg uppercase tracking-tight">Thông báo</h3>
                                <p className="text-[9px] font-black text-[#00A4FD]/60 uppercase tracking-[0.2em]">
                                    Trung tâm điều phối hệ thống
                                </p>
                            </div>
                            {unreadCount > 0 && (
                                <button
                                    onClick={() => markAllAsRead()}
                                    className="text-[10px] font-black text-[#00A4FD] hover:bg-[#00A4FD] hover:text-white border-[2px] border-[#00A4FD] px-3 py-1.5 transition-all uppercase tracking-widest"
                                >
                                    Đã đọc hết
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="max-h-[450px] overflow-y-auto custom-scrollbar bg-white">
                            {notifications.length > 0 ? (
                                notifications.map((notification, index) => (
                                    <NotificationItem
                                        key={`${notification.id}-${index}`}
                                        notification={notification}
                                        onClick={() => handleNotificationClick(notification)}
                                    />
                                ))
                            ) : (
                                <div className="py-24 flex flex-col items-center justify-center text-center px-6">
                                    <div className="w-20 h-20 bg-[#F5F8FF] border-[2px] border-[#00A4FD]/20 flex items-center justify-center mb-6">
                                        <Bell className="text-[#00A4FD]/30" size={32} strokeWidth={1} />
                                    </div>
                                    <h4 className="font-black text-black uppercase tracking-widest mb-2">Không có tín hiệu</h4>
                                    <p className="text-[11px] font-bold text-black/40 uppercase tracking-widest">Hệ thống đang ở trạng thái chờ.</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t-[2px] border-[#00A4FD]/10 bg-white">
                            <Link
                                href="/dashboard/notifications"
                                className="w-full py-3 text-center block text-[10px] font-black text-[#00A4FD]/60 hover:text-[#00A4FD] hover:bg-[#F5F8FF] transition-all uppercase tracking-[0.3em] border-[2px] border-transparent hover:border-[#00A4FD]/20"
                                onClick={() => setIsOpen(false)}
                            >
                                Xem nhật ký thông báo
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const NotificationItem: React.FC<{ notification: Notification; onClick: () => void }> = ({ notification, onClick }) => {
    return (
        <div
            onClick={onClick}
            className={`flex gap-5 p-6 hover:bg-[#F5F8FF] transition-all border-b-[2px] border-[#00A4FD]/5 last:border-0 relative group cursor-pointer ${!notification.is_read ? 'bg-[#00A4FD]/5' : ''}`}
        >
            {!notification.is_read && (
                <div className="absolute left-0 top-0 bottom-0 w-[6px] bg-[#00A4FD] shadow-[4px_0_15px_rgba(0,164,253,0.3)]" />
            )}

            <div className={`w-14 h-14 border-[2px] flex items-center justify-center shrink-0 transition-all duration-500 ${
                notification.is_read ? 'bg-white border-[#00A4FD]/10' : 'bg-white border-[#00A4FD] shadow-[4px_4px_0px_rgba(0,164,253,0.1)]'
            }`}>
                {getIcon(notification.type)}
            </div>

            <div className="flex-1 space-y-2 pr-2">
                <div className="flex items-start justify-between gap-4">
                    <h4 className={`text-sm tracking-tight leading-tight line-clamp-1 uppercase ${notification.is_read ? 'font-black text-black/40' : 'font-black text-black'}`}>
                        {notification.title}
                    </h4>
                    <span className="text-[9px] font-black text-[#00A4FD]/40 whitespace-nowrap uppercase tracking-widest">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: vi })}
                    </span>
                </div>
                <p className={`text-[12px] leading-relaxed line-clamp-2 ${notification.is_read ? 'font-bold text-black/30' : 'font-bold text-black/70'}`}>
                    {notification.message}
                </p>
                
                {notification.type === 'admin_alert' && (
                    <div className="flex gap-3 pt-3">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                const data = notification.data ? JSON.parse(notification.data) : {};
                                window.location.href = `/dashboard/chat?user=${data.user_id || notification.sender_id || ''}`;
                            }}
                            className="px-4 py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#00A4FD] transition-all"
                        >
                            Phản hồi
                        </button>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                if (notification.link) window.location.href = notification.link;
                            }}
                            className="px-4 py-2 border-[2px] border-black text-black text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all"
                        >
                            Xử lý
                        </button>
                    </div>
                )}

                <div className="pt-2 flex items-center gap-2 text-[9px] font-black text-[#00A4FD] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    Xem chi tiết <ArrowRight size={10} strokeWidth={3} />
                </div>
            </div>

            {notification.priority === 'high' && (
                <div className="absolute top-4 right-6">
                    <div className="w-2 h-2 bg-red-600 animate-pulse" />
                </div>
            )}
        </div>
    );
};

function getIcon(type: string) {
    switch (type) {
        case 'booking': return <Calendar className="text-[#00A4FD]" size={24} strokeWidth={2.5} />;
        case 'payment': return <CreditCard className="text-black" size={24} strokeWidth={2.5} />;
        case 'chat': return <MessageSquare className="text-[#00A4FD]" size={24} strokeWidth={2.5} />;
        case 'admin_alert': return <ShieldCheck className="text-red-600" size={24} strokeWidth={2.5} />;
        default: return <Info className="text-black/40" size={24} strokeWidth={2.5} />;
    }
}
