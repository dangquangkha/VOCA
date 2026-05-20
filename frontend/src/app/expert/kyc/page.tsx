'use client';

import React from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export default function ExpertKYCPage() {
    const { user, logout } = useAuthStore();
    const router = useRouter();

    if (!user) {
        return <div className="p-8 text-center">Loading...</div>;
    }

    const { expert_profile } = user;
    const status = expert_profile?.kyc_status;

    return (
        <div className="min-h-screen bg-white selection:bg-[#0046EA]/10 text-[#171716] font-dm-sans pb-44">
            {/* ── Header Section ── */}
            <div className="bg-[#0046EA] pt-24 pb-48 px-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(0,164,253,0.3)_0%,transparent_70%)]" />
                <div className="max-w-[800px] mx-auto relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-[2px] bg-[#FFE900]" />
                        <span className="text-[10px] text-[#FFE900] tracking-[0.5em] font-black uppercase">Identity Verification</span>
                    </div>
                    <h1 className="text-[clamp(40px,5vw,68px)] font-garamond italic font-bold text-white tracking-tight leading-none">
                        Trạng thái xác thực
                    </h1>
                </div>
            </div>

            <main className="max-w-[800px] mx-auto px-8 -mt-24 relative z-20">
                <div className="bg-white border border-black/5 rounded-[48px] p-12 md:p-16 shadow-2xl text-center">
                    {status === 'PENDING' && (
                        <div className="space-y-10">
                            <div className="w-24 h-24 mx-auto bg-[#FFE900]/10 rounded-full flex items-center justify-center text-[#FFE900]">
                                <svg className="w-10 h-10 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-4xl font-garamond italic font-bold text-[#171716]">Đang chờ phê duyệt</h3>
                                <p className="text-black/40 text-sm font-light leading-relaxed max-w-md mx-auto">
                                    Cảm ơn bạn đã tin tưởng CareerPath. Hồ sơ của bạn hiện đang được Hội đồng chuyên gia đánh giá kỹ lưỡng. Bạn sẽ có quyền truy cập đầy đủ ngay khi quá trình xác thực hoàn tất.
                                </p>
                            </div>
                            <div className="pt-10 border-t border-black/5 flex flex-col items-center gap-4">
                                <p className="text-[9px] font-black text-[#0046EA] uppercase tracking-[0.3em]">Thời gian dự kiến: Trong vòng 24 giờ</p>
                                <button 
                                    onClick={() => router.push('/expert/kyc/form')}
                                    className="px-8 h-14 bg-[#F5F8FF] text-[#0046EA] text-[10px] font-black uppercase tracking-[0.2em] rounded-full hover:bg-[#0046EA] hover:text-white transition-all duration-500"
                                >
                                    Chỉnh sửa hồ sơ
                                </button>
                            </div>
                        </div>
                    )}

                    {status === 'REJECTED' && (
                        <div className="space-y-10">
                            <div className="w-24 h-24 mx-auto bg-red-50 rounded-full flex items-center justify-center text-red-500">
                                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-4xl font-garamond italic font-bold text-red-600">Hồ sơ bị từ chối</h3>
                                <p className="text-black/40 text-sm font-light leading-relaxed max-w-md mx-auto">
                                    Rất tiếc, hồ sơ của bạn chưa đáp ứng đủ các tiêu chuẩn hiện tại của nền tảng. Vui lòng kiểm tra lại thông tin và các tài liệu chứng minh năng lực.
                                </p>
                            </div>
                            <div className="pt-10 border-t border-black/5">
                                <button 
                                    onClick={() => router.push('/expert/kyc/form')}
                                    className="px-12 h-16 bg-[#171716] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full hover:bg-[#0046EA] transition-all duration-500 shadow-xl"
                                >
                                    Cập nhật và Gửi lại hồ sơ
                                </button>
                            </div>
                        </div>
                    )}

                    {status === 'APPROVED' && (
                        <div className="space-y-10">
                            <div className="w-24 h-24 mx-auto bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500">
                                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-4xl font-garamond italic font-bold text-emerald-600">Xác thực thành công</h3>
                                <p className="text-black/40 text-sm font-light leading-relaxed">
                                    Chúc mừng! Bạn đã chính thức trở thành Chuyên gia tinh hoa tại CareerPath AI.
                                </p>
                            </div>
                            <div className="pt-10 border-t border-black/5">
                                <button 
                                    onClick={() => router.push('/dashboard/expert')}
                                    className="px-12 h-16 bg-[#0046EA] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full hover:bg-[#171716] transition-all duration-500 shadow-2xl shadow-blue-500/20"
                                >
                                    Bắt đầu hành trình ngay
                                </button>
                            </div>
                        </div>
                    )}

                    {!expert_profile && user.role === 'EXPERT' && (
                        <div className="space-y-10">
                            <div className="w-24 h-24 mx-auto bg-[#F5F8FF] rounded-full flex items-center justify-center text-[#0046EA]">
                                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-4xl font-garamond italic font-bold text-[#171716]">Khởi tạo danh tính</h3>
                                <p className="text-black/40 text-sm font-light leading-relaxed">
                                    Hệ thống chưa ghi nhận hồ sơ chuyên môn của bạn. Hãy bắt đầu quy trình xác thực để mở khóa các đặc quyền dành riêng cho Expert.
                                </p>
                            </div>
                            <div className="pt-10 border-t border-black/5">
                                <button 
                                    onClick={() => router.push('/expert/kyc/form')}
                                    className="px-12 h-16 bg-[#0046EA] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full hover:bg-[#171716] transition-all duration-500"
                                >
                                    Khởi động ngay
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="mt-12 pt-8 border-t border-black/5">
                        <button 
                            onClick={logout}
                            className="text-[9px] font-black text-black/20 uppercase tracking-[0.4em] hover:text-[#0046EA] transition-colors"
                        >
                            Đăng xuất hệ thống
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
