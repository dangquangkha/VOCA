'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic,
    MicOff,
    StopCircle,
    SkipForward,
    CheckCircle2,
    Trophy,
    MessageSquare,
    Volume2,
    VolumeX,
    ArrowRight,
    AlertCircle,
    Zap
} from 'lucide-react';

type InterviewState = 'PRE_CHECK' | 'ROOM' | 'REPORT' | 'MIC_DENIED';

const MOCK_INTERVIEW_DATA = {
    score: 92,
    fluency: 88,
    feedback: [
        {
            q: "Giới thiệu bản thân và kinh nghiệm làm việc của bạn?",
            a: "Chào bạn, tôi là một kỹ sư phần mềm với 3 năm kinh nghiệm trong phát triển web...",
            feedback: "Câu trả lời của bạn rất rõ ràng và mạch lạc. Tuy nhiên, bạn có thể bổ sung thêm một số thành tựu cụ thể về con số."
        },
        {
            q: "Bạn giải quyết vấn đề thế nào khi gặp xung đột trong team?",
            a: "Tôi thường lắng nghe các bên và cố gắng tìm ra giải pháp trung lập có lợi cho dự án nhất...",
            feedback: "Bạn thể hiện được kỹ năng giao tiếp tốt. Hãy thử kể một ví dụ cụ thể (Case study) để tăng sức thuyết phục hơn."
        }
    ]
};

export default function MockInterview() {
    const [state, setState] = useState<InterviewState>('PRE_CHECK');
    const [isAIspeaking, setIsAIspeaking] = useState(false);
    const [isUserSpeaking, setIsUserSpeaking] = useState(false);
    const [micLevel, setMicLevel] = useState(0);
    const [questionCount, setQuestionCount] = useState(1);
    const [showTranscript, setShowTranscript] = useState(false);

    // Simulate Mic Level during check
    useEffect(() => {
        if (state === 'PRE_CHECK') {
            const interval = setInterval(() => {
                setMicLevel(Math.random() * 50 + 10);
            }, 100);
            return () => clearInterval(interval);
        }
    }, [state]);

    const enterRoom = () => {
        setState('ROOM');
        setIsAIspeaking(true);
        // AI speaks first
        setTimeout(() => setIsAIspeaking(false), 3000);
    };

    const skipQuestion = () => {
        if (questionCount < 5) {
            setQuestionCount(prev => prev + 1);
            setIsAIspeaking(true);
            setTimeout(() => setIsAIspeaking(false), 2000);
        } else {
            setState('REPORT');
        }
    };

    const endInterview = () => {
        setState('REPORT');
    };

    return (
        <div className="w-full max-w-[1400px] mx-auto py-12 px-4 h-full min-h-[600px] flex flex-col selection:bg-[#C9A84C]/30">
            <AnimatePresence mode="wait">

                {/* State 1: Mic Check */}
                {state === 'PRE_CHECK' && (
                    <motion.div
                        key="precheck"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                        className="flex-grow flex flex-col items-center justify-center text-center space-y-20"
                    >
                        <div className="space-y-6">
                            <h1 className="text-[clamp(32px,5vw,52px)] font-serif italic text-[#F5F0E8] font-light tracking-tight">Sẵn sàng cho phỏng vấn?</h1>
                            <p className="text-[#F5F0E8]/40 font-sans font-light text-sm tracking-wide">Hãy dành 1 phút để kiểm tra thiết bị của bạn.</p>
                        </div>

                        <div className="relative group">
                            <div className="w-48 h-48 border border-[#C9A84C]/10 flex items-center justify-center overflow-hidden relative">
                                <Mic className="w-12 h-12 text-[#C9A84C]/20 group-hover:text-[#C9A84C]/40 transition-colors duration-700" strokeWidth={0.5} />
                                {/* Audio Level Visualizer */}
                                <motion.div
                                    className="absolute bottom-0 w-full bg-[#C9A84C]/5"
                                    animate={{ height: `${micLevel}%` }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            </div>
                            <motion.div
                                animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.4, 0.2] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="absolute inset-x-[-10px] inset-y-[-10px] border border-[#C9A84C]/20 pointer-events-none"
                            />
                        </div>

                        <div className="space-y-10">
                            <div className="flex items-center gap-3 text-[#C9A84C]/60 font-sans text-[10px] tracking-[0.3em] uppercase justify-center">
                                <CheckCircle2 className="w-3 h-3" strokeWidth={1} />
                                Microphone đã kết nối
                            </div>
                            <button
                                onClick={enterRoom}
                                className="px-16 py-6 bg-[#C9A84C] text-[#090C12] text-[11px] tracking-[0.5em] uppercase font-normal transition-all duration-900 hover:bg-[#F5F0E8] shadow-2xl shadow-black/40 flex items-center gap-4 group/btn"
                            >
                                Vào phòng phỏng vấn
                                <ArrowRight className="w-4 h-4 transition-transform duration-700 group-hover/btn:translate-x-2" strokeWidth={1} />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* State 2: Interview Room */}
                {state === 'ROOM' && (
                    <motion.div
                        key="room"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.9 }}
                        className="flex-grow flex flex-col items-center justify-between py-12"
                    >
                        {/* Top Bar */}
                        <div className="w-full flex justify-between items-center px-4 md:px-8">
                            <div className="flex items-center gap-4">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-pulse" />
                                <span className="text-[10px] font-normal uppercase tracking-[0.3em] text-[#F5F0E8]/40 font-sans">Đang phỏng vấn • {questionCount}/5</span>
                            </div>
                            <button
                                onClick={() => setShowTranscript(!showTranscript)}
                                className="w-12 h-12 border border-[#C9A84C]/10 flex items-center justify-center hover:bg-[#C9A84C]/5 transition-all duration-700 group"
                                title="Switch to Text"
                            >
                                <MessageSquare className={`w-5 h-5 transition-colors duration-700 ${showTranscript ? 'text-[#C9A84C]' : 'text-[#F5F0E8]/20 group-hover:text-[#F5F0E8]/40'}`} strokeWidth={1} />
                            </button>
                        </div>

                        {/* Center Area: AI Pulse & Waves */}
                        <div className="relative flex flex-col items-center">
                            <motion.div
                                animate={{
                                    scale: isAIspeaking ? [1, 1.1, 1] : 1,
                                    opacity: isAIspeaking ? [0.6, 1, 0.6] : 0.4
                                }}
                                transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                                className="w-32 h-32 border border-[#C9A84C]/40 flex items-center justify-center mb-20 relative group"
                            >
                                <Zap className="w-10 h-10 text-[#C9A84C]" strokeWidth={0.5} />
                                <motion.div
                                    animate={{
                                        scale: [1, 1.5, 1],
                                        opacity: [0.1, 0.3, 0.1]
                                    }}
                                    transition={{ duration: 4, repeat: Infinity }}
                                    className="absolute inset-0 border border-[#C9A84C]/60 blur-md"
                                />
                            </motion.div>

                            {/* Sound Waves */}
                            <div className="flex items-center gap-2 h-12">
                                {[...Array(24)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        animate={{
                                            height: (isAIspeaking || isUserSpeaking) ? [4, Math.random() * 40 + 8, 4] : 4
                                        }}
                                        transition={{
                                            duration: 0.3 + Math.random() * 0.2,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                        className={`w-[1px] ${isAIspeaking ? 'bg-[#C9A84C]' :
                                            isUserSpeaking ? 'bg-[#F5F0E8]' : 'bg-white/10'
                                            }`}
                                    />
                                ))}
                            </div>

                            {isAIspeaking && (
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-12 text-[9px] uppercase tracking-[0.4em] text-[#C9A84C]/60 font-sans"
                                >
                                    AI đang thấu cảm...
                                </motion.p>
                            )}
                        </div>

                        {/* Bottom Controls */}
                        <div className="w-full max-w-xl px-4">
                            <div className="bg-white/[0.03] border border-[#F5F0E8]/10 p-6 flex items-center justify-between relative">
                                <button
                                    onClick={endInterview}
                                    className="flex items-center gap-3 px-6 py-4 text-[10px] font-normal text-[#F5F0E8]/40 hover:text-white transition-all duration-700 uppercase tracking-widest font-sans"
                                >
                                    <StopCircle className="w-4 h-4" strokeWidth={1} />
                                    Kết thúc
                                </button>

                                <button
                                    onMouseDown={() => setIsUserSpeaking(true)}
                                    onMouseUp={() => setIsUserSpeaking(false)}
                                    className={`w-16 h-16 border rounded-none flex items-center justify-center transition-all duration-700
                    ${isUserSpeaking
                                            ? 'bg-[#C9A84C] text-[#090C12] border-[#C9A84C] scale-105'
                                            : 'border-[#C9A84C]/40 text-[#C9A84C] bg-white/[0.02] hover:bg-white/[0.05]'}`}
                                >
                                    <Mic className="w-6 h-6" strokeWidth={1} />
                                </button>

                                <button
                                    onClick={skipQuestion}
                                    className="flex items-center gap-3 px-6 py-4 text-[10px] font-normal text-[#F5F0E8]/40 hover:text-[#C9A84C] transition-all duration-700 uppercase tracking-widest font-sans"
                                >
                                    <SkipForward className="w-4 h-4" strokeWidth={1} />
                                    Bỏ qua
                                </button>
                            </div>
                            <p className="text-center text-[9px] font-normal text-[#F5F0E8]/20 mt-8 uppercase tracking-[0.4em] font-sans">
                                Nhấn giữ để phản hồi
                            </p>
                        </div>

                        {/* Hidden Text Chat Pane */}
                        <AnimatePresence>
                            {showTranscript && (
                                <motion.div
                                    initial={{ x: '100%' }}
                                    animate={{ x: 0 }}
                                    exit={{ x: '100%' }}
                                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                                    className="absolute right-0 top-0 bottom-0 w-80 bg-[#090C12] border-l border-[#C9A84C]/10 p-10 z-20 backdrop-blur-xl"
                                >
                                    <div className="flex justify-between items-center mb-10">
                                        <h3 className="font-serif italic text-xl text-[#F5F0E8] font-light">Lịch sử đối thoại</h3>
                                        <button onClick={() => setShowTranscript(false)} className="text-[#F5F0E8]/20 hover:text-[#C9A84C] transition-colors duration-700 text-sm italic">Thoát</button>
                                    </div>
                                    <div className="space-y-6 text-xs font-sans font-light text-[#F5F0E8]/60">
                                        <p className="bg-white/[0.03] p-5 border border-[#C9A84C]/5 leading-loose">Chào mừng bạn. Bạn hãy giới thiệu bản thân nhé!</p>
                                        <p className="p-5 border border-white/5 text-right italic opacity-40">Đang chờ bạn trả lời...</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}

                {/* State 3: Performance Report */}
                {state === 'REPORT' && (
                    <motion.div
                        key="report"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                        className="space-y-16 pb-20"
                    >
                        <div className="text-center space-y-6">
                            <div className="w-20 h-20 border border-[#C9A84C]/30 flex items-center justify-center text-[#C9A84C] mx-auto mb-10 group">
                                <Trophy className="w-10 h-10" strokeWidth={0.5} />
                            </div>
                            <h2 className="text-[clamp(32px,5vw,52px)] font-serif italic text-[#F5F0E8] font-light">Hoàn thành đối thoại!</h2>
                            <p className="text-[#F5F0E8]/40 font-sans font-light text-sm tracking-wide">Chúc mừng bạn đã hoàn thiện phiên luyện tập cùng trợ lý chiến lược.</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="bg-white/[0.02] border border-[#C9A84C]/10 p-12 flex flex-col items-center text-center space-y-8 group hover:border-[#C9A84C]/30 transition-all duration-700">
                                <div className="text-6xl font-serif italic text-[#F5F0E8] font-light">{MOCK_INTERVIEW_DATA.score}<span className="text-xl text-[#F5F0E8]/20 font-sans italic">/100</span></div>
                                <div className="space-y-2">
                                    <p className="text-[10px] uppercase tracking-[0.4em] text-[#C9A84C] font-normal font-sans">Điểm tổng thể</p>
                                    <p className="text-[10px] text-[#F5F0E8]/40 font-sans font-light uppercase tracking-widest">Top 15% ứng viên xuất sắc</p>
                                </div>
                            </div>
                            <div className="bg-[#C9A84C] p-12 text-[#090C12] flex flex-col items-center text-center space-y-8 shadow-3xl shadow-black/40 group hover:bg-[#F5F0E8] transition-all duration-900">
                                <div className="text-6xl font-serif italic font-light">{MOCK_INTERVIEW_DATA.fluency}%</div>
                                <div className="space-y-2">
                                    <p className="text-[10px] uppercase tracking-[0.4em] font-normal font-sans opacity-80">Độ lưu loát</p>
                                    <p className="text-[10px] font-sans font-light uppercase tracking-widest opacity-60">Khả năng diễn đạt mạch lạc</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-10">
                            <h3 className="text-2xl font-serif italic text-[#F5F0E8] font-light">Hồ sơ thẩm định</h3>
                            <div className="space-y-8">
                                {MOCK_INTERVIEW_DATA.feedback.map((item, i) => (
                                    <div key={i} className="bg-white/[0.02] border border-white/5 p-10 space-y-10 group hover:border-[#C9A84C]/20 transition-all duration-700">
                                        <div className="space-y-4">
                                            <p className="text-[9px] font-normal text-[#C9A84C]/60 uppercase tracking-[0.5em] font-sans">Câu hỏi 0{i + 1}</p>
                                            <p className="text-2xl font-serif italic text-[#F5F0E8] font-light leading-snug">{item.q}</p>
                                        </div>
                                        <div className="bg-white/[0.01] border-l border-white/5 p-8 italic text-sm text-[#F5F0E8]/40 font-sans font-light leading-loose">
                                            &ldquo;{item.a}&rdquo;
                                        </div>
                                        <div className="flex gap-6">
                                            <div className="w-12 h-12 border border-[#C9A84C]/20 flex items-center justify-center shrink-0">
                                                <MessageSquare className="w-5 h-5 text-[#C9A84C]/60" strokeWidth={0.5} />
                                            </div>
                                            <div className="space-y-3">
                                                <p className="text-[10px] uppercase tracking-[0.3em] font-normal text-[#C9A84C] font-sans">Phân tích chuyên sâu</p>
                                                <p className="text-sm text-[#F5F0E8]/60 font-sans font-light leading-[1.8] tracking-wide">{item.feedback}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-center pt-10">
                            <button
                                onClick={() => setState('PRE_CHECK')}
                                className="px-12 py-5 border border-[#C9A84C]/30 text-[#C9A84C] text-[10px] tracking-[0.5em] uppercase font-normal transition-all duration-900 hover:bg-[#C9A84C] hover:text-[#090C12] shadow-2xl"
                            >
                                Luyện tập phiên mới
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
