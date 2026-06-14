'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import { supabase } from '@/lib/supabase';

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
            const formData = new FormData(e.currentTarget as HTMLFormElement);
            const email = formData.get('email') as string;
            const password = formData.get('password') as string;

            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                throw new Error(authError.message);
            }

            const token = data.session?.access_token;
            if (!token) {
                throw new Error("Không thể lấy token xác thực từ Supabase");
            }

            localStorage.setItem('token', token);
            const userResponse = await api.get('users/me', {
                headers: { Authorization: `Bearer ${token}` },
            });
            loginStore(token, userResponse.data);
            window.dispatchEvent(new Event('auth-change'));
            const { role, expert_profile } = userResponse.data;
            if (role === 'ADMIN') router.push('/dashboard/admin');
            else if (role === 'EXPERT') {
                router.push(expert_profile?.kyc_status === 'APPROVED' ? '/dashboard/expert' : '/expert/kyc');
            } else if (role === 'MENTOR') {
                router.push('/dashboard/expert');
            } else router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Đăng nhập không thành công. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError('');
        try {
            const { error: authError } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/dashboard`
                }
            });
            if (authError) throw authError;
        } catch (err: any) {
            console.error("Google Login Error:", err);
            setError('Đăng nhập bằng Google thất bại. Vui lòng thử lại.');
            setIsLoading(false);
        }
    };

    return (
        <div className="animate-fade-in relative z-10 font-dm-sans">
            <div className="mb-16">
                <div className="flex items-center gap-6 mb-8">
                    <div className="h-px w-12 bg-[#0046EA]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#0046EA]">THE PROTOCOL</span>
                </div>
                <h1 className="text-[clamp(40px,4vw,64px)] font-garamond italic font-bold text-[#171716] leading-[1.1] mb-6">Chào mừng <br /> quay trở lại.</h1>
                <p className="text-black/40 text-[14px] font-dm-sans font-medium tracking-[0.1em] uppercase">Vui lòng nhập thông tin để tiếp tục hành trình.</p>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="flex items-center gap-4 p-6 mb-12 bg-red-50 border-l-4 border-red-500 text-red-600 text-[13px] font-bold uppercase tracking-wider animate-fade-in shadow-sm rounded-r-2xl">
                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-12">
                {/* Email */}
                <div className="group">
                    <label className="block text-[11px] font-black text-black/40 uppercase tracking-[0.3em] mb-4 group-focus-within:text-[#0046EA] transition-colors" htmlFor="email">
                        ĐỊA CHỈ EMAIL
                    </label>
                    <div className="relative">
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            suppressHydrationWarning
                            placeholder="you@luxury-standard.com"
                            className="w-full bg-[#F5F8FF] border border-black/5 px-8 py-5 text-[15px] font-medium text-[#171716] placeholder-black/20 focus:ring-2 focus:ring-[#0046EA]/20 focus:outline-none focus:border-[#0046EA] transition-all duration-500 rounded-3xl"
                        />
                    </div>
                </div>

                {/* Password */}
                <div className="group">
                    <div className="flex justify-between items-center mb-4">
                        <label className="block text-[11px] font-black text-black/40 uppercase tracking-[0.3em] group-focus-within:text-[#0046EA] transition-colors" htmlFor="password">
                            MẬT KHẨU
                        </label>
                        <Link href="/forgot-password" title="Quên mật khẩu?" className="text-[10px] font-black text-black/30 hover:text-[#0046EA] transition-colors uppercase tracking-[0.3em]">
                            QUÊN MẬT KHẨU?
                        </Link>
                    </div>
                    <div className="relative">
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            suppressHydrationWarning
                            placeholder="••••••••"
                            className="w-full bg-[#F5F8FF] border border-black/5 px-8 py-5 text-[15px] font-medium text-[#171716] placeholder-black/20 focus:ring-2 focus:ring-[#0046EA]/20 focus:outline-none focus:border-[#0046EA] transition-all duration-500 rounded-3xl"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-6 top-1/2 -translate-y-1/2 text-black/20 hover:text-[#0046EA] transition-colors p-2"
                            tabIndex={-1}
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest">{showPassword ? 'ẨN' : 'HIỆN'}</span>
                        </button>
                    </div>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={isLoading}
                    suppressHydrationWarning
                    className="group relative w-full py-6 bg-[#0046EA] text-[#FFE900] text-[11px] font-black tracking-[0.5em] uppercase transition-all duration-700 hover:bg-[#171716] rounded-full shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    
                    {isLoading ? (
                        <div className="flex items-center justify-center gap-3 relative z-10">
                            <div className="w-5 h-5 border-2 border-white/20 border-t-[#FFE900] rounded-full animate-spin" />
                            <span>AUTHENTICATING...</span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-4 relative z-10">
                            <span>ĐĂNG NHẬP</span>
                            <span className="text-white/40 group-hover:text-[#FFE900] group-hover:translate-x-2 transition-all duration-500">→</span>
                        </div>
                    )}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-6 py-4">
                    <div className="flex-1 h-px bg-black/5" />
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-black/20">OR</span>
                    <div className="flex-1 h-px bg-black/5" />
                </div>

                {/* Google Login */}
                <button
                    type="button"
                    onClick={() => handleGoogleLogin()}
                    disabled={isLoading}
                    suppressHydrationWarning
                    className="flex items-center justify-center gap-6 w-full py-6 bg-white border-2 border-black/5 text-[#171716] text-[11px] font-black tracking-[0.5em] uppercase transition-all duration-700 hover:border-[#0046EA] hover:text-[#0046EA] hover:bg-[#F5F8FF] disabled:opacity-50 rounded-full shadow-sm"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.908 3.152-1.928 4.176-1.288 1.288-3.312 2.696-6.896 2.696-5.584 0-10.232-4.528-10.232-10.12s4.648-10.12 10.232-10.12c3.016 0 5.256 1.192 6.84 2.688l2.304-2.304c-2.888-2.616-6.848-4.148-11.232-4.148-7.904 0-14.392 6.488-14.392 14.392s6.488 14.392 14.392 14.392c4.224 0 7.408-1.4 9.776-3.864 2.52-2.52 3.32-6.048 3.32-8.68 0-.84-.064-1.632-.192-2.32h-12.92z" />
                    </svg>
                    <span>GOOGLE IDENTITY</span>
                </button>
            </form>

            <div className="mt-20 pt-10 border-t border-black/5 text-center">
                <p className="text-[12px] text-black/40 font-medium tracking-[0.1em] uppercase">
                    Chưa có tài khoản?{' '}
                    <Link href="/register" className="text-[#0046EA] hover:text-[#171716] transition-all duration-500 font-black tracking-[0.2em] ml-2 border-b-2 border-[#0046EA]/20 hover:border-[#171716] pb-1">
                        ĐĂNG KÝ MIỄN PHÍ →
                    </Link>
                </p>
            </div>
        </div>
    );
}
