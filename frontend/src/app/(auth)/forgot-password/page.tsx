'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const formData = new FormData(e.target as HTMLFormElement);
        const email = formData.get('email') as string;

        try {
            await api.post('auth/password-recovery', { email });
            setIsSubmitted(true);
        } catch (err: unknown) {
            setError('Không thể gửi email khôi phục. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="animate-fade-in text-center">
                <div className="mb-8 flex justify-center">
                    <div className="w-16 h-16 border border-gold/20 flex items-center justify-center text-gold">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                </div>
                <h2 className="font-garamond italic font-light text-[32px] text-navy mb-6">Kiểm tra Terminal!</h2>
                <p className="font-dm-sans text-xs text-navy/60 leading-relaxed mb-10 uppercase tracking-widest">
                    Vì đây là bản demo, chúng tôi đã in token khôi phục vào Backend Terminal.
                    <br /> Hãy copy token đó và nhấn nút bên dưới.
                </p>
                <Link href="/reset-password">
                    <button className="w-full h-14 bg-navy text-ivory text-[11px] font-medium tracking-[0.4em] uppercase transition-all duration-700 hover:bg-gold hover:text-navy">
                        Nhập mã khôi phục
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
                    <span className="font-dm-sans text-[9px] uppercase tracking-[0.3em]">Hỗ trợ truy cập</span>
                </div>
                <h1 className="font-garamond italic font-light text-[42px] leading-tight text-navy mb-4">Quên <br /> mật khẩu?</h1>
                <p className="font-dm-sans text-navy/60 text-xs font-light tracking-wide uppercase">Nhập email của bạn để nhận hướng dẫn khôi phục.</p>
            </div>

            <form className="space-y-10" onSubmit={handleSubmit}>
                {error && (
                    <div className="p-4 bg-burgundy/5 border border-burgundy/10 text-burgundy text-[11px] uppercase tracking-wider">
                        {error}
                    </div>
                )}

                <div className="group">
                    <label className="block text-[9px] font-medium text-navy/40 uppercase tracking-[0.2em] mb-3 group-focus-within:text-gold transition-colors" htmlFor="email">
                        Địa chỉ Email
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder="you@example.com"
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
                        <span>Gửi yêu cầu khôi phục</span>
                    )}
                </button>
            </form>

            <div className="mt-12 pt-8 border-t border-navy/5 text-center font-dm-sans">
                <p className="text-[11px] text-navy/40 font-light tracking-wide uppercase italic">
                    Nhớ lại mật khẩu?{' '}
                    <Link href="/login" className="text-navy hover:text-gold transition-colors border-b border-navy/10 hover:border-gold/40 pb-0.5 ml-2 font-medium non-italic tracking-wider">
                        Đăng nhập
                    </Link>
                </p>
            </div>
        </div>
    );
}
