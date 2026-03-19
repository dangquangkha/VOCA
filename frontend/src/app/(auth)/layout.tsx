'use client';

import Link from 'next/link';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex bg-[#FAF7F2]">
            {/* Left — Brand Panel (Premium Navy) */}
            <div className="hidden lg:flex lg:w-[40%] bg-[#0A1018] relative overflow-hidden flex-col justify-between p-16">
                {/* Subtle Parallax Background Effect */}
                <div className="absolute inset-x-0 -top-40 -bottom-40 opacity-20 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#C9A84C]/10 rounded-full blur-[120px] animate-float" />
                </div>

                {/* Top: Logo */}
                <Link href="/" className="relative flex items-center gap-4 group">
                    <div className="w-10 h-10 border border-[#C9A84C]/20 flex items-center justify-center text-[#C9A84C] group-hover:bg-[#C9A84C] group-hover:text-[#0A1018] transition-all duration-700">
                        <span className="font-garamond text-xl">V</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-garamond text-[#F5F0E8] text-2xl tracking-[0.2em] font-light lowercase">voca.</span>
                        <span className="font-inter text-[#C9A84C] text-[8px] tracking-[0.5em] uppercase mt-1 opacity-60">The Standard</span>
                    </div>
                </Link>

                {/* Center: Branding */}
                <div className="relative mt-auto mb-auto">
                    <div className="flex items-center gap-4 mb-8 opacity-60">
                        <div className="h-[0.5px] w-12 bg-[#C9A84C]" />
                        <span className="font-inter text-[10px] uppercase tracking-[0.3em] text-[#C9A84C]">VOCA Authority</span>
                    </div>
                    <h2 className="font-garamond italic font-light text-[52px] leading-[1.1] text-[#F5F0E8] mb-8">
                        Hành trình <br />
                        <span className="text-[#C9A84C]">quyền năng</span> của <br />
                        sự nghiệp.
                    </h2>
                    <p className="font-inter text-[#F5F0E8]/60 text-sm font-light leading-relaxed max-w-sm tracking-wide">
                        Nơi những chuyên gia hàng đầu và những tâm hồn khát khao định hình lại tương lai. Đăng nhập để tiếp tục hành trình tinh hoa.
                    </p>
                </div>

                {/* Bottom: Minimal Footer Info */}
                <div className="relative flex justify-between items-end">
                    <div className="flex flex-col gap-2">
                        <span className="font-inter text-[9px] uppercase tracking-[0.4em] text-[#C9A84C]/50">Est. 2024</span>
                        <span className="font-garamond italic text-xs text-[#F5F0E8]/40">VOCA Academy & Mentorship</span>
                    </div>
                    <div className="flex gap-6 opacity-30">
                        <div className="w-1 h-32 bg-gradient-to-t from-[#C9A84C] to-transparent" />
                    </div>
                </div>
            </div>

            {/* Right — Form Panel */}
            <div className="flex-1 flex flex-col justify-center items-center px-8 lg:px-20 py-20">
                {/* Mobile logo */}
                <Link href="/" className="lg:hidden flex items-center gap-4 mb-16">
                    <div className="w-8 h-8 border border-[#C9A84C]/30 flex items-center justify-center text-[#0A1018]">
                        <span className="font-garamond text-lg">V</span>
                    </div>
                    <span className="font-garamond text-[#0A1018] text-xl tracking-[0.2em] lowercase">voca.</span>
                </Link>

                <div className="w-full max-w-[400px]">
                    {children}
                </div>

                {/* Subtle back link */}
                <div className="mt-20">
                    <Link href="/" className="font-inter text-[10px] text-[#0A1018]/40 hover:text-[#C9A84C] uppercase tracking-[0.3em] transition-colors border-b border-transparent hover:border-[#C9A84C]/30 pb-1">
                        ← Trở về trang chủ
                    </Link>
                </div>
            </div>
        </div>
    );
}
