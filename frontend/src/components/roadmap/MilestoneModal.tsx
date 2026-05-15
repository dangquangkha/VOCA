'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Star, Wallet, ArrowRight } from 'lucide-react';

interface MilestoneModalProps {
    isOpen: boolean;
    onClose: () => void;
    dayNumber: number;
    rewardAmount: number;
    onViewWallet: () => void;
}

const EASING = [0.22, 1, 0.36, 1];

export default function MilestoneModal({ 
    isOpen, 
    onClose, 
    dayNumber, 
    rewardAmount,
    onViewWallet
}: MilestoneModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-xl"
                    />
                    
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ duration: 0.6, ease: EASING as any }}
                        className="relative w-full max-w-xl bg-white border-8 border-[#00A4FD] shadow-[0_64px_128px_rgba(0,164,253,0.3)] overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-2 bg-[#00A4FD]" />
                        
                        <div className="p-12 text-center space-y-8">
                            <button 
                                onClick={onClose}
                                className="absolute top-6 right-6 text-black/20 hover:text-[#00A4FD] transition-colors p-2"
                            >
                                <X size={24} />
                            </button>

                            <div className="flex items-center gap-4 justify-center">
                                <div className="w-8 h-[1px] bg-[#00A4FD]/30" />
                                <span className="text-[10px] font-black text-[#00A4FD] uppercase tracking-[0.5em]">
                                    Milestone Reached
                                </span>
                                <div className="w-8 h-[1px] bg-[#00A4FD]/30" />
                            </div>

                            <div className="relative inline-block">
                                <motion.div
                                    initial={{ scale: 0.8, rotate: -10 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    className="w-32 h-32 bg-[#00A4FD] flex items-center justify-center text-yellow-300 shadow-[12px_12px_0_0_rgba(0,164,253,0.1)] mx-auto"
                                >
                                    <Trophy size={56} strokeWidth={1.5} />
                                </motion.div>
                                <motion.div 
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                    className="absolute -top-4 -right-4 text-[#00A4FD]/40"
                                >
                                    <Star size={32} />
                                </motion.div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-garamond text-5xl text-[#0046EA] italic font-bold leading-tight">
                                    Ngày thứ {dayNumber}
                                </h3>
                                <p className="text-black/60 text-lg font-garamond italic max-w-sm mx-auto">
                                    Bạn đã bền bỉ vượt qua thử thách. Một phần quà xứng đáng dành cho ý chí của bạn.
                                </p>
                            </div>

                            <div 
                                className="bg-sky-50 border border-sky-100 p-6 flex items-center justify-between group cursor-pointer hover:bg-sky-100/50 transition-all duration-500 text-left"
                                onClick={onViewWallet}
                            >
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 bg-[#00A4FD] flex items-center justify-center text-white shadow-lg">
                                        <Wallet size={24} strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-sky-600/60 uppercase tracking-[0.3em] mb-0.5">REWARD GRANTED</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-garamond italic font-bold text-sky-600">+{rewardAmount}</span>
                                            <span className="text-[9px] font-black text-sky-600/40 uppercase tracking-widest">CREDITS</span>
                                        </div>
                                    </div>
                                </div>
                                <ArrowRight className="text-sky-300 group-hover:text-[#00A4FD] group-hover:translate-x-1 transition-all duration-500" size={20} />
                            </div>

                            <button
                                onClick={onClose}
                                className="w-full h-14 border-2 border-black/5 text-[10px] font-black uppercase tracking-widest hover:border-[#00A4FD] hover:text-[#00A4FD] transition-all"
                            >
                                Tiếp tục hành trình
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
