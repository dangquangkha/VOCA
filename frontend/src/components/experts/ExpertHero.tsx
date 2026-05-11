'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const EASING: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const ExpertHero = () => {
    return (
        <header style={{
            background: '#29B6F6',
            padding: '72px 0 80px',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Subtle texture — không phải overlay, chỉ là nhẹ */}
            <div style={{
                position: 'absolute',
                top: 0, right: 0,
                width: '60%',
                height: '100%',
                background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.08) 100%)',
                pointerEvents: 'none',
            }} />

            <div style={{
                maxWidth: 1400,
                margin: '0 auto',
                padding: '0 32px',
                position: 'relative',
                zIndex: 10,
            }}>
                {/* Label */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.9, ease: EASING }}
                    style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}
                >
                    <div style={{ width: 32, height: 1, background: 'rgba(255,255,255,0.6)' }} />
                    <span style={{
                        fontSize: 9,
                        fontWeight: 500,
                        color: '#FFFFFF',
                        letterSpacing: '0.5em',
                        textTransform: 'uppercase',
                        opacity: 0.85,
                    }}>
                        THE ELITE PROTOCOL
                    </span>
                </motion.div>

                {/* Heading */}
                <motion.h1
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.1, ease: EASING, delay: 0.1 }}
                    style={{
                        fontSize: 'clamp(40px, 5.5vw, 80px)',
                        fontWeight: 300,
                        color: '#FFFFFF',
                        letterSpacing: '-0.01em',
                        lineHeight: 1.1,
                        margin: 0,
                        marginBottom: 20,
                    }}
                >
                    Đặc quyền hội dẫn<br />
                    <span style={{
                        fontWeight: 600,
                        color: '#FFFFFF',
                        fontSize: 'clamp(40px, 5.5vw, 80px)',
                    }}>
                        Nhân tài Kiệt xuất
                    </span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: EASING, delay: 0.25 }}
                    style={{
                        fontSize: 16,
                        fontWeight: 300,
                        color: 'rgba(255,255,255,0.8)',
                        letterSpacing: '0.03em',
                        lineHeight: 1.8,
                        maxWidth: 560,
                        margin: '0 0 40px',
                    }}
                >
                    Kết nối trực tiếp cùng những cố vấn chiến lược để kiến tạo lộ trình công danh bền vững. Tinh hoa trí tuệ, minh bạch và an toàn tuyệt đối.
                </motion.p>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, ease: EASING, delay: 0.4 }}
                >
                    <Link
                        href="/dashboard/experts/explore"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 16,
                            fontSize: 9,
                            fontWeight: 600,
                            color: '#FFE900',
                            letterSpacing: '0.5em',
                            textTransform: 'uppercase',
                            textDecoration: 'none',
                            opacity: 0.9,
                        }}
                    >
                        <span>KHÁM PHÁ TINH HOA</span>
                        <div style={{ width: 40, height: 1, background: '#FFE900' }} />
                    </Link>
                </motion.div>
            </div>
        </header>
    );
};
