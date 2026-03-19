import React, { useState, useEffect } from 'react';
import { Target, Zap, Brain, ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { assessmentService, UserAssessmentResult } from '@/services/assessmentService';

export default function PersonalStats() {
    const [results, setResults] = useState<UserAssessmentResult[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const data = await assessmentService.getMyResults();
                setResults(data);
            } catch (error) {
                console.error("Failed to fetch assessment results", error);
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, []);

    const getHollandLabels = (code: string) => {
        const mapping: Record<string, { label: string, color: string }> = {
            'R': { label: 'Thực tế', color: 'bg-[#0D1B2A] text-[#F5F0E8] border-[#0D1B2A]' },
            'I': { label: 'Nghiên cứu', color: 'bg-[#58181F] text-[#F5F0E8] border-[#58181F]' },
            'A': { label: 'Nghệ thuật', color: 'bg-[#C9A84C] text-[#0D1B2A] border-[#C9A84C]' },
            'S': { label: 'Xã hội', color: 'border-[#C9A84C]/40 text-[#0D1B2A] bg-white/20' },
            'E': { label: 'Quản lý', color: 'border-[#0D1B2A]/20 text-[#0D1B2A] bg-white/20' },
            'C': { label: 'Nghiệp vụ', color: 'border-[#58181F]/20 text-[#0D1B2A] bg-white/20' },
        };
        return code.split('-').map(c => mapping[c] || { label: c, color: 'border-[#0D1B2A]/10 text-[#0D1B2A]/40' });
    };

    if (loading) {
        return (
            <div className="bg-white/60 border border-[#C9A84C]/20 p-14 backdrop-blur-xl h-full flex flex-col items-center justify-center gap-6 shadow-xl">
                <Loader2 className="w-12 h-12 text-[#C9A84C] animate-spin" strokeWidth={1} />
                <span className="text-[11px] font-bold text-[#0D1B2A]/60 uppercase tracking-[0.5em]">Đang đối soát bản sắc...</span>
            </div>
        );
    }

    if (results.length === 0) {
        return (
            <div className="bg-white/60 border border-[#C9A84C]/15 p-14 backdrop-blur-xl h-full flex flex-col items-center justify-center text-center group transition-all duration-700 hover:border-[#C9A84C]/40 shadow-xl font-dm-sans">
                <div className="w-24 h-24 border border-[#C9A84C]/20 flex items-center justify-center text-[#C9A84C]/40 mb-10 group-hover:bg-[#C9A84C]/5 group-hover:border-[#C9A84C]/40 transition-all duration-700">
                    <Brain size={44} strokeWidth={1} />
                </div>
                <h3 className="font-garamond text-3xl text-[#0D1B2A] italic mb-4">Chưa có dữ liệu</h3>
                <p className="text-[10px] text-[#0D1B2A]/60 font-bold uppercase tracking-[0.4em] max-w-[260px] leading-relaxed">Hãy khởi tạo bản đồ Ikigai để bắt đầu hành trình vươn tầm.</p>
                <Link href="/dashboard/assessment">
                    <button
                        suppressHydrationWarning
                        className="mt-14 px-12 py-5 bg-[#0D1B2A] text-[#F5F0E8] text-[11px] font-bold tracking-[0.4em] uppercase transition-all duration-700 hover:bg-[#C9A84C] hover:text-[#0D1B2A] shadow-lg"
                    >
                        Làm khảo sát ngay
                    </button>
                </Link>
            </div>
        );
    }

    const latestHolland = results.find(r => r.assessment.code === 'HOLLAND');
    const tags = latestHolland ? getHollandLabels(latestHolland.result_code) : [];

    const normalize = (val: number) => Math.min(Math.round((val / 20) * 100), 100);

    const radarStats = latestHolland ? [
        { icon: <Target className="text-[#C9A84C]" size={18} strokeWidth={1.25} />, label: 'Kỹ năng chuyên môn', value: normalize(latestHolland.scores['R'] || 0) },
        { icon: <Zap className="text-[#C9A84C]" size={18} strokeWidth={1.25} />, label: 'Tư duy chiến lược', value: normalize(latestHolland.scores['I'] || 0) },
        { icon: <Brain className="text-[#C9A84C]" size={18} strokeWidth={1.25} />, label: 'Giao tiếp hệ thống', value: normalize(latestHolland.scores['S'] || 0) },
    ] : [];

    return (
        <div className="bg-white/60 border border-[#C9A84C]/20 p-12 backdrop-blur-xl flex flex-col h-full group hover:border-[#C9A84C]/50 transition-all duration-700 shadow-xl font-dm-sans">
            <div className="flex items-center justify-between mb-12">
                <h3 className="font-garamond text-3xl text-[#0D1B2A] italic">Thống kê bản sắc</h3>
                <Link href="/dashboard/result" className="text-[10px] font-bold text-[#C9A84C] hover:text-[#0D1B2A] transition-colors uppercase tracking-[0.4em] flex items-center gap-4 group/link">
                    Chi tiết <ChevronRight size={18} className="group-hover/link:translate-x-2 transition-transform" />
                </Link>
            </div>

            <div className="flex-1 space-y-12">
                {/* Personality Tags */}
                <div className="flex flex-wrap gap-4">
                    {tags.map((tag, i) => (
                        <div key={i} className={`px-6 py-3 border text-[11px] font-bold uppercase tracking-[0.3em] transition-all duration-700 shadow-sm ${tag.color}`}>
                            {tag.label}
                        </div>
                    ))}
                </div>

                {/* Progress Bars */}
                <div className="space-y-10">
                    {radarStats.map((stat, i) => (
                        <div key={i} className="space-y-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="w-10 h-10 border border-[#C9A84C]/20 flex items-center justify-center bg-white shadow-sm">
                                        {stat.icon}
                                    </div>
                                    <span className="text-[12px] font-bold text-[#0D1B2A]/70 uppercase tracking-[0.2em] leading-none">{stat.label}</span>
                                </div>
                                <span className="text-base font-bold text-[#0D1B2A] tabular-nums tracking-widest">{stat.value}%</span>
                            </div>
                            <div className="h-[3px] w-full bg-[#030712]/5 overflow-hidden shadow-inner">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${stat.value}%` }}
                                    transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: i * 0.2 }}
                                    className="h-full bg-gradient-to-r from-[#C9A84C]/60 to-[#C9A84C]"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-10 border border-[#C9A84C]/15 bg-[#F5F0E8]/60 mt-auto shadow-inner">
                    <p className="text-lg text-[#0D1B2A]/80 font-medium leading-relaxed italic font-dm-sans px-8 border-l-2 border-[#C9A84C]/50">
                        {latestHolland?.result_code.includes('I') ?
                            "Dữ liệu cho thấy bạn sở hữu xu hướng **Nghiên cứu & Đối thoại chiến lược** sâu sắc. Hãy sẵn sàng cho những cơ hội vinh quang." :
                            "Tiếp tục hoàn thiện các khảo sát định danh để minh triết chân dung sự nghiệp chuẩn xác nhất cho bản thân."
                        }
                    </p>
                </div>
            </div>
        </div>
    );
}
