'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Brain, 
    Sparkles, 
    ChevronRight, 
    CheckCircle2, 
    AlertCircle, 
    ArrowRight,
    Loader2,
    Users,
    Zap,
    Heart,
    Target,
    Briefcase
} from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';

interface MBTIQuestion {
    id: number;
    order: number;
    text: string;
    option_a_text: string;
    option_b_text: string;
    option_a_value: string;
    option_b_value: string;
    dimension: string;
}

interface MBTIType {
    code: string;
    title: string;
    vietnamese_title: string;
    description: string;
    pros: string[];
    cons: string[];
    population_pct: string;
    suggested_careers: string;
}

interface MBTIResult {
    mbti_code: string;
    gender: string;
    created_at: string;
    type_details: MBTIType;
    scores: Record<string, number>;
}

export default function MBTISector() {
    const [questions, setQuestions] = useState<MBTIQuestion[]>([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [gender, setGender] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<MBTIResult | null>(null);
    const [isQuizStarted, setIsQuizStarted] = useState(false);

    useEffect(() => {
        fetchResult();
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        try {
            const { data } = await api.get<MBTIQuestion[]>('mbti/questions');
            setQuestions(data);
        } catch (err) {
            console.error("Failed to fetch MBTI questions", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchResult = async () => {
        try {
            const { data } = await api.get<MBTIResult | null>('mbti/my-result');
            setResult(data);
        } catch (err) {
            console.error("Failed to fetch MBTI result", err);
        }
    };

    const handleAnswer = (choice: 'A' | 'B') => {
        const qOrder = questions[currentStep].order;
        setAnswers(prev => ({ ...prev, [qOrder]: choice }));
        
        if (currentStep < questions.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            // Last question answered, move to gender selection
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleSubmit = async () => {
        if (!gender) return;
        setSubmitting(true);
        try {
            const { data } = await api.post<MBTIResult>('mbti/submit', {
                answers,
                gender
            });
            setResult(data);
            setIsQuizStarted(false);
        } catch (err) {
            console.error("Failed to submit MBTI", err);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="w-8 h-8 text-[#00A4FD] animate-spin" />
            <p className="text-black/40 text-[10px] uppercase tracking-[0.5em] font-black">KHỞI TẠO BÀI TRẮC NGHIỆM...</p>
        </div>
    );

    if (result && !isQuizStarted) {
        return <MBTIResultView result={result} onRetake={() => setIsQuizStarted(true)} />;
    }

    if (!isQuizStarted) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-6">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border-8 border-[#00A4FD] p-12 md:p-20 text-center space-y-12 shadow-[0_64px_128px_rgba(0,164,253,0.15)]"
                >
                    <div className="w-24 h-24 bg-[#00A4FD] flex items-center justify-center mx-auto shadow-[12px_12px_0_0_rgba(0,164,253,0.1)]">
                        <Brain className="w-12 h-12 text-yellow-300" strokeWidth={1.5} />
                    </div>
                    <div className="space-y-6">
                        <h2 className="font-garamond text-5xl md:text-6xl text-black italic font-bold">Khám phá <span className="text-[#00A4FD] not-italic">Bản ngã</span></h2>
                        <p className="text-black/60 text-lg font-garamond italic max-w-xl mx-auto leading-relaxed">
                            MBTI (Myers-Briggs Type Indicator) là công cụ phân loại tính cách phổ biến nhất thế giới, giúp bạn hiểu rõ cách mình nhận thức thế giới và đưa ra quyết định.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                        <div className="p-8 bg-[#00A4FD]/5 border-l-4 border-[#00A4FD] space-y-4">
                            <Zap className="w-6 h-6 text-[#00A4FD]" />
                            <h4 className="text-[11px] font-black text-black uppercase tracking-widest">70 Câu hỏi</h4>
                            <p className="text-[10px] text-black/40 font-black uppercase tracking-wider leading-relaxed">Bộ câu hỏi chuẩn hóa giúp phân loại chính xác 16 nhóm tính cách.</p>
                        </div>
                        <div className="p-8 bg-[#00A4FD]/5 border-l-4 border-[#00A4FD] space-y-4">
                            <Target className="w-6 h-6 text-[#00A4FD]" />
                            <h4 className="text-[11px] font-black text-black uppercase tracking-widest">Định hướng nghề nghiệp</h4>
                            <p className="text-[10px] text-black/40 font-black uppercase tracking-wider leading-relaxed">Gợi ý các lĩnh vực phù hợp nhất với thế mạnh bẩm sinh của bạn.</p>
                        </div>
                        <div className="p-8 bg-[#00A4FD]/5 border-l-4 border-[#00A4FD] space-y-4">
                            <Users className="w-6 h-6 text-[#00A4FD]" />
                            <h4 className="text-[11px] font-black text-black uppercase tracking-widest">Thấu hiểu bản thân</h4>
                            <p className="text-[10px] text-black/40 font-black uppercase tracking-wider leading-relaxed">Khám phá ưu và nhược điểm để phát triển kỹ năng giao tiếp và làm việc.</p>
                        </div>
                    </div>
                    <Button 
                        onClick={() => {
                            setIsQuizStarted(true);
                            setCurrentStep(0);
                            setAnswers({});
                        }}
                        className="h-16 px-16 bg-[#00A4FD] text-yellow-300 font-black uppercase tracking-[0.4em] text-[10px] hover:bg-[#0086D4] transition-all duration-700 shadow-[0_24px_48px_-12px_rgba(0,164,253,0.4)]"
                    >
                        Bắt đầu khám phá
                    </Button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto py-12 px-6 min-h-[600px] flex flex-col justify-center">
            <AnimatePresence mode="wait">
                {currentStep < questions.length ? (
                    <motion.div 
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-12"
                    >
                        <div className="space-y-6 text-center">
                            <span className="text-[10px] font-black text-[#00A4FD] uppercase tracking-[0.5em]">Câu hỏi {currentStep + 1} / 70</span>
                            <div className="w-full h-2 bg-black/5 relative overflow-hidden">
                                <motion.div 
                                    className="h-full bg-[#00A4FD]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${((currentStep + 1) / 70) * 100}%` }}
                                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                />
                            </div>
                        </div>

                        <h3 className="font-garamond italic font-bold text-4xl text-[#0046EA] text-center leading-tight">
                            {questions[currentStep].text}
                        </h3>

                        <div className="grid grid-cols-1 gap-6">
                            <button 
                                onClick={() => handleAnswer('A')}
                                className="group p-10 bg-white border-2 border-black/5 hover:border-[#00A4FD] transition-all duration-700 text-left flex items-center justify-between shadow-sm hover:shadow-xl"
                            >
                                <span className="text-black/60 text-xl font-garamond italic group-hover:text-[#0046EA] transition-colors">
                                    {questions[currentStep].option_a_text || "Lựa chọn thứ nhất"}
                                </span>
                                <ArrowRight className="w-6 h-6 text-black/10 group-hover:text-[#00A4FD] group-hover:translate-x-2 transition-all duration-500" />
                            </button>
                            <button 
                                onClick={() => handleAnswer('B')}
                                className="group p-10 bg-white border-2 border-black/5 hover:border-[#00A4FD] transition-all duration-700 text-left flex items-center justify-between shadow-sm hover:shadow-xl"
                            >
                                <span className="text-black/60 text-xl font-garamond italic group-hover:text-[#0046EA] transition-colors">
                                    {questions[currentStep].option_b_text || "Lựa chọn thứ hai"}
                                </span>
                                <ArrowRight className="w-6 h-6 text-black/10 group-hover:text-[#00A4FD] group-hover:translate-x-2 transition-all duration-500" />
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="gender"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-16 text-center"
                    >
                        <div className="space-y-6">
                            <Sparkles className="w-16 h-16 text-[#00A4FD] mx-auto animate-pulse" />
                            <h3 className="font-garamond text-5xl text-[#0046EA] italic font-bold">Bước cuối cùng</h3>
                            <p className="text-black/40 text-[10px] font-black uppercase tracking-[0.5em]">LỰA CHỌN GIỚI TÍNH ĐỂ HOÀN TẤT BÁO CÁO</p>
                        </div>

                        <div className="flex justify-center gap-8">
                            <button 
                                onClick={() => setGender('Nam')}
                                className={`px-16 py-6 border-2 transition-all duration-700 text-[10px] font-black uppercase tracking-widest ${gender === 'Nam' ? 'bg-[#0046EA] text-white border-[#0046EA] shadow-xl' : 'text-black/20 border-black/5 hover:border-black/20'}`}
                            >
                                Nam
                            </button>
                            <button 
                                onClick={() => setGender('Nữ')}
                                className={`px-16 py-6 border-2 transition-all duration-700 text-[10px] font-black uppercase tracking-widest ${gender === 'Nữ' ? 'bg-[#0046EA] text-white border-[#0046EA] shadow-xl' : 'text-black/20 border-black/5 hover:border-black/20'}`}
                            >
                                Nữ
                            </button>
                        </div>

                        <Button 
                            onClick={handleSubmit}
                            disabled={!gender || submitting}
                            className="h-20 px-24 bg-[#00A4FD] text-yellow-300 font-black uppercase tracking-[0.5em] text-[11px] disabled:opacity-20 shadow-2xl transition-all duration-700 hover:scale-[1.02]"
                        >
                            {submitting ? 'ĐANG PHÂN TÍCH...' : 'XEM KẾT QUẢ'}
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function MBTIResultView({ result, onRetake }: { result: MBTIResult, onRetake: () => void }) {
    const details = result.type_details;

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-7xl mx-auto py-20 px-8 space-y-24"
        >
            {/* Header Section */}
            <div className="text-center space-y-10">
                <div className="inline-flex items-center gap-6 text-[#00A4FD] mb-4">
                    <div className="w-16 h-[1px] bg-[#00A4FD]/30"></div>
                    <span className="text-[11px] font-black uppercase tracking-[0.6em]">KẾT QUẢ TRẮC NGHIỆM MBTI</span>
                    <div className="w-16 h-[1px] bg-[#00A4FD]/30"></div>
                </div>
                <h1 className="font-garamond text-8xl md:text-9xl text-[#0046EA] italic font-bold leading-none tracking-tighter">
                    {details.vietnamese_title}
                </h1>
                <div className="flex items-center justify-center gap-8">
                    <span className="text-8xl font-black text-[#00A4FD] tracking-tighter drop-shadow-2xl">{result.mbti_code}</span>
                    <div className="text-left border-l-4 border-black/5 pl-8">
                        <p className="text-[14px] font-black text-black uppercase tracking-widest">{details.title}</p>
                        <p className="text-[10px] text-black/40 font-black uppercase tracking-[0.2em] mt-2">CHIẾM {details.population_pct} DÂN SỐ THẾ GIỚI</p>
                    </div>
                </div>
            </div>

            {/* Description & Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
                <div className="lg:col-span-7 space-y-16">
                    <div className="space-y-8">
                        <h3 className="text-[#00A4FD] text-[12px] font-black uppercase tracking-[0.4em] flex items-center gap-6">
                            <div className="w-12 h-[1px] bg-[#00A4FD]/30"></div> TỔNG QUAN TÍNH CÁCH
                        </h3>
                        <p className="text-black/70 text-2xl font-garamond italic leading-relaxed first-letter:text-6xl first-letter:font-bold first-letter:mr-3 first-letter:text-[#00A4FD]">
                            {details.description}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-8 p-10 bg-[#00A4FD]/5 border-t-8 border-[#00A4FD]">
                            <h4 className="text-[#0046EA] text-[11px] font-black uppercase tracking-widest flex items-center gap-4">
                                <CheckCircle2 className="w-5 h-5" /> ƯU ĐIỂM NỔI BẬT
                            </h4>
                            <ul className="space-y-6">
                                {details.pros.map((pro, i) => (
                                    <li key={i} className="text-xs text-black/60 font-black uppercase tracking-wider leading-relaxed flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 bg-[#00A4FD] mt-1 shrink-0" />
                                        {pro}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="space-y-8 p-10 bg-red-50 border-t-8 border-red-500">
                            <h4 className="text-red-600 text-[11px] font-black uppercase tracking-widest flex items-center gap-4">
                                <AlertCircle className="w-5 h-5" /> ĐIỂM CẦN CẢI THIỆN
                            </h4>
                            <ul className="space-y-6">
                                {details.cons.map((con, i) => (
                                    <li key={i} className="text-xs text-black/60 font-black uppercase tracking-wider leading-relaxed flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 bg-red-500 mt-1 shrink-0" />
                                        {con}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-5 bg-white border-8 border-black p-12 space-y-12 shadow-2xl h-fit sticky top-24">
                    <h3 className="text-black text-[12px] font-black uppercase tracking-[0.4em] text-center">PHÂN TÍCH XU HƯỚNG</h3>
                    
                    <div className="space-y-10">
                        <DimensionBar label1="Extraversion" val1={result.scores.E} label2="Introversion" val2={result.scores.I} color="#00A4FD" />
                        <DimensionBar label1="Sensing" val1={result.scores.S} label2="Intuition" val2={result.scores.N} color="#00A4FD" />
                        <DimensionBar label1="Thinking" val1={result.scores.T} label2="Feeling" val2={result.scores.F} color="#00A4FD" />
                        <DimensionBar label1="Judging" val1={result.scores.J} label2="Perceiving" val2={result.scores.P} color="#00A4FD" />
                    </div>

                    <div className="pt-12 border-t-2 border-black/5 space-y-8">
                        <h4 className="text-[11px] font-black text-[#00A4FD] uppercase tracking-widest flex items-center gap-4">
                            <Briefcase className="w-5 h-5" /> NGÀNH NGHỀ GỢI Ý
                        </h4>
                        <p className="text-xs text-black/50 font-black uppercase tracking-wider leading-relaxed">
                            {details.suggested_careers}
                        </p>
                    </div>

                    <button 
                        onClick={onRetake}
                        className="w-full py-6 border-2 border-black/10 text-[10px] text-black/40 font-black uppercase tracking-widest hover:border-[#00A4FD] hover:text-[#00A4FD] transition-all duration-700"
                    >
                        Làm lại bài trắc nghiệm
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

function DimensionBar({ label1, val1, label2, val2, color }: { label1: string, val1: number, label2: string, val2: number, color: string }) {
    const total = val1 + val2 || 1;
    const pct1 = Math.round((val1 / total) * 100);
    const pct2 = 100 - pct1;

    return (
        <div className="space-y-4">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                <span className={pct1 >= pct2 ? 'text-[#00A4FD]' : 'text-black/30'}>{label1} ({pct1}%)</span>
                <span className={pct2 > pct1 ? 'text-[#00A4FD]' : 'text-black/30'}>{label2} ({pct2}%)</span>
            </div>
            <div className="h-2 w-full bg-black/5 flex overflow-hidden">
                <div className="h-full bg-[#00A4FD] transition-all duration-1000" style={{ width: `${pct1}%` }} />
                <div className="h-full bg-black/10 transition-all duration-1000" style={{ width: `${pct2}%` }} />
            </div>
        </div>
    );
}
