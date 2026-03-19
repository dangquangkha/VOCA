'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { UserRole } from '@/types/user';

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

    const menuItems = [
        { href: '/dashboard/profile', label: 'Hồ sơ cá nhân', icon: '👤' },
        { href: '/dashboard/manage/bookings', label: 'Lịch trình', icon: '📅' },
        { href: '/dashboard/chat', label: 'Tin nhắn', icon: '💬' },
        { href: '/dashboard/wallet', label: 'Tài chính', icon: '💳' },
    ];

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
                ? 'bg-[#090C12]/90 backdrop-blur-xl py-4'
                : 'bg-transparent py-7'
                }`}
        >
            <div className="max-w-[1400px] mx-auto px-8">
                <div className="flex items-center justify-between h-10">
                    {/* Logo (Rule 8 & 128) */}
                    <Link href="/" className="flex items-baseline gap-1.5 group">
                        <span className="font-garamond text-3xl text-[#F5F0E8] tracking-[0.12em]">VOCA</span>
                        <span className="w-[6px] h-[6px] rounded-full bg-[#C9A84C] mb-1.5" />
                    </Link>

                    {/* Navigation Links (Rule 127 - Scaled) */}
                    <div className="hidden lg:flex items-center gap-12">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="font-dm-sans text-[14px] font-light text-[#F5F0E8]/70 hover:text-[#C9A84C] transition-colors tracking-[0.12em] uppercase"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Right Action */}
                    <div className="flex items-center gap-10">
                        {user ? (
                            <div className="relative" data-user-menu>
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="flex items-center gap-4 focus:outline-none group"
                                >
                                    <div className="h-10 w-10 rounded-full border border-[#C9A84C]/20 p-0.5 group-hover:border-[#C9A84C]/40 transition-colors">
                                        <div className="h-full w-full rounded-full bg-[#0D1B2A] flex items-center justify-center text-[#F5F0E8] text-[11px] font-medium overflow-hidden">
                                            {user.avatar_url ? (
                                                <img
                                                    className="h-full w-full object-cover"
                                                    src={user.avatar_url}
                                                    alt=""
                                                />
                                            ) : (
                                                initials
                                            )}
                                        </div>
                                    </div>
                                    <div className="hidden sm:flex flex-col items-start leading-none gap-1.5">
                                        <span className="text-[13px] font-light text-[#F5F0E8] tracking-wide">
                                            {user.full_name}
                                        </span>
                                    </div>
                                    <svg
                                        className={`w-3 h-3 text-[#C9A84C]/60 transition-transform duration-500 ${isMenuOpen ? 'rotate-180' : ''
                                            }`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1}
                                            d="M19 9l-7 7-7-7"
                                        />
                                    </svg>
                                </button>

                                {isMenuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        className="absolute right-0 mt-4 w-56 bg-[#090C12] border border-[#C9A84C]/10 shadow-2xl overflow-hidden z-50 backdrop-blur-xl"
                                    >
                                        <div className="px-6 py-4 bg-[#0D1B2A]/50 border-b border-[#C9A84C]/5">
                                            <p className="text-[9px] text-[#C9A84C]/60 uppercase tracking-[0.2em] mb-1">
                                                Session
                                            </p>
                                            <p className="text-[11px] font-light text-[#F5F0E8]/80 truncate">
                                                {user.email}
                                            </p>
                                        </div>
                                        <div className="p-1.5">
                                            {menuItems.map((item) => (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    onClick={() => setIsMenuOpen(false)}
                                                    className="flex items-center px-4 py-2.5 text-[10px] font-light text-[#F5F0E8]/60 hover:text-[#F5F0E8] hover:bg-[#C9A84C]/5 transition-all tracking-[0.1em] uppercase"
                                                >
                                                    {item.label}
                                                </Link>
                                            ))}
                                            <div className="h-[0.5px] bg-[#C9A84C]/10 my-1.5 mx-3" />
                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center w-full px-4 py-2.5 text-[10px] font-light text-[#58181F] hover:bg-[#58181F]/5 transition-all tracking-[0.1em] uppercase"
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
                                    className="text-[14px] font-light text-[#F5F0E8]/70 hover:text-[#C9A84C] tracking-[0.12em] uppercase transition-colors"
                                >
                                    Đăng nhập
                                </Link>
                                <Link
                                    href="/register"
                                    className="px-10 py-3 bg-[#C9A84C] text-[#0A1018] text-[12px] font-normal tracking-[0.16em] uppercase transition-all duration-500 hover:bg-[#F5F0E8] hover:scale-105 active:scale-95"
                                >
                                    Tham gia
                                </Link>
                            </div>
                        )}

                        {/* Mobile Toggle */}
                        <button
                            className="lg:hidden p-2 text-[#F5F0E8] focus:outline-none"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            <div className="w-5 h-3 flex flex-col justify-between">
                                <span
                                    className={`h-[0.5px] bg-[#F5F0E8] transition-all duration-500 ${isMenuOpen ? 'rotate-45 translate-y-[6px]' : ''
                                        }`}
                                />
                                <span
                                    className={`h-[0.5px] bg-[#F5F0E8] transition-all duration-500 ${isMenuOpen ? 'opacity-0' : ''
                                        }`}
                                />
                                <span
                                    className={`h-[0.5px] bg-[#F5F0E8] transition-all duration-500 ${isMenuOpen ? '-rotate-45 -translate-y-[6px]' : ''
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
