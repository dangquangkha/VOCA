'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const loginStore = useAuthStore((state) => state.login);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const formData = new FormData(e.target as HTMLFormElement);
            const email = formData.get('email') as string;
            const password = formData.get('password') as string;

            const { data } = await api.post('auth/login/access-token',
                new URLSearchParams({ username: email, password }),
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
            );
            localStorage.setItem('token', data.access_token);
            const userResponse = await api.get('users/me', {
                headers: { Authorization: `Bearer ${data.access_token}` },
            });
            loginStore(data.access_token, userResponse.data);
            window.dispatchEvent(new Event('auth-change'));
            const { role, expert_profile } = userResponse.data;
            if (role === 'ADMIN') router.push('/dashboard/admin');
            else if (role === 'EXPERT') {
                router.push(expert_profile?.kyc_status === 'APPROVED' ? '/dashboard/expert' : '/expert/kyc');
            } else router.push('/');
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            setError(typeof detail === 'string' ? detail : Array.isArray(detail) ? detail.map((e: any) => e.msg).join(', ') : 'Đăng nhập không thành công. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="mb-12">
                <div className="flex items-center gap-2 mb-6 opacity-40">
                    <div className="h-[0.5px] w-8 bg-[#0A1018]" />
                    <span className="font-dm-sans text-[9px] uppercase tracking-[0.3em]">Hệ thống hội viên</span>
                </div>
                <h1 className="font-garamond italic font-light text-[42px] leading-tight text-[#0A1018] mb-4">Chào mừng <br /> quay trở lại.</h1>
                <p className="font-dm-sans text-[#0A1018]/60 text-xs font-light tracking-wide uppercase">Vui lòng nhập thông tin để tiếp tục.</p>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="flex items-center gap-3 p-4 mb-8 bg-[#58181F]/5 border border-[#58181F]/10 text-[#58181F] text-[11px] uppercase tracking-wider animate-fade-in">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Email */}
                <div className="group">
                    <label className="block text-[9px] font-medium text-[#0A1018]/40 uppercase tracking-[0.2em] mb-3 group-focus-within:text-[#C9A84C] transition-colors" htmlFor="email">
                        Địa chỉ Email
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder="you@example.com"
                        className="w-full bg-transparent border-b border-[#0A1018]/10 py-3 text-sm font-light text-[#0A1018] placeholder-[#0A1018]/20 focus:outline-none focus:border-[#C9A84C] transition-all duration-500"
                    />
                </div>

                {/* Password */}
                <div className="group">
                    <div className="flex justify-between items-center mb-3">
                        <label className="block text-[9px] font-medium text-[#0A1018]/40 uppercase tracking-[0.2em] group-focus-within:text-[#C9A84C] transition-colors" htmlFor="password">
                            Mật khẩu
                        </label>
                        <Link href="/forgot-password" title="Quên mật khẩu?" className="text-[9px] font-medium text-[#0A1018]/40 hover:text-[#C9A84C] transition-colors uppercase tracking-[0.2em]">
                            Quên?
                        </Link>
                    </div>
                    <div className="relative">
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            placeholder="••••••••"
                            className="w-full bg-transparent border-b border-[#0A1018]/10 py-3 text-sm font-light text-[#0A1018] placeholder-[#0A1018]/20 focus:outline-none focus:border-[#C9A84C] transition-all duration-500"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-0 top-1/2 -translate-y-1/2 text-[#0A1018]/20 hover:text-[#C9A84C] transition-colors p-2"
                            tabIndex={-1}
                        >
                            <span className="text-[9px] uppercase tracking-widest">{showPassword ? 'Ẩn' : 'Hiện'}</span>
                        </button>
                    </div>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-14 bg-[#0A1018] text-[#F5F0E8] text-[11px] font-medium tracking-[0.4em] uppercase transition-all duration-700 hover:bg-[#C9A84C] hover:text-[#0A1018] flex items-center justify-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <div className="w-4 h-4 border border-[#F5F0E8]/30 border-t-[#F5F0E8] rounded-full animate-spin" />
                    ) : (
                        <>
                            <span>Đăng nhập</span>
                            <span className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">→</span>
                        </>
                    )}
                </button>
            </form>

            <div className="mt-12 pt-8 border-t border-[#0A1018]/5 text-center">
                <p className="text-[11px] text-[#0A1018]/40 font-light tracking-wide uppercase italic">
                    Chưa có tài khoản?{' '}
                    <Link href="/register" className="text-[#0A1018] hover:text-[#C9A84C] transition-colors border-b border-[#0A1018]/10 hover:border-[#C9A84C]/40 pb-0.5 ml-2 font-medium non-italic tracking-wider">
                        Đăng ký miễn phí →
                    </Link>
                </p>
            </div>
        </div>
    );
}
