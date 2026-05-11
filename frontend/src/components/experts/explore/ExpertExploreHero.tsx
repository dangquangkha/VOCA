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
        <div className="bg-white pt-24 pb-32 px-8 relative overflow-hidden border-b-[6px] border-[#00A4FD]/10">
            {/* Cinematic Background Elements (Light Mode) */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#00A4FD]/5 blur-[120px] rounded-full -mr-96 -mt-96" />
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#00A4FD]/20 to-transparent" />

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
                            <div className="w-8 h-[2px] bg-[#00A4FD]" />
                            <span className="font-sans text-[10px] text-[#00A4FD] font-black tracking-[0.4em] uppercase">Elite Discovery</span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1.2, ease: EASING, delay: 0.1 }}
                            className="text-[clamp(40px,5vw,68px)] font-serif italic font-bold text-black tracking-tight leading-[1.20]"
                        >
                            Khai phá tiềm năng <br />
                            <span className="text-[#00A4FD]">Hội tụ Tinh hoa</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1.2, ease: EASING, delay: 0.2 }}
                            className="text-black/60 text-[17px] max-w-xl font-bold leading-[1.85] font-sans tracking-[0.02em]"
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
                        <div className="bg-[#F5F8FF] p-2 border-[6px] border-[#00A4FD]/40 hover:border-[#00A4FD] transition-all duration-700 flex flex-col md:flex-row gap-2 items-center shadow-2xl">
                            <div className="relative flex-1 group w-full">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 group-focus-within:text-[#00A4FD] transition-colors" strokeWidth={2} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit()}
                                    placeholder="Tìm tên, kỹ năng (React, Marketing)..."
                                    className="w-full bg-transparent border-none text-black py-4 pl-14 pr-6 focus:ring-0 transition-all placeholder:text-black/30 font-bold text-[15px] tracking-[0.02em] font-sans"
                                />
                            </div>

                            <div className="h-8 w-[2px] bg-[#00A4FD]/20 hidden md:block self-center" />

                            <div className="relative min-w-[200px] group/select w-full md:w-auto px-4">
                                <ArrowUpDown className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 group-focus-within/select:text-[#00A4FD] transition-colors" strokeWidth={2} />
                                <select
                                    value={sortBy}
                                    onChange={(e) => onSortChange(e.target.value)}
                                    className="w-full bg-transparent border-none text-black/80 py-4 pl-10 pr-10 appearance-none focus:ring-0 transition-all font-black text-[10px] uppercase tracking-[0.2em] cursor-pointer font-sans"
                                >
                                    <option value="default" className="bg-white">Mặc định</option>
                                    <option value="price_asc" className="bg-white">Phí đầu tư</option>
                                    <option value="rating_desc" className="bg-white">Đánh giá VIP</option>
                                </select>
                            </div>

                            <button
                                onClick={onSearchSubmit}
                                className="w-full md:w-auto bg-[#00A4FD] hover:bg-black text-white font-black px-12 py-4 transition-all duration-700 active:scale-95 text-[11px] uppercase tracking-[0.14em] whitespace-nowrap rounded-0 font-sans shadow-lg shadow-[#00A4FD]/20"
                            >
                                Truy vấn
                            </button>
                        </div>

                        {/* Quick Tags - Subtle */}
                        <div className="flex flex-wrap items-center gap-6 mt-6 px-4">
                            <span className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em] font-sans">Gợi ý tinh hoa:</span>
                            {['#Blockchain', '#GenerativeAI', '#Growth'].map(tag => (
                                <button key={tag} className="text-[10px] font-black text-[#00A4FD]/70 hover:text-black transition-colors uppercase tracking-widest font-sans">
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
