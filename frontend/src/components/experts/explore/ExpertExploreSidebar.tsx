'use client';

import React from 'react';
import { Filter, X, Star, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ExpertExploreSidebarProps {
    industry: 'it' | 'marketing';
    onIndustryChange: (ind: 'it' | 'marketing') => void;
    selectedSkills: string[];
    onToggleSkill: (skill: string) => void;
    tiers: string[];
    onToggleTier: (tier: string) => void;
    priceRange: [number, number];
    onPriceChange: (range: [number, number]) => void;
    minRating: number;
    onRatingChange: (rating: number) => void;
    onReset: () => void;
}

const IT_SKILLS = ['Frontend', 'Backend', 'Data Science', 'BA', 'UI/UX', 'Mobile'];
const MARKETING_SKILLS = ['Performance Ads', 'SEO', 'Content', 'Brand Management'];

const EASING: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const ExpertExploreSidebar: React.FC<ExpertExploreSidebarProps> = ({
    industry,
    onIndustryChange,
    selectedSkills,
    onToggleSkill,
    tiers,
    onToggleTier,
    priceRange,
    onPriceChange,
    minRating,
    onRatingChange,
    onReset,
}) => {
    const currentSkills = industry === 'it' ? IT_SKILLS : MARKETING_SKILLS;

    return (
        <aside className="w-full lg:w-1/4 space-y-12 lg:sticky lg:top-28 h-fit pb-16 font-sans">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-[10px] font-normal text-[#0A1018] uppercase tracking-[0.3em] flex items-center gap-3 font-sans">
                    <Filter size={14} strokeWidth={1.5} className="text-[#A85C1E]" />
                    Phân lọc thông minh
                </h3>
                <button
                    onClick={onReset}
                    className="text-[10px] font-normal text-[#0A1018]/60 hover:text-[#A85C1E] flex items-center gap-2 transition-all group uppercase tracking-[0.2em] font-sans"
                >
                    <X size={10} className="group-hover:rotate-90 transition-transform" />
                    Xóa hết
                </button>
            </div>

            {/* Industry Toggle */}
            <div className="space-y-6">
                <label className="text-[10px] font-normal text-[#0A1018]/60 uppercase tracking-[0.3em] block ml-1 font-sans">Lĩnh vực chiến lược</label>
                <div className="bg-[#FAF7F2]/60 backdrop-blur-md p-1 border border-[#C9A84C]/10 flex relative rounded-[2px]">
                    <button
                        onClick={() => onIndustryChange('it')}
                        className={`relative z-10 flex-1 py-3.5 text-[11px] font-normal uppercase tracking-[0.14em] transition-all duration-700 font-sans ${industry === 'it' ? 'text-[#F5F0E8]' : 'text-[#0A1018]/80 hover:text-[#0A1018]'
                            }`}
                    >
                        Công nghệ
                    </button>
                    <button
                        onClick={() => onIndustryChange('marketing')}
                        className={`relative z-10 flex-1 py-3.5 text-[11px] font-normal uppercase tracking-[0.14em] transition-all duration-700 font-sans ${industry === 'marketing' ? 'text-[#F5F0E8]' : 'text-[#0A1018]/80 hover:text-[#0A1018]'
                            }`}
                    >
                        Tiếp thị
                    </button>
                    <motion.div
                        layoutId="industry-indicator"
                        transition={{ duration: 0.8, ease: EASING }}
                        className={`absolute top-1 left-1 bottom-1 w-[calc(50%-4px)] bg-[#0A1018] rounded-[1px] ${industry === 'marketing' ? 'translate-x-[calc(100%+4px)]' : ''
                            }`}
                    />
                </div>
            </div>

            {/* Professional Skills */}
            <div className="space-y-6">
                <label className="text-[9px] font-normal text-[#0A1018]/30 uppercase tracking-[0.3em] block ml-1">Kỹ năng đặc thù</label>
                <div className="flex flex-wrap gap-2">
                    <AnimatePresence mode="popLayout">
                        {currentSkills.map((skill) => {
                            const isSelected = selectedSkills.includes(skill);
                            return (
                                <motion.button
                                    key={skill}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    onClick={() => onToggleSkill(skill)}
                                    className={`px-4 py-2 border text-[9px] font-normal uppercase tracking-[0.2em] transition-all duration-700 rounded-[2px] ${isSelected
                                        ? 'bg-[#0A1018] border-[#0A1018] text-[#F5F0E8] shadow-lg shadow-[#0A1018]/10'
                                        : 'bg-[#FAF7F2]/40 border-transparent text-[#0A1018]/80 hover:border-[#C9A84C]/20 hover:text-[#0A1018]'
                                        }`}
                                >
                                    {skill}
                                </motion.button>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>

            {/* Tiers */}
            <div className="space-y-6">
                <label className="text-[10px] font-normal text-[#0A1018]/60 uppercase tracking-[0.3em] block ml-1 font-sans">Phân khúc Cố vấn</label>
                <div className="space-y-2">
                    {[
                        { id: 'peer', label: 'Peer Mentor', sub: 'Tiềm năng trẻ', color: 'bg-[#C9A84C]' },
                        { id: 'pro', label: 'Pro Mentor', sub: 'Chuyên gia dày dặn', color: 'bg-[#0A1018]' },
                        { id: 'elite', label: 'Elite Mentor', sub: 'Lãnh đạo Kiệt xuất', color: 'bg-[#A85C1E]' },
                    ].map((tier) => (
                        <label key={tier.id} className="flex items-center gap-4 p-4 bg-[#FAF7F2]/40 border border-transparent hover:border-[#C9A84C]/10 transition-all cursor-pointer group rounded-[2px] relative overflow-hidden">
                            <input
                                type="checkbox"
                                checked={tiers.includes(tier.id)}
                                onChange={() => onToggleTier(tier.id)}
                                className="hidden peer"
                            />
                            <div className="relative w-4 h-4 border border-[#0A1018]/10 peer-checked:border-[#C9A84C] peer-checked:bg-[#A85C1E] transition-all flex items-center justify-center rounded-[2px]">
                                <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-normal text-[#0A1018]/80 uppercase tracking-[0.15em] group-hover:text-[#A85C1E] transition-colors font-sans">
                                        {tier.label}
                                    </span>
                                    <span className={`w-1.5 h-1.5 rounded-full ${tier.color}`} />
                                </div>
                                <p className="text-[9px] font-normal text-[#0A1018]/50 uppercase tracking-[0.2em] mt-1.5 font-sans">{tier.sub}</p>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            {/* Price Range */}
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-normal text-[#0A1018]/60 uppercase tracking-[0.3em] block ml-1 font-sans">Ngân sách (xu)</label>
                    <span className="text-[11px] font-normal text-[#A85C1E] bg-[#C9A84C]/5 px-4 py-1.5 border border-[#C9A84C]/10 tracking-widest rounded-[2px] font-sans">{priceRange[1].toLocaleString('vi-VN')}</span>
                </div>
                <div className="px-1">
                    <input
                        type="range"
                        min="0"
                        max="2000"
                        step="50"
                        value={priceRange[1]}
                        onChange={(e) => onPriceChange([0, parseInt(e.target.value)])}
                        className="w-full h-[1px] bg-[#C9A84C]/20 appearance-none cursor-pointer accent-[#C9A84C] focus:outline-none"
                    />
                    <div className="flex items-center justify-between mt-4">
                        <span className="text-[10px] font-normal text-[#0A1018]/50 uppercase tracking-widest font-sans">0</span>
                        <span className="text-[10px] font-normal text-[#0A1018]/50 uppercase tracking-widest font-sans">2,000</span>
                    </div>
                </div>
            </div>

            {/* Rating */}
            <div className="space-y-6">
                <label className="text-[10px] font-normal text-[#0A1018]/60 uppercase tracking-[0.3em] block ml-1 font-sans">Chỉ số Uy tín</label>
                <div className="grid grid-cols-1 gap-2">
                    {[4, 3, 2].map((r) => {
                        const isSelected = minRating === r;
                        return (
                            <button
                                key={r}
                                onClick={() => onRatingChange(r)}
                                className={`flex items-center justify-between px-5 py-3.5 border transition-all duration-700 rounded-[2px] ${isSelected
                                    ? 'bg-[#0A1018] border-[#0A1018] text-[#F5F0E8] shadow-xl shadow-[#0A1018]/10'
                                    : 'bg-[#FAF7F2]/40 border-transparent text-[#0A1018]/40 hover:border-[#C9A84C]/20 group'
                                    }`}
                            >
                                <div className="flex items-center gap-1.5">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={12} className={i < r ? 'fill-[#C9A84C] text-[#C9A84C]' : isSelected ? 'text-white/20' : 'text-[#0A1018]/20'} strokeWidth={1} />
                                    ))}
                                </div>
                                <span className={`text-[9px] font-normal uppercase tracking-[0.2em] ${isSelected ? 'text-[#C9A84C]' : 'text-[#0A1018]/60 group-hover:text-[#0A1018]'}`}>
                                    {r}+ Sao
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Apply Button */}
            <div className="pt-8">
                <button className="w-full bg-[#090C12] hover:bg-[#C9A84C] hover:text-[#0A1018] text-[#F5F0E8] font-normal py-5 transition-all duration-700 active:scale-95 uppercase tracking-[0.14em] text-[11px] flex items-center justify-center gap-3 group rounded-[2px] shadow-2xl shadow-[#0A1018]/20 font-sans">
                    Lọc chuyên sâu
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform duration-500" strokeWidth={1.5} />
                </button>
            </div>
        </aside>
    );
};
