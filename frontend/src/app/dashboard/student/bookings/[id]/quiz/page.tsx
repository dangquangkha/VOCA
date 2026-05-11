'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { MessageSquare, Send, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Question {
    id: string;
    type: string;
    label: string;
    options?: string[];
    required: boolean;
}

interface Quiz {
    id: number;
    title: string;
    description: string;
    questions: Question[];
}

export default function StudentQuizPage() {
    const params = useParams();
    const router = useRouter();
    const bookingId = params.id;

    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [responses, setResponses] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [completed, setCompleted] = useState(false);

    useEffect(() => {
        fetchQuiz();
    }, [bookingId]);

    const fetchQuiz = async () => {
        setLoading(true);
        try {
            // Get booking to find expert quiz
            const { data: booking } = await api.get(`bookings/${bookingId}`);
            const { data: quizzes } = await api.get(`experts/quizzes/expert/${booking.expert_id}`);
            
            // For now, take the first quiz
            if (quizzes.length > 0) {
                setQuiz(quizzes[0]);
            } else {
                router.push('/dashboard/student');
            }
        } catch (err) {
            console.error("Failed to fetch quiz", err);
            router.push('/dashboard/student');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (questionId: string, value: any) => {
        setResponses(prev => ({ ...prev, [questionId]: value }));
    };

    const handleSubmit = async () => {
        if (!quiz || submitting) return;
        
        // Validate required
        for (const q of quiz.questions) {
            if (q.required && !responses[q.id]) {
                alert(`Vui lòng trả lời câu hỏi: ${q.label}`);
                return;
            }
        }

        setSubmitting(true);
        try {
            await api.post('experts/quizzes/submit', {
                booking_id: parseInt(bookingId as string),
                quiz_id: quiz.id,
                responses: responses
            });
            setCompleted(true);
            setTimeout(() => {
                router.push('/dashboard/student');
            }, 3000);
        } catch (err) {
            alert("Gửi khảo sát thất bại.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="min-h-[60vh] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold" />
                </div>
            </DashboardLayout>
        );
    }

    if (completed) {
        return (
            <DashboardLayout>
                <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
                    <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500"
                    >
                        <CheckCircle2 size={40} />
                    </motion.div>
                    <h1 className="text-3xl font-serif italic text-white">Cảm ơn bạn đã chuẩn bị!</h1>
                    <p className="text-ivory-45 uppercase tracking-widest text-xs max-w-sm">Thông tin của bạn đã được gửi tới chuyên gia. Đang quay lại trang chủ...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto py-12 px-6">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-ivory-45 hover:text-white transition-colors text-xs uppercase tracking-widest mb-12">
                    <ArrowLeft size={14} /> Quay lại
                </button>

                <header className="mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-gold/10 border border-gold/20 text-gold text-[10px] font-bold uppercase tracking-widest mb-4">
                        <MessageSquare size={12} /> Khảo sát chuẩn bị
                    </div>
                    <h1 className="text-4xl font-serif italic text-white">{quiz?.title}</h1>
                    <p className="text-ivory-70 font-light mt-4 leading-relaxed">{quiz?.description}</p>
                </header>

                <div className="space-y-10">
                    {quiz?.questions.map((q, idx) => (
                        <div key={q.id} className="space-y-4">
                            <label className="block">
                                <span className="text-[10px] text-gold uppercase tracking-[0.3em] font-bold block mb-3">Câu hỏi 0{idx+1} {q.required && "*"}</span>
                                <span className="text-lg text-white font-light italic leading-tight block mb-6">{q.label}</span>
                                
                                {q.type === 'text' && (
                                    <textarea 
                                        className="w-full bg-white/5 border border-ivory-10 p-6 text-ivory-70 focus:outline-none focus:border-gold transition-all min-h-[150px] font-light"
                                        placeholder="Nhập câu trả lời của bạn..."
                                        value={responses[q.id] || ''}
                                        onChange={(e) => handleInputChange(q.id, e.target.value)}
                                    />
                                )}

                                {(q.type === 'radio' || q.type === 'checkbox') && q.options && (
                                    <div className="grid grid-cols-1 gap-3">
                                        {q.options.map(opt => (
                                            <label key={opt} className="flex items-center gap-4 p-4 bg-white/5 border border-ivory-10 hover:border-gold/30 transition-all cursor-pointer group">
                                                <input 
                                                    type={q.type === 'radio' ? 'radio' : 'checkbox'}
                                                    name={q.id}
                                                    className="accent-gold w-4 h-4"
                                                    onChange={(e) => {
                                                        if (q.type === 'radio') {
                                                            handleInputChange(q.id, opt);
                                                        } else {
                                                            const current = responses[q.id] || [];
                                                            if (e.target.checked) {
                                                                handleInputChange(q.id, [...current, opt]);
                                                            } else {
                                                                handleInputChange(q.id, current.filter((v: string) => v !== opt));
                                                            }
                                                        }
                                                    }}
                                                />
                                                <span className="text-sm text-ivory-70 group-hover:text-white transition-colors">{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </label>
                        </div>
                    ))}
                </div>

                <div className="mt-16 pt-8 border-t border-ivory-10">
                    <Button 
                        onClick={handleSubmit} 
                        isLoading={submitting} 
                        className="w-full h-16 text-xs tracking-[0.4em]"
                    >
                        Gửi thông tin chuẩn bị <Send size={16} className="ml-3" />
                    </Button>
                </div>
            </div>
        </DashboardLayout>
    );
}
