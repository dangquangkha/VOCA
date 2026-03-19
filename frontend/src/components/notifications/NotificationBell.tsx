'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Bell, Check, ExternalLink, MessageSquare, Calendar, CreditCard, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Notification } from '@/types/notification';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import Link from 'next/link';

export const NotificationBell: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const {
        notifications,
        unreadCount,
        fetchNotifications,
        fetchUnreadCount,
        connectWebSocket,
        disconnectWebSocket,
        markAsRead,
        markAllAsRead
    } = useNotificationStore();

    const { token } = useAuthStore();

    useEffect(() => {
        fetchNotifications();
        fetchUnreadCount();

        // Connect WS if token exists
        if (token) {
            connectWebSocket(token);
        }

        return () => disconnectWebSocket();
    }, [token, fetchNotifications, fetchUnreadCount, connectWebSocket, disconnectWebSocket]);

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

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-300 active:scale-95"
            >
                <Bell size={24} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50 py-2"
                    >
                        {/* Header */}
                        <div className="px-5 py-4 flex items-center justify-between border-b border-slate-50">
                            <div>
                                <h3 className="font-black text-slate-900">Thông báo</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Cập nhật mới nhất từ hệ thống
                                </p>
                            </div>
                            {unreadCount > 0 && (
                                <button
                                    onClick={() => markAllAsRead()}
                                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                                >
                                    <Check size={12} />
                                    Đánh dấu đã đọc
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                            {notifications.length > 0 ? (
                                notifications.map((notification) => (
                                    <NotificationItem
                                        key={notification.id}
                                        notification={notification}
                                        onRead={() => {
                                            if (!notification.is_read) markAsRead(notification.id);
                                            setIsOpen(false);
                                        }}
                                    />
                                ))
                            ) : (
                                <div className="py-20 flex flex-col items-center justify-center text-center px-4">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                        <Bell className="text-slate-300" size={28} />
                                    </div>
                                    <h4 className="font-bold text-slate-900 mb-1">Chưa có thông báo</h4>
                                    <p className="text-sm text-slate-400">Chúng tôi sẽ báo cho bạn khi có tin mới.</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-3 border-t border-slate-50 bg-slate-50/50">
                            <Link
                                href="/dashboard/notifications"
                                className="w-full py-2 text-center block text-[12px] font-bold text-slate-500 hover:text-blue-600 transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                Xem tất cả thông báo
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const NotificationItem: React.FC<{ notification: Notification; onRead: () => void }> = ({ notification, onRead }) => {
    return (
        <Link
            href={notification.link || '#'}
            onClick={onRead}
            className={`flex gap-4 p-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 relative group ${!notification.is_read ? 'bg-blue-50/30' : ''}`}
        >
            {!notification.is_read && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-blue-600 rounded-r-full" />
            )}

            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${notification.is_read ? 'bg-slate-100' : 'bg-white'
                }`}>
                {getIcon(notification.type)}
            </div>

            <div className="flex-1 space-y-1 pr-4">
                <div className="flex items-center justify-between gap-2">
                    <h4 className={`text-sm tracking-tight line-clamp-1 ${notification.is_read ? 'font-semibold text-slate-600' : 'font-black text-slate-900'}`}>
                        {notification.title}
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: vi })}
                    </span>
                </div>
                <p className="text-[12px] text-slate-500 line-clamp-2 leading-relaxed">
                    {notification.message}
                </p>
                {notification.link && (
                    <div className="pt-1 flex items-center gap-1 text-[10px] font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        Xem chi tiết <ExternalLink size={10} />
                    </div>
                )}
            </div>

            {notification.priority === 'high' && (
                <div className="absolute top-2 right-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                </div>
            )}
        </Link>
    );
};

function getIcon(type: string) {
    switch (type) {
        case 'booking': return <Calendar className="text-blue-500" size={20} />;
        case 'payment': return <CreditCard className="text-emerald-500" size={20} />;
        case 'chat': return <MessageSquare className="text-purple-500" size={20} />;
        default: return <Info className="text-slate-400" size={20} />;
    }
}
