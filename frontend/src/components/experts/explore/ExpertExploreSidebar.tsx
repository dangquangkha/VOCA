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
                <h3 className="text-[11px] font-black text-black uppercase tracking-[0.3em] flex items-center gap-3 font-sans">
                    <Filter size={14} strokeWidth={2} className="text-[#00A4FD]" />
                    Phân lọc thông minh
                </h3>
                <button
                    onClick={onReset}
                    className="text-[10px] font-black text-black/40 hover:text-[#00A4FD] flex items-center gap-2 transition-all group uppercase tracking-[0.2em] font-sans"
                >
                    <X size={10} className="group-hover:rotate-90 transition-transform" />
                    Xóa hết
                </button>
            </div>

            {/* Industry Toggle */}
            <div className="space-y-6">
                <label className="text-[10px] font-black text-black/60 uppercase tracking-[0.3em] block ml-1 font-sans">Lĩnh vực chiến lược</label>
                <div className="bg-[#F5F8FF] p-1 border-[6px] border-[#00A4FD]/20 flex relative rounded-0">
                    <button
                        onClick={() => onIndustryChange('it')}
                        className={`relative z-10 flex-1 py-3.5 text-[11px] font-black uppercase tracking-[0.14em] transition-all duration-700 font-sans ${industry === 'it' ? 'text-white' : 'text-black/60 hover:text-black'
                            }`}
                    >
                        Công nghệ
                    </button>
                    <button
                        onClick={() => onIndustryChange('marketing')}
                        className={`relative z-10 flex-1 py-3.5 text-[11px] font-black uppercase tracking-[0.14em] transition-all duration-700 font-sans ${industry === 'marketing' ? 'text-white' : 'text-black/60 hover:text-black'
                            }`}
                    >
                        Tiếp thị
                    </button>
                    <motion.div
                        layoutId="industry-indicator"
                        transition={{ duration: 0.8, ease: EASING }}
                        className={`absolute top-1 left-1 bottom-1 w-[calc(50%-4px)] bg-[#00A4FD] rounded-0 ${industry === 'marketing' ? 'translate-x-[calc(100%+4px)]' : ''
                            }`}
                    />
                </div>
            </div>

            {/* Professional Skills */}
            <div className="space-y-6">
                <label className="text-[9px] font-black text-black/30 uppercase tracking-[0.3em] block ml-1">Kỹ năng đặc thù</label>
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
                                    className={`px-4 py-2 border-[2px] text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-700 rounded-0 ${isSelected
                                        ? 'bg-black border-black text-white shadow-lg shadow-black/10'
                                        : 'bg-white border-[#00A4FD]/20 text-black/60 hover:border-[#00A4FD] hover:text-[#00A4FD]'
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
                <label className="text-[10px] font-black text-black/60 uppercase tracking-[0.3em] block ml-1 font-sans">Phân khúc Cố vấn</label>
                <div className="space-y-3">
                    {[
                        { id: 'peer', label: 'Peer Mentor', sub: 'Tiềm năng trẻ', color: 'bg-[#00A4FD]' },
                        { id: 'pro', label: 'Pro Mentor', sub: 'Chuyên gia dày dặn', color: 'bg-black' },
                        { id: 'elite', label: 'Elite Mentor', sub: 'Lãnh đạo Kiệt xuất', color: 'bg-[#D20048]' },
                    ].map((tier) => (
                        <label key={tier.id} className="flex items-center gap-4 p-4 bg-white border-[6px] border-[#00A4FD]/10 hover:border-[#00A4FD] transition-all cursor-pointer group rounded-0 relative overflow-hidden">
                            <input
                                type="checkbox"
                                checked={tiers.includes(tier.id)}
                                onChange={() => onToggleTier(tier.id)}
                                className="hidden peer"
                            />
                            <div className="relative w-5 h-5 border-[2px] border-black/10 peer-checked:border-[#00A4FD] peer-checked:bg-[#00A4FD] transition-all flex items-center justify-center rounded-0">
                                <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-black text-black uppercase tracking-[0.15em] group-hover:text-[#00A4FD] transition-colors font-sans">
                                        {tier.label}
                                    </span>
                                    <span className={`w-2 h-2 rounded-0 ${tier.color}`} />
                                </div>
                                <p className="text-[9px] font-black text-black/40 uppercase tracking-[0.2em] mt-1.5 font-sans">{tier.sub}</p>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            {/* Price Range */}
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-black/60 uppercase tracking-[0.3em] block ml-1 font-sans">Ngân sách (xu)</label>
                    <span className="text-[11px] font-black text-[#00A4FD] bg-[#F5F8FF] px-4 py-1.5 border-[2px] border-[#00A4FD]/20 tracking-widest rounded-0 font-sans">{priceRange[1].toLocaleString('vi-VN')}</span>
                </div>
                <div className="px-1">
                    <input
                        type="range"
                        min="0"
                        max="2000"
                        step="50"
                        value={priceRange[1]}
                        onChange={(e) => onPriceChange([0, parseInt(e.target.value)])}
                        className="w-full h-[6px] bg-[#00A4FD]/20 appearance-none cursor-pointer accent-[#00A4FD] focus:outline-none rounded-0"
                    />
                    <div className="flex items-center justify-between mt-4">
                        <span className="text-[10px] font-black text-black/30 uppercase tracking-widest font-sans">0</span>
                        <span className="text-[10px] font-black text-black/30 uppercase tracking-widest font-sans">2,000</span>
                    </div>
                </div>
            </div>

            {/* Rating */}
            <div className="space-y-6">
                <label className="text-[10px] font-black text-black/60 uppercase tracking-[0.3em] block ml-1 font-sans">Chỉ số Uy tín</label>
                <div className="grid grid-cols-1 gap-2">
                    {[4, 3, 2].map((r) => {
                        const isSelected = minRating === r;
                        return (
                            <button
                                key={r}
                                onClick={() => onRatingChange(r)}
                                className={`flex items-center justify-between px-5 py-3.5 border-[2px] transition-all duration-700 rounded-0 ${isSelected
                                    ? 'bg-[#00A4FD] border-[#00A4FD] text-white shadow-xl shadow-[#00A4FD]/10'
                                    : 'bg-white border-[#00A4FD]/10 text-black/40 hover:border-[#00A4FD] group'
                                    }`}
                            >
                                <div className="flex items-center gap-1.5">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={12} className={i < r ? 'fill-black text-black' : isSelected ? 'text-white/20' : 'text-black/10'} strokeWidth={1} />
                                    ))}
                                </div>
                                <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${isSelected ? 'text-white' : 'text-black/60 group-hover:text-black'}`}>
                                    {r}+ Sao
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Apply Button */}
            <div className="pt-8">
                <button className="w-full bg-black hover:bg-[#00A4FD] text-white font-black py-5 transition-all duration-700 active:scale-95 uppercase tracking-[0.14em] text-[11px] flex items-center justify-center gap-3 group rounded-0 shadow-2xl shadow-black/20 font-sans">
                    Lọc chuyên sâu
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform duration-500" strokeWidth={2} />
                </button>
            </div>
        </aside>
    );
};
