'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShieldCheck, Star, ChevronRight } from 'lucide-react';
import { Expert } from '@/types/expert';

interface ExpertCardProps {
    expert: Expert;
    viewMode?: 'grid' | 'list';
}

const EASING: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const ExpertCard: React.FC<ExpertCardProps> = ({ expert, viewMode = 'grid' }) => {
    const tagList = expert.tags
        ? expert.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
        : [];

    const avatarUrl = expert.user?.avatar_url
        || `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.user?.full_name || 'Expert')}&background=0A1018&color=C9A84C&size=128`;

    const cardStyles = "group relative bg-[#FAF7F2]/60 backdrop-blur-sm border border-[#C9A84C]/10 hover:border-[#C9A84C]/40 transition-all duration-700 overflow-hidden shadow-sm hover:shadow-[0_48px_96px_-12px_rgba(10,16,24,0.1)] rounded-[2px]";

    if (viewMode === 'list') {
        return (
            <motion.div
                layout
                initial={{ opacity: 0, x: -20, scale: 1.02 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                whileHover={{ scale: 1.01, x: 5 }}
                transition={{ duration: 0.9, ease: EASING }}
                className={`${cardStyles} p-8 flex flex-col md:flex-row gap-10 items-center`}
            >
                <div className="relative shrink-0">
                    <div className="w-28 h-28 overflow-hidden border border-[#C9A84C]/10 shadow-2xl transition-all duration-700 group-hover:border-[#C9A84C]/40 rounded-[2px]">
                        <img src={avatarUrl} alt={expert.user?.full_name || 'Chuyên gia'} className="w-full h-full object-cover grayscale-[0.2] transition-all duration-700" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-[#C9A84C] p-2 border-2 border-[#FAF7F2] text-[#0A1018] shadow-lg rounded-[2px]">
                        <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </div>
                </div>

                <div className="flex-1 text-center md:text-left space-y-4">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div className="space-y-1">
                            <h3 className="text-[24px] font-serif italic font-light text-[#0A1018] group-hover:text-[#A85C1E] transition-colors duration-700">
                                {expert.user?.full_name || 'Chuyên gia'}
                            </h3>
                            <p className="text-[#0A1018]/60 text-[10px] font-normal uppercase tracking-[0.2em] font-sans">
                                {expert.experience_years} năm kinh nghiệm • Chuyên gia quốc tế
                            </p>
                        </div>
                        <div className="flex items-center justify-center md:justify-end gap-3 text-[#0A1018]">
                            <span className="text-3xl font-serif font-light tracking-tighter">{expert.hourly_rate}</span>
                            <span className="text-[10px] text-[#0A1018]/60 font-normal uppercase tracking-[0.2em] font-sans">xu/giờ</span>
                        </div>
                    </div>

                    <p className="text-[#2A1608]/80 text-[15px] font-light line-clamp-2 max-w-2xl leading-[1.75] font-sans tracking-[0.02em]">
                        {expert.bio || `${expert.experience_years} năm kinh nghiệm chuyên sâu trong lĩnh vực tư vấn chiến lược và phát triển tiềm năng.`}
                    </p>

                    <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
                        {tagList.slice(0, 4).map((tag) => (
                            <span key={tag} className="px-4 py-1.5 bg-[#C9A84C]/5 text-[#C97B3A] text-[10px] font-normal uppercase tracking-[0.14em] font-sans border border-[#C9A84C]/10 rounded-full">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="shrink-0 flex flex-col items-center md:items-end gap-6 min-w-[170px]">
                    <div className="flex items-center gap-3 px-6 py-2.5 bg-white/50 border border-[#C9A84C]/10 rounded-[2px]">
                        <Star className="w-3.5 h-3.5 text-[#C9A84C] fill-[#C9A84C]" strokeWidth={1} />
                        <span className="text-[#0A1018] text-sm font-normal">{expert.rating.toFixed(1)}</span>
                        <span className="text-[11px] text-[#0A1018]/50 font-light">({expert.total_reviews})</span>
                    </div>
                    <Link href={`/dashboard/experts/${expert.id}`} className="w-full">
                        <button className="w-full h-[52px] bg-[#0A1018] text-[#F5F0E8] text-[11px] uppercase tracking-[0.2em] font-normal transition-all duration-700 hover:bg-[#C9A84C] hover:text-[#0A1018] rounded-[2px]">
                            Chi tiết
                        </button>
                    </Link>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20, scale: 1.05 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={{ y: -12, scale: 1.02 }}
            transition={{ duration: 0.9, ease: EASING }}
            className={`${cardStyles} p-8`}
        >
            <div className="relative z-10 h-full flex flex-col">
                <div className="flex items-start justify-between mb-10">
                    <div className="relative">
                        <div className="w-24 h-24 overflow-hidden border border-[#C9A84C]/10 shadow-xl group-hover:border-[#C9A84C]/40 transition-all duration-700 rounded-[2px]">
                            <img
                                src={avatarUrl}
                                alt={expert.user?.full_name || 'Chuyên gia'}
                                className="w-full h-full object-cover transition-all duration-700"
                            />
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-[#C97B3A] p-2 border-2 border-[#FAF7F2] text-[#F5F0E8] shadow-xl rounded-[2px]">
                            <ShieldCheck className="w-3 h-3" strokeWidth={1.5} />
                        </div>
                    </div>
                    <div className="text-right space-y-1">
                        <span className="text-[32px] font-serif font-light text-[#0A1018] tracking-tighter block leading-none">
                            {expert.hourly_rate}
                        </span>
                        <span className="text-[10px] text-[#0A1018]/60 font-normal uppercase tracking-[0.2em] font-sans">xu/giờ</span>
                    </div>
                </div>

                <div className="mb-4 space-y-4">
                    <div className="space-y-1">
                        <h3 className="text-[24px] font-serif italic font-light text-[#0A1018] group-hover:text-[#A85C1E] transition-colors duration-700 tracking-tight">
                            {expert.user?.full_name || 'Chuyên gia'}
                        </h3>
                        <p className="text-[#0A1018]/60 text-[10px] font-normal uppercase tracking-[0.2em] font-sans">
                            {expert.experience_years} năm • Chuyên gia tư vấn
                        </p>
                    </div>
                    <p className="text-[#2A1608]/80 text-[15px] font-light leading-[1.75] font-sans tracking-[0.02em] line-clamp-2 min-h-[52px]">
                        {expert.bio || `${expert.experience_years} năm kinh nghiệm chuyên sâu trong lĩnh vực tư vấn chiến lược và phát triển nhân sự.`}
                    </p>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-10">
                    {tagList.slice(0, 3).map((tag: string) => (
                        <span key={tag} className="px-3 py-1 bg-[#C9A84C]/5 text-[#C97B3A] text-[10px] font-normal uppercase tracking-[0.1em] border border-[#C9A84C]/10 rounded-full font-sans">
                            {tag}
                        </span>
                    ))}
                    {tagList.length > 3 && (
                        <span className="text-[10px] font-normal text-[#0A1018]/50 self-center tracking-widest font-sans">+{tagList.length - 3}</span>
                    )}
                </div>

                <div className="mt-auto flex items-center justify-between pt-8 border-t border-[#C9A84C]/10">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center text-[#0A1018] font-normal text-sm gap-2">
                            <Star className="w-3 h-3 text-[#C9A84C] fill-[#C9A84C]" strokeWidth={0.5} />
                            {expert.rating.toFixed(1)}
                        </div>
                        <span className="text-[10px] text-[#0A1018]/60 font-light tracking-widest font-sans">({expert.total_reviews})</span>
                    </div>

                    <Link href={`/dashboard/experts/${expert.id}`}>
                        <button className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] font-normal text-[#0A1018] group-hover:text-[#C97B3A] transition-all duration-700 font-sans group/btn">
                            Hồ sơ <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" strokeWidth={1} />
                        </button>
                    </Link>
                </div>
            </div>
        </motion.div>
    );
};
