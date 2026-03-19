'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart3,
    CalendarDays,
    ClipboardList,
    Wallet,
    ShieldAlert,
    Settings,
    ChevronDown,
    Menu,
    X,
    LogOut,
    Power,
    Home,
    Wand2,
    Tag
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
            flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
            ${active
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'}
        `}>
            <div className={`${active ? 'text-white' : 'group-hover:text-blue-600'}`}>
                {icon}
            </div>
            {!collapsed && (
                <span className="font-semibold text-sm whitespace-nowrap">{label}</span>
            )}
            {active && !collapsed && (
                <motion.div
                    layoutId="activeSideExpert"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
                />
            )}
        </div>
    </Link>
);

export default function ExpertDashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuthStore();
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isOnline, setIsOnline] = useState(true);

    const menuItems = [
        { href: '/dashboard/expert', icon: <BarChart3 size={22} />, label: 'Tổng quan' },
        { href: '/dashboard/expert/availability', icon: <CalendarDays size={22} />, label: 'Quản lý Lịch rảnh' },
        { href: '/dashboard/manage/bookings', icon: <ClipboardList size={22} />, label: 'Danh sách Lịch hẹn' },
        { href: '/dashboard/expert/wallet', icon: <Wallet size={22} />, label: 'Ví & Doanh thu' },
        { href: '/dashboard/dispute', icon: <ShieldAlert size={22} />, label: 'Trung tâm Khiếu nại' },
        { href: '/expert/kyc/form', icon: <Settings size={22} />, label: 'Hồ sơ & KYC' },
    ];

    const platformItems = [
        { href: '/', icon: <Home size={22} />, label: 'Trang chủ' },
        { href: '/ai-tools', icon: <Wand2 size={22} />, label: 'Công cụ AI' },
        { href: '/pricing', icon: <Tag size={22} />, label: 'Bảng giá' },
    ];

    return (
        <div className="flex h-screen bg-[#F8FAFC]">
            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: isCollapsed ? 80 : 280 }}
                className="bg-[#0F172A] flex flex-col z-50 sticky top-0 h-full text-slate-300"
            >
                <div className="p-6 flex items-center justify-between overflow-hidden">
                    {!isCollapsed && (
                        <Link href="/" className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xl">C</div>
                                <span className="font-bold text-xl text-white tracking-tight">CareerPath</span>
                            </div>
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded self-start border border-blue-500/20">FOR EXPERTS</span>
                        </Link>
                    )}
                    {isCollapsed && (
                        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold mx-auto">C</div>
                    )}
                </div>

                <nav className="flex-1 px-4 space-y-1 mt-8 overflow-y-auto custom-scrollbar">
                    <div className="mb-4">
                        {!isCollapsed && <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Chuyên gia</p>}
                        {menuItems.map((item) => (
                            <SidebarItem
                                key={item.href}
                                {...item}
                                active={pathname === item.href}
                                collapsed={isCollapsed}
                            />
                        ))}
                    </div>

                    <div className="mb-4">
                        {!isCollapsed && <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Hệ thống</p>}
                        {platformItems.map((item) => (
                            <SidebarItem
                                key={item.href}
                                {...item}
                                active={pathname === item.href}
                                collapsed={isCollapsed}
                            />
                        ))}
                    </div>
                </nav>

                <div className="p-4 border-t border-slate-800/50">
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all w-full"
                    >
                        <LogOut size={22} />
                        {!isCollapsed && <span className="font-semibold text-sm">Đăng xuất</span>}
                    </button>
                </div>

                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-20 bg-white border border-slate-200 text-slate-400 p-1 rounded-full shadow-sm hover:text-blue-600 z-50 md:flex hidden"
                >
                    {isCollapsed ? <X size={14} className="rotate-45" /> : <Menu size={14} />}
                </button>
            </motion.aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Topbar */}
                <header className="h-16 bg-white border-b border-slate-100 px-8 flex items-center justify-between sticky top-0 z-40 shadow-sm">
                    <div className="flex flex-col">
                        <h2 className="text-slate-900 font-bold text-md">Chào Chuyên gia {user?.full_name?.split(' ')[0]}, chúc một ngày làm việc hiệu quả! 🚀</h2>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Activity Toggle */}
                        <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100 scale-90 origin-right">
                            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`}></div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">{isOnline ? 'Online' : 'Offline'}</span>
                            <button
                                onClick={() => setIsOnline(!isOnline)}
                                className={`w-8 h-4 rounded-full relative transition-colors duration-200 ${isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`}
                            >
                                <motion.div
                                    animate={{ x: isOnline ? 16 : 2 }}
                                    className="absolute top-0.5 left-0 w-3 h-3 bg-white rounded-full shadow-sm"
                                />
                            </button>
                        </div>

                        {/* Notifications */}
                        <NotificationBell />

                        <div className="h-8 w-px bg-slate-100 mx-2"></div>

                        {/* User Profile Dropdown */}
                        <div className="relative group" data-user-menu>
                            <button
                                className="flex items-center gap-3 p-1 pr-3 rounded-full hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group"
                            >
                                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white shadow-md">
                                    {user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex flex-col items-start text-left">
                                    <span className="text-xs font-black text-slate-900 leading-none">{user?.full_name?.split(' ')[0]}</span>
                                    <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-0.5">Expert</span>
                                </div>
                                <ChevronDown size={14} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                            </button>

                            {/* Dropdown Menu */}
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                <div className="px-4 py-2 border-b border-slate-50 mb-2">
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Đăng nhập với</p>
                                    <p className="text-xs font-bold text-slate-900 truncate">{user?.email}</p>
                                </div>
                                <Link href="/dashboard/profile" className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                                    👤 Hồ sơ cá nhân
                                </Link>
                                <Link href="/expert/kyc/form" className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                                    🛡️ Xác thực KYC
                                </Link>
                                <button
                                    onClick={logout}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors mt-1 border-t border-slate-50 pt-3"
                                >
                                    🚪 Đăng xuất
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {children}
                </main>
            </div>
        </div>
    );
}
