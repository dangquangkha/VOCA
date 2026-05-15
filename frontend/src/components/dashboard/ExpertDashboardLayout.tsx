'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart3,
    CalendarDays,
    ClipboardList,
    Wallet,
    ShieldAlert,
    Settings,
    LogOut,
    Home,
    Wand2,
    Tag,
    ChevronDown,
    MessageSquare
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { getAvatarUrl } from '@/utils/url-utils';

interface SidebarItemProps {
    href: string;
    icon: React.ReactNode;
    label: string;
    active: boolean;
    collapsed: boolean;
}

const SidebarItem = ({ href, icon, label, active, collapsed }: SidebarItemProps) => (
    <Link href={href} className={`nav-item ${active ? 'active' : ''}`}
        style={{ justifyContent: collapsed ? 'center' : undefined }}>
        <span style={{ flexShrink: 0 }}>
            {React.cloneElement(icon as React.ReactElement<any>, {
                size: 18,
                strokeWidth: active ? 2 : 1.5,
            })}
        </span>
        {!collapsed && <span>{label}</span>}
    </Link>
);

export default function ExpertDashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, logout, _hasHydrated } = useAuthStore();
    const connectionStatus = useNotificationStore(state => state.connectionStatus);
    const router = useRouter();
    const pathname = usePathname();

    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const [showCreditsDetail, setShowCreditsDetail] = useState(false);

    useEffect(() => {
        if (!_hasHydrated) return;

        if (!user) {
            router.push('/login');
        } else if (user.role !== 'EXPERT' && user.role !== 'MENTOR') {
            router.push('/dashboard/student');
        }
    }, [user, router, _hasHydrated]);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const menuItems = [
        { href: '/dashboard/expert',               icon: <BarChart3 />,     label: 'Tổng quan' },
        { href: '/dashboard/expert/availability',  icon: <CalendarDays />,  label: 'Lịch rảnh' },
        { href: '/dashboard/manage/bookings',      icon: <ClipboardList />, label: 'Lịch hẹn' },
        { href: '/dashboard/expert/wallet',        icon: <Wallet />,        label: 'Ví & Doanh thu' },
        { href: '/dashboard/chat',                 icon: <MessageSquare />, label: 'Tin nhắn' },
        { href: '/dashboard/dispute',              icon: <ShieldAlert />,   label: 'Khiếu nại' },
        { href: '/dashboard/expert/quizzes',       icon: <ClipboardList />, label: 'Khảo sát' },
        { href: '/expert/kyc/form',                icon: <Settings />,      label: 'Hồ sơ & KYC' },
    ];

    const platformItems = [
        { href: '/',          icon: <Home />,  label: 'Trang chủ' },
        { href: '/ai-tools',  icon: <Wand2 />, label: 'Công cụ AI' },
        { href: '/pricing',   icon: <Tag />,   label: 'Bảng giá' },
    ];

    const sidebarWidth = isCollapsed ? 72 : 300;

    return (
        <div className="flex h-screen bg-white font-dm-sans overflow-hidden" style={{ fontFamily: 'var(--sans)' }}>
            {/* ── Sidebar ── */}
            <motion.aside
                initial={false}
                animate={{ width: sidebarWidth }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                style={{
                    background: '#00A4FD',
                    display: 'flex',
                    flexDirection: 'column',
                    flexShrink: 0,
                    zIndex: 60,
                    borderRight: '1px solid rgba(255,255,255,0.15)',
                    overflow: 'hidden',
                    position: 'relative',
                }}
            >
                {/* Logo */}
                <div style={{
                    padding: isCollapsed ? '28px 0' : '32px 28px 24px',
                    borderBottom: '1px solid rgba(255,255,255,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'space-between',
                }}>
                    {!isCollapsed ? (
                        <Link href="/" style={{ textDecoration: 'none' }}>
                            <div>
                                <span style={{ fontSize: 20, fontWeight: 600, color: '#FFFFFF', letterSpacing: '0.15em', textTransform: 'uppercase', display: 'block' }}>
                                    VOCA
                                </span>
                                <span style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.4em', textTransform: 'uppercase', display: 'block', marginTop: 4 }}>
                                    Expert Portal
                                </span>
                            </div>
                        </Link>
                    ) : (
                        <span style={{ fontSize: 16, fontWeight: 600, color: '#FFFFFF', letterSpacing: '0.1em' }}>E</span>
                    )}
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, overflowY: 'auto', padding: '20px 0' }} className="custom-scrollbar">
                    {!isCollapsed && (
                        <div style={{ padding: '0 28px 12px', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.4em', textTransform: 'uppercase' }}>
                            Operations
                        </div>
                    )}
                    {menuItems.map((item) => (
                        <SidebarItem key={item.href} {...item}
                            active={pathname === item.href || pathname?.startsWith(item.href + '/')}
                            collapsed={isCollapsed}
                        />
                    ))}

                    <div style={{ margin: '20px 0 12px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 20 }}>
                        {!isCollapsed && (
                            <div style={{ padding: '0 28px 12px', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.4em', textTransform: 'uppercase' }}>
                                Platform
                            </div>
                        )}
                        {platformItems.map((item) => (
                            <SidebarItem key={item.href} {...item}
                                active={pathname === item.href}
                                collapsed={isCollapsed}
                            />
                        ))}
                    </div>
                </nav>

                {/* Logout */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', padding: '16px 0' }}>
                    <button
                        onClick={handleLogout}
                        className="nav-item"
                        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', justifyContent: isCollapsed ? 'center' : undefined }}
                    >
                        <LogOut size={18} strokeWidth={1.5} />
                        {!isCollapsed && <span>Đăng xuất</span>}
                    </button>
                </div>

                {/* Collapse toggle */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    style={{
                        position: 'absolute',
                        top: 36,
                        right: -12,
                        width: 24,
                        height: 24,
                        background: '#00A4FD',
                        border: '1px solid rgba(255,255,255,0.3)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 70,
                        fontSize: 10,
                    }}
                >
                    {isCollapsed ? '›' : '‹'}
                </button>
            </motion.aside>

            {/* ── Main Content ── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#FFFFFF' }}>
                {/* Topbar */}
                <header style={{
                    height: 64,
                    background: '#29B6F6',
                    borderBottom: 'none',
                    padding: '0 32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    position: 'sticky',
                    top: 0,
                    zIndex: 50,
                    flexShrink: 0,
                }}>
                    {/* Left */}
                    <div>
                        <span style={{ fontSize: 8, fontWeight: 500, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.4em', textTransform: 'uppercase', display: 'block' }}>
                            EXPERT PORTAL
                        </span>
                        <span style={{ fontSize: 16, fontWeight: 300, color: '#FFFFFF', letterSpacing: '0.05em', display: 'block', marginTop: 3 }}>
                            {user?.full_name}
                        </span>
                    </div>

                    {/* Right */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                        {/* Online status toggle */}
                        <button
                            onClick={() => setIsOnline(!isOnline)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '6px 16px',
                                background: 'rgba(255,255,255,0.2)',
                                border: '1px solid rgba(255,255,255,0.4)',
                                color: '#FFFFFF',
                                cursor: 'pointer',
                                fontSize: 9,
                                fontWeight: 500,
                                letterSpacing: '0.25em',
                                textTransform: 'uppercase',
                            }}
                        >
                            <span style={{
                                width: 8, height: 8,
                                background: isOnline ? '#FFFFFF' : 'rgba(255,255,255,0.3)',
                                display: 'block',
                                flexShrink: 0,
                            }} />
                            {isOnline ? 'Active' : 'Offline'}
                        </button>
                        <div style={{ 
                            width: 6, height: 6, borderRadius: '50%',
                            background: connectionStatus === 'connected' ? '#4ADE80' : '#EF4444',
                            opacity: 0.8
                        }} title={`WS Status: ${connectionStatus}`} />

                        {/* Notifications */}
                        <div style={{ color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <button 
                                onClick={() => {
                                    const store = (window as any).useNotificationStore;
                                    if (store) {
                                        store.getState().addNotification({
                                            id: Date.now(),
                                            title: "Test UI Notification",
                                            message: "This confirms the dashboard UI can display notifications.",
                                            type: 'system',
                                            priority: 'low',
                                            created_at: new Date().toISOString(),
                                            is_read: false
                                        });
                                    } else {
                                        alert("Store not found in window");
                                    }
                                }}
                                style={{ fontSize: 9, textTransform: 'uppercase', opacity: 0.5, background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
                            >
                                Test
                            </button>
                            <NotificationBell />
                        </div>

                        {/* Divider */}
                        <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.3)' }} />

                        {/* Avatar + name */}
                        <Link href="/dashboard/profile" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#FFFFFF', letterSpacing: '0.1em' }}>
                                    {user?.full_name?.split(' ').slice(-1)[0]}
                                </span>
                                <span style={{ display: 'block', fontSize: 8, fontWeight: 400, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.25em', textTransform: 'uppercase', marginTop: 2 }}>
                                    {user?.role === 'MENTOR' ? 'Mentor' : 'Expert'}
                                </span>
                            </div>
                            <div className="avatar-glow" style={{ width: 36, height: 36, flexShrink: 0 }}>
                                <Image
                                    src={getAvatarUrl(user?.avatar_url, user?.full_name)}
                                    alt={user?.full_name || ''}
                                    width={36}
                                    height={36}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = getAvatarUrl(null, user?.full_name);
                                    }}
                                />
                            </div>
                        </Link>
                    </div>
                </header>

                {/* Content */}
                <main style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '32px',
                    background: '#FFFFFF',
                    color: '#171716',
                }} className="custom-scrollbar">
                    <div style={{ maxWidth: 1600, margin: '0 auto', minHeight: '100%', paddingBottom: 64 }}>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
