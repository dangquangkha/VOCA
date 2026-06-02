'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

import { useAuthStore } from '@/store/useAuthStore';

export default function RegisterPage() {
    const [role, setRole] = useState<'student' | 'expert'>('student');
    const loginStore = useAuthStore((state) => state.login);
    const [yearsOfExperience, setYearsOfExperience] = useState<string>('');
    const [noExperience, setNoExperience] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget as HTMLFormElement);
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
            let rolePayload = role === 'student' ? 'STUDENT' : 'EXPERT';
            if (role === 'expert' && noExperience) {
                rolePayload = 'MENTOR';
            }

            const payload = {
                email,
                phone_number: phone,
                password,
                full_name: fullName,
                role: rolePayload,
                years_of_experience: role === 'expert' ? (noExperience ? 0 : parseInt(yearsOfExperience) || 0) : 0
            };

            await api.post('auth/register', payload);
            router.push('/login');
        } catch (err: any) {
            const responseData = err.response?.data;
            let message = 'Đăng ký thất bại. Vui lòng thử lại hoặc liên hệ hỗ trợ.';

            if (responseData) {
                if (typeof responseData.detail === 'string') {
                    message = responseData.detail;
                    if (message.includes('already exists')) {
                        message = 'Email hoặc số điện thoại này đã được sử dụng.';
                    }
                } else if (Array.isArray(responseData.detail)) {
                    message = responseData.detail.map((e: any) => e.msg || e.message).join(', ');
                } else if (responseData.message) {
                    message = responseData.message;
                }
            } else if (err.message === 'Network Error') {
                message = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
            }

            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError('');
        try {
            // Mock Google Login for development/demo
            const mockToken = `mock_google_user_${Math.floor(Math.random() * 1000)}@gmail.com`;

            const { data } = await api.post('auth/google', {
                id_token: mockToken
            });

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
            } else if (role === 'MENTOR') {
                router.push('/dashboard/expert');
            } else router.push('/dashboard');
        } catch (err: any) {
            console.error("Google Registration Error:", err);
            setError('Đăng ký bằng Google thất bại. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="animate-fade-in pb-12 font-dm-sans">
            <div className="mb-16">
                <div className="flex items-center gap-6 mb-8 opacity-60">
                    <div className="h-px w-12 bg-[#0046EA]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#0046EA]">THE GENESIS</span>
                </div>
                <h1 className="text-[clamp(40px,4vw,64px)] font-garamond italic font-bold text-[#171716] leading-[1.1] mb-6">Gia nhập <br /> cộng đồng tinh hoa.</h1>
                <p className="text-black/40 text-[14px] font-dm-sans font-medium tracking-[0.1em] uppercase">Tạo tài khoản để tiếp cận những đặc quyền duy nhất.</p>
            </div>

            <form className="space-y-10" onSubmit={handleSubmit}>
                {/* Role Switcher */}
                <div className="mb-12">
                    <label className="block text-[11px] font-black uppercase tracking-[0.3em] text-black/40 mb-6">BẠN LÀ...</label>
                    <div className="flex gap-6 p-2 bg-[#F5F8FF] rounded-full border border-black/5">
                        {[
                            { id: 'student', label: 'Học viên' },
                            { id: 'expert', label: 'Chuyên gia' }
                        ].map((r) => (
                            <button
                                key={r.id}
                                type="button"
                                onClick={() => setRole(r.id as any)}
                                className={`flex-1 py-4 text-[11px] font-black uppercase tracking-[0.3em] transition-all duration-700 rounded-full ${role === r.id
                                    ? 'bg-[#0046EA] text-[#FFE900] shadow-xl'
                                    : 'text-black/30 hover:text-[#0046EA]'
                                    }`}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="p-6 bg-red-50 border-l-4 border-red-500 text-red-600 text-[13px] font-bold uppercase tracking-wider rounded-r-2xl shadow-sm animate-fade-in">
                        {error}
                    </div>
                )}

                <div className="space-y-10">
                    {/* Full Name */}
                    <div className="group">
                        <label className="block text-[11px] font-black uppercase tracking-widest text-black/40 mb-3 group-focus-within:text-[#0046EA] transition-colors">
                            HỌ VÀ TÊN
                        </label>
                        <input
                            name="fullName"
                            type="text"
                            required
                            placeholder="Nguyễn Văn A"
                            className="w-full bg-[#F5F8FF] border border-black/5 px-8 py-5 text-[15px] font-medium text-[#171716] placeholder-black/20 focus:ring-2 focus:ring-[#0046EA]/20 focus:outline-none focus:border-[#0046EA] transition-all duration-500 rounded-3xl"
                        />
                    </div>

                    {/* Email */}
                    <div className="group">
                        <label className="block text-[11px] font-black uppercase tracking-widest text-black/40 mb-3 group-focus-within:text-[#0046EA] transition-colors">
                            ĐỊA CHỈ EMAIL
                        </label>
                        <input
                            name="email"
                            type="email"
                            required
                            placeholder="you@example.com"
                            className="w-full bg-[#F5F8FF] border border-black/5 px-8 py-5 text-[15px] font-medium text-[#171716] placeholder-black/20 focus:ring-2 focus:ring-[#0046EA]/20 focus:outline-none focus:border-[#0046EA] transition-all duration-500 rounded-3xl"
                        />
                    </div>

                    {/* Phone */}
                    <div className="group">
                        <label className="block text-[11px] font-black uppercase tracking-widest text-black/40 mb-3 group-focus-within:text-[#0046EA] transition-colors">
                            SỐ ĐIỆN THOẠI
                        </label>
                        <input
                            name="phone"
                            type="tel"
                            required
                            placeholder="09xx xxx xxx"
                            className="w-full bg-[#F5F8FF] border border-black/5 px-8 py-5 text-[15px] font-medium text-[#171716] placeholder-black/20 focus:ring-2 focus:ring-[#0046EA]/20 focus:outline-none focus:border-[#0046EA] transition-all duration-500 rounded-3xl"
                        />
                    </div>

                    {/* Password */}
                    <div className="group">
                        <label className="block text-[11px] font-black uppercase tracking-widest text-black/40 mb-3 group-focus-within:text-[#0046EA] transition-colors">
                            MẬT KHẨU
                        </label>
                        <div className="relative">
                            <input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                required
                                placeholder="Tối thiểu 8 ký tự"
                                className="w-full bg-[#F5F8FF] border border-black/5 pl-8 pr-16 py-5 text-[15px] font-medium text-[#171716] placeholder-black/20 focus:ring-2 focus:ring-[#0046EA]/20 focus:outline-none focus:border-[#0046EA] transition-all duration-500 rounded-3xl"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-6 top-1/2 -translate-y-1/2 text-black/30 hover:text-[#0046EA] transition-colors focus:outline-none"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="group">
                        <label className="block text-[11px] font-black uppercase tracking-widest text-black/40 mb-3 group-focus-within:text-[#0046EA] transition-colors">
                            XÁC NHẬN MẬT KHẨU
                        </label>
                        <div className="relative">
                            <input
                                name="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                required
                                placeholder="Lặp lại mật khẩu"
                                className="w-full bg-[#F5F8FF] border border-black/5 pl-8 pr-16 py-5 text-[15px] font-medium text-[#171716] placeholder-black/20 focus:ring-2 focus:ring-[#0046EA]/20 focus:outline-none focus:border-[#0046EA] transition-all duration-500 rounded-3xl"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-6 top-1/2 -translate-y-1/2 text-black/30 hover:text-[#0046EA] transition-colors focus:outline-none"
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Expert Specific Fields */}
                    {role === 'expert' && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="space-y-10 pt-8 border-t border-black/5"
                        >
                            <div className="group">
                                <label className="block text-[11px] font-black uppercase tracking-widest text-black/40 mb-3 group-focus-within:text-[#0046EA] transition-colors">
                                    SỐ NĂM KINH NGHIỆM
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={yearsOfExperience}
                                    onChange={(e) => setYearsOfExperience(e.target.value)}
                                    disabled={noExperience}
                                    placeholder={noExperience ? "Cố vấn Cộng đồng" : "Ví dụ: 5"}
                                    className={`w-full bg-[#F5F8FF] border px-8 py-5 text-[15px] font-medium transition-all duration-500 rounded-3xl focus:ring-2 focus:ring-[#0046EA]/20 focus:outline-none ${noExperience ? 'text-black/20 border-dashed border-black/10 cursor-not-allowed' : 'text-[#171716] border-black/5 focus:border-[#0046EA]'}`}
                                />
                            </div>

                            <div 
                                className="flex items-center gap-4 cursor-pointer group/check bg-[#F5F8FF] p-6 rounded-[24px] border border-black/5 hover:border-[#0046EA]/20 transition-all duration-500"
                                onClick={() => setNoExperience(!noExperience)}
                            >
                                <div className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all duration-500 ${noExperience ? 'bg-[#0046EA] border-[#0046EA] shadow-lg' : 'border-black/10 group-hover/check:border-[#0046EA]/50'}`}>
                                    {noExperience && (
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2.5 h-2.5 bg-[#FFE900] rounded-full" />
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className={`text-[11px] font-black uppercase tracking-widest transition-colors ${noExperience ? 'text-[#0046EA]' : 'text-black/40'}`}>Trở thành Cố vấn Cộng đồng</span>
                                    <span className="text-[12px] text-black/30 font-medium mt-1">Chọn nếu bạn tham gia với tinh thần đóng góp (Pay What You Want)</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="group relative w-full py-6 bg-[#0046EA] text-[#FFE900] text-[11px] font-black tracking-[0.5em] uppercase transition-all duration-700 hover:bg-[#171716] rounded-full shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    
                    {isLoading ? (
                        <div className="flex items-center justify-center gap-3 relative z-10">
                            <div className="w-5 h-5 border-2 border-white/20 border-t-[#FFE900] rounded-full animate-spin" />
                            <span>PROCESSING...</span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-4 relative z-10">
                            <span>ĐĂNG KÝ {role === 'student' ? 'HỌC VIÊN' : (noExperience ? 'CỐ VẤN' : 'CHUYÊN GIA')}</span>
                            <span className="text-white/40 group-hover:text-[#FFE900] group-hover:translate-x-2 transition-all duration-500">→</span>
                        </div>
                    )}
                </button>

                {role === 'student' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-10"
                    >
                        <div className="flex items-center gap-6 py-4">
                            <div className="flex-1 h-px bg-black/5" />
                            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-black/20">OR QUICK ACCESS</span>
                            <div className="flex-1 h-px bg-black/5" />
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                            className="flex items-center justify-center gap-6 w-full py-6 bg-white border-2 border-black/5 text-[#171716] text-[11px] font-black tracking-[0.5em] uppercase transition-all duration-700 hover:border-[#0046EA] hover:text-[#0046EA] hover:bg-[#F5F8FF] disabled:opacity-50 rounded-full shadow-sm"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.908 3.152-1.928 4.176-1.288 1.288-3.312 2.696-6.896 2.696-5.584 0-10.232-4.528-10.232-10.12s4.648-10.12 10.232-10.12c3.016 0 5.256 1.192 6.84 2.688l2.304-2.304c-2.888-2.616-6.848-4.148-11.232-4.148-7.904 0-14.392 6.488-14.392 14.392s6.488 14.392 14.392 14.392c4.224 0 7.408-1.4 9.776-3.864 2.52-2.52 3.32-6.048 3.32-8.68 0-.84-.064-1.632-.192-2.32h-12.92z" />
                            </svg>
                            <span>GOOGLE IDENTITY</span>
                        </button>
                    </motion.div>
                )}
            </form>

            <div className="mt-16 pt-10 border-t border-black/5 text-center">
                <p className="text-[12px] text-black/40 font-medium tracking-[0.1em] uppercase">
                    Đã có tài khoản?{' '}
                    <Link href="/login" className="text-[#0046EA] hover:text-[#171716] transition-all duration-500 font-black tracking-[0.2em] ml-2 border-b-2 border-[#0046EA]/20 hover:border-[#171716] pb-1">
                        ĐĂNG NHẬP NGAY →
                    </Link>
                </p>
            </div>
        </div>
    );
}
