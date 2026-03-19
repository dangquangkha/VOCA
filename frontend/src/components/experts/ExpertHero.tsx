'use client';

import React from 'react';
import { motion } from 'framer-motion';

const EASING: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const ExpertHero = () => {
    return (
        <header className="relative pt-32 pb-44 overflow-hidden bg-[#0A1018]">
            {/* Cinematic Background Elements */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#C9A84C]/5 blur-[120px] rounded-full -mr-96 -mt-96 z-0" />
            <div className="absolute bottom-0 left-0 w-full h-[0.5px] bg-gradient-to-r from-transparent via-[#C9A84C]/20 to-transparent z-0" />

            {/* Video Background */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover opacity-60 scale-105"
                >
                    <source src="/heroEx.mp4" type="video/mp4" />
                </video>
                {/* Refined Luxury Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#0A1018]/10 via-[#0A1018]/40 to-[#0A1018]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#0A1018_100%)] opacity-40" />
            </div>

            <div className="relative z-10 max-w-[1400px] mx-auto px-8">
                <div className="flex flex-col gap-12">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.2, ease: EASING }}
                        className="flex items-center gap-4"
                    >
                        <div className="w-8 h-[0.5px] bg-[#C9A84C]/40" />
                        <span className="font-sans text-[10px] text-[#C9A84C] tracking-[0.4em] uppercase">Trusted Advisors</span>
                    </motion.div>

                    <div className="space-y-10 max-w-4xl">
                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1.4, ease: EASING, delay: 0.1 }}
                            className="text-[clamp(40px,5vw,68px)] font-serif italic font-light text-[#F5F0E8] tracking-tight leading-[1.20]"
                        >
                            Đặc quyền hội dẫn <br />
                            <span className="text-[#C9A84C]">Nhân tài Kiệt xuất</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1.2, ease: EASING, delay: 0.3 }}
                            className="text-[#F5F0E8]/80 text-[17px] md:text-[17px] font-light leading-[1.85] max-w-xl font-sans tracking-[0.02em]"
                        >
                            Kết nối trực tiếp cùng những cố vấn chiến lược để kiến tạo lộ trình công danh bền vững.
                            Minh bạch, an toàn và tinh hoa.
                        </motion.p>
                    </div>
                </div>
            </div>
        </header>
    );
};
