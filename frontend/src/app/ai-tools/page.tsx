'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSearch, Mic2, Sparkles, ChevronLeft, Upload, Zap, Target, Award, ShieldCheck, Cpu, HelpCircle, ChevronRight, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import CVAnalyzer from '@/components/ai/CVAnalyzer';
import MockInterview from '@/components/ai/MockInterview';

type ToolType = 'CV' | 'INTERVIEW' | 'HOME';

export default function AIToolsPage() {
    const [activeTool, setActiveTool] = useState<ToolType>('HOME');

    return (
        <div className="bg-[#090C12] min-h-screen relative overflow-hidden selection:bg-[#C9A84C]/30 text-[#F5F0E8] font-sans">
            {/* Ambient Background Glows - Refined for Obsidian theme */}
            <div className="absolute top-0 left-0 w-full h-[1000px] bg-gradient-to-b from-[#C9A84C]/5 to-transparent z-0 opacity-30" aria-hidden="true" />
            <div className="absolute top-[15%] -right-72 w-[800px] h-[800px] bg-[#C9A84C]/5 rounded-full blur-[160px] z-0 opacity-40" aria-hidden="true" />
            <div className="absolute bottom-[20%] -left-72 w-[800px] h-[800px] bg-[#A85C1E]/5 rounded-full blur-[160px] z-0 opacity-30" aria-hidden="true" />

            {/* Video Background */}
            <div className="absolute top-0 left-0 w-full h-[800px] z-0 overflow-hidden pointer-events-none">
                <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover opacity-60 scale-105"
                >
                    <source src="/heroAI.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-b from-[#090C12]/20 via-[#090C12]/60 to-[#090C12]" />
            </div>

            <div className="max-w-[1400px] mx-auto px-6 lg:px-8 pt-20 pb-40 relative z-10">
                {/* Breadcrumb / Back Navigation */}
                <div className="mb-24">
                    {activeTool !== 'HOME' ? (
                        <button
                            onClick={() => setActiveTool('HOME')}
                            className="flex items-center gap-5 text-[#F5F0E8]/40 hover:text-[#C9A84C] font-normal transition-all duration-700 group"
                        >
                            <div className="w-11 h-11 border border-[#C9A84C]/10 flex items-center justify-center group-hover:bg-[#C9A84C]/5 transition-all duration-700 rounded-[2px]">
                                <ChevronLeft className="w-4 h-4" strokeWidth={1} />
                            </div>
                            <span className="text-[10px] tracking-[0.4em] uppercase font-sans">Mục lục công cụ</span>
                        </button>
                    ) : (
                        <Link href="/" className="flex items-center gap-5 text-[#F5F0E8]/40 hover:text-[#C9A84C] font-normal transition-all duration-700 group">
                            <div className="w-11 h-11 border border-[#C9A84C]/10 flex items-center justify-center group-hover:bg-[#C9A84C]/5 transition-all duration-700 rounded-[2px]">
                                <ChevronLeft className="w-4 h-4" strokeWidth={1} />
                            </div>
                            <span className="text-[10px] tracking-[0.4em] uppercase font-sans">Về trang chủ</span>
                        </Link>
                    )}
                </div>

                {/* Selection State */}
                <AnimatePresence mode="wait">
                    {activeTool === 'HOME' ? (
                        <motion.div
                            key="home"
                            initial={{ opacity: 0, y: 30, scale: 1.02 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -30, scale: 1.02 }}
                            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                            className="space-y-40"
                        >
                            <div className="text-center space-y-10 max-w-3xl mx-auto">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 1.1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                                    className="w-20 h-20 border border-[#C9A84C]/20 flex items-center justify-center text-[#C9A84C] mx-auto mb-16 relative group"
                                >
                                    <div className="absolute inset-0 bg-[#C9A84C]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-900" />
                                    <Sparkles className="w-8 h-8 relative z-10" strokeWidth={0.75} />
                                </motion.div>
                                <h1 className="text-[clamp(40px,5vw,68px)] font-serif italic font-light tracking-tight text-[#F5F0E8] leading-[1.20]">
                                    Hệ sinh thái AI <br /><span className="text-[#C9A84C]">Vinh hoa sự nghiệp</span>
                                </h1>
                                <p className="text-[17px] text-[#F5F0E8]/50 font-sans font-light max-w-2xl mx-auto leading-[1.85] tracking-[0.02em]">
                                    Kiến tạo bản sắc chuyên nghiệp với công nghệ trí tuệ nhân tạo tối tân, được tinh chỉnh cho những khát vọng vươn tầm.
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-10">
                                {/* CV Analyzer Card */}
                                <motion.div
                                    initial={{ opacity: 0, y: 40, scale: 1.05 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                    whileHover={{ y: -12, scale: 1.02 }}
                                    onClick={() => setActiveTool('CV')}
                                    className="bg-white/[0.03] backdrop-blur-3xl border border-[#C9A84C]/10 p-14 lg:p-16 shadow-3xl cursor-pointer group transition-all duration-900 relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-[#C9A84C]/5 blur-[100px] rounded-full -mr-24 -mt-24 group-hover:bg-[#C9A84C]/10 transition-all duration-900" />
                                    <div className="flex flex-col items-center text-center space-y-12 relative z-10">
                                        <div className="w-20 h-20 border border-[#C9A84C]/20 flex items-center justify-center text-[#C9A84C] group-hover:border-[#C9A84C] transition-all duration-900">
                                            <FileSearch className="w-8 h-8" strokeWidth={0.5} />
                                        </div>
                                        <div className="space-y-6">
                                            <h3 className="text-[32px] font-serif italic text-[#F5F0E8] font-light">AI CV Analyzer</h3>
                                            <p className="text-[#F5F0E8]/40 text-sm font-sans font-light max-w-xs mx-auto leading-[1.75] tracking-[0.02em]">
                                                Phân tích đa chiều, chấm điểm và tối ưu hóa hồ sơ theo chuẩn mực quốc tế.
                                            </p>
                                        </div>
                                        <button className="w-full py-5 bg-[#C9A84C] text-[#0A1018] text-[11px] tracking-[0.4em] uppercase font-normal transition-all duration-900 hover:bg-[#F5F0E8] shadow-xl shadow-black/20">
                                            Khai phóng công cụ
                                        </button>
                                    </div>
                                </motion.div>

                                {/* Mock Interview Card */}
                                <motion.div
                                    initial={{ opacity: 0, y: 40 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                    whileHover={{ y: -10 }}
                                    onClick={() => setActiveTool('INTERVIEW')}
                                    className="bg-white/[0.05] backdrop-blur-3xl border border-[#C9A84C]/20 p-14 lg:p-16 shadow-3xl cursor-pointer group transition-all duration-900 relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-[#A85C1E]/10 blur-[100px] rounded-full -mr-24 -mt-24 group-hover:bg-[#A85C1E]/20 transition-all duration-900" />
                                    <div className="flex flex-col items-center text-center space-y-12 relative z-10">
                                        <div className="w-20 h-20 border border-[#C9A84C]/30 flex items-center justify-center text-[#C9A84C] group-hover:border-[#C9A84C] transition-all duration-900">
                                            <Mic2 className="w-8 h-8" strokeWidth={0.5} />
                                        </div>
                                        <div className="space-y-6">
                                            <h3 className="text-[32px] font-serif italic text-[#F5F0E8] font-light">AI Mock Interview</h3>
                                            <p className="text-[#F5F0E8]/40 text-sm font-sans font-light max-w-xs mx-auto leading-[1.75] tracking-[0.02em]">
                                                Đối thoại giả lập 1-1 với trợ lý âm học thời gian thực, rèn luyện bản lĩnh phản biện.
                                            </p>
                                        </div>
                                        <button className="w-full py-5 border border-[#C9A84C]/30 text-[#C9A84C] text-[11px] tracking-[0.4em] uppercase font-normal transition-all duration-900 hover:bg-[#C9A84C] hover:text-[#0A1018] shadow-xl">
                                            Bắt đầu hành trình
                                        </button>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Luxury Thread Tip */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                                className="bg-white/[0.02] backdrop-blur-3xl border border-[#C9A84C]/10 p-12 flex items-center gap-12 max-w-4xl mx-auto shadow-3xl group"
                            >
                                <div className="w-20 h-20 border border-[#C9A84C]/10 flex items-center justify-center text-[#C9A84C]/40 group-hover:text-[#C9A84C] transition-all duration-900 shrink-0">
                                    <Target className="w-10 h-10" strokeWidth={0.5} />
                                </div>
                                <div className="space-y-4">
                                    <p className="text-[#C9A84C] font-normal text-[9px] uppercase tracking-[0.5em] opacity-60 font-sans">Tri thức từ CareerPath</p>
                                    <p className="text-[#F5F0E8]/80 font-serif italic text-2xl leading-[1.6] tracking-[0.01em]">
                                        &ldquo;Sự chuẩn bị kỹ lưỡng là nền tảng của thành công. Hãy tinh lọc hồ sơ trước khi bước vào những cuộc đối thoại chiến lược.&rdquo;
                                    </p>
                                </div>
                            </motion.div>

                            {/* Process Section */}
                            <div className="py-24">
                                <div className="text-center mb-24 space-y-5">
                                    <h2 className="text-4xl font-serif italic text-[#F5F0E8] tracking-tight font-light">Quy trình tối ưu hóa</h2>
                                    <div className="w-20 h-[1px] bg-[#C9A84C]/30 mx-auto" />
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-12 lg:gap-16">
                                    {[
                                        { icon: <Upload size={24} strokeWidth={0.75} />, label: 'Tiếp nhận', desc: 'Kết nối dữ liệu chuyên môn (.pdf / .docx)' },
                                        { icon: <Zap size={24} strokeWidth={0.75} />, label: 'Phân tích', desc: 'Đối soát đa chiều cùng trí tuệ nhân tạo' },
                                        { icon: <Target size={24} strokeWidth={0.75} />, label: 'Gợi ý', desc: 'Tiếp nhận chiến lược cải thiện chi tiết' },
                                        { icon: <Award size={24} strokeWidth={0.75} />, label: 'Thành tựu', desc: 'Khẳng định vị thế trong mắt nhà tuyển dụng' }
                                    ].map((step, index) => (
                                        <div key={index} className="relative group text-center space-y-8">
                                            <div className="w-16 h-16 border border-[#C9A84C]/10 flex items-center justify-center text-[#C9A84C]/60 mx-auto group-hover:border-[#C9A84C] group-hover:text-[#C9A84C] transition-all duration-900 bg-white/[0.02] backdrop-blur-sm">
                                                {step.icon}
                                            </div>
                                            <div className="space-y-4">
                                                <h4 className="text-[10px] font-normal text-[#F5F0E8] tracking-[0.4em] uppercase font-sans">{step.label}</h4>
                                                <p className="text-[10px] text-[#F5F0E8]/40 font-sans font-light leading-loose max-w-[140px] mx-auto uppercase tracking-widest">{step.desc}</p>
                                            </div>
                                            {index < 3 && (
                                                <div className="hidden lg:block absolute top-8 -right-8 text-[#C9A84C]/20 transition-all duration-700 group-hover:text-[#C9A84C]/40">
                                                    <ChevronRight size={14} strokeWidth={1} />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* FAQ Section */}
                            <div className="py-32 max-w-3xl mx-auto w-full">
                                <div className="text-center mb-24 space-y-5">
                                    <p className="text-[#C9A84C]/40 text-[10px] tracking-[0.5em] uppercase font-normal font-sans">Thấu hiểu để vươn tầm</p>
                                    <h2 className="text-4xl font-serif italic text-[#F5F0E8] font-light">Những điều cần thấu cảm</h2>
                                </div>
                                <div className="space-y-6">
                                    <FAQItem
                                        q="Bảo mật dữ liệu cá nhân"
                                        a="CareerPath cam kết mã hóa tuyệt đối mọi hồ sơ. Tri thức của bạn chỉ được dùng để trợ lực sự nghiệp cho chính bạn, không bao giờ chia sẻ cho bên thứ ba."
                                    />
                                    <FAQItem
                                        q="Nguyên tắc Co-pilot"
                                        a="AI của chúng tôi đóng vai trò trợ lý chiến lược. Mọi quyết định và dấu ấn cá nhân trong hồ sơ vẫn luôn thuộc về bạn, AI chỉ giúp bạn làm sáng tỏ giá trị đó."
                                    />
                                    <FAQItem
                                        q="Độ chính xác của giả lập"
                                        a="Sử dụng các mô hình ngôn ngữ tiên tiến nhất (GPT-4o), AI có khả năng phản hồi và thấu hiểu ngữ cảnh chuyên môn đến 99%, mang lại trải nghiệm tiệm cận thực tế."
                                    />
                                </div>
                            </div>

                            {/* Final CTA Section */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                                className="relative p-24 text-center border border-[#C9A84C]/15 bg-white/[0.02] backdrop-blur-3xl overflow-hidden group shadow-3xl"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-[#A85C1E]/5 to-[#C9A84C]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-[2000ms]" />
                                <div className="relative z-10 space-y-14">
                                    <h2 className="text-[clamp(32px,4vw,52px)] font-serif italic text-[#F5F0E8] leading-[1.25] font-light max-w-2xl mx-auto">
                                        Sẵn sàng kiến tạo <br />dấu ấn di sản?
                                    </h2>
                                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                                        <button
                                            onClick={() => setActiveTool('CV')}
                                            className="px-16 py-6 bg-[#C9A84C] text-[#0A1018] text-[11px] tracking-[0.5em] uppercase font-normal transition-all duration-900 hover:bg-[#F5F0E8] shadow-2xl shadow-black/40"
                                        >
                                            Bắt đầu ngay
                                        </button>
                                        <Link
                                            href="/pricing"
                                            className="px-16 py-6 border border-[#F5F0E8]/10 text-[#F5F0E8]/50 text-[11px] tracking-[0.5em] uppercase font-normal hover:border-[#C9A84C] hover:text-[#C9A84C] transition-all duration-900"
                                        >
                                            Gói dịch vụ
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="tool"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.6 }}
                            className="min-h-[800px] bg-[#1A1A2E]/20 backdrop-blur-md p-1 items-start"
                        >
                            {activeTool === 'CV' ? <CVAnalyzer /> : <MockInterview />}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function FAQItem({ q, a }: { q: string; a: string }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="bg-white/[0.02] border border-[#C9A84C]/5 overflow-hidden transition-all duration-700 hover:border-[#C9A84C]/20">
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                className="w-full px-10 py-8 flex items-center justify-between text-left focus:outline-none group"
            >
                <span className="font-serif italic text-xl text-[#F5F0E8]/80 group-hover:text-[#F5F0E8] transition-colors duration-700 font-light">{q}</span>
                <ChevronDown className={`w-4 h-4 text-[#C9A84C] transition-transform duration-900 ${isOpen ? 'rotate-180' : ''}`} strokeWidth={1} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <div className="px-10 pb-10 text-[10px] text-[#F5F0E8]/40 leading-loose uppercase tracking-[0.2em] font-light font-sans">
                            {a}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
