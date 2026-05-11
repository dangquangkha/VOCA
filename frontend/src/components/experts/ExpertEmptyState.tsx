'use client';

import React from 'react';
import { SearchX, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

interface ExpertEmptyStateProps {
    onReset: () => void;
}

export function ExpertEmptyState({ onReset }: ExpertEmptyStateProps) {
    return (
        <div className="relative flex flex-col items-center justify-center py-32 px-6 text-center overflow-hidden neon-hologram rounded-3xl border-2 border-dashed border-[#0046EA]/30 group">
            {/* Watermark Background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.03]">
                <p className="font-sans text-[#0F0C17]/40 text-[11px] uppercase tracking-[0.2em] italic">&quot;Hành trình vạn dặm bắt đầu từ một bước chân.&quot;</p>
                <span className="text-[12rem] font-black uppercase tracking-tighter text-[#0F0C17]/5 rotate-12">
                    Empty_Void
                </span>
            </div>

            {/* Elegant Illustration Container */}
            <div className="relative mb-16 w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0 bg-[#0046EA]/10 blur-[100px] rounded-full animate-pulse"
                />
                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                    className="relative z-10 w-full h-full border border-[#0046EA]/20 rounded-full flex items-center justify-center bg-[#0F0C17]/5 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,70,234,0.1)] overflow-hidden group-hover:border-[#0046EA]/40 transition-colors duration-700"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0046EA]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                    <SearchX className="w-24 h-24 md:w-32 md:h-32 text-[#0046EA] animate-pulse relative z-10 group-hover:scale-110 transition-transform duration-1000" strokeWidth={1} />
                </motion.div>
            </div>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="relative z-10 space-y-8 max-w-xl"
            >
                <h3 className="text-4xl md:text-5xl font-black italic text-[#0F0C17] tracking-tighter leading-tight uppercase drop-shadow-sm">
                    Tìm kiếm của bạn quá <span className="text-[#0046EA]">&quot;Độc bản&quot;</span>
                </h3>
                <p className="text-[#0F0C17]/60 font-bold text-sm md:text-base uppercase tracking-[0.2em] leading-relaxed max-w-md mx-auto">
                    Hiện chưa có chuyên gia nào tương thích với bộ lọc này. Hãy thử điều chỉnh tiêu chuẩn để khám phá thêm nhiều nhân tài.
                </p>
            </motion.div>

            <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                onClick={onReset}
                className="mt-16 z-10 px-12 py-6 bg-transparent border border-[#0046EA] text-[#0046EA] hover:bg-[#0046EA] hover:text-[#FFE900] hover:drop-shadow-sm font-black text-xs uppercase tracking-[0.3em] transition-all duration-500 flex items-center gap-5 group active:scale-95"
            >
                <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-1000" />
                Làm mới bộ lọc
            </motion.button>
        </div>
    );
}
