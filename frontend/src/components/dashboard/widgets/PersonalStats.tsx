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
            'R': { label: 'Thực tế', color: 'bg-[#0D1B2A] text-ivory border-[#0D1B2A]' },
            'I': { label: 'Nghiên cứu', color: 'bg-burgundy text-ivory border-burgundy' },
            'A': { label: 'Nghệ thuật', color: 'bg-gold text-[#0D1B2A] border-gold' },
            'S': { label: 'Xã hội', color: 'border-gold/40 text-[#0D1B2A] bg-white/20' },
            'E': { label: 'Quản lý', color: 'border-[#0D1B2A]/20 text-[#0D1B2A] bg-white/20' },
            'C': { label: 'Nghiệp vụ', color: 'border-burgundy/20 text-[#0D1B2A] bg-white/20' },
        };
        return code.split('-').map(c => mapping[c] || { label: c, color: 'border-[#0D1B2A]/10 text-[#0D1B2A]/40' });
    };

    if (loading) {
        return (
            <div className="bg-[var(--color-navy-mid)] border border-[var(--color-ivory-10)] p-14 h-full flex flex-col items-center justify-center gap-6 shadow-xl rounded-sm">
                <Loader2 className="w-12 h-12 text-[var(--color-teal-mid)] animate-spin" strokeWidth={1} />
                <span className="text-[11px] font-bold text-[var(--color-ivory-45)] uppercase tracking-[0.5em]">Đang đối soát bản sắc...</span>
            </div>
        );
    }

    if (results.length === 0) {
        return (
            <div className="bg-[var(--color-navy-mid)] border border-[var(--color-ivory-10)] p-14 flex flex-col items-center justify-center text-center group transition-all duration-700 hover:border-[var(--color-gold-line)] shadow-xl font-dm-sans rounded-sm h-full">
                <div className="w-24 h-24 border border-[var(--color-ivory-10)] flex items-center justify-center text-[var(--color-gold)]/40 mb-10 group-hover:bg-[var(--color-gold-faint)] group-hover:border-[var(--color-gold-line)] transition-all duration-700">
                    <Brain size={44} strokeWidth={1} />
                </div>
                <h3 className="font-serif text-2xl text-[var(--color-ivory)] italic mb-4">Chưa có dữ liệu</h3>
                <p className="font-sans text-[10px] text-[var(--color-ivory-45)] uppercase tracking-widest max-w-[260px] leading-relaxed">Hãy khởi tạo bản đồ Ikigai để bắt đầu hành trình vươn tầm.</p>
                <Link href="/dashboard/assessment" className="w-full mt-14">
                    <button
                        suppressHydrationWarning
                        className="w-full bg-gradient-to-r from-[var(--color-gold)] to-[var(--color-teal-mid)] text-[var(--color-navy)] font-bold uppercase tracking-widest text-xs py-4 hover:opacity-90 transition-all border-0"
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
        { icon: <Target className="text-gold" size={18} strokeWidth={1.25} />, label: 'Kỹ năng chuyên môn', value: normalize(latestHolland.scores['R'] || 0) },
        { icon: <Zap className="text-gold" size={18} strokeWidth={1.25} />, label: 'Tư duy chiến lược', value: normalize(latestHolland.scores['I'] || 0) },
        { icon: <Brain className="text-gold" size={18} strokeWidth={1.25} />, label: 'Giao tiếp hệ thống', value: normalize(latestHolland.scores['S'] || 0) },
    ] : [];

    return (
        <div className="bg-[var(--color-navy-mid)] border border-[var(--color-ivory-10)] p-10 flex flex-col h-full group hover:border-[var(--color-gold-line)] transition-all duration-700 shadow-xl font-dm-sans rounded-sm">
            <div className="flex items-center justify-between mb-10">
                <h3 className="font-serif text-2xl text-[var(--color-ivory)] italic">Thống kê bản sắc</h3>
                <Link href="/dashboard/result" className="text-[10px] font-bold text-[var(--color-teal-mid)] hover:text-[var(--color-ivory)] transition-colors uppercase tracking-[0.4em] flex items-center gap-4 group/link">
                    Chi tiết <ChevronRight size={18} className="group-hover/link:translate-x-2 transition-transform" />
                </Link>
            </div>

            <div className="flex-1 space-y-12">
                {/* Personality Tags */}
                <div className="flex flex-wrap gap-4">
                    {tags.map((tag, i) => (
                        <div key={i} className="px-6 py-2 border border-[var(--color-ivory-10)] bg-white/5 text-[var(--color-ivory-70)] text-[10px] font-bold uppercase tracking-[0.3em] transition-all duration-700 shadow-sm">
                            {tag.label}
                        </div>
                    ))}
                </div>

                {/* Progress Bars */}
                <div className="space-y-8">
                    {radarStats.map((stat, i) => (
                        <div key={i} className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-5">
                                    <div className="w-10 h-10 border border-[var(--color-ivory-10)] flex items-center justify-center bg-white/5 shadow-sm">
                                        {stat.icon}
                                    </div>
                                    <span className="text-[11px] font-bold text-[var(--color-ivory-70)] uppercase tracking-[0.2em] leading-none">{stat.label}</span>
                                </div>
                                <span className="text-sm font-bold text-[var(--color-ivory)] tabular-nums tracking-widest">{stat.value}%</span>
                            </div>
                            <div className="h-[2.5px] w-full bg-[var(--color-ivory-10)] overflow-hidden shadow-inner">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${stat.value}%` }}
                                    transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: i * 0.2 }}
                                    className="h-full bg-[var(--color-teal-mid)]"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-8 border border-[var(--color-ivory-10)] bg-white/5 mt-auto shadow-inner">
                    <p className="text-base text-[var(--color-ivory-70)] font-light leading-relaxed italic font-sans px-6 border-l border-[var(--color-gold-line)]">
                        {latestHolland?.result_code.includes('I') ?
                            "Dữ liệu cho thấy bạn sở hữu xu hướng Nghiên cứu & Đối thoại chiến lược sâu sắc. Hãy sẵn sàng cho những cơ hội vinh quang." :
                            "Tiếp tục hoàn thiện các khảo sát định danh để minh triết chân dung sự nghiệp chuẩn xác nhất cho bản thân."
                        }
                    </p>
                </div>
            </div>
        </div>
    );
}
