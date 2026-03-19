'use client';

import React from 'react';
import { Star, CheckCircle2, Calendar, ArrowRight } from 'lucide-react';
import { Expert } from '@/types/expert';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

// Enhanced Expert Interface for the New UI
export interface EnhancedExpert extends Expert {
    jobTitle: string;
    tier: 'peer' | 'pro' | 'elite';
    isOnline?: boolean;
    skills: string[];
}

interface ExpertExploreCardProps {
    expert: EnhancedExpert;
    priority?: boolean;
}

const TIER_CONFIG = {
    peer: {
        label: 'Peer Mentor',
        labelColor: 'bg-[#C9A84C]/5 text-[#A85C1E] border-[#C9A84C]/20',
    },
    pro: {
        label: 'Pro Mentor',
        labelColor: 'bg-[#0A1018]/5 text-[#0A1018] border-[#0A1018]/10',
    },
    elite: {
        label: 'Elite Mentor',
        labelColor: 'bg-[#A85C1E]/5 text-[#A85C1E] border-[#C9A84C]/30',
    },
};

const EASING: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const ExpertExploreCard: React.FC<ExpertExploreCardProps> = ({ expert, priority }) => {
    const config = TIER_CONFIG[expert.tier];

    return (
        <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.8, ease: EASING }}
            className="bg-[#FAF7F2]/40 backdrop-blur-xl border border-[#C9A84C]/10 hover:border-[#C9A84C]/30 transition-all duration-700 group overflow-hidden flex flex-col md:flex-row h-full md:h-auto relative rounded-[2px]"
        >
            {/* Identity Section */}
            <div className="p-8 md:p-10 flex flex-col items-center md:items-start md:border-r border-[#C9A84C]/10 relative z-10 md:min-w-[220px] bg-[#FAF7F2]/40">
                <div className="relative mb-6">
                    <div className="relative w-28 h-28 md:w-32 md:h-32 border border-white/40 shadow-2xl overflow-hidden grayscale-[0.2] transition-all duration-1000 group-hover:grayscale-0 group-hover:scale-105 rounded-[1px]">
                        {expert.user?.avatar_url ? (
                            <Image
                                src={expert.user.avatar_url}
                                alt={expert.user.full_name || 'Expert'}
                                fill
                                className="object-cover"
                                priority={priority}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#0A1018] text-[#C9A84C] font-serif italic text-4xl">
                                {expert.user?.full_name?.charAt(0) || 'E'}
                            </div>
                        )}
                    </div>
                    {expert.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#A85C1E] border-2 border-white shadow-xl flex items-center justify-center animate-pulse rounded-full">
                            <div className="w-1.5 h-1.5 bg-white rounded-full" />
                        </div>
                    )}
                </div>

                <div className={`px-4 py-1.5 text-[10px] font-normal uppercase tracking-[0.2em] border ${config.labelColor} rounded-[2px] font-sans`}>
                    {config.label}
                </div>
            </div>

            {/* Main Content Section */}
            <div className="p-8 md:p-10 flex-1 flex flex-col justify-center gap-8 relative z-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <h4 className="text-[24px] font-serif italic font-light text-[#0A1018] group-hover:text-[#A85C1E] transition-colors duration-700 tracking-tight">
                            {expert.user?.full_name || 'Chuyên gia'}
                        </h4>
                        <CheckCircle2 size={14} className="text-[#C9A84C]" strokeWidth={1.5} />
                    </div>
                    <p className="text-[#C9A84C] font-normal text-[10px] uppercase tracking-[0.3em] font-sans">
                        {expert.jobTitle}
                    </p>
                </div>

                <p className="text-[#2A1608]/80 text-[15px] font-light leading-[1.75] max-w-2xl line-clamp-2 md:line-clamp-3 font-serif border-l border-[#C9A84C]/20 pl-6 italic">
                    "{expert.bio || 'Chào bạn! Tôi là chuyên gia tư vấn chiến lược. Hãy kết nối để cùng kiến tạo lộ trình công danh bền vững.'}"
                </p>

                <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-3 bg-[#FAF7F2]/60 px-4 py-2 border border-[#C9A84C]/10 rounded-[1px]">
                        <Star size={14} className="fill-[#C9A84C] text-[#C9A84C]" strokeWidth={1} />
                        <span className="text-xs font-normal text-[#0A1018] font-sans">{expert.rating.toFixed(1)}</span>
                        <span className="text-[10px] font-normal text-[#0A1018]/50 uppercase font-sans">({expert.total_reviews})</span>
                    </div>
                    <div className="flex items-center gap-3 bg-[#FAF7F2]/60 px-4 py-2 border border-[#C9A84C]/10 rounded-[1px]">
                        <Calendar size={14} className="text-[#C9A84C]" strokeWidth={1} />
                        <span className="text-xs font-normal text-[#0A1018] font-sans">{expert.experience_years}+</span>
                        <span className="text-[10px] font-normal text-[#0A1018]/50 uppercase font-sans">năm</span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {expert.skills.slice(0, 4).map((skill) => (
                        <span key={skill} className="px-3 py-1 bg-[#FAF7F2]/20 text-[#A85C1E] text-[10px] font-normal uppercase tracking-widest border border-[#C9A84C]/5 rounded-[1px] transition-all hover:bg-[#C9A84C]/5 font-sans">
                            {skill}
                        </span>
                    ))}
                </div>
            </div>

            {/* Price & CTA Section */}
            <div className="p-8 md:p-10 md:border-l border-[#C9A84C]/10 flex flex-col justify-center items-center md:items-end gap-10 bg-[#FAF7F2]/20 md:min-w-[260px] relative z-10">
                <div className="text-center md:text-right space-y-2">
                    <span className="block text-[10px] font-normal text-[#0A1018]/60 uppercase tracking-[0.2em] font-sans">Phí tư vấn</span>
                    <div className="flex items-baseline gap-2 md:justify-end">
                        <span className="text-[32px] font-light text-[#0A1018] tracking-tighter font-serif">{(expert.hourly_rate).toLocaleString('vi-VN')}</span>
                        <span className="text-[10px] font-normal text-[#0A1018]/80 uppercase tracking-widest font-sans">xu/h</span>
                    </div>
                </div>

                <div className="flex flex-col gap-3 w-full">
                    <Link
                        href={`/dashboard/experts/${expert.id}/book`}
                        className="flex items-center justify-center gap-4 py-4.5 bg-[#090C12] text-[#F5F0E8] font-normal text-[11px] uppercase tracking-[0.14em] transition-all duration-700 hover:bg-[#C9A84C] hover:text-[#0A1018] group/btn active:scale-95 rounded-[2px] font-sans shadow-xl shadow-[#0A1018]/10"
                    >
                        Đặt lịch ngay
                        <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform duration-500" strokeWidth={1.5} />
                    </Link>
                    <Link
                        href={`/dashboard/experts/${expert.id}`}
                        className="flex items-center justify-center py-4.5 border border-[#0A1018]/10 text-[#0A1018]/80 font-normal text-[11px] uppercase tracking-[0.14em] hover:bg-[#0A1018]/5 hover:text-[#0A1018] transition-all active:scale-95 rounded-[2px] font-sans"
                    >
                        Hồ sơ chi tiết
                    </Link>
                </div>
            </div>
        </motion.div>
    );
};
