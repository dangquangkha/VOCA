'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { DailyProgress, DayContent, DayStatus } from '@/types/roadmap';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/useAuthStore';
import {
    ChevronDown,
    ChevronUp,
    CheckCircle2,
    Circle,
    Lock,
    Menu,
    X,
    MessageSquare,
    Send,
    ArrowLeft,
    ArrowRight,
    Trophy,
    Calendar,
    Flame,
    BookOpen,
    Sparkles,
    FileCheck,
    ClipboardList,
    Home,
    Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ExpertQuizzesTab from '@/components/roadmap/ExpertQuizzesTab';
import { RoadmapCompletionModal } from '@/components/roadmap/RoadmapCompletionModal';
import MilestoneModal from '@/components/roadmap/MilestoneModal';
import { useToastStore } from '@/store/useToastStore';
import MBTISector from '@/components/roadmap/MBTISector';
import ShinkaiBackground from '@/components/special/ShinkaiBackground';

const EASING = [0.22, 1, 0.36, 1] as any;

const SYLLABUS_MODULES = [
    { id: 1, title: 'Chuẩn bị hành trình', range: [1, 3], icon: <Flame className="w-4 h-4" /> },
    { id: 2, title: 'Giá trị cốt lõi', range: [4, 10], icon: <Sparkles className="w-4 h-4" /> },
    { id: 3, title: 'Thế mạnh bản thân', range: [11, 18], icon: <Trophy className="w-4 h-4" /> },
    { id: 4, title: 'Vùng thiên tài', range: [19, 25], icon: <BookOpen className="w-4 h-4" /> },
    { id: 5, title: 'Xác định Ikigai', range: [26, 30], icon: <Calendar className="w-4 h-4" /> },
];

export default function RoadmapPage() {
    const { token } = useAuthStore();
    const router = useRouter();

    const [days, setDays] = useState<DailyProgress[]>([]);
    const [selectedDay, setSelectedDay] = useState<number>(1);
    const [dayContent, setDayContent] = useState<DayContent | null>(null);
    const [answer, setAnswer] = useState('');
    const [gritStatus, setGritStatus] = useState<{ completed_days: number, is_grit_verified: boolean } | null>(null);

    const [loading, setLoading] = useState(true);
    const [contentLoading, setContentLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [expandedModules, setExpandedModules] = useState<number[]>([1]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    
    const [activeTab, setActiveTab] = useState<'ikigai' | 'quizzes' | 'mbti'>('ikigai');
    const [showCompletionModal, setShowCompletionModal] = useState(false);
    const [milestoneInfo, setMilestoneInfo] = useState<{ day: number, reward: number } | null>(null);
    const { addToast } = useToastStore();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (!token) return;
        fetchData();
    }, [token]);

    useEffect(() => {
        if (selectedDay) {
            fetchDayContent(selectedDay);
        }
    }, [selectedDay]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [roadmapRes, gritRes] = await Promise.all([
                api.get<DailyProgress[]>('roadmap'),
                api.get('roadmap/grit-status')
            ]);
            
            setDays(roadmapRes.data);
            setGritStatus(gritRes.data);

            const latest = roadmapRes.data.find(d => d.status === DayStatus.UNLOCKED)?.day_number || 
                           roadmapRes.data.filter(d => d.status === DayStatus.COMPLETED).length + 1 || 1;
            
            const clampedDay = Math.min(latest, 30);
            setSelectedDay(clampedDay);

            const currentModule = SYLLABUS_MODULES.find(m => clampedDay >= m.range[0] && clampedDay <= m.range[1]);
            if (currentModule) setExpandedModules([currentModule.id]);

        } catch (error) {
            console.error("Failed to load data", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDayContent = async (dayNumber: number) => {
        setContentLoading(true);
        setDayContent(null);
        setAnswer('');
        try {
            const { data } = await api.get<DayContent>(`roadmap/${dayNumber}/content`);
            setDayContent(data);

            const existing = days.find(d => d.day_number === dayNumber);
            if (existing?.content_data) {
                const raw = existing.content_data as any;
                setAnswer(typeof raw === 'object' && raw?.text ? raw.text : typeof raw === 'string' ? raw : JSON.stringify(raw));
            }
        } catch (error) {
            console.error("Failed to load day content", error);
        } finally {
            setContentLoading(false);
        }
    };

    const handleGenerateReport = async () => {
        if (!window.confirm("Bạn có muốn tạo báo cáo tổng kết cho hành trình 30 ngày này không? (Phí: 50 Credits)")) return;
        
        try {
            await api.post('roadmap/generate-report');
            alert("Đã khởi tạo báo cáo thành công! Bạn có thể xem lại trong lịch sử.");
            router.push('/dashboard/roadmap/history');
        } catch (err: any) {
            alert(err.response?.data?.detail || "Tạo báo cáo thất bại.");
        }
    };

    const handleSubmit = async () => {
        if (!answer.trim() || submitting) return;
        setSubmitting(true);
        try {
            const res = await api.post<DailyProgress>(`roadmap/${selectedDay}/submit`, { content_data: { text: answer } });
            
            const [roadmapRes, gritRes] = await Promise.all([
                api.get<DailyProgress[]>('roadmap'),
                api.get('roadmap/grit-status')
            ]);
            setDays(roadmapRes.data);
            setGritStatus(gritRes.data);

            // Handle Rewards & Completion
            const reward = res.data.reward_earned;
            
            // ALWAYS show completion modal on day 30, regardless of reward
            if (selectedDay === 30) {
                setShowCompletionModal(true);
            } else if (reward && reward > 0) {
                setMilestoneInfo({ day: selectedDay, reward });
            } else if (selectedDay < 30) {
                setSelectedDay(selectedDay + 1);
            }
        } catch (error) {
            console.error("Submission failed", error);
        } finally {
            setSubmitting(false);
        }
    };

    const toggleModule = (id: number) => {
        setExpandedModules(prev => 
            prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
        );
    };

    const getDayStatusIcon = (dayNum: number) => {
        const day = days.find(d => d.day_number === dayNum);
        if (!day || day.status === DayStatus.LOCKED) return <Lock className="w-3.5 h-3.5 opacity-40" />;
        if (day.status === DayStatus.COMPLETED) return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
        return <Circle className="w-3.5 h-3.5 text-[#0046EA]" />;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] font-dm-sans">
                <div className="flex flex-col items-center gap-8">
                    <div className="w-12 h-12 border-2 border-black/5 border-t-[#0046EA] rounded-full animate-spin" />
                    <p className="text-[10px] text-black/30 font-black tracking-[0.5em] uppercase">KHỞI TẠO HÀNH TRÌNH...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex flex-col gap-8 font-dm-sans selection:bg-[#0046EA]/20 min-h-screen">
            {/* Ambient Light Background */}
            <ShinkaiBackground 
                imagePath="/roadmap-bg.svg" 
                showFish={true} 
                overlayColor="rgba(255, 255, 255, 0.95)" 
            />
            
            <div className="relative z-10 flex flex-col gap-8 p-8">
                {/* Top Navigation */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 p-2 bg-white/40 backdrop-blur-md border border-white/60 rounded-full w-fit shadow-lg">
                        {[
                            { id: 'ikigai', label: 'Hành trình Ikigai', icon: <Sparkles size={16} /> },
                            { id: 'mbti', label: 'Trắc nghiệm MBTI', icon: <Brain size={16} /> },
                            { id: 'quizzes', label: 'Khảo sát Chuyên gia', icon: <ClipboardList size={16} /> }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-4 px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-1000 ${
                                    activeTab === tab.id 
                                        ? 'bg-[#0046EA] text-white shadow-2xl' 
                                        : 'text-[#0046EA]/40 hover:text-[#0046EA] hover:bg-white/60'
                                }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-8">
                        <button
                            onClick={() => router.push('/dashboard/roadmap/history')}
                            className="flex items-center gap-4 px-8 py-4 bg-white/40 backdrop-blur-md border border-white/60 rounded-full text-[#0046EA] hover:bg-white/60 transition-all text-[10px] font-black uppercase tracking-[0.2em] shadow-lg"
                        >
                            <Calendar size={16} />
                            XEM LỊCH SỬ
                        </button>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="flex items-center gap-4 px-8 py-4 text-[#0046EA]/40 hover:text-[#0046EA] transition-all text-[10px] font-black uppercase tracking-[0.4em] group"
                        >
                            <Home size={16} className="group-hover:-translate-y-1 transition-transform duration-500" />
                            HOME
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden">
                    <AnimatePresence mode="wait">
                        {activeTab === 'ikigai' ? (
                            <motion.div 
                                key="ikigai-content"
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -40 }}
                                transition={{ duration: 1, ease: EASING }}
                                className="flex min-h-[800px] bg-white border border-black/5 rounded-[32px] shadow-sm relative overflow-hidden"
                            >
                                {/* Sidebar Navigation */}
                                <motion.aside 
                                    initial={false}
                                    animate={{ width: isSidebarOpen ? 380 : 0, opacity: isSidebarOpen ? 1 : 0 }}
                                    className="border-r border-white/20 bg-[#0046EA]/5 flex flex-col relative z-20 backdrop-blur-md"
                                >
                                    <div className="p-12 border-b border-white/10 flex items-center justify-between">
                                        <div className="space-y-1">
                                            <h2 className="text-[10px] font-black tracking-[0.5em] uppercase text-[#0046EA]/40">CURRICULUM</h2>
                                            <p className="text-xl font-garamond italic font-bold text-[#0046EA]">Hành trình 30 ngày</p>
                                        </div>
                                        <button onClick={() => setIsSidebarOpen(false)} className="w-10 h-10 rounded-full bg-white/40 flex items-center justify-center text-[#0046EA] hover:bg-white transition-colors shadow-sm">
                                            <X size={18} />
                                        </button>
                                    </div>
                                    
                                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-4">
                                        {SYLLABUS_MODULES.map(module => (
                                            <div key={module.id} className="space-y-3">
                                                <button 
                                                    onClick={() => toggleModule(module.id)}
                                                    className={`w-full flex items-center justify-between p-5 rounded-[24px] transition-all duration-700 text-left group ${expandedModules.includes(module.id) ? 'bg-[#0046EA]/10 border border-[#0046EA]/20' : 'hover:bg-white/40 border border-transparent'}`}
                                                >
                                                    <div className="flex items-center gap-5">
                                                        <span className="text-[#0046EA] group-hover:scale-110 transition-transform duration-500">{module.icon}</span>
                                                        <span className="text-[11px] font-black text-[#0046EA] uppercase tracking-widest">{module.title}</span>
                                                    </div>
                                                    {expandedModules.includes(module.id) ? <ChevronUp size={16} className="text-[#0046EA]/30" /> : <ChevronDown size={16} className="text-[#0046EA]/30" />}
                                                </button>
                                                
                                                <AnimatePresence>
                                                    {expandedModules.includes(module.id) && (
                                                        <motion.div 
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden ml-8 space-y-2 border-l-2 border-[#0046EA]/10 pl-6"
                                                        >
                                                            {Array.from({ length: module.range[1] - module.range[0] + 1 }).map((_, i) => {
                                                                const dayNum = module.range[0] + i;
                                                                const isSelected = selectedDay === dayNum;
                                                                const dayData = days.find(d => d.day_number === dayNum);
                                                                const isLocked = !dayData || dayData.status === DayStatus.LOCKED;
                                                                
                                                                return (
                                                                    <button
                                                                        key={dayNum}
                                                                        disabled={isLocked && dayNum !== 1}
                                                                        onClick={() => setSelectedDay(dayNum)}
                                                                        className={`w-full flex items-center gap-5 p-4 rounded-2xl text-left transition-all duration-1000 ${
                                                                            isSelected ? 'bg-[#0046EA] text-white shadow-xl' : 'hover:bg-white/60 text-[#0046EA]/40'
                                                                        } ${isLocked ? 'cursor-not-allowed opacity-10' : 'cursor-pointer'}`}
                                                                    >
                                                                        <div className={isSelected ? 'text-white' : 'text-[#0046EA]/20'}>
                                                                            {getDayStatusIcon(dayNum)}
                                                                        </div>
                                                                        <span className="text-[10px] font-black uppercase tracking-widest">Ngày {dayNum}</span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        ))}
                                    </div>
                                </motion.aside>

                                {/* Main Content Area */}
                                <main className="flex-1 flex flex-col relative overflow-hidden">
                                    {!isSidebarOpen && (
                                        <button 
                                            onClick={() => setIsSidebarOpen(true)}
                                            className="absolute top-10 left-10 z-[30] w-14 h-14 bg-white/60 backdrop-blur-md text-[#0046EA] shadow-2xl rounded-full border border-white/60 flex items-center justify-center hover:scale-110 transition-transform duration-500"
                                        >
                                            <Menu size={24} />
                                        </button>
                                    )}

                                    <header className="p-12 md:px-20 flex items-center justify-between border-b border-white/10 relative z-10">
                                        <div className="flex items-center gap-8">
                                            <div className="w-16 h-16 rounded-[24px] bg-[#0046EA] flex items-center justify-center text-white shadow-2xl font-garamond italic font-bold text-3xl">
                                                {selectedDay}
                                            </div>
                                            <div>
                                                <h1 className="text-4xl font-garamond italic font-bold text-[#0046EA] tracking-tight break-words">
                                                    {contentLoading ? "Đang truy vấn tinh hoa..." : dayContent?.topic || `Ngày ${selectedDay}`}
                                                </h1>
                                                <p className="text-[10px] text-[#0046EA]/30 uppercase tracking-[0.5em] font-black mt-2 font-mono">CHƯƠNG TIẾP THEO • {selectedDay}/30</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-10">
                                            <div className={`flex items-center gap-5 px-6 py-3 rounded-full border border-white/60 backdrop-blur-md shadow-sm transition-all duration-1000 ${
                                                gritStatus?.is_grit_verified 
                                                    ? 'bg-[#0046EA]/10 text-[#0046EA]' 
                                                    : 'bg-white/20 text-[#0046EA]/30'
                                            }`}>
                                                <Trophy size={18} className={gritStatus?.is_grit_verified ? 'text-[#0046EA]' : 'text-[#0046EA]/20'} />
                                                <span className="text-[11px] font-black uppercase tracking-[0.2em]">
                                                    {gritStatus?.is_grit_verified ? 'GRIT VERIFIED' : `GRIT: ${gritStatus?.completed_days || 0}/7`}
                                                </span>
                                            </div>
                                            <button 
                                                onClick={handleGenerateReport}
                                                className="h-14 px-10 bg-white/60 text-[#0046EA] border border-white/80 hover:bg-[#0046EA] hover:text-white transition-all duration-700 font-black uppercase text-[10px] tracking-[0.3em] rounded-full shadow-lg flex items-center gap-4 group"
                                            >
                                                <FileCheck size={18} className="group-hover:rotate-12 transition-transform" />
                                                XUẤT BÁO CÁO
                                            </button>
                                        </div>
                                    </header>

                                    <div className="flex-1 overflow-y-auto p-12 md:p-16 custom-scrollbar relative">
                                        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/40 blur-[150px] rounded-full -mr-400 -mt-400 pointer-events-none opacity-50" />
                                        
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={selectedDay}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ duration: 0.8, ease: EASING }}
                                                className="max-w-4xl mx-auto space-y-20 relative z-10"
                                            >
                                                <section className="space-y-12">
                                                    <div className="inline-flex items-center gap-4 px-6 py-2 rounded-full bg-white/60 text-[#0046EA] text-[10px] font-black uppercase tracking-[0.3em] shadow-sm">
                                                        <MessageSquare size={14} />
                                                        SUY NGẪM CHIẾN LƯỢC
                                                    </div>
                                                    <h3 className="text-4xl font-garamond italic font-normal text-[#0046EA] leading-[1.6] border-l-8 border-[#00A4FD] pl-12 break-words">
                                                        "{dayContent?.prompt}"
                                                    </h3>
                                                    {dayContent?.requirements && (
                                                        <div className="flex items-center gap-12 text-[10px] text-[#0046EA]/30 uppercase tracking-[0.5em] font-black font-mono">
                                                            <span className="flex items-center gap-4">
                                                                <div className="w-2 h-2 rounded-full bg-[#0046EA]" />
                                                                MIN: {String(dayContent.requirements.min_length)} KÝ TỰ
                                                            </span>
                                                            <span className="flex items-center gap-4">
                                                                <div className="w-2 h-2 rounded-full bg-[#00A4FD]" />
                                                                TRẠNG THÁI: {days.find(d => d.day_number === selectedDay)?.status === DayStatus.COMPLETED ? 'HOÀN THÀNH' : 'ĐANG THỰC HIỆN'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </section>

                                                    {days.find(d => d.day_number === selectedDay)?.status === DayStatus.COMPLETED ? (
                                                        <div className="w-full bg-white/40 backdrop-blur-xl border-2 border-[#0046EA]/10 rounded-[56px] p-20 text-center space-y-8 shadow-2xl">
                                                            <div className="w-20 h-20 bg-[#0046EA] text-white rounded-3xl flex items-center justify-center mx-auto shadow-2xl animate-pulse">
                                                                <CheckCircle2 size={40} />
                                                            </div>
                                                            <h4 className="text-3xl font-garamond italic font-bold text-[#0046EA]">Hành trình đã ghi dấu</h4>
                                                            <p className="text-[11px] font-black text-[#0046EA]/30 uppercase tracking-[0.4em]">Hệ thống đã lưu giữ tâm hồn của bạn vào dòng lịch sử.</p>
                                                            <div className="pt-10">
                                                                <div className="bg-white/60 p-12 rounded-[40px] border border-white shadow-inner text-left italic font-garamond text-2xl text-[#0046EA]/70 leading-relaxed break-words">
                                                                    {answer}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="relative group">
                                                            <textarea
                                                                ref={textareaRef}
                                                                value={answer}
                                                                onChange={(e) => setAnswer(e.target.value)}
                                                                placeholder="Ghi lại những rung động và suy tư của bạn..."
                                                                className="w-full min-h-[450px] bg-white/40 backdrop-blur-md border-2 border-white focus:border-[#0046EA]/20 focus:bg-white/80 rounded-[56px] p-16 text-2xl text-[#0046EA] placeholder:text-[#0046EA]/10 focus:outline-none transition-all duration-1000 resize-none leading-[1.8] font-garamond italic shadow-2xl"
                                                            />
                                                            <div className="absolute bottom-12 right-12 flex items-center gap-10">
                                                                <span className="text-[11px] text-[#0046EA]/20 font-black uppercase tracking-[0.3em] tabular-nums font-mono">
                                                                    {answer.length} KÝ TỰ
                                                                </span>
                                                                <button 
                                                                    onClick={handleSubmit}
                                                                    disabled={submitting || !answer.trim() || (!!dayContent?.requirements?.min_length && answer.length < (dayContent.requirements.min_length as number))}
                                                                    className="h-20 px-16 bg-[#0046EA] text-white font-black uppercase tracking-[0.5em] text-[11px] rounded-full shadow-[0_24px_48px_rgba(0,70,234,0.3)] disabled:opacity-10 disabled:grayscale transition-all duration-1000 active:scale-95 group overflow-hidden"
                                                                >
                                                                    <span className="relative z-10 flex items-center gap-5">
                                                                        {submitting ? 'TRANSCRIBING...' : 'KHẮC GHI'}
                                                                        {!submitting && <Send size={20} className="group-hover:translate-x-3 group-hover:-translate-y-3 transition-transform duration-700" />}
                                                                    </span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                
                                                <footer className="flex items-center justify-between pt-20 border-t border-white/20">
                                                    <button 
                                                        disabled={selectedDay === 1}
                                                        onClick={() => setSelectedDay(selectedDay - 1)}
                                                        className="text-[#0046EA]/30 hover:text-[#0046EA] font-black uppercase tracking-[0.5em] text-[11px] flex items-center gap-6 transition-all duration-500 group"
                                                    >
                                                        <ArrowLeft size={20} className="group-hover:-translate-x-2 transition-transform" /> PREVIOUS
                                                    </button>
                                                    
                                                    <div className="flex gap-2">
                                                        {(() => {
                                                            const range = 2;
                                                            let start = Math.max(1, selectedDay - range);
                                                            let end = Math.min(30, selectedDay + range);
                                                            
                                                            // Adjust if at boundaries
                                                            if (selectedDay <= range) end = Math.min(30, 5);
                                                            if (selectedDay > 30 - range) start = Math.max(1, 30 - 4);
                                                            
                                                            const pages = [];
                                                            for (let i = start; i <= end; i++) pages.push(i);
                                                            
                                                            return pages.map((p) => (
                                                                <button 
                                                                    key={p} 
                                                                    onClick={() => setSelectedDay(p)}
                                                                    className={`w-10 h-10 flex items-center justify-center text-[10px] font-black transition-all duration-500 ${
                                                                        p === selectedDay 
                                                                            ? 'bg-[#0046EA] text-white shadow-[0_10px_20px_rgba(0,70,234,0.2)]' 
                                                                            : 'bg-white border border-[#0046EA]/10 text-[#0046EA]/30 hover:border-[#0046EA]/30'
                                                                    }`} 
                                                                >
                                                                    {p.toString().padStart(2, '0')}
                                                                </button>
                                                            ));
                                                        })()}
                                                    </div>

                                                    <button 
                                                        disabled={selectedDay === 30 || (days.find(d => d.day_number === selectedDay)?.status !== DayStatus.COMPLETED)}
                                                        onClick={() => setSelectedDay(selectedDay + 1)}
                                                        className="text-[#0046EA]/30 hover:text-[#0046EA] font-black uppercase tracking-[0.5em] text-[11px] flex items-center gap-6 transition-all duration-500 group"
                                                    >
                                                        NEXT <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                                                    </button>
                                                </footer>
                                            </motion.div>
                                        </AnimatePresence>
                                    </div>
                                </main>
                            </motion.div>
                        ) : activeTab === 'mbti' ? (
                            <motion.div
                                key="mbti-content"
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -40 }}
                                className="min-h-[600px]"
                            >
                                <MBTISector />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="quizzes-content"
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -40 }}
                                className="h-full overflow-y-auto custom-scrollbar pr-4"
                            >
                                <ExpertQuizzesTab />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <RoadmapCompletionModal 
                    isOpen={showCompletionModal}
                    onClose={() => setShowCompletionModal(false)}
                    onGenerateReport={handleGenerateReport}
                    onViewWallet={() => {
                        setShowCompletionModal(false);
                        router.push('/dashboard/wallet');
                    }}
                    totalCreditsEarned={days.reduce((acc, d) => acc + (d.reward_earned || 0), 0)}
                />

                <MilestoneModal 
                    isOpen={!!milestoneInfo}
                    onClose={() => setMilestoneInfo(null)}
                    dayNumber={milestoneInfo?.day || 0}
                    rewardAmount={milestoneInfo?.reward || 0}
                    onViewWallet={() => {
                        setMilestoneInfo(null);
                        router.push('/dashboard/wallet');
                    }}
                />
            </div>
        </div>
    );
}
