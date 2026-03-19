import React, { useState, useEffect } from 'react';
import { Bot, FileText, Mic, ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { aiService, CVAnalysis } from '@/services/aiService';

export default function AIToolsQuickAccess() {
    const [latestCV, setLatestCV] = useState<CVAnalysis | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCV = async () => {
            try {
                const data = await aiService.getMyCvAnalysis();
                if (data.length > 0) {
                    setLatestCV(data[0]);
                }
            } catch (error) {
                console.error("Failed to fetch CV analysis", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCV();
    }, []);

    if (loading) {
        return (
            <div className="bg-white/60 border border-[#C9A84C]/20 p-14 backdrop-blur-xl h-full flex flex-col items-center justify-center gap-6 shadow-xl">
                <Loader2 className="w-12 h-12 text-[#C9A84C] animate-spin" strokeWidth={1} />
                <span className="text-[11px] font-bold text-[#0D1B2A]/60 uppercase tracking-[0.5em]">Đang khởi tạo Trợ lý AI...</span>
            </div>
        );
    }

    const cvScore = latestCV?.score || 0;

    return (
        <div className="bg-white/60 border border-[#C9A84C]/20 p-12 backdrop-blur-xl flex flex-col h-full group hover:border-[#C9A84C]/50 transition-all duration-700 shadow-xl font-dm-sans">
            <div className="flex items-center justify-between mb-12">
                <h3 className="font-garamond text-3xl text-[#0D1B2A] italic">Trợ lý AI</h3>
                <div className="w-12 h-12 border border-[#C9A84C]/20 flex items-center justify-center bg-white shadow-sm">
                    <Bot className="text-[#C9A84C]" size={24} strokeWidth={1.25} />
                </div>
            </div>

            <div className="flex-1 space-y-12">
                {/* CV Score Circular Progress */}
                <div className="flex items-center gap-10 p-8 border border-[#C9A84C]/10 bg-white/60 group-hover:bg-white/80 transition-all duration-700 shadow-sm">
                    <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
                        <svg className="w-full h-full -rotate-90">
                            <circle
                                cx="48"
                                cy="48"
                                r="42"
                                fill="transparent"
                                stroke="#F5F0E8"
                                strokeWidth="6"
                            />
                            <circle
                                cx="48"
                                cy="48"
                                r="42"
                                fill="transparent"
                                stroke="#C9A84C"
                                strokeWidth="6"
                                strokeDasharray={2 * Math.PI * 42}
                                strokeDashoffset={(1 - cvScore / 100) * (2 * Math.PI * 42)}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold text-[#0D1B2A] tabular-nums tracking-tighter">{cvScore}</span>
                            <span className="text-[10px] text-[#C9A84C] font-bold uppercase mt-1 tracking-widest">/100</span>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <p className="text-[11px] font-bold text-[#C9A84C] uppercase tracking-[0.3em] mb-3">Chấn hưng hồ sơ</p>
                        <p className="text-lg font-medium text-[#0D1B2A]/80 leading-relaxed font-dm-sans line-clamp-2 italic pr-4">
                            {latestCV ? latestCV.analysis_result.suggestions : "Hãy để trí tuệ nhân tạo tinh lọc lộ trình nghề gia của bạn."}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <Link href="/dashboard/ai-tools">
                        <button
                            suppressHydrationWarning
                            className="w-full flex items-center justify-between p-8 border border-[#C9A84C]/10 bg-white/30 hover:bg-white/80 hover:border-[#C9A84C]/40 transition-all duration-700 text-left group/btn shadow-sm"
                        >
                            <div className="flex items-center gap-8">
                                <div className="w-16 h-16 border border-[#C9A84C]/20 text-[#C9A84C] flex items-center justify-center group-hover/btn:bg-[#C9A84C] group-hover/btn:text-[#0D1B2A] transition-all duration-700 shadow-sm">
                                    <FileText size={24} strokeWidth={1} />
                                </div>
                                <div>
                                    <p className="font-bold text-[#0D1B2A] text-lg uppercase tracking-[0.2em]">Phân tích CV</p>
                                    <p className="text-[10px] font-bold text-[#0D1B2A]/40 tracking-[0.4em] mt-2 uppercase">Chuẩn mực hóa hồ sơ</p>
                                </div>
                            </div>
                            <ChevronRight size={20} className="text-[#C9A84C] opacity-40 group-hover/btn:opacity-100 group-hover/btn:translate-x-2 transition-all" />
                        </button>
                    </Link>

                    <Link href="/dashboard/ai-tools/interview">
                        <button
                            suppressHydrationWarning
                            className="w-full flex items-center justify-between p-8 border border-[#C9A84C]/10 bg-white/30 hover:bg-white/80 hover:border-[#C9A84C]/40 transition-all duration-700 text-left group/btn shadow-sm"
                        >
                            <div className="flex items-center gap-8">
                                <div className="w-16 h-16 border border-[#C9A84C]/20 text-[#C9A84C] flex items-center justify-center group-hover/btn:bg-[#C9A84C] group-hover/btn:text-[#0D1B2A] transition-all duration-700 shadow-sm">
                                    <Mic size={24} strokeWidth={1} />
                                </div>
                                <div>
                                    <p className="font-bold text-[#0D1B2A] text-lg uppercase tracking-[0.2em]">Đối thoại thử</p>
                                    <p className="text-[10px] font-bold text-[#0D1B2A]/40 tracking-[0.4em] mt-2 uppercase">Luyện tập tư duy</p>
                                </div>
                            </div>
                            <ChevronRight size={20} className="text-[#C9A84C] opacity-40 group-hover/btn:opacity-100 group-hover/btn:translate-x-2 transition-all" />
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
