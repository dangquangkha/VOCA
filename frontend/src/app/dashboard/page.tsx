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
                <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-12 font-dm-sans">
                    <div className="lg:col-span-2 bg-white/60 border border-[#C9A84C]/20 p-12 backdrop-blur-xl shadow-xl">
                        <div className="flex items-center justify-between mb-12">
                            <h3 className="font-garamond text-3xl text-[#0D1B2A] italic">Tiến trình đào tạo</h3>
                            <Link href="/dashboard/roadmap" className="text-[10px] font-bold text-[#C9A84C] uppercase tracking-[0.5em] hover:text-[#0D1B2A] transition-all border-b border-transparent hover:border-[#0D1B2A] pb-1">
                                Chi tiết lộ trình
                            </Link>
                        </div>
                        <div className="space-y-8">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex items-center gap-10 p-8 hover:bg-white/80 transition-all duration-700 cursor-pointer group border-b border-[#0D1B2A]/5 last:border-0 shadow-sm hover:shadow-md">
                                    <div className="w-14 h-14 border border-[#C9A84C]/30 flex items-center justify-center text-[#C9A84C]/60 group-hover:text-[#C9A84C] group-hover:border-[#C9A84C] group-hover:bg-[#C9A84C]/5 transition-all duration-700 font-garamond text-base shadow-inner">
                                        0{i}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[12px] font-bold text-[#0D1B2A] uppercase tracking-[0.3em] mb-3">Module {i}</p>
                                        <p className="text-[15px] font-light text-[#0D1B2A]/70 font-dm-sans leading-relaxed">Kiến tạo nền tảng và nhận thức bản sắc riêng biệt trong hành trình vinh quang.</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-3">
                                        <span className="text-[11px] font-bold text-[#C9A84C] tracking-widest">80%</span>
                                        <div className="w-24 h-[2px] bg-[#0D1B2A]/5 overflow-hidden shadow-inner">
                                            <div className="h-full bg-gradient-to-r from-[#C9A84C]/50 to-[#C9A84C] w-[80%]" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-[#0D1B2A] p-12 flex flex-col justify-between relative overflow-hidden group shadow-2xl h-[450px] lg:h-auto border border-[#C9A84C]/10">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-[#C9A84C]/10 blur-[100px] -mr-20 -mt-20 opacity-50" />
                        <div className="space-y-10 relative z-10">
                            <div className="w-16 h-16 border border-[#C9A84C]/30 flex items-center justify-center bg-white/5 backdrop-blur-sm group-hover:border-[#C9A84C] transition-all duration-700">
                                <Compass size={28} color="#C9A84C" strokeWidth={1} className="group-hover:scale-110 transition-transform duration-700" />
                            </div>
                            <h3 className="font-garamond text-4xl text-[#F5F0E8] leading-tight font-light">Mở rộng <br /><span className="italic font-normal text-[#C9A84C]">Tầm nhìn Chuyên gia</span></h3>
                            <p className="text-[11px] text-[#F5F0E8]/50 font-bold uppercase tracking-[0.4em] leading-loose max-w-[200px]">
                                Gặp gỡ những người dẫn đầu để chắt lọc tinh hoa kinh nghiệm.
                            </p>
                        </div>

                        <Link href="/dashboard/experts" className="relative z-10">
                            <button className="w-full py-6 bg-[#C9A84C] text-[#0D1B2A] text-[11px] font-bold tracking-[0.5em] uppercase transition-all duration-700 hover:bg-[#F5F0E8] shadow-xl hover:shadow-[#C9A84C]/20">
                                Kết nối ngay
                            </button>
                        </Link>
                    </div>
                </motion.div>
            </motion.div>
        </DashboardLayout>
    );
}
