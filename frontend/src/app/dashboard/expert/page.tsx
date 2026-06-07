'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import ExpertDashboardLayout from '@/components/dashboard/ExpertDashboardLayout';
import RevenueSummary from '@/components/dashboard/widgets/expert/RevenueSummary';
import NextSession from '@/components/dashboard/widgets/expert/NextSession';
import WithdrawalKYC from '@/components/dashboard/widgets/expert/WithdrawalKYC';
import RecentActivityList from '@/components/dashboard/widgets/expert/RecentActivityList';
import { useAuthStore } from '@/store/useAuthStore';

export default function ExpertDashboardPage() {
    const { user } = useAuthStore();

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <ExpertDashboardLayout>
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="max-w-[1400px] mx-auto space-y-12 pb-24"
            >
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <p className="text-[10px] text-[#00A4FD] font-black uppercase tracking-[0.5em]">Command Center</p>
                        <h1 className="text-5xl font-serif italic font-bold text-black">Bảng điều hành Chiến lược</h1>
                    </div>
                    <div className="h-12 px-6 bg-[#F5F8FF] border-[2px] border-[#00A4FD] rounded-0 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-0 bg-[#00A4FD] animate-pulse" />
                        <span className="text-[10px] font-black text-[#00A4FD] uppercase tracking-widest">Hệ thống: Ổn định</span>
                    </div>
                </div>

                {/* Section 1: Revenue Summary */}
                <motion.div variants={item} className="w-full">
                    <RevenueSummary />
                </motion.div>

                {/* Section 2: Main Operational Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Next Session */}
                    <motion.div variants={item} className="lg:col-span-4">
                        <div className="h-full bg-white border-[6px] border-[#00A4FD]/20 rounded-0 overflow-hidden hover:border-[#00A4FD] transition-all duration-700">
                            <NextSession />
                        </div>
                    </motion.div>

                    {/* Withdrawal & KYC */}
                    <motion.div variants={item} className="lg:col-span-4">
                        <div className="h-full bg-white border-[6px] border-[#00A4FD]/20 rounded-0 overflow-hidden hover:border-[#00A4FD] transition-all duration-700">
                            <WithdrawalKYC />
                        </div>
                    </motion.div>

                    {/* Recent Activity */}
                    <motion.div variants={item} className="lg:col-span-4">
                        <div className="h-full bg-white border-[6px] border-[#00A4FD]/20 rounded-0 overflow-hidden hover:border-[#00A4FD] transition-all duration-700">
                            <RecentActivityList />
                        </div>
                    </motion.div>
                </div>

                {/* Section 3: Strategic Performance Metrics */}
                <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-black rounded-0 p-10 flex items-center gap-8 group hover:border-[#00A4FD] border-[6px] border-transparent transition-all duration-700">
                        <div className="w-20 h-20 rounded-0 bg-[#FFE900] flex items-center justify-center font-serif italic font-bold text-4xl text-[#00A4FD] shadow-xl">
                            4.9
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.4em]">Đánh giá Elite</p>
                            <p className="text-lg font-serif italic text-white/80">Chiến lược gia xuất sắc</p>
                        </div>
                    </div>

                    <div className="bg-[#F5F8FF] border-[6px] border-[#00A4FD]/20 rounded-0 p-10 flex items-center gap-8 group hover:border-[#00A4FD] transition-all duration-700">
                        <div className="w-20 h-20 rounded-0 bg-white border-[2px] border-[#00A4FD]/20 flex items-center justify-center font-serif italic font-bold text-3xl text-[#00A4FD]">
                            98%
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-[#00A4FD] font-black uppercase tracking-[0.4em]">Tỷ lệ Cam kết</p>
                            <p className="text-lg font-serif italic text-black/60">Đối tác vận hành tin cậy</p>
                        </div>
                    </div>

                    <Link href="/dashboard/expert/quizzes" className="bg-white border-[6px] border-[#00A4FD]/20 rounded-0 p-10 flex items-center justify-between group hover:border-[#FFE900] transition-all duration-700 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFE900]/5 rounded-0 -mr-16 -mt-16 opacity-10 group-hover:scale-150 transition-transform duration-1000"></div>
                        <div className="relative z-10 space-y-2">
                            <p className="text-[10px] text-black font-black uppercase tracking-[0.4em]">Growth Hack</p>
                            <p className="text-2xl font-serif italic font-bold text-[#00A4FD]">Nâng cấp Hồ sơ Chiến lược</p>
                        </div>
                        <div className="w-14 h-14 rounded-0 bg-black flex items-center justify-center text-white group-hover:bg-[#FFE900] group-hover:text-black transition-all relative z-10 shadow-lg">
                            <ArrowRight size={20} strokeWidth={3} />
                        </div>
                    </Link>

                </motion.div>
            </motion.div>
        </ExpertDashboardLayout>
    );
}
