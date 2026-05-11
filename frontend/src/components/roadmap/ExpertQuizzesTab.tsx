'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Star, Clock, User, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { ExpertQuizPublic } from '@/types/quiz';
import { useRouter } from 'next/navigation';
import { getAvatarUrl } from '@/utils/url-utils';

import ShinkaiBackground from '@/components/special/ShinkaiBackground';

export default function ExpertQuizzesTab() {
    const [quizzes, setQuizzes] = useState<ExpertQuizPublic[]>([]);
    const [loading, setLoading] = useState(true);
    const [completedMap, setCompletedMap] = useState<Record<number, boolean>>({});
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;
    const router = useRouter();

    useEffect(() => {
        fetchPublicQuizzes();
    }, []);

    const fetchPublicQuizzes = async () => {
        setLoading(true);
        try {
            const { data } = await api.get<ExpertQuizPublic[]>('experts/quizzes/public');
            
            // --- MOCK DATA FOR PAGINATION TESTING ---
            let mockData = [...data];
            if (mockData.length > 0 && mockData.length < 8) {
                while (mockData.length < 8) {
                    mockData = [
                        ...mockData, 
                        ...data.map((q: any, i: number) => ({
                            ...q, 
                            id: q.id * 1000 + Math.floor(Math.random() * 1000), // Unique ID
                            title: `${q.title} (Bản mở rộng ${mockData.length + i + 1})`
                        }))
                    ];
                }
            }
            setQuizzes(mockData);
            // -----------------------------------------
            
            // Check completion for each
            const completionPromises = data.map(q => 
                api.get(`experts/quizzes/${q.id}/check-completed`)
                    .then(res => ({ id: q.id, completed: res.data.completed }))
            );
            const results = await Promise.all(completionPromises);
            const map: Record<number, boolean> = {};
            results.forEach(r => { map[r.id] = r.completed; });
            setCompletedMap(map);
        } catch (error) {
            console.error("Failed to fetch public quizzes", error);
        } finally {
            setLoading(false);
        }
    };

    const totalPages = Math.ceil(quizzes.length / itemsPerPage);
    const currentQuizzes = quizzes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="w-10 h-10 border-2 border-[#0046EA]/20 border-t-[#0046EA] rounded-full animate-spin" />
                <p className="text-sm text-[#0046EA]/40 uppercase tracking-widest font-light">Đang tải danh sách khảo sát...</p>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-transparent">
            <div className="relative z-10 max-w-7xl mx-auto py-20 px-8">
                {/* Cinematic Header */}
                <div className="mb-24 space-y-8">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: 80 }}
                        className="h-1 bg-[#00A4FD]"
                    />
                    <div className="space-y-4">
                        <span className="text-[10px] font-black text-[#0046EA]/40 tracking-[0.5em] uppercase">CLARITY THROUGH INSIGHT</span>
                        <h2 className="text-6xl font-garamond italic font-bold text-[#0046EA] tracking-tight leading-none">
                            Di sản tri thức
                        </h2>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 pt-4">
                        <p className="text-[#0046EA]/60 max-w-2xl text-xl font-garamond italic leading-relaxed">
                            Khám phá những góc nhìn sâu sắc được đúc kết từ tâm huyết của đội ngũ chuyên gia, giúp bạn thắp sáng lộ trình di sản của riêng mình.
                        </p>
                        <div className="flex items-center gap-6 px-8 py-3 bg-white border border-[#0046EA]/10 rounded-full shadow-sm">
                            <div className="w-2 h-2 bg-[#00A4FD] rounded-full animate-pulse" />
                            <span className="text-[10px] font-black text-[#0046EA] uppercase tracking-widest">
                                {quizzes.length} KHẢO SÁT CHUYÊN SÂU
                            </span>
                        </div>
                    </div>
                </div>

                {quizzes.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-40 bg-[#F8FAFC] rounded-[64px] border border-[#0046EA]/10 shadow-sm"
                    >
                        <MessageSquare className="w-20 h-20 text-[#0046EA]/10 mx-auto mb-8" strokeWidth={0.5} />
                        <p className="text-[#0046EA]/30 text-2xl font-garamond italic">Hành trình tri thức đang được chuẩn bị...</p>
                    </motion.div>
                ) : (
                    <div className="space-y-16">
                        {/* Top Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between py-8 border-b border-[#0046EA]/5">
                                <span className="text-[10px] font-black text-[#0046EA]/30 uppercase tracking-[0.5em]">
                                    PAGE {currentPage} OF {totalPages}
                                </span>
                                <div className="flex items-center gap-2">
                                    {Array.from({ length: totalPages }).map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={`w-10 h-10 flex items-center justify-center text-[10px] font-black transition-all duration-500 ${
                                                currentPage === i + 1 
                                                    ? 'bg-[#0046EA] text-white shadow-lg' 
                                                    : 'bg-white border border-[#0046EA]/10 text-[#0046EA]/30 hover:border-[#0046EA]/30'
                                            }`}
                                        >
                                            {(i + 1).toString().padStart(2, '0')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-12">
                            {currentQuizzes.map((quiz, index) => (
                                <motion.div
                                    key={quiz.id}
                                    initial={{ opacity: 0, y: 40 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                                    className="group relative bg-white border border-[#0046EA]/10 hover:border-[#00A4FD] rounded-none p-12 transition-all duration-1000 overflow-hidden flex flex-col min-h-[520px] shadow-sm hover:shadow-xl hover:-translate-y-2"
                                >
                                    {/* Subtle Light Effects */}
                                    <div className="absolute -top-32 -right-32 w-80 h-80 bg-[#00A4FD]/5 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                                    
                                    <div className="relative z-10 flex-1 flex flex-col">
                                        <div className="flex items-center justify-between mb-10">
                                            <span className="text-[9px] font-black text-[#0046EA]/20 uppercase tracking-[0.5em] font-mono">
                                                SNAPSHOT #{quiz.id.toString().padStart(3, '0')}
                                            </span>
                                            {completedMap[quiz.id] && (
                                                <div className="flex items-center gap-3 px-4 py-1.5 bg-[#00A4FD] text-white text-[9px] font-black uppercase tracking-[0.2em] shadow-lg">
                                                    <CheckCircle2 size={10} />
                                                    DONE
                                                </div>
                                            )}
                                        </div>

                                        <h3 className="text-3xl font-garamond italic font-bold text-[#0046EA] group-hover:text-[#00A4FD] transition-colors duration-700 leading-tight mb-8">
                                            {quiz.title}
                                        </h3>

                                        <p className="text-[#0046EA]/50 text-lg font-garamond italic line-clamp-4 leading-relaxed mb-12">
                                            {quiz.description || "Đi sâu vào tâm thức và khai phá tiềm năng cùng chuyên gia trong hành trình di sản."}
                                        </p>

                                        <div className="mt-auto pt-10 border-t border-[#0046EA]/5 flex items-center justify-between">
                                            <div className="flex items-center gap-5">
                                                <div className="relative">
                                                    <img 
                                                        src={getAvatarUrl(quiz.expert_avatar, quiz.expert_name)} 
                                                        alt={quiz.expert_name} 
                                                        className="w-14 h-14 rounded-none border border-[#0046EA]/10 object-cover shadow-lg" 
                                                    />
                                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#00A4FD] border border-white shadow-sm" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-[#0046EA] uppercase tracking-widest">{quiz.expert_name}</span>
                                                    <span className="text-[10px] text-[#00A4FD] font-black uppercase tracking-[0.2em] mt-1">
                                                        {quiz.expert_tags?.split(',')[0] || "SPECIALIST"}
                                                    </span>
                                                </div>
                                            </div>

                                            <button 
                                                onClick={() => router.push(`/dashboard/roadmap/quiz/${quiz.id}`)}
                                                className="w-16 h-16 bg-[#0046EA] text-white flex items-center justify-center hover:bg-[#00A4FD] hover:scale-110 transition-all duration-700 shadow-xl group/btn"
                                            >
                                                <ArrowRight size={24} className="group-hover/btn:translate-x-2 transition-transform duration-500" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Bottom Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-4 py-12 border-t border-[#0046EA]/5">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => prev - 1)}
                                    className="w-12 h-12 flex items-center justify-center border border-[#0046EA]/10 text-[#0046EA]/40 hover:text-[#0046EA] hover:border-[#0046EA]/30 transition-all disabled:opacity-0"
                                >
                                    <ArrowRight size={20} className="rotate-180" />
                                </button>
                                
                                <div className="flex items-center gap-2">
                                    {Array.from({ length: totalPages }).map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={`w-12 h-12 flex items-center justify-center text-[10px] font-black transition-all duration-500 ${
                                                currentPage === i + 1 
                                                    ? 'bg-[#0046EA] text-white shadow-lg' 
                                                    : 'bg-white border border-[#0046EA]/10 text-[#0046EA]/30 hover:border-[#0046EA]/30'
                                            }`}
                                        >
                                            {(i + 1).toString().padStart(2, '0')}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(prev => prev + 1)}
                                    className="w-12 h-12 flex items-center justify-center border border-[#0046EA]/10 text-[#0046EA]/40 hover:text-[#0046EA] hover:border-[#0046EA]/30 transition-all disabled:opacity-0"
                                >
                                    <ArrowRight size={20} />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
