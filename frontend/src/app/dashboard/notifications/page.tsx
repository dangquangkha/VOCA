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
    ChevronRight,
    ExternalLink,
    MoreVertical,
    Clock
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ExpertDashboardLayout from '@/components/dashboard/ExpertDashboardLayout';
import { useAuthStore } from '@/store/useAuthStore';
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
    
    const { user } = useAuthStore();
    const isExpert = user?.role === 'EXPERT' || user?.role === 'MENTOR';
    const Layout = isExpert ? ExpertDashboardLayout : DashboardLayout;
    
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
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <Layout>
            <div className="max-w-6xl mx-auto space-y-12 pb-24">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b-[2px] border-black/10 pb-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 text-[#00A4FD]">
                            <Bell size={20} strokeWidth={1.5} />
                            <span className="text-[10px] font-black uppercase tracking-[0.5em]">
                                Notification Hub
                            </span>
                        </div>
                        <h1 className="font-serif text-5xl text-black italic font-bold">
                            Trung tâm Thông báo
                        </h1>
                        <p className="text-black/40 text-xs font-black uppercase tracking-widest leading-relaxed">
                            QUẢN LÝ TẤT CẢ CẬP NHẬT VÀ TƯƠNG TÁC TRONG HÀNH TRÌNH CỦA BẠN
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        {unreadCount > 0 && (
                            <button 
                                onClick={() => markAllAsRead()}
                                className="px-6 py-4 bg-[#0046EA] hover:bg-black text-[#FFE900] text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 border border-[#0046EA] cursor-pointer shadow-lg shadow-[#0046EA]/10 hover:shadow-xl"
                            >
                                <Check size={14} strokeWidth={2.5} />
                                Đánh dấu tất cả đã đọc
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
                    <div className="flex items-center gap-2 p-1.5 bg-[#F5F8FF] border border-[#00A4FD]/15 overflow-x-auto no-scrollbar max-w-full">
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
                                className={`px-5 py-3 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap duration-300 cursor-pointer ${
                                    filter === t.id 
                                    ? 'bg-[#00A4FD] text-white shadow-md shadow-[#00A4FD]/15' 
                                    : 'text-black/50 hover:text-black hover:bg-white/60'
                                }`}
                            >
                                <t.icon size={12} strokeWidth={2.5} />
                                {t.label}
                                {t.id === 'unread' && unreadCount > 0 && (
                                    <span className="ml-1 w-5 h-5 bg-[#D20048] text-white flex items-center justify-center text-[9px] font-black">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full lg:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 group-focus-within:text-[#00A4FD] transition-colors" size={16} strokeWidth={2} />
                        <input 
                            type="text" 
                            placeholder="TÌM KIẾM THÔNG BÁO..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#F5F8FF] border-[2px] border-[#00A4FD]/20 pl-12 pr-6 py-3.5 text-xs text-black outline-none focus:border-[#0046EA] focus:bg-white transition-all placeholder:text-black/30 tracking-widest"
                        />
                    </div>
                </div>

                {/* Notifications List */}
                <div className="space-y-6 min-h-[400px]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-40 gap-6">
                            <div className="w-12 h-12 border-2 border-black/5 border-t-[#0046EA] rounded-full animate-spin" />
                            <p className="text-[10px] text-black/40 uppercase tracking-[0.5em] font-sans">Đang truy xuất dữ liệu...</p>
                        </div>
                    ) : filteredNotifications.length > 0 ? (
                        <motion.div 
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="space-y-6"
                        >
                            {filteredNotifications.map((notification) => {
                                const isUnread = !notification.is_read;
                                return (
                                    <motion.div 
                                        key={notification.id}
                                        variants={itemVariants}
                                        layout
                                        className={`group relative bg-white border-[6px] border-[#00A4FD]/20 hover:border-[#00A4FD] p-6 md:p-8 flex gap-6 md:gap-8 items-start transition-all duration-500 hover:shadow-xl hover:-translate-y-1 cursor-pointer ${
                                            isUnread ? 'bg-[#F5F8FF]/30 border-[#0046EA]/35 hover:border-[#0046EA]' : ''
                                        }`}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        {/* Icon/Avatar Container */}
                                        <div className="relative shrink-0">
                                            <div className={`w-14 h-14 overflow-hidden flex items-center justify-center transition-all duration-500 border-[2px] border-[#00A4FD]/20 bg-white ${
                                                isUnread 
                                                ? 'text-[#0046EA] shadow-md' 
                                                : 'text-black/30'
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
                                                    getIcon(notification.type, isUnread)
                                                )}
                                            </div>
                                            {notification.priority === 'high' && (
                                                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 border-2 border-white animate-pulse" />
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 space-y-2 min-w-0">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                                <h3 className={`text-base tracking-tight transition-colors uppercase truncate ${
                                                    isUnread 
                                                    ? 'text-black font-black' 
                                                    : 'text-black/40 font-bold'
                                                }`}>
                                                    {notification.title}
                                                </h3>
                                                <div className="flex items-center gap-2 text-black/30 shrink-0">
                                                    <Clock size={12} strokeWidth={2.5} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: vi })}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <p className={`text-sm leading-relaxed max-w-4xl ${
                                                isUnread ? 'text-black/70 font-medium' : 'text-black/40'
                                            }`}>
                                                {notification.message}
                                            </p>

                                            {notification.link && (
                                                <div className="flex items-center justify-between pt-2">
                                                    <span className="text-[9px] font-black text-[#00A4FD] uppercase tracking-[0.3em] flex items-center gap-2 group-hover:translate-x-2 transition-all duration-300">
                                                        Chi tiết hành động <ChevronRight size={12} strokeWidth={2.5} />
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    ) : (
                        <div className="py-24 flex flex-col items-center justify-center text-center px-10 border-[6px] border-[#00A4FD]/20 bg-[#F5F8FF]">
                            <div className="w-20 h-20 bg-white border border-[#00A4FD]/10 flex items-center justify-center mb-8 shadow-sm">
                                <Bell className="text-[#00A4FD]/20" size={32} strokeWidth={1.5} />
                            </div>
                            <h2 className="font-serif text-2xl text-black font-black italic mb-3 uppercase tracking-tight">Mọi thứ đều yên tĩnh</h2>
                            <p className="text-[10px] text-black/40 font-black max-w-md mx-auto leading-relaxed uppercase tracking-[0.2em]">
                                Hiện tại không có thông báo nào phù hợp với tiêu chí của bạn. Hãy tận hưởng giây phút tĩnh lặng này.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}

function getIcon(type: string, isUnread: boolean) {
    const size = 20;
    const colorClass = isUnread ? "text-[#0046EA]" : "text-black/30";
    switch (type) {
        case 'booking': return <Calendar size={size} className={colorClass} strokeWidth={1.8} />;
        case 'payment': return <CreditCard size={size} className={colorClass} strokeWidth={1.8} />;
        case 'chat': return <MessageSquare size={size} className={colorClass} strokeWidth={1.8} />;
        case 'marketing': return <ExternalLink size={size} className={colorClass} strokeWidth={1.8} />;
        default: return <Info size={size} className={colorClass} strokeWidth={1.8} />;
    }
}
