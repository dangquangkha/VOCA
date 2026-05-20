'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ArrowRight, FileCheck, Wallet, Sparkles, X } from 'lucide-react';
import ShinkaiBackground from '@/components/special/ShinkaiBackground';

interface RoadmapCompletionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerateReport: () => void;
    onViewWallet: () => void;
    totalCreditsEarned: number;
}

const EASING = [0.22, 1, 0.36, 1] as const;

/**
 * RoadmapCompletionModal — VOCA Design System
 * 
 * Enforces Square Corners, High Contrast, and Editorial Layout.
 */
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
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-6"
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-white/60 backdrop-blur-3xl"
                    />

                    {/* Background Visual (Scoped inside modal) */}
                    <ShinkaiBackground 
                        className="absolute inset-0"
                        imagePath="/roadmap-bg.svg" 
                        showFish={true} 
                        overlayColor="rgba(255, 255, 255, 0.2)" 
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        transition={{ duration: 0.8, ease: EASING }}
                        className="relative w-full max-w-4xl bg-white border-8 border-[#00A4FD] shadow-[0_64px_128px_rgba(0,164,253,0.3)] overflow-y-auto max-h-[90vh] custom-scrollbar"
                        style={{ borderRadius: 0 }}
                    >
                        {/* High-Contrast Strip */}
                        <div className="absolute top-0 left-0 w-full h-2 bg-[#00A4FD]" />
                        
                        <div className="relative z-10 p-12 md:p-20 flex flex-col items-center text-center">
                            {/* Close Button */}
                            <button 
                                onClick={onClose}
                                className="absolute top-8 right-10 text-black/40 hover:text-[#00A4FD] transition-all duration-300 p-2 hover:scale-110 active:scale-95"
                            >
                                <X size={32} strokeWidth={1} />
                            </button>

                            {/* Section Label */}
                            <div className="flex items-center gap-4 mb-12">
                                <div className="w-12 h-[1px] bg-[#00A4FD]" />
                                <span className="text-[11px] font-black text-[#00A4FD] uppercase tracking-[0.6em]">
                                    Milestone Reached
                                </span>
                                <div className="w-12 h-[1px] bg-[#00A4FD]" />
                            </div>

                            {/* Main Content Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-16 items-center">
                                {/* Left: Visual/Icon */}
                                <div className="md:col-span-5 flex flex-col items-center gap-8">
                                    <motion.div
                                        initial={{ scale: 0.8, rotate: -10 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        className="w-48 h-48 bg-[#00A4FD] flex items-center justify-center text-yellow-300 shadow-[20px_20px_0_0_rgba(0,164,253,0.15)] relative"
                                    >
                                        <Trophy size={80} strokeWidth={1.5} />
                                        <motion.div 
                                            animate={{ 
                                                rotate: 360
                                            }}
                                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                            className="absolute -top-6 -right-6 text-[#00A4FD]/60"
                                        >
                                            <Sparkles size={48} />
                                        </motion.div>
                                    </motion.div>
                                    
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-black/40 uppercase tracking-[0.3em]">
                                            Status: Mastered
                                        </p>
                                        <div className="h-1 w-32 bg-black/5 relative overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: "100%" }}
                                                transition={{ duration: 1.5, delay: 0.5 }}
                                                className="absolute top-0 left-0 h-full bg-[#00A4FD]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Text & Actions */}
                                <div className="md:col-span-7 text-left space-y-10">
                                    <div className="space-y-6">
                                        <h2 className="text-5xl md:text-7xl font-garamond italic font-bold text-black leading-tight tracking-tight">
                                            Hành trình <br/> tuyệt diệu
                                        </h2>
                                        <p className="text-black/60 text-xl font-garamond italic leading-relaxed max-w-md">
                                            "Mọi nỗ lực đã kết tinh thành di sản tri thức. Bạn đã thấu hiểu bản thân sau 30 ngày chinh phục Ikigai."
                                        </p>
                                    </div>

                                    {/* Rewards Block */}
                                    <div 
                                        className="bg-sky-50 border border-sky-100 p-8 flex items-center justify-between group cursor-pointer hover:bg-sky-100/50 transition-all duration-500" 
                                        onClick={onViewWallet}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => e.key === 'Enter' && onViewWallet()}
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-[#00A4FD] flex items-center justify-center text-white shadow-lg group-hover:shadow-sky-200 transition-all">
                                                <Wallet size={32} strokeWidth={1.5} />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-sky-600/60 uppercase tracking-[0.4em] mb-1">ACCUMULATED</p>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-4xl font-garamond italic font-bold text-sky-600">{totalCreditsEarned}</span>
                                                    <span className="text-[10px] font-black text-sky-600/40 uppercase tracking-widest">CREDITS</span>
                                                </div>
                                            </div>
                                        </div>
                                        <ArrowRight className="text-sky-300 group-hover:text-[#00A4FD] group-hover:translate-x-2 transition-all duration-500" size={24} />
                                    </div>

                                    {/* Buttons */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <button
                                            onClick={onGenerateReport}
                                            className="h-16 bg-[#00A4FD] text-yellow-300 font-black uppercase tracking-[0.4em] text-[10px] flex items-center justify-center gap-3 hover:bg-[#0086D4] transition-all shadow-[0_15px_30px_-10px_rgba(0,164,253,0.4)] hover:scale-[1.02] active:scale-95"
                                        >
                                            XUẤT BẢN DI SẢN <FileCheck size={18} />
                                        </button>
                                        <button
                                            onClick={onClose}
                                            className="h-16 border-2 border-black/10 text-black/40 font-black uppercase tracking-[0.4em] text-[10px] hover:border-black hover:text-black transition-all hover:scale-[1.02] active:scale-95"
                                        >
                                            TIẾP TỤC
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
