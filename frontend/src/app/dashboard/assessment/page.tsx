'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Brain, Compass, Sparkles, ChevronRight, Bookmark } from 'lucide-react';

const EASING = [0.22, 1, 0.36, 1] as any;

interface Assessment {
    id: number;
    title: string;
    description: string;
    image_url: string | null;
    code: string;
}

export default function AssessmentListPage() {
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function fetchAssessments() {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    router.push('/login');
                    return;
                }

                const res = await fetch('http://localhost:8000/api/v1/assessments/', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    setAssessments(data);
                } else {
                    // Handle error
                }
            } catch (error) {
                console.error('Failed to fetch assessments', error);
            } finally {
                setLoading(false);
            }
        }
        fetchAssessments();
    }, [router]);

    if (loading) return (
        <div className="min-h-screen bg-[#0A1018] flex items-center justify-center">
            <div className="w-12 h-12 border-2 border-[#C9A84C]/20 border-t-[#C9A84C] rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0A1018] relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#C9A84C]/5 to-transparent z-0" />

            <div className="max-w-[1400px] mx-auto px-8 pt-32 pb-40 relative z-10">
                <header className="mb-24 space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, ease: EASING }}
                        className="flex items-center gap-4"
                    >
                        <div className="w-8 h-[0.5px] bg-[#C9A84C]/40" />
                        <span className="font-sans text-[10px] text-[#C9A84C] tracking-[0.4em] uppercase font-medium">Core Exploration</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30, scale: 1.02 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 1.2, delay: 0.1, ease: EASING }}
                        className="font-serif text-5xl md:text-7xl text-[#F5F0E8] font-light leading-tight tracking-tight"
                    >
                        Khám phá bản ngã. <br />
                        <span className="italic opacity-40 font-light">Kích hoạt tiềm năng vô hạn.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.2, delay: 0.2, ease: EASING }}
                        className="max-w-2xl text-[17px] text-[#F5F0E8]/50 font-sans font-light leading-relaxed tracking-[0.02em]"
                    >
                        Hệ thống bài trắc nghiệm chuẩn quốc tế, tinh chỉnh bởi trí tuệ nhân tạo để mang lại cái nhìn sâu sắc nhất về con đường sự nghiệp của bạn.
                    </motion.p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    <AnimatePresence>
                        {assessments.map((test, idx) => (
                            <motion.div
                                key={test.id}
                                initial={{ opacity: 0, y: 40, scale: 1.05 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 1, delay: 0.3 + (idx * 0.1), ease: EASING }}
                                whileHover={{ y: -12, scale: 1.02 }}
                                className="group relative bg-white/[0.03] backdrop-blur-3xl border border-[#C9A84C]/10 p-12 flex flex-col justify-between transition-all duration-700 shadow-2xl hover:border-[#C9A84C]/40 overflow-hidden rounded-[2px]"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9A84C]/5 blur-[60px] rounded-full -mr-16 -mt-16 group-hover:bg-[#C9A84C]/10 transition-all duration-700" />

                                <div className="relative z-10">
                                    <div className="w-16 h-16 border border-[#C9A84C]/20 flex items-center justify-center text-[#C9A84C] mb-10 group-hover:border-[#C9A84C] transition-all duration-700">
                                        {test.code === 'HOLLAND' ? <Compass strokeWidth={0.75} /> : <Brain strokeWidth={0.75} />}
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] text-[#C9A84C] uppercase tracking-[0.2em] font-sans font-medium">Psychometric</span>
                                            <div className="w-1 h-1 bg-[#C9A84C]/30 rounded-full" />
                                            <span className="text-[10px] text-[#F5F0E8]/30 uppercase tracking-[0.2em] font-sans font-light">{test.code}</span>
                                        </div>
                                        <h2 className="font-serif text-3xl font-light text-[#F5F0E8] group-hover:text-[#F5F0E8] transition-colors duration-700">{test.title}</h2>
                                    </div>

                                    <p className="text-[15px] text-[#F5F0E8]/40 font-sans font-light leading-relaxed mb-12 line-clamp-3 group-hover:text-[#F5F0E8]/60 transition-colors duration-700">
                                        {test.description}
                                    </p>
                                </div>

                                <div className="relative z-10">
                                    <Link
                                        href={`/assessment/${test.id}`}
                                        className="inline-flex items-center gap-6 text-[11px] font-bold tracking-[0.5em] uppercase text-[#F5F0E8] group/link hover:text-[#C9A84C] transition-all duration-700"
                                    >
                                        BẮT ĐẦU <div className="h-[0.5px] bg-[#C9A84C] w-12 group-hover:w-20 transition-all duration-700" />
                                    </Link>
                                    <p className="mt-6 text-[8px] uppercase tracking-[0.3em] text-[#F5F0E8]/20 group-hover:text-[#C9A84C]/40 transition-colors duration-700">Approx. 15-20 Minutes</p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
