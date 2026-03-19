'use client';

import React from 'react';
import { SearchX, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

interface ExpertEmptyStateProps {
    onReset: () => void;
}

export function ExpertEmptyState({ onReset }: ExpertEmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-32 px-6 text-center">
            {/* Elegant Illustration Container */}
            <div className="relative mb-16 w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0 bg-[#C9A84C]/5 blur-[100px] rounded-full animate-pulse"
                />
                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                    className="relative z-10 w-full h-full border border-[#C9A84C]/20 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-2xl shadow-3xl overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#F5F0E8] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                    <SearchX className="w-24 h-24 md:w-32 md:h-32 text-[#C9A84C]/30 relative z-10 group-hover:scale-110 transition-transform duration-1000" strokeWidth={1} />
                </motion.div>
            </div>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="space-y-8 max-w-xl"
            >
                <h3 className="text-4xl md:text-5xl font-garamond italic text-[#0D1B2A] tracking-tight leading-tight">
                    Tìm kiếm của bạn quá "độc bản"
                </h3>
                <p className="text-[#0D1B2A]/60 font-bold text-sm md:text-base uppercase tracking-[0.2em] leading-relaxed max-w-md mx-auto">
                    Hiện chưa có chuyên gia nào tương thích với bộ lọc này. Hãy thử điều chỉnh tiêu chuẩn để khám phá thêm nhiều nhân tài.
                </p>
            </motion.div>

            <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                onClick={onReset}
                className="mt-16 px-12 py-6 bg-[#0D1B2A] text-[#F5F0E8] font-bold text-xs uppercase tracking-[0.3em] shadow-2xl transition-all duration-700 hover:bg-[#C9A84C] hover:text-[#0D1B2A] flex items-center gap-5 group active:scale-95 shadow-[#0D1B2A]/20"
            >
                <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-1000" />
                Làm mới bộ lọc
            </motion.button>
        </div>
    );
}
