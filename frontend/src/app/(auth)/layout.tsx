'use client';

import Link from 'next/link';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex bg-white">
            {/* Left — Brand Panel (Shinkai Deep Blue) */}
            <div className="hidden lg:flex lg:w-[40%] bg-[#0046EA] relative overflow-hidden flex-col justify-between p-16 border-r border-white/10">
                {/* Subtle Parallax Background Effect */}
                <div className="absolute inset-x-0 -top-40 -bottom-40 opacity-20 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00A4FD]/8 rounded-full blur-[120px] animate-float" />
                </div>

                {/* Top: Logo */}
                <Link href="/" className="relative flex items-center gap-4 group">
                    <div className="w-10 h-10 border border-white/30 flex items-center justify-center text-[#FFE900] group-hover:bg-white group-hover:text-[#0046EA] transition-all duration-700">
                        <span className="font-garamond text-xl">V</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-garamond text-white text-2xl tracking-[0.2em] font-light lowercase">voca.</span>
                        <span className="font-inter text-[#FFE900] text-[8px] tracking-[0.5em] uppercase mt-1 opacity-80">The Standard</span>
                    </div>
                </Link>

                {/* Center: Branding */}
                <div className="relative mt-auto mb-auto">
                    <div className="flex items-center gap-4 mb-8 opacity-80">
                        <div className="h-[0.5px] w-12 bg-[#FFE900]" />
                        <span className="font-inter text-[10px] uppercase tracking-[0.3em] text-[#FFE900]">VOCA Authority</span>
                    </div>
                    <h2 className="font-garamond italic font-light text-[52px] leading-[1.1] text-white mb-8">
                        Hành trình <br />
                        <span className="text-[#FFE900]">quyền năng</span> của <br />
                        sự nghiệp.
                    </h2>
                    <p className="font-inter text-white/70 text-sm font-light leading-relaxed max-w-sm tracking-wide">
                        Nơi những chuyên gia hàng đầu và những tâm hồn khát khao định hình lại tương lai. Đăng nhập để tiếp tục hành trình tinh hoa.
                    </p>
                </div>

                {/* Bottom: Minimal Footer Info */}
                <div className="relative flex justify-between items-end">
                    <div className="flex flex-col gap-2">
                        <span className="font-inter text-[9px] uppercase tracking-[0.4em] text-gold/50">Est. 2024</span>
                        <span className="font-garamond italic text-xs text-ivory/40">VOCA Academy & Mentorship</span>
                    </div>
                    <div className="flex gap-6 opacity-30">
                        <div className="w-1 h-32 bg-gradient-to-t from-[var(--color-gold)] to-transparent" />
                    </div>
                </div>
            </div>

            {/* Right — Form Panel (White) */}
            <div className="flex-1 flex flex-col justify-center items-center px-8 lg:px-20 py-20 bg-white relative overflow-hidden">
                {/* Decorative glow to make it feel "friendly" */}
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-[var(--color-gold-faint)] rounded-full blur-[120px] pointer-events-none opacity-20" />
                {/* Mobile logo */}
                <Link href="/" className="lg:hidden flex items-center gap-4 mb-16">
                    <div className="w-8 h-8 border border-[#0046EA]/30 flex items-center justify-center text-[#0046EA]">
                        <span className="font-garamond text-lg">V</span>
                    </div>
                    <span className="font-garamond text-[#0046EA] text-xl tracking-[0.2em] lowercase">voca.</span>
                </Link>

                <div className="w-full max-w-[400px]">
                    {children}
                </div>

                {/* Subtle back link */}
                <div className="mt-20">
                    <Link href="/" className="font-inter text-[10px] text-[#0F0C17]/40 hover:text-[#0046EA] uppercase tracking-[0.3em] transition-colors border-b border-transparent hover:border-[#0046EA]/30 pb-1">
                        ← Trở về trang chủ
                    </Link>
                </div>
            </div>
        </div>

    );
}
