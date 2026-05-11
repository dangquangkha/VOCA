'use client';

import React from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ExpertSearchProps {
    value: string;
    onChange: (val: string) => void;
    onSearch: () => void;
    isPending?: boolean;
    minPrice: string;
    maxPrice: string;
    minRating: string;
    onMinPriceChange: (val: string) => void;
    onMaxPriceChange: (val: string) => void;
    onMinRatingChange: (val: string) => void;
    onReset: () => void;
}

const EASING: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const ExpertSearch: React.FC<ExpertSearchProps> = ({
    value,
    onChange,
    onSearch,
    isPending = false,
    minPrice,
    maxPrice,
    minRating,
    onMinPriceChange,
    onMaxPriceChange,
    onMinRatingChange,
    onReset
}) => {
    const [showFilters, setShowFilters] = React.useState(false);
    const hasActiveFilters = minPrice || maxPrice || minRating;

    return (
        <div className="max-w-[1400px] mx-auto px-8 -mt-10 relative z-20 mb-20">
            <div className="bg-white/80 backdrop-blur-2xl p-3 border border-black/5 shadow-2xl rounded-[40px] transition-all duration-700 hover:border-[#0046EA]/20">
                <div className="flex flex-col lg:flex-row items-center gap-4">
                    {/* Main Search Input */}
                    <div className="flex-1 w-full relative group">
                        <Search className={`absolute left-8 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-700 ${isPending ? 'text-[#0046EA] animate-pulse' : 'text-black/20 group-focus-within:text-[#0046EA]'}`} strokeWidth={2.5} />
                        <input
                            type="text"
                            placeholder="TÌM KIẾM CHUYÊN GIA, CỐ VẤN..."
                            className="w-full pl-16 pr-8 py-6 bg-transparent border-none focus:ring-0 outline-none text-[13px] font-black text-[#171716] placeholder:text-black/20 font-dm-sans tracking-[0.2em]"
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto px-2 pb-2 lg:pb-0">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`h-16 px-8 transition-all duration-700 flex items-center justify-center gap-4 border rounded-[32px] text-[10px] font-black uppercase tracking-[0.3em] font-dm-sans ${showFilters || hasActiveFilters
                                ? 'bg-[#171716] text-white border-[#171716]'
                                : 'bg-white border-black/5 text-black/40 hover:text-[#0046EA] hover:border-[#0046EA]'
                                }`}
                        >
                            <SlidersHorizontal className="w-4 h-4" strokeWidth={2.5} />
                            <span>Bộ lọc</span>
                            {hasActiveFilters && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-2 h-2 rounded-full bg-[#FFE900]"
                                />
                            )}
                        </button>

                        <button
                            className="flex-1 lg:flex-none h-16 px-12 bg-[#0046EA] text-white hover:bg-[#FFE900] hover:text-[#0046EA] text-[10px] uppercase tracking-[0.3em] font-black rounded-[32px] transition-all duration-700 shadow-xl shadow-blue-500/20 active:scale-[0.98] whitespace-nowrap disabled:opacity-50 font-dm-sans"
                            onClick={onSearch}
                            disabled={isPending}
                        >
                            {isPending ? 'TRUY VẤN...' : 'TÌM KIẾM'}
                        </button>
                    </div>
                </div>

                {/* Advanced Filters Panel */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.8, ease: EASING }}
                            className="overflow-hidden"
                        >
                            <div className="mt-6 pt-12 border-t border-black/5 px-10 pb-10">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
                                    {/* Price range */}
                                    <div className="space-y-6">
                                        <label className="text-[9px] font-black text-black/30 uppercase tracking-[0.3em] flex items-center gap-4">
                                            <div className="w-6 h-px bg-[#0046EA]/20" /> Mức phí (Credits)
                                        </label>
                                        <div className="flex items-center gap-6">
                                            <input
                                                type="number"
                                                placeholder="MIN"
                                                className="w-full bg-[#F5F8FF] border border-black/5 rounded-2xl py-4 px-6 text-[13px] font-black text-[#171716] focus:border-[#0046EA] outline-none transition-all placeholder:text-black/20"
                                                value={minPrice}
                                                onChange={(e) => onMinPriceChange(e.target.value)}
                                            />
                                            <span className="text-black/10 font-black">—</span>
                                            <input
                                                type="number"
                                                placeholder="MAX"
                                                className="w-full bg-[#F5F8FF] border border-black/5 rounded-2xl py-4 px-6 text-[13px] font-black text-[#171716] focus:border-[#0046EA] outline-none transition-all placeholder:text-black/20"
                                                value={maxPrice}
                                                onChange={(e) => onMaxPriceChange(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Min Rating */}
                                    <div className="space-y-6">
                                        <label className="text-[9px] font-black text-black/30 uppercase tracking-[0.3em] flex items-center gap-4">
                                            <div className="w-6 h-px bg-[#FFE900]/40" /> Đánh giá tối thiểu
                                        </label>
                                        <div className="relative">
                                            <select
                                                className="w-full bg-[#F5F8FF] border border-black/5 rounded-2xl py-4 px-6 text-[13px] font-black text-[#171716] focus:border-[#0046EA] outline-none transition-all appearance-none cursor-pointer"
                                                value={minRating}
                                                onChange={(e) => onMinRatingChange(e.target.value)}
                                            >
                                                <option value="" className="bg-white">Tất cả thứ hạng</option>
                                                <option value="4.5" className="bg-white">Elite (4.5+ ★)</option>
                                                <option value="4.0" className="bg-white">Expert (4.0+ ★)</option>
                                                <option value="3.5" className="bg-white">Mentor (3.5+ ★)</option>
                                            </select>
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-black/20">
                                                <SlidersHorizontal className="w-4 h-4 rotate-90" strokeWidth={1} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-end gap-4">
                                        <button
                                            onClick={onReset}
                                            className="flex-1 h-14 flex items-center justify-center gap-4 bg-white border border-black/5 text-black/20 text-[9px] font-black uppercase tracking-[0.3em] rounded-full transition-all duration-700 hover:bg-red-50 hover:text-red-500 hover:border-red-100"
                                        >
                                            <X className="w-4 h-4" /> Reset
                                        </button>
                                        <button
                                            onClick={() => { onSearch(); setShowFilters(false); }}
                                            className="flex-1 h-14 bg-[#171716] text-white hover:bg-[#0046EA] text-[9px] font-black uppercase tracking-[0.3em] rounded-full transition-all duration-700 shadow-xl"
                                        >
                                            Áp dụng
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
