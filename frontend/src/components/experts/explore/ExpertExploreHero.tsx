'use client';

import React from 'react';
import { Search, ArrowUpDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface ExpertExploreHeroProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onSearchSubmit: () => void;
    sortBy: string;
    onSortChange: (sort: string) => void;
}

const EASING: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const ExpertExploreHero: React.FC<ExpertExploreHeroProps> = ({
    searchQuery,
    onSearchChange,
    onSearchSubmit,
    sortBy,
    onSortChange,
}) => {
    return (
        <div className="bg-[#0A1018] pt-24 pb-32 px-8 relative overflow-hidden">
            {/* Cinematic Background Elements */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#C9A84C]/5 blur-[120px] rounded-full -mr-96 -mt-96" />
            <div className="absolute bottom-0 left-0 w-full h-[0.5px] bg-gradient-to-r from-transparent via-[#C9A84C]/20 to-transparent" />

            <div className="max-w-[1400px] mx-auto relative z-10">
                <div className="flex flex-col gap-16">
                    {/* Hero Content */}
                    <div className="space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, ease: EASING }}
                            className="flex items-center gap-4"
                        >
                            <div className="w-8 h-[0.5px] bg-[#C9A84C]/40" />
                            <span className="font-sans text-[10px] text-[#C9A84C] tracking-[0.4em] uppercase">Elite Discovery</span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1.2, ease: EASING, delay: 0.1 }}
                            className="text-[clamp(40px,5vw,68px)] font-serif italic font-light text-[#F5F0E8] tracking-tight leading-[1.20]"
                        >
                            Khai phá tiềm năng <br />
                            <span className="text-[#C9A84C]">Hội tụ Tinh hoa</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1.2, ease: EASING, delay: 0.2 }}
                            className="text-[#F5F0E8]/80 text-[17px] max-w-xl font-light leading-[1.85] font-sans tracking-[0.02em]"
                        >
                            Kết nối trực tiếp với các chuyên gia hàng đầu từ Google, VinGroup, MoMo...
                            Những người sẵn sàng đồng hành cùng lộ trình bứt phá của bạn.
                        </motion.p>
                    </div>

                    {/* Search & Sort Area */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.2, ease: EASING, delay: 0.3 }}
                        className="w-full"
                    >
                        <div className="bg-[#FAF7F2]/5 backdrop-blur-2xl p-2 border border-[#C9A84C]/20 rounded-[2px] flex flex-col md:flex-row gap-2 items-center shadow-2xl">
                            <div className="relative flex-1 group w-full">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F5F0E8]/60 group-focus-within:text-[#C9A84C] transition-colors" strokeWidth={1.5} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit()}
                                    placeholder="Tìm tên, kỹ năng (React, Marketing)..."
                                    className="w-full bg-transparent border-none text-[#F5F0E8] py-4 pl-14 pr-6 focus:ring-0 transition-all placeholder:text-[#F5F0E8]/40 font-light text-[15px] tracking-[0.02em] font-sans"
                                />
                            </div>

                            <div className="h-8 w-[0.5px] bg-[#C9A84C]/20 hidden md:block self-center" />

                            <div className="relative min-w-[200px] group/select w-full md:w-auto px-4">
                                <ArrowUpDown className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F5F0E8]/60 group-focus-within/select:text-[#C9A84C] transition-colors" strokeWidth={1} />
                                <select
                                    value={sortBy}
                                    onChange={(e) => onSortChange(e.target.value)}
                                    className="w-full bg-transparent border-none text-[#F5F0E8]/80 py-4 pl-10 pr-10 appearance-none focus:ring-0 transition-all font-normal text-[10px] uppercase tracking-[0.2em] cursor-pointer font-sans"
                                >
                                    <option value="default" className="bg-[#0A1018]">Mặc định</option>
                                    <option value="price_asc" className="bg-[#0A1018]">Phí đầu tư</option>
                                    <option value="rating_desc" className="bg-[#0A1018]">Đánh giá VIP</option>
                                </select>
                            </div>

                            <button
                                onClick={onSearchSubmit}
                                className="w-full md:w-auto bg-[#C9A84C] hover:bg-[#090C12] hover:text-[#F5F0E8] border border-transparent hover:border-[#C9A84C]/40 text-[#0A1018] font-normal px-12 py-4 transition-all duration-700 active:scale-95 text-[11px] uppercase tracking-[0.14em] whitespace-nowrap rounded-[2px] font-sans shadow-lg shadow-[#000]/20"
                            >
                                Truy vấn
                            </button>
                        </div>

                        {/* Quick Tags - Subtle */}
                        <div className="flex flex-wrap items-center gap-6 mt-6 px-4">
                            <span className="text-[10px] font-normal text-[#F5F0E8]/40 uppercase tracking-[0.2em] font-sans">Gợi ý tinh hoa:</span>
                            {['#Blockchain', '#GenerativeAI', '#Growth'].map(tag => (
                                <button key={tag} className="text-[10px] font-normal text-[#F5F0E8]/70 hover:text-[#C9A84C] transition-colors uppercase tracking-widest font-sans">
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};
