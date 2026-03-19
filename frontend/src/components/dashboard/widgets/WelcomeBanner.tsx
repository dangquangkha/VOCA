import React from 'react';
import { Sparkles, Navigation } from 'lucide-react';

export default function WelcomeBanner({ userName }: { userName: string }) {
    return (
        <div className="relative overflow-hidden bg-[#0D1B2A] border border-[#C9A84C]/15 p-14 text-[#F5F0E8] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] h-full flex flex-col justify-center group transition-all duration-1000 font-dm-sans">
            {/* Background elements */}
            <div className="absolute top-0 right-0 -mt-24 -mr-24 w-[500px] h-[500px] bg-[#C9A84C]/5 rounded-full blur-[120px] group-hover:bg-[#C9A84C]/10 transition-all duration-1000"></div>
            <div className="absolute bottom-0 left-0 -mb-24 -ml-24 w-80 h-80 bg-[#58181F]/5 rounded-full blur-[100px]"></div>

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-20">
                <div className="flex-1 space-y-12">
                    <div className="inline-flex items-center gap-5 px-8 py-3 bg-[#C9A84C]/5 border border-[#C9A84C]/20 text-[10px] font-bold tracking-[0.5em] uppercase text-[#C9A84C]">
                        <Sparkles size={16} strokeWidth={1} />
                        <span>Chương 01 • Khởi nguyên bản sắc</span>
                    </div>

                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-garamond leading-[1.1] font-light">
                        Chào mừng, {userName}. <br />
                        <span className="italic opacity-60 font-light">Hôm nay là một khởi đầu mới.</span>
                    </h1>

                    <p className="font-dm-sans text-[#F5F0E8]/50 text-xl font-light max-w-2xl leading-relaxed italic border-l-2 border-[#C9A84C]/30 pl-10">
                        “Sự vĩ đại không nằm ở việc bạn là ai, mà ở việc bạn <span className="text-[#F5F0E8]/80 non-italic font-medium text-[#C9A84C]">kiến tạo</span> giá trị gì cho thế giới.”
                    </p>

                    <div className="flex items-center gap-12">
                        <button
                            suppressHydrationWarning
                            className="group relative px-14 py-6 bg-[#C9A84C] text-[#0D1B2A] text-[11px] font-bold tracking-[0.5em] uppercase transition-all duration-700 hover:bg-[#F5F0E8] shadow-xl hover:shadow-[#C9A84C]/20"
                        >
                            TIẾP TỤC HÀNH TRÌNH
                        </button>
                        <div className="hidden sm:flex items-center gap-5 text-[10px] font-bold text-[#C9A84C]/60 tracking-[0.3em] uppercase">
                            <span className="w-16 h-[1px] bg-[#C9A84C]/30" />
                            BÀI 05 / 30
                        </div>
                    </div>
                </div>

                <div className="w-56 h-56 md:w-64 md:h-64 relative flex-shrink-0">
                    {/* Minimalist Luxury AI Icon */}
                    <div className="w-full h-full border border-[#C9A84C]/30 flex items-center justify-center p-10 group-hover:border-[#C9A84C]/60 transition-all duration-1000 rotate-45 hover:rotate-0 bg-white/5 backdrop-blur-sm">
                        <div className="w-full h-full border border-[#C9A84C]/20 flex items-center justify-center relative">
                            <Navigation size={64} color="#C9A84C" strokeWidth={0.5} className="-rotate-45 group-hover:scale-110 transition-transform duration-1000" />
                            <div className="absolute inset-0 bg-gradient-to-tr from-[#C9A84C]/10 to-transparent blur-2xl" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
