'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { UserRole } from '@/types/user';
import { getAvatarUrl } from '@/utils/url-utils';

export function Navbar() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        const close = (e: MouseEvent) => {
            if (!(e.target as Element).closest('[data-user-menu]')) setIsMenuOpen(false);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    const handleLogout = () => { logout(); router.push('/login'); setIsMenuOpen(false); };

    const initials = user?.full_name
        ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : 'V';

    const navLinks = [
        { href: '/#about', label: 'Về VOCA' },
        { href: '/dashboard/roadmap', label: 'Lộ trình' },
        { href: '/dashboard/experts', label: 'Chuyên gia' },
        { href: '/ai-tools', label: 'Công cụ AI' },
        { href: '/pricing', label: 'Thành viên' },
    ];

    const dashboardHref = (user?.role === UserRole.EXPERT || user?.role === UserRole.MENTOR)
        ? '/dashboard/expert'
        : user?.role === UserRole.ADMIN
            ? '/dashboard/admin'
            : '/dashboard';

    const menuItems = [
        { href: dashboardHref, label: 'Bảng điều khiển', icon: '📊' },
        { href: '/dashboard/profile', label: 'Hồ sơ cá nhân', icon: '👤' },
        { href: '/dashboard/manage/bookings', label: 'Lịch trình', icon: '📅' },
        { href: '/dashboard/chat', label: 'Tin nhắn', icon: '💬' },
        { href: '/dashboard/wallet', label: 'Tài chính', icon: '💳' },
    ];

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${scrolled
                ? 'bg-[#29B6F6] border-white/20 h-20 shadow-lg'
                : 'bg-[#29B6F6]/80 backdrop-blur-md border-white/10 h-24'
                }`}
        >
            <div className="max-w-[1400px] mx-auto px-8 h-full">
                <div className="flex items-center justify-between h-full">
                    {/* Logo (Rule 134) */}
                    <Link href="/" className="flex items-baseline gap-1.5 group shrink-0">
                        <span className="font-sans text-[22px] font-bold text-white tracking-[0.15em] uppercase">VOCA</span>
                        <span className="w-[5px] h-[5px] bg-white mb-1" />
                    </Link>

                    {/* Navigation Links (Rule 133) */}
                    <div className="hidden lg:flex items-stretch h-full mx-12">
                        {navLinks.map((link) => {
                            const isAbout = link.label === 'Về VOCA';
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`flex items-center justify-center font-sans text-[11px] font-bold tracking-[0.2em] uppercase transition-all duration-500 px-8 border-x border-white/5 first:border-l-0 last:border-r-0
                                        ${isAbout 
                                            ? 'bg-[#FFE900] text-[#29B6F6]' 
                                            : 'text-white/80 hover:bg-[#FFE900] hover:text-[#29B6F6]'
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right Action */}
                    <div className="flex items-center gap-10 shrink-0">
                        {user ? (
                            <div className="relative" data-user-menu>
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="flex items-center gap-4 focus:outline-none group"
                                >
                                    <div className="h-10 w-10 border border-white/30 p-0.5 group-hover:border-white/60 transition-colors">
                                        <div className="h-full w-full bg-white/10 flex items-center justify-center text-white text-[11px] font-medium overflow-hidden">
                                            <Image
                                                className="h-full w-full object-cover"
                                                src={getAvatarUrl(user.avatar_url, user.full_name)}
                                                alt={user.full_name}
                                                width={40}
                                                height={40}
                                                priority
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = getAvatarUrl(null, user.full_name);
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="hidden sm:flex flex-col items-start leading-none gap-1.5">
                                        <span className="text-[13px] font-medium text-white tracking-wide">
                                            {user.full_name}
                                        </span>
                                    </div>
                                    <svg
                                        className={`w-3 h-3 text-white/60 transition-transform duration-500 ${isMenuOpen ? 'rotate-180' : ''
                                            }`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 9l-7 7-7-7"
                                        />
                                    </svg>
                                </button>

                                {isMenuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        className="absolute right-0 mt-4 w-56 bg-[#29B6F6] border border-white/20 shadow-2xl overflow-hidden z-50 backdrop-blur-xl"
                                    >
                                        <div className="px-6 py-4 bg-white/10 border-b border-white/10">
                                            <p className="text-[9px] text-white/60 uppercase tracking-[0.2em] mb-1">
                                                Session
                                            </p>
                                            <p className="text-[11px] font-medium text-white truncate">
                                                {user.email}
                                            </p>
                                        </div>
                                        <div className="p-1.5">
                                            {menuItems.map((item) => (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    onClick={() => setIsMenuOpen(false)}
                                                    className="flex items-center px-4 py-2.5 text-[10px] font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all tracking-[0.1em] uppercase"
                                                >
                                                    {item.label}
                                                </Link>
                                            ))}
                                            <div className="h-[1px] bg-white/10 my-1.5 mx-3" />
                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center w-full px-4 py-2.5 text-[10px] font-medium text-white hover:bg-red-500/20 transition-all tracking-[0.1em] uppercase"
                                            >
                                                Đăng xuất
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-12">
                                <Link
                                    href="/login"
                                    className="text-[14px] font-medium text-white/80 hover:text-white tracking-[0.12em] uppercase transition-colors"
                                >
                                    Đăng nhập
                                </Link>
                                <Link
                                    href="/register"
                                    className="px-10 py-3 bg-white text-[#29B6F6] text-[11px] font-bold tracking-[0.14em] uppercase transition-all duration-700 hover:bg-opacity-90 hover:scale-[1.02] active:scale-[0.98] rounded-[2px] shadow-lg shadow-white/10"
                                >
                                    Tham gia
                                </Link>
                            </div>
                        )}

                        {/* Mobile Toggle */}
                        <button
                            className="lg:hidden p-2 text-white focus:outline-none"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            <div className="w-5 h-3 flex flex-col justify-between">
                                <span
                                    className={`h-[0.5px] bg-white transition-all duration-500 ${isMenuOpen ? 'rotate-45 translate-y-[6px]' : ''
                                        }`}
                                />
                                <span
                                    className={`h-[0.5px] bg-white transition-all duration-500 ${isMenuOpen ? 'opacity-0' : ''
                                        }`}
                                />
                                <span
                                    className={`h-[0.5px] bg-white transition-all duration-500 ${isMenuOpen ? '-rotate-45 -translate-y-[6px]' : ''
                                        }`}
                                />
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
