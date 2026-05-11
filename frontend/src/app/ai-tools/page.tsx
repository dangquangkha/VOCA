'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSearch, Mic2, Sparkles, ChevronLeft, Upload, Zap, Target, Award, ShieldCheck, Cpu, HelpCircle, ChevronRight, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import RainVisual from '@/components/special/RainVisual';
import CVAnalyzer from '@/components/ai/CVAnalyzer';
import MockInterview from '@/components/ai/MockInterview';

type ToolType = 'CV' | 'INTERVIEW' | 'HOME';

export default function AIToolsPage() {
    const [activeTool, setActiveTool] = useState<ToolType>('HOME');

    return (
        <div className="bg-white min-h-screen relative overflow-hidden font-dm-sans">
            {/* Cinematic Background Elements removed for clarity */}
            
            {/* Video Background */}
            <RainVisual />

            <div className="max-w-[1400px] mx-auto px-8 lg:px-12 pt-24 pb-40 relative z-10">
                {/* Breadcrumb / Back Navigation */}
                <div className="mb-24">
                    {activeTool !== 'HOME' ? (
                        <button
                            onClick={() => setActiveTool('HOME')}
                            className="flex items-center gap-6 text-[#0046EA]/40 hover:text-[#0046EA] transition-all duration-700 group"
                        >
                            <div className="w-12 h-12 border border-[#0046EA]/10 flex items-center justify-center group-hover:bg-[#0046EA]/5 transition-all duration-700 rounded-full">
                                <ChevronLeft className="w-5 h-5" strokeWidth={1} />
                            </div>
                            <span className="text-[10px] tracking-[0.5em] uppercase font-black">QUAY LẠI DANH MỤC</span>
                        </button>
                    ) : (
                        <Link href="/" className="flex items-center gap-6 text-[#0046EA]/40 hover:text-[#0046EA] transition-all duration-700 group">
                            <div className="w-12 h-12 border border-[#0046EA]/10 flex items-center justify-center group-hover:bg-[#0046EA]/5 transition-all duration-700 rounded-full">
                                <ChevronLeft className="w-5 h-5" strokeWidth={1} />
                            </div>
                            <span className="text-[10px] tracking-[0.5em] uppercase font-black">VỀ TRANG CHỦ</span>
                        </Link>
                    )}
                </div>

                {/* Selection State */}
                <AnimatePresence mode="wait">
                    {activeTool === 'HOME' ? (
                        <motion.div
                            key="home"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                            className="space-y-48"
                        >
                            <div className="text-center space-y-12 max-w-4xl mx-auto">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 1.1, delay: 0.2 }}
                                    className="w-20 h-20 border-[2px] border-[#00A4FD] flex items-center justify-center text-[#00A4FD] mx-auto mb-16 rounded-0 relative group shadow-lg shadow-[#00A4FD]/10 bg-white"
                                >
                                    <div className="absolute inset-0 bg-[#00A4FD]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                    <Sparkles className="w-8 h-8 relative z-10" strokeWidth={3} />
                                </motion.div>
                                <h1 className="text-[clamp(48px,6vw,84px)] font-garamond italic font-bold text-[#171716] tracking-tight leading-[1.1] drop-shadow-sm">
                                    Hệ sinh thái AI <br /><span className="text-[#0046EA]">Kiến tạo sự nghiệp</span>
                                </h1>
                                <p className="text-[18px] md:text-[20px] text-[#0046EA]/60 font-garamond italic max-w-2xl mx-auto leading-relaxed">
                                    Nâng tầm bản sắc chuyên nghiệp với công nghệ trí tuệ nhân tạo tối tân, được tinh chỉnh cho những khát vọng vươn tầm chuyên gia.
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-12">
                                {/* CV Analyzer Card */}
                                <motion.div
                                    initial={{ opacity: 0, y: 40 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 1, delay: 0.3 }}
                                    onClick={() => setActiveTool('CV')}
                                    className="bg-[#F5F8FF] border border-black/5 p-16 shadow-2xl cursor-pointer group transition-all duration-700 rounded-[64px] relative overflow-hidden hover:border-[#0046EA]/20"
                                >
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#0046EA]/5 blur-[120px] rounded-full -mr-32 -mt-32 group-hover:bg-[#0046EA]/10 transition-all duration-700" />
                                    <div className="flex flex-col items-center text-center space-y-16 relative z-10">
                                        <div className="w-20 h-20 border-2 border-[#0046EA]/20 flex items-center justify-center text-[#0046EA] group-hover:border-[#0046EA] transition-all duration-700 rounded-3xl">
                                            <FileSearch className="w-10 h-10" strokeWidth={1} />
                                        </div>
                                        <div className="space-y-6">
                                            <h3 className="text-4xl font-garamond italic font-bold text-[#171716]">AI CV Analyzer</h3>
                                            <p className="text-black/40 text-[17px] font-dm-sans font-medium max-w-xs mx-auto leading-relaxed">
                                                Phân tích đa chiều, chấm điểm và tối ưu hóa hồ sơ theo chuẩn mực ATS quốc tế.
                                            </p>
                                        </div>
                                        <button className="w-full py-6 bg-[#0046EA] text-[#FFE900] text-[11px] font-black tracking-[0.5em] uppercase transition-all duration-700 hover:bg-[#171716] rounded-full shadow-xl">
                                            KHAI PHÓNG CÔNG CỤ
                                        </button>
                                    </div>
                                </motion.div>

                                {/* Mock Interview Card */}
                                <motion.div
                                    initial={{ opacity: 0, y: 40 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 1, delay: 0.4 }}
                                    onClick={() => setActiveTool('INTERVIEW')}
                                    className="bg-white border border-black/5 p-16 shadow-2xl cursor-pointer group transition-all duration-700 rounded-[64px] relative overflow-hidden hover:border-[#0046EA]/20"
                                >
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFE900]/5 blur-[120px] rounded-full -mr-32 -mt-32 group-hover:bg-[#FFE900]/10 transition-all duration-700" />
                                    <div className="flex flex-col items-center text-center space-y-16 relative z-10">
                                        <div className="w-20 h-20 border-2 border-[#00A4FD]/20 flex items-center justify-center text-[#00A4FD] group-hover:border-[#00A4FD] transition-all duration-700 rounded-3xl">
                                            <Mic2 className="w-10 h-10" strokeWidth={1} />
                                        </div>
                                        <div className="space-y-6">
                                            <h3 className="text-4xl font-garamond italic font-bold text-[#171716]">AI Mock Interview</h3>
                                            <p className="text-black/40 text-[17px] font-dm-sans font-medium max-w-xs mx-auto leading-relaxed">
                                                Đối thoại giả lập 1-1 với trợ lý thông minh thời gian thực, rèn luyện bản lĩnh phản biện.
                                            </p>
                                        </div>
                                        <button className="w-full py-6 border-2 border-[#0046EA] text-[#0046EA] text-[11px] font-black tracking-[0.5em] uppercase transition-all duration-700 hover:bg-[#0046EA] hover:text-[#FFE900] rounded-full">
                                            BẮT ĐẦU HÀNH TRÌNH
                                        </button>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Luxury Thread Tip */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.9 }}
                                className="bg-[#F5F8FF] border border-[#0046EA]/10 p-16 flex flex-col md:flex-row items-center gap-12 max-w-5xl mx-auto shadow-2xl rounded-[48px] group"
                            >
                                <div className="w-24 h-24 border-2 border-[#00A4FD]/20 flex items-center justify-center text-[#00A4FD] group-hover:border-[#00A4FD] transition-all duration-700 shrink-0 rounded-full">
                                    <Target className="w-10 h-10" strokeWidth={1} />
                                </div>
                                <div className="space-y-6 text-center md:text-left">
                                    <p className="text-[#0046EA] font-black text-[10px] uppercase tracking-[0.6em] opacity-60">Tri thức từ CareerPath</p>
                                    <p className="text-[#171716] font-garamond italic text-[24px] leading-relaxed tracking-tight">
                                        &ldquo;Sự chuẩn bị kỹ lưỡng là nền tảng của thành công. Hãy tinh lọc hồ sơ trước khi bước vào những cuộc đối thoại chiến lược cùng chuyên gia.&rdquo;
                                    </p>
                                </div>
                            </motion.div>

                            {/* Process Section */}
                            <div className="py-32">
                                <div className="text-center mb-32 space-y-6">
                                    <div className="flex items-center justify-center gap-6">
                                        <div className="w-12 h-px bg-[#0046EA]" />
                                        <span className="text-[10px] font-black text-[#0046EA] uppercase tracking-[0.5em]">The Protocol</span>
                                    </div>
                                    <h2 className="text-5xl font-garamond italic font-bold text-[#171716] tracking-tight">Quy trình tối ưu hóa</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-16">
                                    {[
                                        { icon: <Upload size={28} strokeWidth={1} />, label: 'Tiếp nhận', desc: 'Kết nối dữ liệu chuyên môn (.pdf / .docx)' },
                                        { icon: <Zap size={28} strokeWidth={1} />, label: 'Phân tích', desc: 'Đối soát đa chiều cùng trí tuệ nhân tạo' },
                                        { icon: <Target size={28} strokeWidth={1} />, label: 'Gợi ý', desc: 'Tiếp nhận chiến lược cải thiện chi tiết' },
                                        { icon: <Award size={28} strokeWidth={1} />, label: 'Thành tựu', desc: 'Khẳng định vị thế trong mắt nhà tuyển dụng' }
                                    ].map((step, index) => (
                                        <div key={index} className="relative group text-center space-y-10">
                                            <div className="w-20 h-20 border-2 border-black/5 flex items-center justify-center text-black/20 mx-auto group-hover:border-[#0046EA] group-hover:text-[#0046EA] transition-all duration-700 bg-white rounded-3xl shadow-lg">
                                                {step.icon}
                                            </div>
                                            <div className="space-y-4">
                                                <h4 className="text-[11px] font-black text-[#171716] tracking-[0.4em] uppercase">{step.label}</h4>
                                                <p className="text-[13px] text-black/40 font-dm-sans font-medium leading-relaxed max-w-[180px] mx-auto">{step.desc}</p>
                                            </div>
                                            {index < 3 && (
                                                <div className="hidden lg:block absolute top-10 -right-10 text-black/10 transition-all duration-700 group-hover:text-[#0046EA]/40">
                                                    <ChevronRight size={16} strokeWidth={1} />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* FAQ Section */}
                            <div className="py-32 max-w-4xl mx-auto w-full">
                                <div className="text-center mb-24 space-y-8">
                                    <div className="flex items-center justify-center gap-6">
                                        <div className="w-12 h-px bg-[#0046EA]" />
                                        <span className="text-[10px] font-black text-[#0046EA] uppercase tracking-[0.5em]">FAQ</span>
                                    </div>
                                    <h2 className="text-5xl font-garamond italic font-bold text-[#171716]">Những điều cần thấu cảm</h2>
                                </div>
                                <div className="space-y-8">
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
                                transition={{ duration: 1 }}
                                className="relative p-24 text-center bg-[#0046EA] overflow-hidden group shadow-3xl rounded-[64px]"
                            >
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,233,0,0.1)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                                <div className="relative z-10 space-y-16">
                                    <h2 className="text-[clamp(32px,4vw,64px)] font-garamond italic text-white leading-tight font-bold max-w-3xl mx-auto">
                                        Sẵn sàng kiến tạo <br />dấu ấn vinh quang?
                                    </h2>
                                    <div className="flex flex-col sm:flex-row items-center justify-center gap-10">
                                        <button
                                            onClick={() => setActiveTool('CV')}
                                            className="px-20 py-8 bg-[#FFE900] text-[#171716] text-[11px] font-black tracking-[0.5em] uppercase hover:bg-white transition-all duration-700 shadow-2xl rounded-full"
                                        >
                                            Bắt đầu ngay
                                        </button>
                                        <Link
                                            href="/pricing"
                                            className="px-20 py-8 border-2 border-white/20 text-white text-[11px] font-black tracking-[0.5em] uppercase hover:border-[#FFE900] hover:text-[#FFE900] transition-all duration-700 rounded-full"
                                        >
                                            Xem bảng giá
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
                            className="min-h-[800px] bg-white border border-black/5 p-4 rounded-[48px] shadow-3xl items-start"
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
        <div className="bg-white border border-black/5 overflow-hidden transition-all duration-700 hover:border-[#0046EA]/20 rounded-[32px] shadow-sm">
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                className="w-full px-12 py-10 flex items-center justify-between text-left focus:outline-none group"
            >
                <span className="font-garamond italic text-2xl text-[#171716]/80 group-hover:text-[#0046EA] transition-colors duration-700 font-bold">{q}</span>
                <ChevronDown className={`w-5 h-5 text-[#0046EA] transition-transform duration-700 ${isOpen ? 'rotate-180' : ''}`} strokeWidth={1.5} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <div className="px-12 pb-12 text-[15px] text-black/40 leading-relaxed font-dm-sans font-medium">
                            {a}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
