'use client';

import React from 'react';
import { Search, DollarSign, Star, SlidersHorizontal, X } from 'lucide-react';
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
            <div className="bg-[#FAF7F2]/90 backdrop-blur-2xl p-2 border border-[#C9A84C]/20 shadow-[0_32px_64px_-16px_rgba(10,16,24,0.15)] rounded-[2px]">
                <div className="flex flex-col lg:flex-row items-center gap-2">
                    {/* Main Search Input */}
                    <div className="flex-1 w-full relative group">
                        <Search className={`absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-700 ${isPending ? 'text-[#C9A84C] animate-pulse' : 'text-[#0A1018]/60 group-focus-within:text-[#C9A84C]'}`} strokeWidth={1.5} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm chuyên gia, lĩnh vực..."
                            className="w-full pl-14 pr-6 py-5 bg-transparent border-none focus:ring-0 outline-none text-[15px] font-light text-[#0A1018] placeholder:text-[#0A1018]/40 font-sans tracking-[0.02em]"
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full lg:w-auto px-2 pb-2 lg:pb-0">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`h-[54px] px-6 transition-all duration-700 flex items-center justify-center gap-3 border rounded-[2px] text-[11px] font-normal uppercase tracking-[0.14em] font-sans ${showFilters || hasActiveFilters
                                ? 'bg-[#C9A84C]/5 border-[#C9A84C]/40 text-[#A85C1E]'
                                : 'bg-transparent border-transparent text-[#0A1018]/80 hover:text-[#0A1018] hover:border-[#0A1018]/10'
                                }`}
                        >
                            <SlidersHorizontal className="w-3.5 h-3.5" strokeWidth={1.5} />
                            <span>Bộ lọc</span>
                            {hasActiveFilters && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]"
                                />
                            )}
                        </button>

                        <button
                            className="flex-1 lg:flex-none h-[54px] px-10 bg-[#090C12] text-[#F5F0E8] text-[11px] uppercase tracking-[0.18em] font-normal rounded-[2px] transition-all duration-700 hover:bg-[#C9A84C] hover:text-[#0A1018] shadow-xl active:scale-[0.98] whitespace-nowrap disabled:opacity-50"
                            onClick={onSearch}
                            disabled={isPending}
                        >
                            {isPending ? 'Đang truy vấn...' : 'Phân lọc'}
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
                            <div className="mt-4 pt-10 border-t border-[#C9A84C]/10 px-8 pb-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
                                    {/* Price range */}
                                    <div className="space-y-6">
                                        <label className="text-[10px] font-normal text-[#0A1018]/60 uppercase tracking-[0.2em] flex items-center gap-3 font-sans">
                                            <div className="w-4 h-[0.5px] bg-[#C9A84C]/40" /> Khoảng phí (xu/giờ)
                                        </label>
                                        <div className="flex items-center gap-6">
                                            <input
                                                type="number"
                                                placeholder="Từ"
                                                className="w-full bg-transparent border-b border-[#0A1018]/10 py-2 text-[15px] font-light text-[#0A1018] focus:border-[#C9A84C] outline-none transition-all placeholder:text-[#0A1018]/30"
                                                value={minPrice}
                                                onChange={(e) => onMinPriceChange(e.target.value)}
                                            />
                                            <span className="text-[#0A1018]/10 font-light">/</span>
                                            <input
                                                type="number"
                                                placeholder="Đến"
                                                className="w-full bg-transparent border-b border-[#0A1018]/10 py-2 text-[15px] font-light text-[#0A1018] focus:border-[#C9A84C] outline-none transition-all placeholder:text-[#0A1018]/30"
                                                value={maxPrice}
                                                onChange={(e) => onMaxPriceChange(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Min Rating */}
                                    <div className="space-y-6">
                                        <label className="text-[10px] font-normal text-[#0A1018]/60 uppercase tracking-[0.2em] flex items-center gap-3 font-sans">
                                            <div className="w-4 h-[0.5px] bg-[#C9A84C]/40" /> Tiêu chuẩn đánh giá
                                        </label>
                                        <div className="relative">
                                            <select
                                                className="w-full bg-transparent border-b border-[#0A1018]/10 py-2 text-[15px] font-light text-[#0A1018] focus:border-[#C9A84C] outline-none transition-all appearance-none cursor-pointer"
                                                value={minRating}
                                                onChange={(e) => onMinRatingChange(e.target.value)}
                                            >
                                                <option value="">Tất cả hạng bậc</option>
                                                <option value="4.5">4.5+ ★ (Bậc thầy)</option>
                                                <option value="4.0">4.0+ ★ (Chuyên gia)</option>
                                                <option value="3.5">3.5+ ★ (Cố vấn)</option>
                                            </select>
                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-[#0A1018]/40">
                                                <SlidersHorizontal className="w-3.5 h-3.5 rotate-90" strokeWidth={1} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-end gap-3">
                                        <button
                                            onClick={onReset}
                                            className="flex-1 h-[50px] flex items-center justify-center gap-3 border border-[#0A1018]/10 text-[#0A1018]/80 text-[10px] uppercase tracking-[0.14em] font-normal rounded-[2px] transition-all duration-700 hover:bg-[#58181F]/5 hover:text-[#58181F] hover:border-[#58181F]/20"
                                        >
                                            <X className="w-3.5 h-3.5" /> Thiết lập lại
                                        </button>
                                        <button
                                            onClick={() => { onSearch(); setShowFilters(false); }}
                                            className="flex-1 h-[50px] bg-[#C9A84C] text-[#0A1018] text-[10px] uppercase tracking-[0.14em] font-normal rounded-[2px] transition-all duration-700 hover:bg-[#0A1018] hover:text-[#F5F0E8] shadow-lg shadow-[#C9A84C]/10"
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
