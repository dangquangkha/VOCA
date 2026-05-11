'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Bell, 
    Check, 
    Trash2, 
    Calendar, 
    CreditCard, 
    MessageSquare, 
    Info, 
    Search,
    Filter,
    ChevronRight,
    ExternalLink,
    MoreVertical,
    Clock
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useNotificationStore } from '@/store/useNotificationStore';
import { Notification, NotificationType } from '@/types/notification';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { getAvatarUrl } from '@/utils/url-utils';

type FilterType = 'all' | 'unread' | NotificationType;

export default function NotificationsPage() {
    const { 
        notifications, 
        unreadCount, 
        markAsRead, 
        markAllAsRead, 
        isLoading 
    } = useNotificationStore();
    
    const [filter, setFilter] = useState<FilterType>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    // Memoized filtered notifications
    const filteredNotifications = useMemo(() => {
        return notifications.filter(n => {
            const matchesFilter = 
                filter === 'all' || 
                (filter === 'unread' && !n.is_read) || 
                n.type === filter;
            
            const matchesSearch = 
                n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                n.message.toLowerCase().includes(searchQuery.toLowerCase());
                
            return matchesFilter && matchesSearch;
        });
    }, [notifications, filter, searchQuery]);

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.is_read) {
            await markAsRead(notification.id);
        }
        
        if (notification.link && notification.link !== '#') {
            // Special handling for booking links to ensure they go to the management page
            let targetLink = notification.link;
            if (notification.type === 'booking' || notification.title?.toLowerCase().includes('đặt lịch')) {
                targetLink = '/dashboard/manage/bookings';
                const bookingMatch = notification.link.match(/booking=(\d+)/);
                if (bookingMatch) {
                    targetLink += `?booking=${bookingMatch[1]}`;
                }
            }
            router.push(targetLink);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto space-y-10 pb-20 px-4 md:px-0">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-[6px] border-[#00A4FD]/20 pb-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#F5F8FF] border-[2px] border-[#00A4FD]/20 rounded-0 flex items-center justify-center text-[#00A4FD]">
                                <Bell size={24} strokeWidth={3} />
                            </div>
                            <h1 className="text-4xl md:text-5xl font-serif italic font-black text-black">Trung tâm Thông báo</h1>
                        </div>
                        <p className="text-black/40 font-black tracking-widest uppercase text-[10px]">
                            Quản lý tất cả cập nhật và tương tác trong hành trình của bạn
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {unreadCount > 0 && (
                            <button 
                                onClick={() => markAllAsRead()}
                                className="px-6 py-3 bg-[#00A4FD] hover:bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-0 transition-all flex items-center gap-2 shadow-lg shadow-[#00A4FD]/20"
                            >
                                <Check size={14} strokeWidth={3} />
                                Đánh dấu tất cả đã đọc
                            </button>
                        )}
                        <button className="p-3 text-[var(--color-ivory-30)] hover:text-[var(--color-ivory)] transition-colors">
                            <MoreVertical size={20} />
                        </button>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
                    <div className="flex items-center gap-2 p-2 bg-[#F5F8FF] border-[6px] border-[#00A4FD]/10 rounded-0 overflow-x-auto no-scrollbar max-w-full">
                        {[
                            { id: 'all', label: 'Tất cả', icon: Bell },
                            { id: 'unread', label: 'Chưa đọc', icon: Info },
                            { id: 'booking', label: 'Lịch hẹn', icon: Calendar },
                            { id: 'payment', label: 'Tài chính', icon: CreditCard },
                            { id: 'system', label: 'Hệ thống', icon: Info }
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setFilter(t.id as FilterType)}
                                className={`px-6 py-2.5 rounded-0 text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${
                                    filter === t.id 
                                    ? 'bg-[#00A4FD] text-white shadow-lg shadow-[#00A4FD]/10' 
                                    : 'text-black/40 hover:text-black'
                                }`}
                            >
                                <t.icon size={12} strokeWidth={3} />
                                {t.label}
                                {t.id === 'unread' && unreadCount > 0 && (
                                    <span className="ml-1 w-5 h-5 bg-red-600 text-white rounded-0 flex items-center justify-center text-[9px] font-black">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full lg:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 group-focus-within:text-[#00A4FD] transition-colors" size={18} strokeWidth={3} />
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm thông báo..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border-[6px] border-[#00A4FD]/20 pl-12 pr-6 py-3.5 rounded-0 text-sm text-black outline-none focus:border-[#00A4FD] transition-all placeholder:text-black/20 font-bold"
                        />
                    </div>
                </div>

                {/* Notifications List */}
                <div className="space-y-4 min-h-[400px]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-40 gap-6">
                            <div className="w-12 h-12 border-2 border-[var(--color-gold-dim)] border-t-[var(--color-gold)] rounded-full animate-spin" />
                            <p className="text-[10px] text-[var(--color-gold)] uppercase tracking-[0.5em] font-sans">Đang truy xuất dữ liệu...</p>
                        </div>
                    ) : filteredNotifications.length > 0 ? (
                        <motion.div 
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="space-y-4"
                        >
                            {filteredNotifications.map((notification) => (
                                <motion.div 
                                    key={notification.id}
                                    variants={itemVariants}
                                    layout
                                    className={`group relative bg-white border-[6px] border-[#00A4FD]/10 hover:border-[#00A4FD] rounded-0 overflow-hidden transition-all duration-500 cursor-pointer ${
                                        !notification.is_read ? 'bg-[#F5F8FF]' : ''
                                    }`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    {/* Unread Indicator */}
                                    {!notification.is_read && (
                                        <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#00A4FD]" />
                                    )}

                                    <div className="p-6 md:p-8 flex gap-6 md:gap-8 items-start">
                                        {/* Icon/Avatar Container */}
                                        <div className="relative shrink-0">
                                            <div className={`w-16 h-16 border-[2px] flex items-center justify-center transition-all duration-700 ${
                                                !notification.is_read 
                                                ? 'bg-white border-[#00A4FD] text-[#00A4FD] shadow-[4px_4px_0_rgba(0,164,253,0.1)]' 
                                                : 'bg-white border-black/10 text-black/30'
                                            }`}>
                                                {notification.sender?.avatar_url ? (
                                                    <img 
                                                        src={getAvatarUrl(notification.sender?.avatar_url, notification.sender?.full_name)} 
                                                        alt={notification.sender?.full_name}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = getAvatarUrl(null, notification.sender?.full_name);
                                                        }}
                                                    />
                                                ) : (
                                                    getIcon(notification.type)
                                                )}
                                            </div>
                                            {notification.priority === 'high' && (
                                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-4 border-[var(--color-navy-mid)] animate-pulse" />
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 space-y-3">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                                <h3 className={`text-xl tracking-tight transition-colors uppercase ${
                                                    !notification.is_read 
                                                    ? 'text-black font-black' 
                                                    : 'text-black/40 font-bold'
                                                }`}>
                                                    {notification.title}
                                                </h3>
                                                <div className="flex items-center gap-3 text-black/30 font-sans">
                                                    <Clock size={12} strokeWidth={3} />
                                                    <span className="text-[11px] font-black uppercase tracking-widest">
                                                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: vi })}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <p className={`text-[15px] font-bold leading-relaxed max-w-3xl ${
                                                !notification.is_read ? 'text-black/80' : 'text-black/40'
                                            }`}>
                                                {notification.message}
                                            </p>

                                            <div className="flex items-center justify-between pt-2">
                                                <div className="flex items-center gap-4">
                                                    {notification.link && (
                                                        <span className="text-[10px] font-black text-[#00A4FD] uppercase tracking-[0.3em] flex items-center gap-2 group-hover:gap-4 transition-all duration-500">
                                                            Chi tiết hành động <ChevronRight size={12} strokeWidth={3} />
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button className="p-2 text-[var(--color-ivory-20)] hover:text-red-400 transition-colors">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <div className="py-40 flex flex-col items-center justify-center text-center px-10 border-[6px] border-[#00A4FD]/10 rounded-0 bg-[#F5F8FF]">
                            <div className="w-24 h-24 bg-white border-[2px] border-[#00A4FD]/20 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-700">
                                <Bell className="text-[#00A4FD]/20" size={40} strokeWidth={1} />
                            </div>
                            <h2 className="font-serif text-3xl text-black font-black italic mb-4 uppercase tracking-tight">Mọi thứ đều yên tĩnh</h2>
                            <p className="text-[11px] text-black/40 font-black max-w-md mx-auto leading-relaxed uppercase tracking-[0.3em]">
                                Hiện tại không có thông báo nào phù hợp với tiêu chí của bạn. Hãy tận hưởng giây phút tĩnh lặng này.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

function getIcon(type: string) {
    switch (type) {
        case 'booking': return <Calendar size={28} strokeWidth={1.5} />;
        case 'payment': return <CreditCard size={28} strokeWidth={1.5} />;
        case 'chat': return <MessageSquare size={28} strokeWidth={1.5} />;
        case 'marketing': return <ExternalLink size={28} strokeWidth={1.5} />;
        default: return <Info size={28} strokeWidth={1.5} />;
    }
}
