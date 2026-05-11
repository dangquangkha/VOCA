'use client';

import React from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import WelcomeBanner from '@/components/dashboard/widgets/WelcomeBanner';
import UpcomingBooking from '@/components/dashboard/widgets/UpcomingBooking';
import AIToolsQuickAccess from '@/components/dashboard/widgets/AIToolsQuickAccess';
import PersonalStats from '@/components/dashboard/widgets/PersonalStats';
import { useAuthStore } from '@/store/useAuthStore';
import { motion } from 'framer-motion';
import { Compass } from 'lucide-react';

export default function StudentDashboardPage() {
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
        <DashboardLayout>
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="max-w-7xl mx-auto space-y-12 pb-24"
            >
                {/* Section 1: Welcome Banner */}
                <motion.div variants={item} className="w-full">
                    <WelcomeBanner userName={user?.full_name || 'Học viên'} />
                </motion.div>

                {/* Section 2: Bento Grid (Highlights) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                    {/* Upcoming Booking */}
                    <motion.div variants={item} className="md:col-span-4 h-full">
                        <UpcomingBooking />
                    </motion.div>

                    {/* AI Tools */}
                    <motion.div variants={item} className="md:col-span-4 h-full">
                        <AIToolsQuickAccess />
                    </motion.div>

                    {/* Personal Stats */}
                    <motion.div variants={item} className="md:col-span-4 h-full">
                        <PersonalStats />
                    </motion.div>
                </div>

                {/* Section 3: Educational Heritage */}
                <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-12 font-sans">
                    <div className="lg:col-span-2 bg-[#0046EA] border-[6px] border-white/40 p-10 shadow-2xl transition-all duration-700 hover:border-white">
                        <div className="flex items-center justify-between mb-10">
                            <h3 className="font-serif text-3xl text-white italic font-bold">Tiến trình đào tạo</h3>
                            <Link href="/dashboard/roadmap" className="text-[10px] font-medium text-[#FFE900] uppercase tracking-[0.5em] hover:text-white transition-all border-b border-transparent hover:border-white pb-1">
                                Chi tiết lộ trình
                            </Link>
                        </div>
                        <div className="space-y-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex items-center gap-10 p-6 hover:bg-white/10 transition-all duration-700 cursor-pointer group border-b-[2px] border-white/10 last:border-0">
                                    <div className="w-14 h-14 border-2 border-white flex items-center justify-center text-white group-hover:bg-white group-hover:text-[#0046EA] transition-all duration-700 font-serif text-lg font-bold">
                                        0{i}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[11px] font-black text-white uppercase tracking-[0.3em] mb-2">Module {i}</p>
                                        <p className="text-sm font-bold text-white leading-relaxed">Kiến tạo nền tảng và nhận thức bản sắc riêng biệt trong hành trình vinh quang.</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-3">
                                        <span className="text-[11px] font-bold text-[#FFE900] tracking-widest">80%</span>
                                        <div className="w-24 h-[2px] bg-white/20 overflow-hidden">
                                            <div className="h-full bg-[#FFE900] w-[80%]" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-12 flex flex-col justify-between relative overflow-hidden group shadow-[0_12px_48px_rgba(0,164,253,0.1)] h-[450px] lg:h-auto border-[6px] border-[#00A4FD]/40 hover:border-[#00A4FD] transition-all duration-700">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-[#0046EA]/5 blur-[100px] -mr-20 -mt-20 opacity-50" />
                        <div className="space-y-10 relative z-10">
                            <div className="w-16 h-16 border-[4px] border-[#0046EA] flex items-center justify-center bg-[#0046EA]/5 backdrop-blur-sm group-hover:bg-[#0046EA] transition-all duration-700">
                                <Compass size={28} color="#0046EA" strokeWidth={2} className="group-hover:text-white group-hover:scale-110 transition-all duration-700" />
                            </div>
                            <h3 className="font-serif text-4xl text-black leading-tight font-bold">Mở rộng <br /><span className="italic font-bold text-[#0046EA]">Tầm nhìn Chuyên gia</span></h3>
                            <p className="text-[11px] text-black font-black uppercase tracking-[0.4em] leading-loose max-w-[200px]">
                                Gặp gỡ những người dẫn đầu để chắt lọc tinh hoa kinh nghiệm.
                            </p>
                        </div>

                        <Link href="/dashboard/experts" className="relative z-10">
                            <button className="w-full py-5 bg-gradient-to-r from-[#0046EA] to-[#00A4FD] text-white font-medium text-[10px] tracking-[0.5em] uppercase transition-all duration-700 hover:opacity-90 border-0 rounded-[2px] shadow-lg shadow-[#00A4FD]/10">
                                Kết nối ngay
                            </button>
                        </Link>
                    </div>
                </motion.div>
            </motion.div>
        </DashboardLayout>
    );
}
