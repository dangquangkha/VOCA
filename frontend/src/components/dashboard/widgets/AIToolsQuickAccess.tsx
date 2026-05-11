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
            <div className="bg-[var(--color-navy-mid)] border border-[var(--color-ivory-10)] p-14 h-full flex flex-col items-center justify-center gap-6 shadow-xl rounded-sm">
                <Loader2 className="w-12 h-12 text-[var(--color-teal-mid)] animate-spin" strokeWidth={1} />
                <span className="text-[11px] font-bold text-[var(--color-ivory-45)] uppercase tracking-[0.5em]">Đang khởi tạo Trợ lý AI...</span>
            </div>
        );
    }

    const cvScore = latestCV?.score || 0;

    return (
        <div className="bg-white border-[6px] border-[#00A4FD]/40 p-10 flex flex-col h-full group hover:border-[#00A4FD] transition-all duration-700 shadow-xl font-dm-sans">
            <div className="flex items-center justify-between mb-10">
                <h3 className="font-serif text-2xl text-black italic font-bold">Trợ lý AI</h3>
                <div className="w-12 h-12 border-[2px] border-[#00A4FD] flex items-center justify-center bg-white/5">
                    <Bot className="text-[#00A4FD]" size={24} strokeWidth={2} />
                </div>
            </div>

            <div className="flex-1 space-y-12">
                {/* CV Score Circular Progress */}
                <div className="flex items-center gap-8 p-6 border-[2px] border-[#00A4FD]/10 bg-[#F5F8FF] group-hover:bg-[#EAF6FF] transition-all duration-700 shadow-sm">
                    <div className="relative w-20 h-20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-full h-full -rotate-90">
                            <circle
                                cx="40"
                                cy="40"
                                r="36"
                                fill="transparent"
                                stroke="#00A4FD"
                                strokeOpacity="0.1"
                                strokeWidth="6"
                            />
                            <circle
                                cx="40"
                                cy="40"
                                r="36"
                                fill="transparent"
                                stroke="#00A4FD"
                                strokeWidth="6"
                                strokeDasharray={2 * Math.PI * 36}
                                strokeDashoffset={(1 - cvScore / 100) * (2 * Math.PI * 36)}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-xl font-bold text-black tabular-nums tracking-tighter">{cvScore}</span>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <p className="text-[10px] font-black text-[#00A4FD] uppercase tracking-[0.3em] mb-2">Chấn hưng hồ sơ</p>
                        <p className="text-sm font-bold text-black font-dm-sans italic pr-4">
                            {latestCV ? latestCV.analysis_result.suggestions : "Hãy để trí tuệ nhân tạo tinh lọc lộ trình nghề gia của bạn."}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <Link href="/dashboard/ai-tools">
                        <button
                            suppressHydrationWarning
                            className="w-full flex items-center justify-between p-6 border-[2px] border-[#00A4FD]/20 bg-transparent hover:bg-[#F5F8FF] hover:border-[#00A4FD] transition-all duration-700 text-left group/btn shadow-sm"
                        >
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 border-[2px] border-[#00A4FD] text-[#00A4FD] flex items-center justify-center group-hover/btn:bg-[#00A4FD] group-hover/btn:text-white transition-all duration-700">
                                    <FileText size={20} strokeWidth={2} />
                                </div>
                                <div>
                                    <p className="font-black text-black text-base uppercase tracking-[0.2em]">Phân tích CV</p>
                                    <p className="text-[9px] font-bold text-black/50 tracking-[0.4em] mt-2 uppercase">Chuẩn mực hóa hồ sơ</p>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-[#00A4FD] opacity-40 group-hover/btn:opacity-100 group-hover/btn:translate-x-2 transition-all" />
                        </button>
                    </Link>

                    <Link href="/dashboard/ai-tools/interview">
                        <button
                            suppressHydrationWarning
                            className="w-full flex items-center justify-between p-6 border-[2px] border-[#00A4FD]/20 bg-transparent hover:bg-[#F5F8FF] hover:border-[#00A4FD] transition-all duration-700 text-left group/btn shadow-sm"
                        >
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 border-[2px] border-[#00A4FD] text-[#00A4FD] flex items-center justify-center group-hover/btn:bg-[#00A4FD] group-hover/btn:text-white transition-all duration-700">
                                    <Mic size={20} strokeWidth={2} />
                                </div>
                                <div>
                                    <p className="font-black text-black text-base uppercase tracking-[0.2em]">Đối thoại thử</p>
                                    <p className="text-[9px] font-bold text-black/50 tracking-[0.4em] mt-2 uppercase">Luyện tập tư duy</p>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-[#00A4FD] opacity-40 group-hover/btn:opacity-100 group-hover/btn:translate-x-2 transition-all" />
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
