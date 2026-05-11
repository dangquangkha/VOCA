'use client';

import React from 'react';
import { Star, CheckCircle2, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';
import { Expert } from '@/types/expert';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { getAvatarUrl } from '@/utils/url-utils';
import { useState } from 'react';

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
    const [imgError, setImgError] = useState(false);
    const config = TIER_CONFIG[expert.tier];
    const avatarUrl = getAvatarUrl(expert.user?.avatar_url, expert.user?.full_name || 'Expert');

    return (
        <motion.div
            whileHover={{ 
                y: -12, 
                scale: 1.02,
                boxShadow: "0 40px 80px -20px rgba(0,70,234,0.15)"
            }}
            transition={{ duration: 0.8, ease: EASING }}
            style={{ perspective: 1000 }}
            className="bg-white flex flex-col md:flex-row h-full md:h-auto relative rounded-0 group overflow-hidden border-[6px] border-[#00A4FD]/40 hover:border-[#00A4FD] transition-all duration-700"
        >
            {/* Identity Section */}
            <div className="p-10 flex flex-col items-center md:items-start md:border-r border-white/5 relative z-10 md:min-w-[240px]">
                <div className="relative mb-8">
                    <div className="p-1 bg-[#00A4FD] rounded-0 shadow-[0_12px_24px_rgba(0,70,234,0.2)]">
                        <div className="relative w-28 h-28 md:w-32 md:h-32 overflow-hidden rounded-0 z-10 border-2 border-white/40">
                            {expert.user?.avatar_url && !imgError ? (
                                <Image
                                    src={avatarUrl}
                                    alt={expert.user.full_name || 'Expert'}
                                    fill
                                    className="object-cover"
                                    priority={priority}
                                    onError={() => setImgError(true)}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-[#00A4FD] text-white font-serif italic text-4xl font-bold">
                                    {expert.user?.full_name?.charAt(0) || 'E'}
                                </div>
                            )}
                        </div>
                    </div>
                    {expert.kyc_status === 'APPROVED' && (
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#FFE900] rounded-0 border-[3px] border-black flex items-center justify-center text-black shadow-lg">
                            <ShieldCheck className="w-5 h-5" strokeWidth={3} />
                        </div>
                    )}
                </div>

                <div className={`px-4 py-2 text-[9px] font-black uppercase tracking-[0.3em] border-[2px] ${config.labelColor} rounded-0 font-dm-sans relative z-10 shadow-sm`}>
                    {config.label}
                </div>
            </div>

            {/* Main Content Section */}
            <div className="p-10 flex-1 flex flex-col justify-center gap-10 relative z-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <h4 className="text-3xl font-serif italic font-bold text-black group-hover:text-[#00A4FD] transition-all duration-700 tracking-tight leading-none">
                            {expert.user?.full_name || 'Chuyên gia'}
                        </h4>
                        <CheckCircle2 size={16} className="text-[#00A4FD]" />
                    </div>
                    <p className="text-[#00A4FD] font-black text-[10px] uppercase tracking-[0.4em] font-dm-sans">
                        {expert.jobTitle}
                    </p>
                </div>

                <p className="text-black text-lg font-serif italic leading-relaxed max-w-2xl line-clamp-2 md:line-clamp-3 border-l-[4px] border-[#00A4FD] pl-8">
                    "{expert.bio || 'Chào bạn! Tôi là chuyên gia tư vấn chiến lược. Hãy kết nối để cùng kiến tạo lộ trình công danh bền vững.'}"
                </p>

                <div className="flex flex-wrap items-center gap-8">
                    <div className="flex items-center gap-3 bg-white/5 px-5 py-2.5 rounded-full border border-white/5">
                        <Star size={14} className="fill-[#FFE900] text-[#FFE900]" />
                        <span className="text-sm font-black text-black">{expert.rating.toFixed(1)}</span>
                        <span className="text-[10px] font-black text-black/40 uppercase tracking-widest">({expert.total_reviews})</span>
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 px-5 py-2.5 rounded-full border border-white/5">
                        <Calendar size={14} className="text-[#00A4FD]" />
                        <span className="text-sm font-black text-black">{expert.experience_years}+</span>
                        <span className="text-[10px] font-black text-black/40 uppercase tracking-widest">NĂM</span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    {expert.skills.slice(0, 4).map((skill) => (
                        <span key={skill} className="px-4 py-2 bg-[#00A4FD]/10 text-[#00A4FD] text-[10px] font-black uppercase tracking-widest border-[2px] border-[#00A4FD]/20 rounded-0 transition-all hover:bg-[#00A4FD] hover:text-white font-dm-sans">
                            {skill}
                        </span>
                    ))}
                </div>
            </div>

            {/* Price & CTA Section */}
            <div className="p-10 md:border-l border-white/5 flex flex-col justify-center items-center md:items-end gap-12 bg-white/[0.02] md:min-w-[280px] relative z-10">
                <div className="text-center md:text-right space-y-3">
                    <span className="block text-[10px] font-black text-black/40 uppercase tracking-[0.4em] font-dm-sans">Investment</span>
                    <div className="flex items-baseline gap-3 md:justify-end">
                        <span className="text-4xl font-serif italic font-bold text-black tracking-tighter">{(expert.hourly_rate).toLocaleString('vi-VN')}</span>
                        <span className="text-[10px] font-black text-[#FFE900] uppercase tracking-[0.3em]">XU/H</span>
                    </div>
                </div>

                <div className="flex flex-col gap-4 w-full">
                    <Link
                        href={`/dashboard/experts/${expert.id}/book`}
                        className="h-16 flex items-center justify-center gap-4 bg-[#FFE900] text-black font-black text-[11px] uppercase tracking-[0.2em] transition-all duration-700 hover:bg-[#00A4FD] hover:text-white rounded-0 shadow-2xl shadow-yellow-500/10"
                    >
                        Đặt lịch —
                        <ArrowRight size={14} />
                    </Link>
                    <Link
                        href={`/dashboard/experts/${expert.id}`}
                        className="h-16 flex items-center justify-center border-[2px] border-black/10 text-black/40 font-black text-[11px] uppercase tracking-[0.2em] hover:bg-black/5 hover:text-black rounded-0 transition-all"
                    >
                        Hồ sơ chi tiết
                    </Link>
                </div>
            </div>
        </motion.div>
    );
};
