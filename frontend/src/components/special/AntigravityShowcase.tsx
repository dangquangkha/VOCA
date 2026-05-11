'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

const EASING = [0.22, 1, 0.36, 1] as any;

export default function AntigravityShowcase() {
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    return (
        <section className="relative min-h-screen overflow-hidden bg-antigravity-deep font-sans">
            {/* Background Image with Parallax/Turbulence */}
            <motion.div 
                initial={{ scale: 1.1, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.4 }}
                transition={{ duration: 2.5, ease: EASING }}
                className="absolute inset-0 z-0"
            >
                <Image 
                    src="/images/antigravity_hero.png" 
                    alt="Antigravity Background" 
                    fill 
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-antigravity-deep/40 via-transparent to-antigravity-deep" />
            </motion.div>

            {/* Geometric Overlays (Cubist influence) */}
            <div className="absolute inset-0 z-10 pointer-events-none">
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, rotate: 0 }}
                        animate={{ 
                            opacity: [0, 0.1, 0],
                            rotate: [0, 45, 90],
                            scale: [1, 1.2, 1]
                        }}
                        transition={{ 
                            duration: 10 + i * 2, 
                            repeat: Infinity, 
                            ease: "linear" 
                        }}
                        className="absolute border border-antigravity-gold/20"
                        style={{
                            width: `${200 + i * 100}px`,
                            height: `${200 + i * 100}px`,
                            top: `${10 + i * 15}%`,
                            left: `${20 + (i % 3) * 20}%`,
                            clipPath: i % 2 === 0 ? 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' : 'polygon(25% 0%, 75% 0%, 100% 100%, 0% 100%)'
                        }}
                    />
                ))}
            </div>

            {/* Main Content */}
            <div className="relative z-20 flex flex-col items-center justify-center min-h-screen text-center px-8">
                <motion.div
                    initial={{ y: 60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 1.5, ease: EASING, delay: 0.5 }}
                    className="max-w-4xl"
                >
                    <div className="flex items-center justify-center gap-6 mb-12">
                        <span className="w-12 h-[1px] bg-antigravity-gold/40" />
                        <span className="text-[10px] tracking-[0.6em] uppercase text-antigravity-gold">Chapter Zero</span>
                        <span className="w-12 h-[1px] bg-antigravity-gold/40" />
                    </div>

                    <h1 className="font-serif text-7xl md:text-9xl text-ivory mb-12 leading-tight">
                        Vượt Qua <br />
                        <span className="italic font-light text-antigravity-gold">Trọng Lực.</span>
                    </h1>

                    <div className="w-px h-24 bg-gradient-to-b from-antigravity-gold/60 to-transparent mx-auto mb-12" />

                    <p className="text-xl md:text-2xl text-ivory/60 font-light max-w-2xl mx-auto leading-relaxed mb-16">
                        Khám phá bản sắc trong một không gian nơi quy tắc cũ không còn tồn tại. 
                        Nơi nghệ thuật và trí tuệ hội tụ để giải phóng tiềm năng của bạn.
                    </p>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            suppressHydrationWarning
                            className="px-12 py-5 bg-antigravity-gold text-antigravity-deep font-bold tracking-[0.2em] uppercase rounded-sm shadow-2xl shadow-antigravity-gold/20 hover:bg-ivory transition-colors duration-500"
                        >
                            Bắt đầu hành trình
                        </motion.button>
                        <motion.button 
                            whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                            suppressHydrationWarning
                            className="px-12 py-5 border border-ivory/20 text-ivory font-light tracking-[0.2em] uppercase rounded-sm transition-all duration-500"
                        >
                            Tìm hiểu thêm
                        </motion.button>
                    </div>
                </motion.div>
            </div>

            {/* Decorative "Antigravity" floating text */}
            <motion.div 
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute right-12 top-1/2 -translate-y-1/2 vertical-text opacity-10 pointer-events-none"
            >
                <span className="text-[120px] font-serif italic text-ivory tracking-tighter leading-none">ANTIGRAVITY</span>
            </motion.div>

            {/* Floating particles/stars */}
            <div className="absolute inset-0 pointer-events-none">
                {isMounted && [...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ 
                            x: Math.random() * 100 + "%", 
                            y: "110%", 
                            opacity: Math.random() 
                        }}
                        animate={{ 
                            y: "-10%",
                            opacity: [0, 1, 0]
                        }}
                        transition={{ 
                            duration: 5 + Math.random() * 10, 
                            repeat: Infinity, 
                            delay: Math.random() * 5 
                        }}
                        className="absolute w-1 h-1 bg-antigravity-star rounded-full blur-[1px]"
                    />
                ))}
            </div>
            
            <style jsx>{`
                .vertical-text {
                    writing-mode: vertical-rl;
                    transform: rotate(180deg);
                }
            `}</style>
        </section>
    );
}
