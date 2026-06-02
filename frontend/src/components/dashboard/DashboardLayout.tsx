'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Compass,
    Users,
    Bot,
    Calendar,
    Wallet,
    ShieldAlert,
    Menu,
    X,
    LogOut,
    Lock,
    ChevronDown,
    ShieldCheck,
    LayoutGrid,
    ClipboardList,
    Mail,
    Banknote,
    RotateCcw,
    AlertCircle,
    Home,
    MessageSquare,
    FileText
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
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
    <Link href={href} className={`
        nav-item
        ${active ? 'active' : ''}
        ${collapsed ? 'justify-center px-0 py-5' : ''}
    `}>
        <span className="shrink-0">
            {React.cloneElement(icon as React.ReactElement<any>, {
                size: 18,
                strokeWidth: active ? 2 : 1.5,
            })}
        </span>
        {!collapsed && (
            <span>{label}</span>
        )}
    </Link>
);

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
    const { user, logout, _hasHydrated } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const tabParam = searchParams?.get('tab');

    const isActive = (itemHref: string) => {
        const [path, query] = itemHref.split('?');
        if (query) {
            const params = new URLSearchParams(query);
            const tab = params.get('tab');
            return pathname === path && tabParam === tab;
        }
        if (path === '/dashboard/roadmap' && tabParam) {
            return false;
        }
        return pathname === path || pathname?.startsWith(path + '/');
    };

    const [isCollapsed, setIsCollapsed] = useState(false);
    const [showCreditsDetail, setShowCreditsDetail] = useState(false);

    useEffect(() => {
        // Wait until the store has rehydrated from localStorage
        if (!_hasHydrated) return;

        if (!user) {
            router.push('/login');
            return;
        }
        
        // Redirect Experts/Mentors away from student dashboard routes
        const isExpert = user.role === 'EXPERT' || user.role === 'MENTOR';
        if (isExpert && pathname?.startsWith('/dashboard/student')) {
            router.replace('/dashboard/expert');
        }
    }, [user, router, pathname, _hasHydrated]);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const isAdmin = user?.role === 'ADMIN' || user?.is_superuser;
    const isExpert = user?.role === 'EXPERT' || user?.role === 'MENTOR';

    let menuItems = [];

    if (isAdmin) {
        menuItems = [
            { href: '/dashboard/admin',              icon: <LayoutDashboard />, label: 'Tổng quan' },
            { href: '/dashboard/admin/users',        icon: <Users />,           label: 'Người dùng' },
            { href: '/dashboard/admin/experts',      icon: <ShieldCheck />,     label: 'Chuyên gia' },
            { href: '/dashboard/admin/admins',       icon: <Lock />,            label: 'Quản trị viên' },
            { href: '/dashboard/admin/moderation',   icon: <LayoutGrid />,      label: 'Kiểm duyệt' },
            { href: '/dashboard/admin/disputes',     icon: <AlertCircle />,     label: 'Khiếu nại' },
            { href: '/dashboard/admin/withdrawals',  icon: <Banknote />,        label: 'Rút tiền' },
            { href: '/dashboard/admin/refunds',      icon: <RotateCcw />,       label: 'Hoàn tiền' },
            { href: '/dashboard/admin/account-actions', icon: <ClipboardList />, label: 'Nhật ký' },
            { href: '/dashboard/admin/emails',       icon: <Mail />,            label: 'Email' },
            { href: '/dashboard/chat',               icon: <MessageSquare />,   label: 'Tin nhắn' },
        ];
    } else if (isExpert) {
        menuItems = [
            { href: '/dashboard/expert',               icon: <LayoutDashboard />, label: 'Tổng quan' },
            { href: '/dashboard/expert/availability',  icon: <Calendar />,        label: 'Lịch rảnh' },
            { href: '/dashboard/manage/bookings',      icon: <ClipboardList />,   label: 'Lịch hẹn' },
            { href: '/dashboard/chat',                 icon: <MessageSquare />,   label: 'Tin nhắn' },
            { href: '/dashboard/expert/wallet',        icon: <Wallet />,          label: 'Ví & Doanh thu' },
            { href: '/dashboard/expert/portfolio',     icon: <FileText />,        label: 'Bài viết & Tài liệu' },
            { href: '/dashboard/expert/quizzes',       icon: <ClipboardList />,   label: 'Khảo sát' },
            { href: '/dashboard/dispute',              icon: <ShieldAlert />,     label: 'Hỗ trợ' },
        ];
    } else {
        menuItems = [
            { href: '/dashboard/student',          icon: <LayoutDashboard />, label: 'Tổng quan' },
            { href: '/dashboard/roadmap',          icon: <Compass />,      label: 'Hành trình' },
            { href: '/dashboard/experts',          icon: <Users />,        label: 'Chuyên gia' },
            { href: '/dashboard/roadmap?tab=posts', icon: <FileText />,     label: 'Bài viết' },
            { href: '/dashboard/ai-assistant',     icon: <Bot />,          label: 'Trợ lý AI' },
            { href: '/dashboard/manage/bookings',  icon: <Calendar />,     label: 'Lịch trình' },
            { href: '/dashboard/chat',             icon: <MessageSquare />, label: 'Tin nhắn' },
            { href: '/dashboard/wallet',           icon: <Wallet />,       label: 'Ví Credits' },
            { href: '/dashboard/dispute',          icon: <ShieldAlert />,  label: 'Hỗ trợ' },
        ];
    }

    const sidebarWidth = isCollapsed ? 72 : 260;

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
                }}
            >
                {/* Logo */}
                <div style={{
                    padding: isCollapsed ? '28px 0' : '32px 28px 24px',
                    borderBottom: '1px solid rgba(255,255,255,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'space-between',
                    gap: 12,
                }}>
                    {!isCollapsed ? (
                        <Link href="/" style={{ textDecoration: 'none' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <span style={{
                                    fontSize: 20,
                                    fontWeight: 600,
                                    color: '#FFFFFF',
                                    letterSpacing: '0.15em',
                                    textTransform: 'uppercase',
                                }}>
                                    VOCA
                                </span>
                                <span style={{
                                    fontSize: 8,
                                    fontWeight: 400,
                                    color: 'rgba(255,255,255,0.5)',
                                    letterSpacing: '0.4em',
                                    textTransform: 'uppercase',
                                }}>
                                    Career Platform
                                </span>
                            </div>
                        </Link>
                    ) : (
                        <span style={{
                            fontSize: 16,
                            fontWeight: 600,
                            color: '#FFFFFF',
                            letterSpacing: '0.1em',
                        }}>V</span>
                    )}
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, overflowY: 'auto', padding: '20px 0' }} className="custom-scrollbar">
                    {!isCollapsed && (
                        <div style={{
                            padding: '0 28px 12px',
                            fontSize: 8,
                            fontWeight: 500,
                            color: 'rgba(255,255,255,0.35)',
                            letterSpacing: '0.4em',
                            textTransform: 'uppercase',
                        }}>
                            Navigation
                        </div>
                    )}
                    {menuItems.map((item) => (
                        <SidebarItem
                            key={item.href}
                            {...item}
                            active={isActive(item.href)}
                            collapsed={isCollapsed}
                        />
                    ))}
                </nav>

                {/* Logout */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', padding: '16px 0' }}>
                    <button
                        onClick={handleLogout}
                        className="nav-item"
                        style={{ width: '100%', border: 'none', cursor: 'pointer', justifyContent: isCollapsed ? 'center' : undefined }}
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
                    {/* Left: greeting */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <span style={{
                            fontSize: 8,
                            fontWeight: 500,
                            color: 'rgba(255,255,255,0.7)',
                            letterSpacing: '0.4em',
                            textTransform: 'uppercase',
                        }}>
                            VOCA PLATFORM
                        </span>
                        <span style={{
                            fontSize: 16,
                            fontWeight: 300,
                            color: '#FFFFFF',
                            letterSpacing: '0.05em',
                        }}>
                            {user?.full_name}
                        </span>
                    </div>

                    {/* Right: credits + notifications + avatar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                        {/* Credits */}
                        <div
                            style={{ position: 'relative' }}
                            onMouseEnter={() => setShowCreditsDetail(true)}
                            onMouseLeave={() => setShowCreditsDetail(false)}
                        >
                            <button style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '8px 18px',
                                background: 'rgba(255,255,255,0.2)',
                                border: '1px solid rgba(255,255,255,0.4)',
                                color: '#FFFFFF',
                                cursor: 'pointer',
                                transition: 'border-color 0.25s',
                                fontSize: 12,
                                fontWeight: 500,
                                letterSpacing: '0.1em',
                            }}
                            onMouseOver={e => (e.currentTarget.style.borderColor = '#FFFFFF')}
                            onMouseOut={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)')}
                            >
                                <Wallet size={14} strokeWidth={1.5} color="#FFFFFF" />
                                <span style={{ color: '#FFFFFF', fontWeight: 600 }}>
                                    {(user?.credits || 0).toLocaleString('vi-VN')}
                                </span>
                                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 9, letterSpacing: '0.2em' }}>CR</span>
                                <ChevronDown size={12} strokeWidth={1.5} color="rgba(255,255,255,0.6)" />
                            </button>

                            <AnimatePresence>
                                {showCreditsDetail && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 8 }}
                                        transition={{ duration: 0.2 }}
                                        style={{
                                            position: 'absolute',
                                            right: 0,
                                            top: '100%',
                                            marginTop: 8,
                                            width: 280,
                                            background: '#FFFFFF',
                                            border: '1px solid rgba(0,164,253,0.25)',
                                            boxShadow: '0 8px 32px rgba(0,164,253,0.12)',
                                            padding: 24,
                                            zIndex: 100,
                                        }}
                                    >
                                        <div style={{ marginBottom: 16 }}>
                                            <span style={{ fontSize: 8, fontWeight: 600, color: 'rgba(23,23,22,0.4)', letterSpacing: '0.4em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Số dư hiện tại</span>
                                            <span style={{ fontSize: 28, fontWeight: 300, color: '#00A4FD', letterSpacing: '-0.02em' }}>
                                                {(user?.credits || 0).toLocaleString('vi-VN')} <small style={{ fontSize: 12, opacity: 0.6 }}>Credits</small>
                                            </span>
                                        </div>
                                        <div style={{ borderTop: '1px solid rgba(23,23,22,0.08)', paddingTop: 16 }}>
                                            <Link href="/dashboard/wallet" style={{
                                                display: 'block',
                                                padding: '10px 0',
                                                background: '#00A4FD',
                                                color: '#FFE900',
                                                textAlign: 'center',
                                                fontSize: 9,
                                                fontWeight: 600,
                                                letterSpacing: '0.4em',
                                                textTransform: 'uppercase',
                                                textDecoration: 'none',
                                                transition: 'background 0.25s',
                                            }}>
                                                Nạp thêm Credits
                                            </Link>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Notification Bell */}
                        <div style={{ color: '#FFFFFF' }}>
                            <NotificationBell />
                        </div>

                        {/* Divider */}
                        <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.3)' }} />

                        {/* User Avatar */}
                        <Link href="/dashboard/profile" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            textDecoration: 'none',
                        }}>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#FFFFFF', letterSpacing: '0.1em' }}>
                                    {user?.full_name?.split(' ').slice(-1)[0]}
                                </span>
                                <span style={{ display: 'block', fontSize: 8, fontWeight: 400, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.25em', textTransform: 'uppercase', marginTop: 2 }}>
                                    {user?.role}
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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={
            <div style={{ display: 'flex', minHeight: '100vh', background: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 40, height: 40, border: '2px solid rgba(0,0,0,0.05)', borderTopColor: '#0046EA', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            </div>
        }>
            <DashboardLayoutContent>{children}</DashboardLayoutContent>
        </Suspense>
    );
}
