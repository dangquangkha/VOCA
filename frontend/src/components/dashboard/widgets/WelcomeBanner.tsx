'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, Navigation } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { DailyProgress, DayStatus } from '@/types/roadmap';

export default function WelcomeBanner({ userName }: { userName: string }) {
    const router = useRouter();
    const [currentDay, setCurrentDay] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchProgress = async () => {
            try {
                const { data } = await api.get<DailyProgress[]>('roadmap');
                const latest = data.find(d => d.status === DayStatus.UNLOCKED)?.day_number || 
                               data.filter(d => d.status === DayStatus.COMPLETED).length + 1 || 1;
                setCurrentDay(Math.min(latest, 30));
            } catch (error) {
                console.error("Failed to load roadmap progress", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProgress();
    }, []);

    return (
        <div className="relative overflow-hidden p-0 text-black h-full flex flex-col justify-center group transition-all duration-1000 font-dm-sans">
            {/* Background elements (Subtle) */}
            <div className="absolute top-0 right-0 -mt-24 -mr-24 w-[500px] h-[500px] bg-[#00A4FD]/5 rounded-full blur-[120px] transition-all duration-1000"></div>

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                <div className="flex-1 space-y-8">
                    <div className="inline-flex items-center gap-5 px-6 py-2 bg-[#00A4FD]/5 border-[2px] border-[#00A4FD] text-[10px] font-black tracking-[0.5em] uppercase text-[#00A4FD]">
                        <Sparkles size={14} strokeWidth={2} />
                        <span>Chương 01 • Khởi nguyên bản sắc</span>
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-5xl md:text-6xl font-serif leading-[1.1] font-bold text-black">
                            Chào mừng, {userName}.
                        </h1>
                        <p className="font-serif italic text-2xl text-black/80 font-bold">
                            Hôm nay là một khởi đầu mới.
                        </p>
                    </div>

                    <p className="font-sans font-bold text-black/60 text-lg max-w-2xl leading-relaxed border-l-[4px] border-[#00A4FD] pl-6">
                        “Sự vĩ đại không nằm ở việc bạn là ai, mà ở việc bạn <span className="text-[#00A4FD]">kiến tạo</span> giá trị gì cho thế giới.”
                    </p>

                    <div className="flex items-center gap-10">
                        <button
                            onClick={() => router.push('/dashboard/roadmap')}
                            suppressHydrationWarning
                            className="bg-transparent border-[3px] border-[#00A4FD] text-[#00A4FD] uppercase tracking-[0.2em] hover:bg-[#00A4FD] hover:text-white transition-all px-8 py-3 text-[10px] font-black"
                        >
                            TIẾP TỤC HÀNH TRÌNH
                        </button>
                        <div className="hidden sm:flex items-center gap-5 text-[10px] font-black text-[#00A4FD]/60 tracking-[0.3em] uppercase">
                            <span className="w-12 h-[2px] bg-[#00A4FD]/20" />
                            BÀI {loading ? '--' : currentDay.toString().padStart(2, '0')} / 30
                        </div>
                    </div>
                </div>

                <div className="w-56 h-56 md:w-64 md:h-64 relative flex-shrink-0">
                    {/* Minimalist Linux AI Icon */}
                    <div className="w-full h-full border-[6px] border-[#00A4FD]/20 flex items-center justify-center p-10 group-hover:border-[#00A4FD] transition-all duration-1000 rotate-45 hover:rotate-0 bg-white shadow-xl">
                        <div className="w-full h-full border-[2px] border-[#00A4FD]/10 flex items-center justify-center relative">
                            <Navigation size={64} color="#00A4FD" strokeWidth={1} className="-rotate-45 group-hover:scale-110 transition-transform duration-1000" />
                            <div className="absolute inset-0 bg-gradient-to-tr from-[#00A4FD]/10 to-transparent blur-2xl" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
