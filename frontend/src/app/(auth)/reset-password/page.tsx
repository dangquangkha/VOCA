'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [hasSession, setHasSession] = useState(false);

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setError('Phiên làm việc khôi phục mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu lại email mới.');
                setHasSession(false);
            } else {
                setHasSession(true);
            }
        };
        checkSession();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const formData = new FormData(e.target as HTMLFormElement);
        const password = formData.get('password') as string;
        const confirmPassword = formData.get('confirmPassword') as string;

        if (password !== confirmPassword) {
            setError('Mật khẩu nhập lại không khớp');
            setIsLoading(false);
            return;
        }

        try {
            const { error: authError } = await supabase.auth.updateUser({
                password: password
            });
            if (authError) throw authError;
            setSuccess(true);
            // Sign out to clean up the temporary reset session
            await supabase.auth.signOut();
        } catch (err: any) {
            setError(err.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="animate-fade-in text-center">
                <div className="mb-8 flex justify-center">
                    <div className="w-16 h-16 border border-gold/20 flex items-center justify-center text-gold">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>
                <h2 className="font-garamond italic font-light text-[32px] text-navy mb-6">Thành công!</h2>
                <p className="font-dm-sans text-xs text-navy/60 leading-relaxed mb-10 uppercase tracking-widest">
                    Mật khẩu của bạn đã được cập nhật thành công.
                </p>
                <Link href="/login">
                    <button className="w-full h-14 bg-navy text-ivory text-[11px] font-medium tracking-[0.4em] uppercase transition-all duration-700 hover:bg-gold hover:text-navy">
                        Đăng nhập với mật khẩu mới
                    </button>
                </Link>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div className="mb-12">
                <div className="flex items-center gap-2 mb-6 opacity-40">
                    <div className="h-[0.5px] w-8 bg-navy" />
                    <span className="font-dm-sans text-[9px] uppercase tracking-[0.3em]">Bảo mật tài khoản</span>
                </div>
                <h1 className="font-garamond italic font-light text-[42px] leading-tight text-navy mb-4">Đặt lại <br /> mật khẩu.</h1>
            </div>

            <form className="space-y-8" onSubmit={handleSubmit}>
                {error && (
                    <div className="p-4 bg-burgundy/5 border border-burgundy/10 text-burgundy text-[11px] uppercase tracking-wider animate-fade-in">
                        {error}
                    </div>
                )}

                {hasSession && (
                    <div className="space-y-8">
                        {/* New Password */}
                        <div className="group">
                            <label className="block text-[9px] font-medium text-navy/40 uppercase tracking-[0.2em] mb-2 group-focus-within:text-gold transition-colors">
                                Mật khẩu mới
                            </label>
                            <input
                                name="password"
                                type="password"
                                required
                                placeholder="Tối thiểu 8 ký tự"
                                className="w-full bg-transparent border-b border-navy/10 py-3 text-sm font-light text-navy placeholder-[var(--color-navy)]/20 focus:outline-none focus:border-gold transition-all duration-500"
                            />
                        </div>

                        {/* Confirm Password */}
                        <div className="group">
                            <label className="block text-[9px] font-medium text-navy/40 uppercase tracking-[0.2em] mb-2 group-focus-within:text-gold transition-colors">
                                Xác nhận mật khẩu mới
                            </label>
                            <input
                                name="confirmPassword"
                                type="password"
                                required
                                placeholder="Lặp lại mật khẩu mới"
                                className="w-full bg-transparent border-b border-navy/10 py-3 text-sm font-light text-navy placeholder-[var(--color-navy)]/20 focus:outline-none focus:border-gold transition-all duration-500"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-14 bg-navy text-ivory text-[11px] font-medium tracking-[0.4em] uppercase transition-all duration-700 hover:bg-gold hover:text-navy flex items-center justify-center gap-4 group disabled:opacity-50"
                        >
                            {isLoading ? (
                                <div className="w-4 h-4 border border-ivory/30 border-t-[var(--color-ivory)] rounded-full animate-spin" />
                            ) : (
                                <span>Đặt lại mật khẩu</span>
                            )}
                        </button>
                    </div>
                )}

                {!hasSession && !error && (
                    <div className="text-center py-6">
                        <div className="w-8 h-8 border border-navy/20 border-t-navy rounded-full animate-spin mx-auto mb-4" />
                        <p className="font-dm-sans text-[11px] uppercase tracking-widest text-navy/60">Đang kiểm tra quyền khôi phục...</p>
                    </div>
                )}

                {!hasSession && error && (
                    <Link href="/forgot-password">
                        <button type="button" className="w-full h-14 border border-navy/20 text-navy text-[11px] font-medium tracking-[0.4em] uppercase transition-all duration-700 hover:bg-navy hover:text-ivory mt-6">
                            Yêu cầu gửi lại email mới
                        </button>
                    </Link>
                )}
            </form>
        </div>
    );
}
