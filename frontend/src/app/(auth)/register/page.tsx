'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function RegisterPage() {
    const [role, setRole] = useState<'student' | 'expert'>('student');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const formData = new FormData(e.target as HTMLFormElement);
        const fullName = formData.get('fullName') as string;
        const email = formData.get('email') as string;
        const phone = formData.get('phone') as string;
        const password = formData.get('password') as string;
        const confirmPassword = formData.get('confirmPassword') as string;

        if (password !== confirmPassword) {
            setError('Mật khẩu nhập lại không khớp');
            setIsLoading(false);
            return;
        }

        const phoneRegex = /^[0-9]{10,11}$/;
        if (!phoneRegex.test(phone)) {
            setError('Số điện thoại phải từ 10-11 chữ số');
            setIsLoading(false);
            return;
        }

        try {
            const rolePayload = role === 'student' ? 'STUDENT' : 'EXPERT';
            await api.post('auth/register', {
                email,
                phone_number: phone,
                password,
                full_name: fullName,
                role: rolePayload
            });
            router.push('/login');
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            setError(typeof detail === 'string' ? detail : Array.isArray(detail) ? detail.map((e: any) => e.msg).join(', ') : 'Đăng ký thất bại. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="animate-fade-in pb-12">
            <div className="mb-12">
                <div className="flex items-center gap-2 mb-6 opacity-40">
                    <div className="h-[0.5px] w-8 bg-[#0A1018]" />
                    <span className="font-dm-sans text-[9px] uppercase tracking-[0.3em]">Bắt đầu hành trình</span>
                </div>
                <h1 className="font-garamond italic font-light text-[42px] leading-tight text-[#0A1018] mb-4">Gia nhập <br /> cộng đồng tinh hoa.</h1>
                <p className="font-dm-sans text-[#0A1018]/60 text-xs font-light tracking-wide uppercase">Tạo tài khoản để tiếp cận những đặc quyền duy nhất.</p>
            </div>

            <form className="space-y-8" onSubmit={handleSubmit}>
                {/* Role Switcher */}
                <div className="mb-10">
                    <label className="block text-[9px] font-medium text-[#0A1018]/40 uppercase tracking-[0.2em] mb-4">Bạn là...</label>
                    <div className="flex gap-4">
                        {[
                            { id: 'student', label: 'Học viên' },
                            { id: 'expert', label: 'Chuyên gia' }
                        ].map((r) => (
                            <button
                                key={r.id}
                                type="button"
                                onClick={() => setRole(r.id as any)}
                                className={`flex-1 py-4 text-[10px] uppercase tracking-[0.2em] transition-all duration-500 border ${role === r.id
                                    ? 'bg-[#0A1018] text-[#F5F0E8] border-[#0A1018]'
                                    : 'bg-transparent text-[#0A1018]/40 border-[#0A1018]/10 hover:border-[#C9A84C]/30'
                                    }`}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-[#58181F]/5 border border-[#58181F]/10 text-[#58181F] text-[11px] uppercase tracking-wider">
                        {error}
                    </div>
                )}

                <div className="space-y-8">
                    {/* Full Name */}
                    <div className="group">
                        <label className="block text-[9px] font-medium text-[#0A1018]/40 uppercase tracking-[0.2em] mb-2 group-focus-within:text-[#C9A84C] transition-colors">
                            Họ và Tên
                        </label>
                        <input
                            name="fullName"
                            type="text"
                            required
                            placeholder="Nguyễn Văn A"
                            className="w-full bg-transparent border-b border-[#0A1018]/10 py-3 text-sm font-light text-[#0A1018] placeholder-[#0A1018]/20 focus:outline-none focus:border-[#C9A84C] transition-all duration-500"
                        />
                    </div>

                    {/* Email */}
                    <div className="group">
                        <label className="block text-[9px] font-medium text-[#0A1018]/40 uppercase tracking-[0.2em] mb-2 group-focus-within:text-[#C9A84C] transition-colors">
                            Địa chỉ Email
                        </label>
                        <input
                            name="email"
                            type="email"
                            required
                            placeholder="you@example.com"
                            className="w-full bg-transparent border-b border-[#0A1018]/10 py-3 text-sm font-light text-[#0A1018] placeholder-[#0A1018]/20 focus:outline-none focus:border-[#C9A84C] transition-all duration-500"
                        />
                    </div>

                    {/* Phone */}
                    <div className="group">
                        <label className="block text-[9px] font-medium text-[#0A1018]/40 uppercase tracking-[0.2em] mb-2 group-focus-within:text-[#C9A84C] transition-colors">
                            Số điện thoại
                        </label>
                        <input
                            name="phone"
                            type="tel"
                            required
                            placeholder="09xx xxx xxx"
                            className="w-full bg-transparent border-b border-[#0A1018]/10 py-3 text-sm font-light text-[#0A1018] placeholder-[#0A1018]/20 focus:outline-none focus:border-[#C9A84C] transition-all duration-500"
                        />
                    </div>

                    {/* Password */}
                    <div className="group">
                        <label className="block text-[9px] font-medium text-[#0A1018]/40 uppercase tracking-[0.2em] mb-2 group-focus-within:text-[#C9A84C] transition-colors">
                            Mật khẩu
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
                            Xác nhận mật khẩu
                        </label>
                        <input
                            name="confirmPassword"
                            type="password"
                            required
                            placeholder="Lặp lại mật khẩu"
                            className="w-full bg-transparent border-b border-[#0A1018]/10 py-3 text-sm font-light text-[#0A1018] placeholder-[#0A1018]/20 focus:outline-none focus:border-[#C9A84C] transition-all duration-500"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-14 bg-[#0A1018] text-[#F5F0E8] text-[11px] font-medium tracking-[0.4em] uppercase transition-all duration-700 hover:bg-[#C9A84C] hover:text-[#0A1018] flex items-center justify-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <div className="w-4 h-4 border border-[#F5F0E8]/30 border-t-[#F5F0E8] rounded-full animate-spin" />
                    ) : (
                        <>
                            <span>Đăng ký {role === 'student' ? 'Học viên' : 'Chuyên gia'}</span>
                            <span className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">→</span>
                        </>
                    )}
                </button>
            </form>

            <div className="mt-12 pt-8 border-t border-[#0A1018]/5 text-center">
                <p className="text-[11px] text-[#0A1018]/40 font-light tracking-wide uppercase italic">
                    Đã có tài khoản?{' '}
                    <Link href="/login" className="text-[#0A1018] hover:text-[#C9A84C] transition-colors border-b border-[#0A1018]/10 hover:border-[#C9A84C]/40 pb-0.5 ml-2 font-medium non-italic tracking-wider">
                        Đăng nhập ngay →
                    </Link>
                </p>
            </div>
        </div>
    );
}
