'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Check, Shield, Zap, Star, Rocket, ChevronRight, Info, Crown, ShieldCheck, Lock as LockIcon, X, HelpCircle, ChevronDown, Sparkles } from 'lucide-react';
import ShootingStarVisual from '@/components/special/ShootingStarVisual';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
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
        <div className="bg-[#050b18] min-h-screen relative overflow-hidden font-dm-sans">
            <ShootingStarVisual />
            
            {/* Content Layer */}
            <div className="relative z-10 pt-32">
                <main className="max-w-[1400px] mx-auto px-8 pb-32">
                    {/* Header Section */}
                    <div className="text-center space-y-12 mb-32">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.2, ease: EASING }}
                            className="flex items-center justify-center gap-6"
                        >
                            <div className="w-12 h-px bg-[#00A4FD]" />
                            <span className="font-dm-sans text-[10px] text-[#00A4FD] tracking-[0.5em] font-black uppercase">INVESTMENT PROTOCOL</span>
                            <div className="w-12 h-px bg-[#00A4FD]" />
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.2, delay: 0.1, ease: EASING }}
                            className="text-[clamp(48px,6vw,90px)] font-garamond italic font-bold text-white tracking-tighter leading-[0.95] mb-12 drop-shadow-2xl"
                        >
                            Đầu tư cho <br />
                            <span className="text-[#00A4FD]">Bản sắc tương lai.</span>
                        </motion.h1>
                        <p className="max-w-2xl text-[18px] md:text-[20px] font-garamond italic text-white/60 leading-relaxed mb-20 mx-auto">
                            Lựa chọn lộ trình tối ưu để khai phá tiềm năng vô tận cùng trí tuệ nhân tạo.
                        </p>

                        {/* Visual Segment Selector */}
                        <div className="grid md:grid-cols-2 gap-10 max-w-4xl mx-auto pt-12">
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
                                    whileHover={{ y: -8 }}
                                    className={`cursor-pointer p-10 shadow-2xl transition-all duration-700 text-left relative overflow-hidden group rounded-[40px] border-2 ${segment === item.id
                                            ? 'bg-[#0046EA] border-[#0046EA] shadow-[#0046EA]/20'
                                            : 'bg-white border-black/5 hover:border-[#0046EA]/20'
                                        }`}
                                >
                                    <div className="space-y-6 relative z-10">
                                        <span className={`text-[10px] font-black uppercase tracking-[0.4em] transition-colors duration-700 ${segment === item.id ? 'text-[#FFE900]' : 'text-black/30'
                                            }`}>
                                            {item.eyebrow}
                                        </span>
                                        <h3 className={`text-4xl font-garamond italic font-bold tracking-tight transition-colors duration-700 ${segment === item.id ? 'text-white' : 'text-[#171716]'
                                            }`}>
                                            {item.title}
                                        </h3>
                                        <p className={`text-[13px] font-medium leading-relaxed font-dm-sans transition-colors duration-700 ${segment === item.id ? 'text-white/60' : 'text-black/40'
                                            }`}>
                                            {item.desc}
                                        </p>
                                        <div className={`flex items-center gap-3 pt-4 transition-all duration-700 ${segment === item.id ? 'opacity-100' : 'opacity-0 translate-y-2'
                                            }`}>
                                            <div className="w-2 h-2 rounded-full bg-[#FFE900] shadow-[0_0_10px_#FFE900] animate-pulse" />
                                            <span className="text-[#FFE900] text-[10px] font-black uppercase tracking-[0.3em]">ACTIVE NODE</span>
                                        </div>
                                    </div>
                                    {segment === item.id && (
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Pricing Cards */}
                    <div className="grid lg:grid-cols-3 gap-12 items-stretch mb-48">
                        {/* Card 1: Khám Phá */}
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.2, delay: 0.2, ease: EASING }}
                            className="bg-white p-16 shadow-3xl border border-black/5 flex flex-col justify-between group rounded-[64px] hover:shadow-blue-500/10 transition-all duration-700"
                        >
                            <div className="space-y-16">
                                <div className="space-y-6">
                                    <span className="text-6xl font-garamond italic font-bold text-[#0046EA]/10">01</span>
                                    <h3 className="text-4xl font-garamond italic font-bold text-[#171716]">Khám Phá</h3>
                                    <div className="flex items-baseline gap-2 pt-6 border-b border-black/5 pb-10">
                                        <span className="text-8xl font-garamond italic font-bold text-[#171716]">0</span>
                                        <span className="text-[12px] font-black text-black/30 tracking-[0.4em] uppercase">VNĐ</span>
                                    </div>
                                </div>

                                <ul className="space-y-8">
                                    {[
                                        "Miễn phí Hành trình Ikigai 30 ngày",
                                        "Trắc nghiệm MBTI & Holland",
                                        "Phân tích CV bằng AI (1 lượt/tháng)"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-6 text-[15px] text-black/40 font-dm-sans font-medium leading-relaxed">
                                            <div className="w-2 h-2 rounded-full bg-[#0046EA] mt-2.5 flex-shrink-0" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                    <li className="flex items-start gap-6 text-[15px] text-black/20 font-dm-sans font-medium leading-relaxed line-through italic">
                                        <div className="w-2 h-2 rounded-full bg-black/10 mt-2.5 flex-shrink-0" />
                                        <span>Phỏng vấn Voice AI</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="pt-24">
                                <Link href="/register" className="block text-center border-2 border-black/10 py-6 font-dm-sans text-[11px] font-black tracking-[0.5em] uppercase text-[#171716] hover:bg-[#0046EA] hover:text-[#FFE900] hover:border-[#0046EA] transition-all duration-700 rounded-full shadow-xl">
                                    BẮT ĐẦU NGAY
                                </Link>
                                <p className="text-[10px] font-black text-black/20 uppercase tracking-[0.4em] text-center mt-8 italic">BASIC ACCESS PROTOCOL</p>
                            </div>
                        </motion.div>

                        {/* Card 2: Khởi Động */}
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.2, delay: 0.3, ease: EASING }}
                            className={`p-16 shadow-3xl transition-all duration-1000 flex flex-col justify-between relative overflow-hidden rounded-[64px] border-2 ${segment === 'HS' ? 'bg-[#0046EA] border-[#0046EA] shadow-[#0046EA]/20 z-10 scale-105' : 'bg-white border-black/5'
                                }`}
                        >
                            <AnimatePresence>
                                {segment === 'HS' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                                        className="absolute top-12 right-12 bg-[#FFE900] text-[#171716] py-2 px-8 text-[10px] font-black uppercase tracking-[0.3em] rounded-full shadow-lg z-20"
                                    >
                                        RECOMMENDED
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-16">
                                <div className="space-y-6">
                                    <span className={`text-6xl font-garamond italic font-bold transition-colors duration-700 ${segment === 'HS' ? 'text-white/10' : 'text-[#0046EA]/10'}`}>02</span>
                                    <h3 className={`text-4xl font-garamond italic font-bold tracking-tight transition-colors duration-700 ${segment === 'HS' ? 'text-white' : 'text-[#171716]'}`}>Khởi Động</h3>
                                    <div className={`space-y-2 pt-6 border-b pb-10 transition-colors duration-700 ${segment === 'HS' ? 'border-white/10' : 'border-black/5'}`}>
                                        <div className="flex items-baseline gap-2">
                                            <span className={`text-8xl font-garamond italic font-bold transition-colors duration-700 ${segment === 'HS' ? 'text-white' : 'text-[#171716]'}`}>49</span>
                                            <span className="text-[12px] font-black text-[#FFE900] tracking-[0.4em] uppercase">.000đ</span>
                                        </div>
                                        <p className={`text-[15px] font-garamond italic font-medium tracking-tight ${segment === 'HS' ? 'text-white/60' : 'text-black/40'}`}>“Tầm giá của sự chuẩn mực.”</p>
                                    </div>
                                </div>

                                <ul className="space-y-8">
                                    {[
                                        "Nhận 60 Credits vào ví tư vấn",
                                        "Nâng cấp 5 lượt phân tích CV AI",
                                        "Hệ thống lộ trình cá nhân hóa"
                                    ].map((item, i) => (
                                        <li key={i} className={`flex items-start gap-6 text-[15px] font-dm-sans font-medium leading-relaxed transition-colors duration-700 ${segment === 'HS' ? 'text-white' : 'text-black/40'}`}>
                                            <div className={`w-2 h-2 rounded-full mt-2.5 flex-shrink-0 ${segment === 'HS' ? 'bg-[#FFE900]' : 'bg-[#0046EA]'}`} />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="pt-24">
                                <button className={`w-full py-6 font-dm-sans text-[11px] font-black tracking-[0.5em] uppercase transition-all duration-700 rounded-full shadow-2xl ${segment === 'HS' ? 'bg-[#FFE900] text-[#171716] hover:bg-white hover:text-[#0046EA]' : 'border-2 border-[#0046EA] text-[#0046EA] hover:bg-[#0046EA] hover:text-[#FFE900]'
                                    }`}>
                                    NHẬN CREDITS
                                </button>
                                <p className={`text-[10px] font-black uppercase tracking-[0.4em] text-center mt-8 italic transition-colors duration-700 ${segment === 'HS' ? 'text-white/20' : 'text-black/20'}`}>FAST-TRACK PROTOCOL</p>
                            </div>
                        </motion.div>

                        {/* Card 3: Tăng Tốc */}
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.2, delay: 0.4, ease: EASING }}
                            className={`p-16 shadow-3xl transition-all duration-1000 flex flex-col justify-between relative overflow-hidden rounded-[64px] border-2 ${segment === 'SV' ? 'bg-[#0046EA] border-[#0046EA] shadow-[#0046EA]/20 z-10 scale-105' : 'bg-white border-black/5'
                                }`}
                        >
                            <AnimatePresence>
                                {segment === 'SV' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                                        className="absolute top-12 left-12"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-[#FFE900] animate-pulse shadow-[0_0_10px_#FFE900]" />
                                            <span className="text-[#FFE900] text-[10px] font-black uppercase tracking-[0.4em]">HỆ SINH THÁI ƯU CHUỘNG</span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-16">
                                <div className="space-y-6 pt-4">
                                    <span className={`text-6xl font-garamond italic font-bold transition-colors duration-700 ${segment === 'SV' ? 'text-white/10' : 'text-[#0046EA]/10'}`}>03</span>
                                    <h3 className={`text-4xl font-garamond italic font-bold tracking-tight transition-colors duration-700 ${segment === 'SV' ? 'text-white' : 'text-[#171716]'}`}>Tăng Tốc</h3>
                                    <div className={`space-y-2 pt-6 border-b pb-10 transition-colors duration-700 ${segment === 'SV' ? 'border-white/10' : 'border-black/5'}`}>
                                        <span className={`text-[12px] font-black line-through tracking-[0.3em] transition-colors duration-700 ${segment === 'SV' ? 'text-white/20' : 'text-black/20'}`}>500.000đ</span>
                                        <div className="flex items-baseline gap-2">
                                            <span className={`text-8xl font-garamond italic font-bold transition-colors duration-700 ${segment === 'SV' ? 'text-white' : 'text-[#171716]'}`}>249</span>
                                            <span className="text-[12px] font-black text-[#FFE900] tracking-[0.4em] uppercase">.000đ</span>
                                        </div>
                                    </div>
                                </div>

                                <ul className="space-y-8">
                                    {[
                                        "Không giới hạn phân tích CV AI",
                                        "10 lượt Phỏng vấn Voice AI chuyên sâu",
                                        "Nhận 299 Credits cho Pro Mentor"
                                    ].map((item, i) => (
                                        <li key={i} className={`flex items-start gap-6 text-[15px] font-dm-sans font-medium leading-relaxed transition-colors duration-700 ${segment === 'SV' ? 'text-white' : 'text-black/40'}`}>
                                            <div className={`w-2 h-2 rounded-full mt-2.5 flex-shrink-0 ${segment === 'SV' ? 'bg-[#FFE900]' : 'bg-[#0046EA]'}`} />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="pt-24">
                                <button className={`w-full py-6 font-dm-sans text-[11px] font-black tracking-[0.5em] uppercase transition-all duration-700 rounded-full shadow-2xl ${segment === 'SV' ? 'bg-[#FFE900] text-[#171716] hover:bg-white hover:text-[#0046EA]' : 'border-2 border-[#0046EA] text-[#0046EA] hover:bg-[#0046EA] hover:text-[#FFE900]'
                                    }`}>
                                    GIA NHẬP PRO
                                </button>
                                <p className={`text-[10px] font-black uppercase tracking-[0.4em] text-center mt-8 italic transition-colors duration-700 ${segment === 'SV' ? 'text-white/20' : 'text-black/20'}`}>AUTHORITY PROTOCOL</p>
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
                        <Link href="/dashboard/experts/explore" className="block relative group overflow-hidden bg-[#0046EA] p-24 text-center md:text-left transition-all duration-700 rounded-[64px] shadow-3xl">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(0,164,253,0.1)_0%,transparent_70%)]" />
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-16">
                                <div className="space-y-10 max-w-2xl">
                                    <h3 className="text-5xl text-white font-garamond italic font-bold tracking-tight">Cần tư vấn 1-1?</h3>
                                    <p className="text-[18px] text-white/60 font-garamond italic leading-relaxed">
                                        Khám phá mạng lưới chuyên gia. Chỉ từ <span className="text-[#FFE900] font-bold">30 Credits/giờ</span> để được các Mentor hàng đầu dẫn dắt trên lộ trình riêng của bạn.
                                    </p>
                                    <div className="flex flex-wrap items-center gap-12 pt-6 justify-center md:justify-start">
                                        <div className="flex items-center gap-4 py-2 border-b border-white/10">
                                            <LockIcon className="w-4 h-4 text-[#FFE900]/40" />
                                            <span className="text-white/40 font-dm-sans text-[10px] font-black uppercase tracking-[0.3em]">Escrow Protection</span>
                                        </div>
                                        <div className="flex items-center gap-4 py-2 border-b border-white/10">
                                            <ShieldCheck className="w-4 h-4 text-[#FFE900]/40" />
                                            <span className="text-white/40 font-dm-sans text-[10px] font-black uppercase tracking-[0.3em]">Verified Experts</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="shrink-0">
                                    <div className="px-20 py-8 bg-[#FFE900] text-[#171716] font-dm-sans text-[11px] font-black tracking-[0.5em] uppercase transition-all duration-700 hover:bg-white hover:text-[#0046EA] rounded-full shadow-2xl">
                                        Tìm Mentor Ngay
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </motion.div>

                    {/* FAQ Section */}
                    <div className="max-w-4xl mx-auto space-y-32">
                        <div className="text-center space-y-8">
                            <div className="w-px h-24 bg-gradient-to-b from-[#00A4FD] to-transparent mx-auto" />
                            <h2 className="text-6xl font-garamond italic font-bold text-white tracking-tight drop-shadow-[0_0_15px_rgba(0,164,253,0.5)]">
                                Giải Đáp Thắc Mắc
                            </h2>
                        </div>

                        <div className="space-y-8">
                            {faqs.map((faq, idx) => (
                                <FAQItem key={idx} q={faq.q} a={faq.a} />
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

function FAQItem({ q, a }: { q: string; a: string }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 overflow-hidden transition-all duration-500 hover:bg-white/15 hover:border-[#00A4FD]/80 hover:shadow-[0_12px_40px_rgba(0,164,253,0.3)] hover:-translate-y-1 rounded-[32px] group">
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                className="w-full px-12 py-10 flex items-center justify-between text-left focus:outline-none"
            >
                <span className="font-garamond italic text-3xl text-white group-hover:text-[#FFE900] transition-colors duration-500 font-bold drop-shadow-md">{q}</span>
                <ChevronDown className={`w-6 h-6 text-[#00A4FD] group-hover:text-[#FFE900] transition-all duration-500 ${isOpen ? 'rotate-180' : ''}`} strokeWidth={2} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <div className="px-12 pb-12 text-[17px] text-white/90 leading-relaxed font-dm-sans font-medium">
                            {a}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default PricingPage;
