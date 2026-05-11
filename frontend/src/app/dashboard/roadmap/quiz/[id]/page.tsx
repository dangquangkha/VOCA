'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft, 
    ChevronRight, 
    ChevronLeft, 
    Send, 
    CheckCircle2, 
    MessageSquare,
    Info,
    AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { ExpertQuiz, QuizQuestion } from '@/types/quiz';
import ShinkaiBackground from '@/components/special/ShinkaiBackground';

export default function TakeQuizPage() {
    const { id } = useParams();
    const router = useRouter();
    const [quiz, setQuiz] = useState<ExpertQuiz | null>(null);
    const [loading, setLoading] = useState(true);
    const [isCheckingCompletion, setIsCheckingCompletion] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [responses, setResponses] = useState<Record<string, any>>({});
    const [error, setError] = useState<string | null>(null);
    const [completed, setCompleted] = useState(false);

    useEffect(() => {
        fetchQuiz();
    }, [id]);

    const fetchQuiz = async () => {
        setLoading(true);
        try {
            const [quizRes, checkRes] = await Promise.all([
                api.get<ExpertQuiz>(`experts/quizzes/${id}`),
                api.get(`experts/quizzes/${id}/check-completed`)
            ]);
            
            setQuiz(quizRes.data);
            if (checkRes.data.completed) {
                setCompleted(true);
            }
        } catch (error: any) {
            console.error("Failed to fetch quiz", error);
            setError(error.response?.data?.detail || "Không thể tải nội dung khảo sát.");
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerChange = (questionId: string, value: any) => {
        setResponses(prev => ({ ...prev, [questionId]: value }));
    };

    const nextStep = () => {
        if (!quiz) return;
        const currentQuestion = quiz.questions[currentStep];
        if (currentQuestion.required && !responses[currentQuestion.id]) {
            alert("Vui lòng trả lời câu hỏi này trước khi tiếp tục.");
            return;
        }
        if (currentStep < quiz.questions.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = async () => {
        if (!quiz || submitting) return;
        
        // Final validation
        const missing = quiz.questions.filter(q => q.required && !responses[q.id]);
        if (missing.length > 0) {
            alert("Bạn chưa hoàn thành tất cả các câu hỏi bắt buộc.");
            return;
        }

        setSubmitting(true);
        try {
            await api.post(`experts/quizzes/${id}/public-submit`, { responses });
            setCompleted(true);
        } catch (error: any) {
            console.error("Failed to submit quiz", error);
            alert(error.response?.data?.detail || "Gửi bài khảo sát thất bại.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-12 h-12 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
                <p className="text-gray-500 uppercase tracking-widest text-xs font-light">Đang chuẩn bị khảo sát...</p>
            </div>
        );
    }

    if (error || !quiz) {
        return (
            <div className="max-w-xl mx-auto py-24 text-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6">
                    <AlertTriangle className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-serif italic text-white mb-4">Ối! Đã có lỗi xảy ra</h2>
                <p className="text-gray-400 mb-8 font-light leading-relaxed">{error}</p>
                <Button onClick={() => router.back()} variant="outline">Quay lại</Button>
            </div>
        );
    }

    if (completed) {
        return (
            <div className="relative min-h-screen flex items-center justify-center p-8">
                <ShinkaiBackground imagePath="/roadmap-bg.png" showFish={true} />
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative z-10 max-w-3xl w-full"
                >
                    <div className="bg-white/30 backdrop-blur-3xl border border-white/50 rounded-[64px] p-20 shadow-[0_32px_64px_rgba(0,0,0,0.1)] text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-white/40 blur-[120px] rounded-full -mr-40 -mt-40" />
                        
                        <div className="w-24 h-24 bg-[#0046EA] text-white rounded-full flex items-center justify-center mx-auto mb-12 shadow-2xl relative z-10">
                            <CheckCircle2 size={48} />
                        </div>
                        
                        <h2 className="text-5xl font-garamond italic font-bold text-[#0046EA] mb-8 relative z-10">Di sản đã được ghi nhận</h2>
                        <p className="text-[#0046EA]/60 text-xl font-garamond italic mb-16 leading-relaxed max-w-lg mx-auto relative z-10">
                            Cảm ơn bạn đã chia sẻ góc nhìn. Thông tin này sẽ giúp chuyên gia thấu hiểu và định hướng tốt nhất cho hành trình di sản của bạn.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative z-10">
                            <button 
                                onClick={() => router.push('/dashboard/roadmap')}
                                className="h-16 px-12 bg-[#0046EA] text-white font-black uppercase tracking-[0.5em] text-[10px] rounded-full shadow-xl hover:bg-[#00A4FD] hover:scale-105 transition-all duration-500 w-full sm:w-auto"
                            >
                                QUAY LẠI LỘ TRÌNH
                            </button>
                            <button 
                                onClick={() => router.push('/dashboard/experts')}
                                className="h-16 px-12 bg-white/40 backdrop-blur-md border border-white/60 text-[#0046EA] font-black uppercase tracking-[0.5em] text-[10px] rounded-full hover:bg-white/60 transition-all duration-500 w-full sm:w-auto"
                            >
                                KHÁM PHÁ CHUYÊN GIA
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    const currentQuestion = quiz.questions[currentStep];
    const progress = ((currentStep + 1) / quiz.questions.length) * 100;

    return (
        <div className="relative min-h-screen bg-[#F8FAFC]">
            {/* Minimalist Light Background Elements */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#0046EA]/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#00A4FD]/5 blur-[120px] rounded-full" />
            </div>
            
            <div className="relative z-10 max-w-4xl mx-auto py-24 px-8">
                {/* Header */}
                <div className="mb-20 space-y-12">
                    <button 
                        onClick={() => router.push('/dashboard/roadmap')}
                        className="flex items-center gap-4 text-[#0046EA]/40 hover:text-[#0046EA] transition-all group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-2 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em]">QUAY LẠI LỘ TRÌNH</span>
                    </button>

                    <div className="space-y-6">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-[1px] bg-[#00A4FD]" />
                            <span className="text-[10px] text-[#00A4FD] tracking-[0.5em] font-black uppercase">EXPERT PERSPECTIVE</span>
                        </div>
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
                            <h1 className="text-6xl font-garamond italic font-bold text-[#0046EA] leading-none tracking-tight">
                                {quiz.title}
                            </h1>
                            <div className="flex flex-col items-end gap-2">
                                <span className="text-3xl font-garamond italic text-[#0046EA]/30 tabular-nums">
                                    {currentStep + 1} <span className="text-[9px] uppercase tracking-widest font-black mx-2 text-[#0046EA]/20">OF</span> {quiz.questions.length}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="w-full h-1 bg-[#0046EA]/5 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="h-full bg-[#0046EA] shadow-[0_0_20px_rgba(0,70,234,0.2)]"
                        />
                    </div>
                </div>

                {/* Question Card */}
                <div className="relative min-h-[540px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                            className="bg-white border border-[#0046EA]/10 rounded-[64px] p-16 md:p-24 shadow-[0_32px_64px_rgba(0,70,234,0.05)] relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-96 h-96 bg-[#00A4FD]/5 blur-[100px] rounded-full -mr-48 -mt-48" />
                            
                            <div className="relative z-10 space-y-16">
                                <div className="space-y-8">
                                    <div className="flex items-center gap-4 text-[9px] font-black text-[#00A4FD] uppercase tracking-[0.5em]">
                                        <MessageSquare size={14} strokeWidth={3} />
                                        QUERY {currentStep + 1} {currentQuestion.required && <span className="text-[#0046EA]/20 ml-4">MANDATORY</span>}
                                    </div>
                                    <h3 className="text-4xl md:text-5xl font-garamond italic font-bold text-[#0046EA] leading-[1.1] tracking-tight">
                                        {currentQuestion.label}
                                    </h3>
                                </div>

                                {/* Input Fields */}
                                <div className="space-y-8">
                                    {currentQuestion.type === 'text' && (
                                        <textarea
                                            autoFocus
                                            value={responses[currentQuestion.id] || ''}
                                            onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                                            placeholder="Ghi lại những suy nghĩ của bạn..."
                                            className="w-full bg-[#F8FAFC] border-2 border-transparent focus:border-[#0046EA]/10 focus:bg-white rounded-[40px] p-12 text-2xl font-garamond italic text-[#0046EA] focus:outline-none transition-all duration-700 min-h-[280px] placeholder:text-[#0046EA]/10 shadow-inner"
                                        />
                                    )}

                                    {(currentQuestion.type === 'radio' || currentQuestion.type === 'checkbox') && (
                                        <div className="grid grid-cols-1 gap-6">
                                            {currentQuestion.options?.map((option, i) => {
                                                const isSelected = currentQuestion.type === 'radio' 
                                                    ? responses[currentQuestion.id] === option
                                                    : (responses[currentQuestion.id] || []).includes(option);
                                                
                                                return (
                                                    <button
                                                        key={i}
                                                        onClick={() => {
                                                            if (currentQuestion.type === 'radio') {
                                                                handleAnswerChange(currentQuestion.id, option);
                                                            } else {
                                                                const current = responses[currentQuestion.id] || [];
                                                                if (current.includes(option)) {
                                                                    handleAnswerChange(currentQuestion.id, current.filter((o: any) => o !== option));
                                                                } else {
                                                                    handleAnswerChange(currentQuestion.id, [...current, option]);
                                                                }
                                                            }
                                                        }}
                                                        className={`flex items-center justify-between p-10 rounded-[40px] border-2 text-left transition-all duration-700 group/opt ${
                                                            isSelected 
                                                                ? 'bg-white border-[#0046EA] text-[#0046EA] shadow-xl' 
                                                                : 'bg-[#F8FAFC] border-transparent text-[#0046EA]/40 hover:bg-white hover:border-[#0046EA]/20'
                                                        }`}
                                                    >
                                                        <span className="text-2xl font-garamond italic font-bold">{option}</span>
                                                        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-700 ${
                                                            isSelected ? 'bg-[#0046EA] border-[#0046EA] shadow-lg' : 'border-[#0046EA]/10'
                                                        }`}>
                                                            {isSelected && <div className="w-3 h-3 bg-white rounded-full" />}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {currentQuestion.type === 'scale' && (
                                        <div className="flex flex-col items-center py-12 gap-12">
                                            <div className="flex items-center gap-8">
                                                {[1, 2, 3, 4, 5].map((val) => (
                                                    <button
                                                        key={val}
                                                        onClick={() => handleAnswerChange(currentQuestion.id, val)}
                                                        className={`w-24 h-24 rounded-[32px] border-2 flex items-center justify-center text-3xl font-garamond italic font-bold transition-all duration-700 ${
                                                            responses[currentQuestion.id] === val
                                                                ? 'bg-[#0046EA] text-white border-[#0046EA] shadow-2xl scale-110'
                                                                : 'bg-[#F8FAFC] border-transparent text-[#0046EA]/30 hover:border-[#0046EA]/30 hover:text-[#0046EA]'
                                                        }`}
                                                    >
                                                        {val}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="flex justify-between w-full max-w-md text-[10px] font-black uppercase tracking-[0.4em] text-[#0046EA]/20 px-4">
                                                <span>DISSENT</span>
                                                <span>AFFIRM</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Pagination Controls */}
                <div className="mt-24 space-y-16">
                    <div className="flex flex-wrap justify-center gap-2">
                        {quiz.questions.map((_, idx) => {
                            const isCurrent = currentStep === idx;
                            const isAnswered = responses[quiz.questions[idx].id] !== undefined;
                            
                            return (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentStep(idx)}
                                    className={`w-10 h-10 flex items-center justify-center text-[10px] font-black transition-all duration-500 ${
                                        isCurrent 
                                            ? 'bg-[#0046EA] text-white shadow-xl' 
                                            : isAnswered
                                                ? 'bg-[#0046EA]/10 text-[#0046EA] hover:bg-[#0046EA]/20'
                                                : 'bg-white border border-[#0046EA]/10 text-[#0046EA]/30 hover:border-[#0046EA]/30'
                                    }`}
                                >
                                    {(idx + 1).toString().padStart(2, '0')}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex items-center justify-between pt-12 border-t border-[#0046EA]/5">
                        <button
                            disabled={currentStep === 0}
                            onClick={prevStep}
                            className="flex items-center gap-6 text-[#0046EA]/30 hover:text-[#0046EA] disabled:opacity-0 transition-all duration-500 group"
                        >
                            <ChevronLeft size={24} className="group-hover:-translate-x-2 transition-transform duration-500" />
                            <span className="text-[10px] font-black uppercase tracking-[0.5em]">PREVIOUS</span>
                        </button>

                        {currentStep === quiz.questions.length - 1 ? (
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="h-20 px-16 bg-[#0046EA] text-white font-black uppercase tracking-[0.6em] text-[11px] shadow-2xl hover:bg-[#00A4FD] hover:scale-105 transition-all duration-700 disabled:opacity-20 flex items-center gap-6 group"
                            >
                                {submitting ? 'RECORDING...' : 'ARCHIVE INSIGHTS'}
                                <Send size={20} className="group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform duration-700" />
                            </button>
                        ) : (
                            <button
                                onClick={nextStep}
                                className="h-20 px-16 bg-white border border-[#0046EA]/10 text-[#0046EA] font-black uppercase tracking-[0.6em] text-[11px] hover:bg-[#F8FAFC] hover:shadow-xl transition-all duration-700 flex items-center gap-6 group"
                            >
                                PROCEED
                                <ChevronRight size={20} className="group-hover:translate-x-2 transition-transform duration-500" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
