'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Check, X, HelpCircle, ChevronDown, ShieldCheck, Lock, Sparkles, Zap, Star } from 'lucide-react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

type Segment = 'HS' | 'SV';

const EASING: [number, number, number, number] = [0.22, 1, 0.36, 1];

const PricingPage = () => {
    const router = useRouter();
    const [segment, setSegment] = useState<Segment>('SV');
    const [openFaq, setOpenFaq] = useState<number | null>(0);

    const faqs = [
        {
            q: "Credits là gì và quy đổi thế nào?",
            a: "1 Credit = 1.000 VNĐ. Có Purchased Credits (Tiền nạp, có thể rút) và Promo Credits (Tiền thưởng, chỉ dùng đặt lịch hệ thống). Hệ thống sẽ ưu tiên trừ Promo Credits trước."
        },
        {
            q: "Tiền của tôi có an toàn khi đặt lịch Mentor?",
            a: "Tuyệt đối an toàn. Hệ thống sử dụng cơ chế Escrow (Giữ tiền trung gian). Tiền chỉ giải ngân cho chuyên gia khi bạn thực sự hoàn thành buổi tư vấn và hài lòng."
        },
        {
            q: "Tôi có thể rút lại tiền đã nạp không?",
            a: "Có. Bạn có thể rút 'Purchased Credits' về đúng tài khoản ngân hàng gốc (đảm bảo an toàn tài chính và chống rửa tiền) sau 7 ngày kể từ lúc nạp."
        }
    ];

    return (
        <div className="min-h-screen bg-[#0A1018] relative overflow-hidden">
            {/* Video Background */}
            <div className="absolute top-0 left-0 w-full h-[800px] z-0 overflow-hidden pointer-events-none">
                <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover opacity-60 scale-105"
                >
                    <source src="/heroNu.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-b from-[#0A1018]/10 via-[#0A1018]/40 to-[#0A1018]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#0A1018_100%)] opacity-40" />
            </div>

            {/* Content Layer */}
            <div className="relative z-10 pt-32">
                <main className="max-w-[1400px] mx-auto px-8 pb-32">
                    {/* Header Section */}
                    <div className="text-center space-y-12 mb-28">
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 1.02 }}
                            whileInView={{ opacity: 1, y: 0, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.2, ease: EASING }}
                            className="inline-flex items-center gap-4"
                        >
                            <div className="w-8 h-[0.5px] bg-[#C9A84C]/40" />
                            <span className="font-sans text-[10px] text-[#C9A84C] tracking-[0.4em] uppercase">Investment in Self</span>
                            <div className="w-8 h-[0.5px] bg-[#C9A84C]/40" />
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 30, scale: 1.02 }}
                            whileInView={{ opacity: 1, y: 0, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.2, delay: 0.1, ease: EASING }}
                            className="font-serif text-5xl md:text-7xl text-[#F5F0E8] font-light leading-[1.15] tracking-tight"
                        >
                            Đầu tư cho sự nghiệp. <br />
                            <span className="italic opacity-40">Giá trị thực, Kết quả thực.</span>
                        </motion.h1>

                        {/* Visual Segment Selector - Moved from Hero */}
                        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto pt-8">
                            {[
                                {
                                    id: 'HS',
                                    eyebrow: 'Dành cho Học sinh',
                                    title: 'Khám phá tiềm năng',
                                    desc: 'Hệ thống trắc nghiệm Holland & định hướng nghề nghiệp Lớp 12.'
                                },
                                {
                                    id: 'SV',
                                    eyebrow: 'Dành cho Sinh viên',
                                    title: 'Chinh phục tuyển dụng',
                                    desc: 'Tối ưu CV chuẩn ATS & Phỏng vấn giả lập với AI chuyên sâu.'
                                }
                            ].map((item) => (
                                <motion.div
                                    key={item.id}
                                    onClick={() => setSegment(item.id as Segment)}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`cursor-pointer p-8 border transition-all duration-700 text-left relative overflow-hidden group ${segment === item.id
                                            ? 'bg-[#0D1B2A] border-[#C9A84C] shadow-2xl'
                                            : 'bg-[#090C12]/40 border-[#C9A84C]/10 hover:border-[#C9A84C]/30'
                                        }`}
                                >
                                    <div className="space-y-4 relative z-10">
                                        <span className={`font-sans text-[9px] uppercase tracking-[0.3em] transition-colors duration-700 ${segment === item.id ? 'text-[#C9A84C]' : 'text-[#F5F0E8]/30'
                                            }`}>
                                            {item.eyebrow}
                                        </span>
                                        <h3 className={`font-serif text-3xl font-light tracking-wide transition-colors duration-700 ${segment === item.id ? 'text-[#F5F0E8]' : 'text-[#F5F0E8]/60'
                                            }`}>
                                            {item.title}
                                        </h3>
                                        <p className="font-sans text-[11px] text-[#F5F0E8]/30 leading-relaxed font-light">
                                            {item.desc}
                                        </p>
                                        <div className={`flex items-center gap-3 pt-2 transition-opacity duration-700 ${segment === item.id ? 'opacity-100' : 'opacity-0'
                                            }`}>
                                            <span className="text-[#C9A84C] text-[9px] font-medium uppercase tracking-[0.2em]">Đã lựa chọn</span>
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] shadow-[0_0_10px_#C9A84C]" />
                                        </div>
                                    </div>
                                    {segment === item.id && (
                                        <motion.div
                                            layoutId="hoverBg"
                                            className="absolute inset-0 bg-gradient-to-br from-[#C9A84C]/5 to-transparent pointer-events-none"
                                        />
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Pricing Cards */}
                    <div className="grid lg:grid-cols-3 gap-8 items-stretch mb-32">
                        {/* Card 1: Khám Phá */}
                        <motion.div
                            initial={{ opacity: 0, y: 40, scale: 1.02 }}
                            whileInView={{ opacity: 1, y: 0, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.2, delay: 0.2, ease: EASING }}
                            className="bg-[#F5F0E8] p-12 border border-[#C9A84C]/10 flex flex-col justify-between group rounded-[2px] hover:shadow-2xl transition-all duration-700 hover:scale-[1.01]"
                        >
                            <div className="space-y-12">
                                <div className="space-y-4">
                                    <span className="font-serif text-3xl italic text-[#C9A84C]/40">01</span>
                                    <h3 className="font-serif text-3xl font-light text-[#0A1018] tracking-wide">Khám Phá</h3>
                                    <div className="flex items-baseline gap-1 pt-4 border-b border-[#0A1018]/5 pb-6">
                                        <span className="font-serif text-7xl text-[#0A1018]">0</span>
                                        <span className="font-sans text-xs font-light text-[#0A1018]/40 tracking-widest uppercase">VNĐ</span>
                                    </div>
                                </div>

                                <ul className="space-y-6">
                                    {[
                                        "Miễn phí Hành trình Ikigai 30 ngày",
                                        "Trắc nghiệm MBTI & Holland",
                                        "Phân tích CV bằng AI (1 lượt/tháng)"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-4 font-sans text-xs text-[#0A1018]/60 font-light tracking-wide leading-relaxed">
                                            <div className="w-1 h-1 rounded-full bg-[#C9A84C] mt-2 flex-shrink-0" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                    <li className="flex items-start gap-4 font-sans text-xs text-[#0A1018]/20 font-light tracking-wide line-through italic">
                                        <div className="w-1 h-1 rounded-full bg-[#0A1018]/10 mt-2 flex-shrink-0" />
                                        <span>Phỏng vấn Voice AI</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="pt-20">
                                <Link href="/register" className="block text-center border border-[#0A1018]/15 py-5 font-sans text-[10px] tracking-[0.4em] uppercase text-[#0A1018] hover:bg-[#0A1018] hover:text-[#F5F0E8] transition-all duration-700">
                                    Bắt đầu ngay
                                </Link>
                                <p className="text-[9px] font-sans text-[#0A1018]/30 uppercase tracking-[0.2em] text-center mt-6">Non-committal access</p>
                            </div>
                        </motion.div>

                        {/* Card 2: Khởi Động */}
                        <motion.div
                            initial={{ opacity: 0, y: 40, scale: 1.02 }}
                            whileInView={{ opacity: 1, y: 0, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.2, delay: 0.3, ease: EASING }}
                            className={`p-12 border transition-all duration-1000 flex flex-col justify-between relative overflow-hidden rounded-[2px] hover:scale-[1.01] ${segment === 'HS' ? 'bg-[#0D1B2A] border-[#C9A84C] shadow-2xl z-10' : 'bg-[#090C12] border-[#C9A84C]/10'
                                }`}
                        >
                            <AnimatePresence>
                                {segment === 'HS' && (
                                    <motion.div
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="absolute top-8 right-[-35px] rotate-45 bg-[#C9A84C] text-[#0A1018] py-1 px-12 text-[8px] font-medium uppercase tracking-[0.3em] shadow-lg"
                                    >
                                        Recommended
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-12">
                                <div className="space-y-4">
                                    <span className={`font-serif text-3xl italic transition-colors duration-700 ${segment === 'HS' ? 'text-[#C9A84C]/60' : 'text-[#C9A84C]/20'}`}>02</span>
                                    <h3 className={`font-serif text-3xl font-light tracking-wide transition-colors duration-700 ${segment === 'HS' ? 'text-[#F5F0E8]' : 'text-[#F5F0E8]/80'}`}>Khởi Động</h3>
                                    <div className={`space-y-1 pt-4 border-b pb-6 transition-colors duration-700 ${segment === 'HS' ? 'border-[#C9A84C]/20' : 'border-[#F5F0E8]/5'}`}>
                                        <div className="flex items-baseline gap-1">
                                            <span className={`font-serif text-7xl transition-colors duration-700 ${segment === 'HS' ? 'text-[#F5F0E8]' : 'text-[#F5F0E8]/80'}`}>49</span>
                                            <span className="font-sans text-xs font-light text-[#C9A84C] tracking-widest uppercase align-top mt-2">.000đ</span>
                                        </div>
                                        <p className="font-serif text-[13px] text-[#C9A84C]/60 font-light italic tracking-wide">“Tầm giá của sự chuẩn mực.”</p>
                                    </div>
                                </div>

                                <ul className="space-y-6">
                                    {[
                                        "Nhận 60 Credits vào ví tư vấn",
                                        "Nâng cấp 5 lượt phân tích CV AI",
                                        "Hệ thống lộ trình cá nhân hóa"
                                    ].map((item, i) => (
                                        <li key={i} className={`flex items-start gap-4 font-sans text-xs font-light tracking-wide leading-relaxed transition-colors duration-700 ${segment === 'HS' ? 'text-[#F5F0E8]' : 'text-[#F5F0E8]/60'}`}>
                                            <div className={`w-1 h-1 rounded-full mt-2 flex-shrink-0 bg-[#C9A84C]`} />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="pt-20">
                                <button className={`w-full py-5 font-sans text-[10px] tracking-[0.4em] uppercase transition-all duration-700 ${segment === 'HS' ? 'bg-[#C9A84C] text-[#0A1018] hover:bg-[#F5F0E8]' : 'border border-[#C9A84C]/20 text-[#F5F0E8]/40 hover:border-[#C9A84C] hover:text-[#C9A84C]'
                                    }`}>
                                    Nhận Credits
                                </button>
                                <p className={`text-[9px] font-sans uppercase tracking-[0.2em] text-center mt-6 transition-colors duration-700 ${segment === 'HS' ? 'text-[#C9A84C]/40' : 'text-[#F5F0E8]/20'}`}>Fast-track engagement</p>
                            </div>
                        </motion.div>

                        {/* Card 3: Tăng Tốc */}
                        <motion.div
                            initial={{ opacity: 0, y: 40, scale: 1.02 }}
                            whileInView={{ opacity: 1, y: 0, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.2, delay: 0.4, ease: EASING }}
                            className={`p-12 border transition-all duration-1000 flex flex-col justify-between relative overflow-hidden rounded-[2px] hover:scale-[1.01] ${segment === 'SV' ? 'bg-[#090C12] border-[#C9A84C] shadow-2xl z-10' : 'bg-[#0A1018] border-[#C9A84C]/10'
                                }`}
                        >
                            <AnimatePresence>
                                {segment === 'SV' && (
                                    <motion.div
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="absolute top-6 left-12"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-pulse" />
                                            <span className="text-[#C9A84C] text-[9px] font-medium uppercase tracking-[0.3em]">Hệ sinh thái ưu chuộng</span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-12">
                                <div className="space-y-4 pt-4">
                                    <span className={`font-serif text-3xl italic transition-colors duration-700 ${segment === 'SV' ? 'text-[#C9A84C]/60' : 'text-[#C9A84C]/20'}`}>03</span>
                                    <h3 className={`font-serif text-3xl font-light tracking-wide transition-colors duration-700 ${segment === 'SV' ? 'text-[#F5F0E8]' : 'text-[#F5F0E8]/80'}`}>Tăng Tốc</h3>
                                    <div className={`space-y-2 pt-4 border-b pb-6 transition-colors duration-700 ${segment === 'SV' ? 'border-[#C9A84C]/20' : 'border-[#F5F0E8]/5'}`}>
                                        <span className="font-sans text-[10px] text-[#F5F0E8]/20 line-through tracking-[0.2em]">500.000đ</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className={`font-serif text-7xl transition-colors duration-700 ${segment === 'SV' ? 'text-[#F5F0E8]' : 'text-[#F5F0E8]/80'}`}>249</span>
                                            <span className="font-sans text-xs font-light text-[#C9A84C] tracking-widest uppercase align-top mt-2">.000đ</span>
                                        </div>
                                    </div>
                                </div>

                                <ul className="space-y-6">
                                    {[
                                        "Không giới hạn phân tích CV AI",
                                        "10 lượt Phỏng vấn Voice AI chuyên sâu",
                                        "Nhận 299 Credits cho Pro Mentor"
                                    ].map((item, i) => (
                                        <li key={i} className={`flex items-start gap-4 font-sans text-xs font-light tracking-wide leading-relaxed transition-colors duration-700 ${segment === 'SV' ? 'text-[#F5F0E8]' : 'text-[#F5F0E8]/60'}`}>
                                            <div className="w-1 h-1 rounded-full bg-[#C9A84C] mt-2 flex-shrink-0" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="pt-20">
                                <button className={`w-full py-5 font-sans text-[10px] tracking-[0.4em] uppercase transition-all duration-700 ${segment === 'SV' ? 'bg-[#C9A84C] text-[#0A1018] hover:bg-[#F5F0E8]' : 'border border-[#C9A84C]/20 text-[#F5F0E8]/40 hover:border-[#C9A84C] hover:text-[#C9A84C]'
                                    }`}>
                                    Gia nhập Pro
                                </button>
                                <p className={`text-[9px] font-sans uppercase tracking-[0.2em] text-center mt-6 transition-colors duration-700 ${segment === 'SV' ? 'text-[#C9A84C]/40' : 'text-[#F5F0E8]/20'}`}>Authority Tier</p>
                            </div>
                        </motion.div>
                    </div>

                    {/* Mentor Marketplace Banner */}
                    <motion.div
                        whileInView={{ opacity: 1, y: 0 }}
                        initial={{ opacity: 0, y: 40 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.4, ease: EASING }}
                        className="mb-48"
                    >
                        <Link href="/dashboard/experts/explore" className="block relative group overflow-hidden border border-[#C9A84C]/10 bg-[#090C12] p-20 text-center md:text-left transition-all duration-700 hover:border-[#C9A84C]/30">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#0D1B2A] to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-700" />
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                                <div className="space-y-8 max-w-xl">
                                    <h3 className="font-serif text-5xl text-[#F5F0E8] font-light tracking-wide italic">Cần tư vấn 1-1?</h3>
                                    <p className="font-sans text-base text-[#F5F0E8]/50 font-light leading-relaxed tracking-wide">
                                        Khám phá Sàn Mentor. Chỉ từ <span className="text-[#C9A84C] font-normal">30 Credits/giờ</span> để được các chuyên gia hàng đầu dẫn dắt trên lộ trình riêng của bạn.
                                    </p>
                                    <div className="flex flex-wrap items-center gap-10 pt-4 justify-center md:justify-start">
                                        <div className="flex items-center gap-4 py-2 border-b border-[#C9A84C]/10">
                                            <Lock className="w-3 h-3 text-[#C9A84C]/40" />
                                            <span className="text-[#F5F0E8]/30 font-sans text-[9px] uppercase tracking-[0.2em]">Escrow Protection</span>
                                        </div>
                                        <div className="flex items-center gap-4 py-2 border-b border-[#C9A84C]/10">
                                            <ShieldCheck className="w-3 h-3 text-[#C9A84C]/40" />
                                            <span className="text-[#F5F0E8]/30 font-sans text-[9px] uppercase tracking-[0.2em]">Full Refund Policy</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center gap-4">
                                    <div className="px-14 py-6 bg-[#C9A84C] text-[#0A1018] font-sans text-[10px] tracking-[0.5em] uppercase transition-all duration-700 group-hover:bg-[#F5F0E8]">
                                        Tìm Mentor Ngay
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </motion.div>

                    {/* FAQ Section */}
                    <div className="max-w-[800px] mx-auto space-y-24">
                        <div className="text-center space-y-8">
                            <div className="w-[0.5px] h-16 bg-[#C9A84C]/20 mx-auto" />
                            <h2 className="font-serif text-4xl md:text-5xl text-[#F5F0E8] font-light italic tracking-tight">Giải Đáp Thắc Mắc</h2>
                        </div>

                        <div className="space-y-1">
                            {faqs.map((faq, idx) => (
                                <div key={idx} className="bg-transparent border-t border-[#C9A84C]/10 overflow-hidden group">
                                    <button
                                        onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                        className="w-full flex items-center justify-between py-12 text-left transition-all duration-500"
                                    >
                                        <span className="font-sans text-[11px] text-[#F5F0E8]/50 uppercase tracking-[0.3em] group-hover:text-[#F5F0E8] transition-colors leading-relaxed">
                                            {faq.q}
                                        </span>
                                        <div className={`p-2 transition-transform duration-700 ease-out ${openFaq === idx ? 'rotate-180' : ''}`}>
                                            <ChevronDown className="w-3.5 h-3.5 text-[#C9A84C]/30 group-hover:text-[#C9A84C]" />
                                        </div>
                                    </button>
                                    <AnimatePresence>
                                        {openFaq === idx && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.8, ease: EASING }}
                                                className="overflow-hidden"
                                            >
                                                <div className="pb-16 px-0 text-[#F5F0E8]/40 font-sans text-[13px] font-light leading-[2] tracking-wide max-w-2xl">
                                                    {faq.a}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                            <div className="border-t border-[#C9A84C]/10 w-full" />
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        </div>
    );
};

export default PricingPage;
