'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ArrowRight, FileCheck, Wallet, Sparkles, X, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import ShinkaiBackground from '@/components/special/ShinkaiBackground';

interface RoadmapCompletionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerateReport: () => void;
    onViewWallet: () => void;
    totalCreditsEarned: number;
}

const EASING = [0.22, 1, 0.36, 1];

export const RoadmapCompletionModal: React.FC<RoadmapCompletionModalProps> = ({
    isOpen,
    onClose,
    onGenerateReport,
    onViewWallet,
    totalCreditsEarned
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-white/20 backdrop-blur-3xl"
                    />

                    {/* Background Visual (Fixed behind modal) */}
                    <ShinkaiBackground imagePath="/roadmap-day-bg.png" showFish={true} overlayColor="rgba(255, 255, 255, 0.2)" />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 100 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 100 }}
                        transition={{ duration: 1, ease: EASING }}
                        className="relative w-full max-w-3xl bg-white/40 backdrop-blur-[64px] border border-white/80 rounded-[80px] shadow-[0_64px_128px_rgba(0,70,234,0.15)] overflow-hidden"
                    >
                        {/* Ethereal Glows */}
                        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/60 blur-[150px] rounded-full -mr-80 -mt-80 opacity-50" />
                        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#00A4FD]/20 blur-[150px] rounded-full -ml-60 -mb-60 opacity-30" />

                        <div className="relative z-10 p-20 md:p-28 flex flex-col items-center text-center">
                            {/* Close Button */}
                            <button 
                                onClick={onClose}
                                className="absolute top-16 right-16 text-[#0046EA]/20 hover:text-[#0046EA] transition-colors duration-500"
                            >
                                <X size={28} />
                            </button>

                            {/* Success Icon */}
                            <motion.div
                                initial={{ rotate: -15, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ delay: 0.5, type: "spring", damping: 15 }}
                                className="w-40 h-40 bg-[#0046EA] rounded-[48px] flex items-center justify-center text-white shadow-[0_32px_64px_rgba(0,70,234,0.3)] mb-16 relative group"
                            >
                                <Trophy size={64} strokeWidth={2} />
                                <motion.div 
                                    animate={{ 
                                        scale: [1, 1.3, 1],
                                        opacity: [0.6, 1, 0.6],
                                        rotate: [0, 90, 180, 270, 360]
                                    }}
                                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                    className="absolute -top-6 -right-6 text-[#00A4FD]"
                                >
                                    <Sparkles size={40} />
                                </motion.div>
                                <div className="absolute inset-0 bg-white/20 rounded-[48px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            </motion.div>

                            {/* Text Content */}
                            <div className="space-y-8 mb-20">
                                <h2 className="text-6xl md:text-7xl font-garamond italic font-bold text-[#0046EA] tracking-tight leading-none">
                                    Hành trình tuyệt diệu
                                </h2>
                                <div className="flex items-center justify-center gap-6">
                                    <div className="w-12 h-[1px] bg-[#00A4FD]" />
                                    <p className="text-[10px] font-black text-[#00A4FD] uppercase tracking-[0.6em] font-sans">
                                        BẠN ĐÃ CHINH PHỤC 30 NGÀY IKIGAI
                                    </p>
                                    <div className="w-12 h-[1px] bg-[#00A4FD]" />
                                </div>
                                <p className="text-[#0046EA]/50 text-2xl font-garamond italic leading-relaxed max-w-lg mx-auto">
                                    Mọi nỗ lực đã được kết tinh thành di sản tri thức. Chúc mừng bạn đã thấu hiểu chính mình.
                                </p>
                            </div>

                            {/* Reward Summary */}
                            <div className="w-full bg-white/60 backdrop-blur-xl border border-white/80 rounded-[56px] p-12 mb-20 flex flex-col md:flex-row items-center justify-between gap-12 group hover:shadow-2xl transition-all duration-1000">
                                <div className="flex items-center gap-10">
                                    <div className="w-20 h-20 bg-[#0046EA] rounded-3xl flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform duration-700">
                                        <Wallet size={32} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] font-black text-[#0046EA]/30 uppercase tracking-[0.4em] mb-2 font-mono">REWARD ACCUMULATED</p>
                                        <div className="flex items-baseline gap-3">
                                            <span className="text-5xl font-garamond italic font-bold text-[#0046EA]">{totalCreditsEarned}</span>
                                            <span className="text-[11px] font-black text-[#0046EA]/40 uppercase tracking-[0.3em]">CREDITS</span>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={onViewWallet}
                                    className="px-10 py-5 bg-[#0046EA]/5 hover:bg-[#0046EA] hover:text-white rounded-full text-[10px] font-black text-[#0046EA] uppercase tracking-[0.3em] flex items-center gap-4 transition-all duration-700"
                                >
                                    TRUY CẬP VÍ <ArrowRight size={16} />
                                </button>
                            </div>

                            {/* Action Buttons */}
                            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                                <button
                                    onClick={onGenerateReport}
                                    className="group relative h-20 bg-[#0046EA] text-white font-black uppercase tracking-[0.5em] text-[11px] rounded-full shadow-[0_24px_48px_rgba(0,70,234,0.2)] hover:bg-[#00A4FD] hover:scale-105 transition-all duration-700 overflow-hidden"
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-4">
                                        XUẤT BẢN DI SẢN <FileCheck size={20} />
                                    </span>
                                </button>
                                <button
                                    onClick={onClose}
                                    className="h-20 bg-white/40 border border-white/60 text-[#0046EA] font-black uppercase tracking-[0.5em] text-[11px] rounded-full hover:bg-white/60 transition-all duration-700"
                                >
                                    TIẾP TỤC HÀNH TRÌNH
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
