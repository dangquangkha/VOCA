'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Compass,
    Users,
    Bot,
    Calendar,
    Wallet,
    ShieldAlert,
    ChevronDown,
    Menu,
    X,
    LogOut
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { NotificationBell } from '@/components/notifications/NotificationBell';

interface SidebarItemProps {
    href: string;
    icon: React.ReactNode;
    label: string;
    active: boolean;
    collapsed: boolean;
}

const SidebarItem = ({ href, icon, label, active, collapsed }: SidebarItemProps) => (
    <Link href={href}>
        <div className={`
            flex items-center gap-5 px-8 py-5 transition-all duration-700 group
            ${active
                ? 'bg-[#0D1B2A] text-[#F5F0E8] shadow-2xl'
                : 'text-[#0D1B2A]/50 hover:bg-white/50 hover:text-[#0D1B2A]'}
        `}>
            <div className={`transition-colors duration-700 ${active ? 'text-[#C9A84C]' : 'group-hover:text-[#C9A84C]'}`}>
                {React.cloneElement(icon as React.ReactElement<any>, { size: 20, strokeWidth: 1.25 })}
            </div>
            {!collapsed && (
                <span className="font-dm-sans font-medium text-[12px] tracking-[0.2em] uppercase whitespace-nowrap">{label}</span>
            )}
            {active && !collapsed && (
                <motion.div
                    layoutId="activeSide"
                    className="ml-auto w-[1.5px] h-5 bg-[#C9A84C]"
                />
            )}
        </div>
    </Link>
);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuthStore();
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [showCreditsDetail, setShowCreditsDetail] = useState(false);

    const menuItems = [
        { href: '/dashboard', icon: <LayoutDashboard />, label: 'Tổng quan' },
        { href: '/dashboard/roadmap', icon: <Compass />, label: 'Hành trình' },
        { href: '/dashboard/experts', icon: <Users />, label: 'Chuyên gia' },
        { href: '/dashboard/ai-assistant', icon: <Bot />, label: 'Trợ lý AI' },
        { href: '/dashboard/manage/bookings', icon: <Calendar />, label: 'Lịch trình' },
        { href: '/dashboard/wallet', icon: <Wallet />, label: 'Ví di sản' },
        { href: '/dashboard/dispute', icon: <ShieldAlert />, label: 'Hỗ trợ' },
    ];

    return (
        <div className="flex h-screen bg-[#F5F0E8] font-dm-sans">
            {/* Sidebar (Luxury Column) */}
            <motion.aside
                initial={false}
                animate={{ width: isCollapsed ? 90 : 320 }}
                className="bg-[#F5F0E8] border-r border-[#C9A84C]/15 flex flex-col z-50 sticky top-0 h-full shadow-[20px_0_40px_rgba(0,0,0,0.02)]"
            >
                <div className="p-10 pb-14 flex items-center justify-between">
                    {!isCollapsed && (
                        <Link href="/" className="flex items-center gap-5 group">
                            <div className="w-12 h-12 border border-[#C9A84C]/30 flex items-center justify-center text-[#C9A84C] group-hover:bg-[#C9A84C] group-hover:text-[#F5F0E8] transition-all duration-700">
                                <span className="font-garamond text-2xl font-normal">V</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-garamond text-3xl text-[#0D1B2A] tracking-[0.1em] font-light lowercase">voca.</span>
                                <span className="font-dm-sans text-[#C9A84C] text-[9px] tracking-[0.6em] uppercase mt-1.5 opacity-70">The Standard</span>
                            </div>
                        </Link>
                    )}
                    {isCollapsed && (
                        <div className="w-12 h-12 border border-[#C9A84C]/30 flex items-center justify-center text-[#C9A84C] mx-auto">
                            <span className="font-garamond text-2xl font-normal">V</span>
                        </div>
                    )}
                    {!isCollapsed && (
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="p-2 focus:outline-none opacity-40 hover:opacity-100 transition-opacity ml-4"
                        >
                            <X size={20} />
                        </button>
                    )}
                    {isCollapsed && (
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="absolute -right-4 top-14 w-8 h-8 bg-[#0D1B2A] text-[#F5F0E8] rounded-full flex items-center justify-center shadow-xl z-[60]"
                        >
                            <Menu size={14} />
                        </button>
                    )}
                </div>

                <nav className="flex-1 space-y-1 mt-6 overflow-y-auto custom-scrollbar">
                    <div className="px-10 py-3 text-[10px] font-bold text-[#C9A84C]/60 uppercase tracking-[0.5em] mb-6">
                        {!isCollapsed ? 'Điều hướng' : ''}
                    </div>
                    {menuItems.map((item) => (
                        <SidebarItem
                            key={item.href}
                            {...item}
                            active={pathname === item.href}
                            collapsed={isCollapsed}
                        />
                    ))}
                </nav>

                <div className="p-6 border-t border-[#C9A84C]/10">
                    <button
                        onClick={logout}
                        className="flex items-center gap-5 px-8 py-5 text-[#0D1B2A]/50 hover:text-[#58181F] transition-all w-full group"
                    >
                        <LogOut size={20} strokeWidth={1.25} />
                        {!isCollapsed && <span className="font-dm-sans font-medium text-[12px] tracking-[0.2em] uppercase">Đăng xuất</span>}
                    </button>
                </div>
            </motion.aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Topbar (Luxury Header) */}
                <header className="h-24 bg-[#F5F0E8]/90 backdrop-blur-2xl border-b border-[#C9A84C]/15 px-12 flex items-center justify-between sticky top-0 z-40">
                    <div className="flex flex-col">
                        <h2 className="text-[#0D1B2A] font-garamond text-2xl italic font-light tracking-wide">
                            Chào mừng, {user?.full_name?.split(' ')[0]}
                        </h2>
                        <p className="text-[#0D1B2A]/60 font-dm-sans text-[10px] font-medium uppercase tracking-[0.4em] mt-2">Đẳng cấp trong từng định hướng</p>
                    </div>

                    <div className="flex items-center gap-10">
                        {/* Credits Widget */}
                        <div
                            className="relative"
                            onMouseEnter={() => setShowCreditsDetail(true)}
                            onMouseLeave={() => setShowCreditsDetail(false)}
                        >
                            <div className="flex items-center gap-3 px-6 py-2 border border-[#C9A84C]/10 cursor-pointer hover:border-[#C9A84C]/30 transition-all duration-700 bg-white/40 backdrop-blur-sm">
                                <Wallet size={14} color="#C9A84C" strokeWidth={1} />
                                <span className="text-[11px] font-medium text-[#0D1B2A] tracking-widest tabular-nums uppercase">{(user?.credits || 0).toLocaleString('vi-VN')} <span className="text-[9px] text-[#C9A84C]">CR</span></span>
                                <ChevronDown size={12} className="text-[#C9A84C] opacity-40" />
                            </div>

                            <AnimatePresence>
                                {showCreditsDetail && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute right-0 mt-2 w-72 bg-[#1A1A2E] border border-[#C9A84C]/10 shadow-2xl p-6 z-50 overflow-hidden"
                                    >
                                        <div className="space-y-6">
                                            <h4 className="text-[9px] font-medium text-[#C9A84C] uppercase tracking-[0.3em]">Cấu trúc tài chính</h4>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center bg-white/5 p-3">
                                                    <span className="text-[10px] text-[#F5F0E8]/60 uppercase tracking-wider font-light">Thực nạp</span>
                                                    <span className="text-xs font-medium text-[#F5F0E8]">500 <span className="text-[9px] text-[#C9A84C]">CR</span></span>
                                                </div>
                                                <div className="flex justify-between items-center bg-white/5 p-3">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-[#F5F0E8]/60 uppercase tracking-wider font-light">Ưu đãi</span>
                                                    </div>
                                                    <span className="text-xs font-medium text-[#F5F0E8]">150 <span className="text-[9px] text-[#C9A84C]">CR</span></span>
                                                </div>
                                            </div>
                                            <Link href="/dashboard/wallet" className="block w-full py-4 bg-[#C9A84C] text-[#0D1B2A] text-[9px] font-medium tracking-[0.4em] uppercase transition-all duration-700 hover:bg-[#F5F0E8] text-center">
                                                Gia tăng Credits
                                            </Link>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Notifications */}
                        <NotificationBell />

                        <div className="h-6 w-[1px] bg-[#C9A84C]/10"></div>

                        {/* User Profile */}
                        <Link href="/dashboard/profile" className="flex items-center gap-4 group">
                            <div className="w-10 h-10 border border-[#C9A84C]/20 p-0.5 group-hover:border-[#C9A84C] transition-all duration-700">
                                <div className="w-full h-full bg-[#0D1B2A] flex items-center justify-center text-[#F5F0E8] text-[10px] font-medium tracking-tighter shadow-sm overflow-hidden">
                                    {user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                            </div>
                        </Link>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                    {children}
                </main>
            </div>
        </div>
    );
}
