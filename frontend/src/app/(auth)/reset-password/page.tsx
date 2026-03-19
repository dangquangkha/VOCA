'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function ResetPasswordPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const formData = new FormData(e.target as HTMLFormElement);
        const token = formData.get('token') as string;
        const password = formData.get('password') as string;
        const confirmPassword = formData.get('confirmPassword') as string;

        if (password !== confirmPassword) {
            setError('Mật khẩu nhập lại không khớp');
            setIsLoading(false);
            return;
        }

        try {
            await api.post('auth/reset-password', {
                token,
                new_password: password
            });
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Khôi phục mật khẩu thất bại. Vui lòng kiểm tra mã token của bạn.');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="animate-fade-in text-center">
                <div className="mb-8 flex justify-center">
                    <div className="w-16 h-16 border border-[#C9A84C]/20 flex items-center justify-center text-[#C9A84C]">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>
                <h2 className="font-garamond italic font-light text-[32px] text-[#0A1018] mb-6">Thành công!</h2>
                <p className="font-dm-sans text-xs text-[#0A1018]/60 leading-relaxed mb-10 uppercase tracking-widest">
                    Mật khẩu của bạn đã được cập nhật thành công.
                </p>
                <Link href="/login">
                    <button className="w-full h-14 bg-[#0A1018] text-[#F5F0E8] text-[11px] font-medium tracking-[0.4em] uppercase transition-all duration-700 hover:bg-[#C9A84C] hover:text-[#0A1018]">
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
                    <div className="h-[0.5px] w-8 bg-[#0A1018]" />
                    <span className="font-dm-sans text-[9px] uppercase tracking-[0.3em]">Bảo mật tài khoản</span>
                </div>
                <h1 className="font-garamond italic font-light text-[42px] leading-tight text-[#0A1018] mb-4">Đặt lại <br /> mật khẩu.</h1>
            </div>

            <form className="space-y-8" onSubmit={handleSubmit}>
                {error && (
                    <div className="p-4 bg-[#58181F]/5 border border-[#58181F]/10 text-[#58181F] text-[11px] uppercase tracking-wider animate-fade-in">
                        {error}
                    </div>
                )}

                <div className="space-y-8">
                    {/* Token */}
                    <div className="group">
                        <label className="block text-[9px] font-medium text-[#0A1018]/40 uppercase tracking-[0.2em] mb-2 group-focus-within:text-[#C9A84C] transition-colors">
                            Mã khôi phục (Token)
                        </label>
                        <input
                            name="token"
                            type="text"
                            required
                            placeholder="Dán mã từ Terminal vào đây"
                            className="w-full bg-transparent border-b border-[#0A1018]/10 py-3 text-sm font-light text-[#0A1018] placeholder-[#0A1018]/20 focus:outline-none focus:border-[#C9A84C] transition-all duration-500"
                        />
                    </div>

                    {/* New Password */}
                    <div className="group">
                        <label className="block text-[9px] font-medium text-[#0A1018]/40 uppercase tracking-[0.2em] mb-2 group-focus-within:text-[#C9A84C] transition-colors">
                            Mật khẩu mới
                        </label>
                        <input
                            name="password"
                            type="password"
                            required
                            placeholder="Tối thiểu 8 ký tự"
                            className="w-full bg-transparent border-b border-[#0A1018]/10 py-3 text-sm font-light text-[#0A1018] placeholder-[#0A1018]/20 focus:outline-none focus:border-[#C9A84C] transition-all duration-500"
                        />
                    </div>

                    {/* Confirm Password */}
                    <div className="group">
                        <label className="block text-[9px] font-medium text-[#0A1018]/40 uppercase tracking-[0.2em] mb-2 group-focus-within:text-[#C9A84C] transition-colors">
                            Xác nhận mật khẩu mới
                        </label>
                        <input
                            name="confirmPassword"
                            type="password"
                            required
                            placeholder="Lặp lại mật khẩu mới"
                            className="w-full bg-transparent border-b border-[#0A1018]/10 py-3 text-sm font-light text-[#0A1018] placeholder-[#0A1018]/20 focus:outline-none focus:border-[#C9A84C] transition-all duration-500"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-14 bg-[#0A1018] text-[#F5F0E8] text-[11px] font-medium tracking-[0.4em] uppercase transition-all duration-700 hover:bg-[#C9A84C] hover:text-[#0A1018] flex items-center justify-center gap-4 group disabled:opacity-50"
                >
                    {isLoading ? (
                        <div className="w-4 h-4 border border-[#F5F0E8]/30 border-t-[#F5F0E8] rounded-full animate-spin" />
                    ) : (
                        <span>Đặt lại mật khẩu</span>
                    )}
                </button>
            </form>
        </div>
    );
}
