'use client';

import React from 'react';
import { motion } from 'framer-motion';
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
                className="max-w-7xl mx-auto space-y-6 pb-12"
            >
                {/* Section 1: Revenue Summary (Full Width) */}
                <motion.div variants={item} className="w-full">
                    <RevenueSummary />
                </motion.div>

                {/* Section 2: Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Next Session - 4 cols */}
                    <motion.div variants={item} className="lg:col-span-4 h-full">
                        <NextSession />
                    </motion.div>

                    {/* Withdrawal & KYC - 4 cols */}
                    <motion.div variants={item} className="lg:col-span-4 h-full">
                        <WithdrawalKYC />
                    </motion.div>

                    {/* Recent Activity - 4 cols */}
                    <motion.div variants={item} className="lg:col-span-4 h-full">
                        <RecentActivityList />
                    </motion.div>
                </div>

                {/* Section 3: Performance Insights (Secondary) */}
                <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                            4.9
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-tight">Đánh giá trung bình</p>
                            <p className="text-sm font-bold text-slate-900 mt-0.5">Trên 128 nhận xét</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center gap-4 text-emerald-600">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center font-black">
                            98%
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-tight">Tỷ lệ hoàn thành</p>
                            <p className="text-sm font-bold text-slate-900 mt-0.5">Rất ấn tượng!</p>
                        </div>
                    </div>

                    <div className="bg-[#0F172A] rounded-3xl p-6 shadow-sm flex items-center justify-between group cursor-pointer hover:bg-slate-800 transition-colors">
                        <div>
                            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest leading-tight">Mẹo tăng thu nhập</p>
                            <p className="text-sm font-bold text-white mt-0.5">Tối ưu hồ sơ chuyên gia</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white group-hover:translate-x-1 transition-transform">
                            →
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </ExpertDashboardLayout>
    );
}
