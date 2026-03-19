'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
    PlayCircle,
    MessageSquare,
    Send,
    ArrowLeft,
    ArrowRight,
    Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EASING = [0.22, 1, 0.36, 1] as any;

const ICON_COLOR = "#C9A84C";

// Modules Data based on thirtydays.md
const SYLLABUS = [
    { id: 1, title: 'Phần 1: Giới thiệu & Chuẩn bị', range: [1, 3] },
    { id: 2, title: 'Phần 2: Đi tìm Giá trị cốt lõi', range: [4, 10] },
    { id: 3, title: 'Phần 3: Khám phá Thế mạnh bản thân', range: [11, 18] },
    { id: 4, title: 'Phần 4: Vùng thiên tài & Ý nghĩa cuộc sống', range: [19, 25] },
    { id: 5, title: 'Phần 5: Xác định Ikigai & Vận dụng', range: [26, 30] },
];

const MOCK_COMMENTS = [
    { id: 1, user: 'Hoàng Minh', text: 'Bài thực hành này giúp mình nhận ra nhiều điều về giá trị cốt lõi mà trước đây mình bỏ qua.', time: '2 giờ trước' },
    { id: 2, user: 'Linh Chi', text: 'Thật tuyệt vời khi được đồng hành cùng mọi người trong hành trình này!', time: '5 giờ trước' },
];

export default function RoadmapPage() {
    const { token, user } = useAuthStore();
    const router = useRouter();

    const [days, setDays] = useState<DailyProgress[]>([]);
    const [selectedDay, setSelectedDay] = useState<number>(1);
    const [dayContent, setDayContent] = useState<DayContent | null>(null);
    const [answer, setAnswer] = useState('');

    const [loading, setLoading] = useState(true);
    const [contentLoading, setContentLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [expandedModules, setExpandedModules] = useState<number[]>([1]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        if (!token) return;
        fetchRoadmap();
    }, [token]);

    useEffect(() => {
        if (selectedDay) {
            fetchDayContent(selectedDay);
        }
    }, [selectedDay]);

    const fetchRoadmap = async () => {
        try {
            const { data } = await api.get<DailyProgress[]>('/roadmap/');
            setDays(data);

            // Auto-select latest unlocked/in-progress day
            const latest = data.find(d => d.status === DayStatus.UNLOCKED)?.day_number || 1;
            setSelectedDay(latest);

            // Expand current module
            const currentModule = SYLLABUS.find(m => latest >= m.range[0] && latest <= m.range[1]);
            if (currentModule) setExpandedModules([currentModule.id]);

        } catch (error) {
            console.error("Failed to load roadmap", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDayContent = async (dayNumber: number) => {
        setContentLoading(true);
        setDayContent(null);
        setAnswer('');
        try {
            const { data } = await api.get<DayContent>(`/roadmap/${dayNumber}/content`);
            setDayContent(data);

            // Fill existing progress if any
            const prog = days.find(d => d.day_number === dayNumber);
            if (prog?.content_data?.text) {
                setAnswer(prog.content_data.text);
            }
        } catch (error) {
            console.error("Failed to load content", error);
        } finally {
            setContentLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedDay) return;
        setSubmitting(true);
        try {
            await api.post(`/roadmap/${selectedDay}/submit`, {
                content_data: { text: answer }
            });
            // Refresh checklist
            const { data } = await api.get<DailyProgress[]>('/roadmap/');
            setDays(data);

            // Move to next day if not last
            if (selectedDay < 30) {
                setSelectedDay(selectedDay + 1);
            }
        } catch (error) {
            console.error("Submit failed", error);
            alert("Lỗi khi lưu kết quả.");
        } finally {
            setSubmitting(false);
        }
    };

    const toggleModule = (id: number) => {
        setExpandedModules(prev =>
            prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
        );
    };

    const getDayStatus = (num: number) => {
        const d = days.find(day => day.day_number === num);
        return d ? d.status : DayStatus.LOCKED;
    };

    const completedCount = days.filter(d => d.status === DayStatus.COMPLETED).length;
    const progressPercent = Math.round((completedCount / 30) * 100);

    if (loading) {
        return (
            <div className="flex h-[80vh] flex-col items-center justify-center gap-6 bg-[#F5F0E8]">
                <div className="animate-spin h-10 w-10 border-t-2 border-[#C9A84C] rounded-full"></div>
                <span className="text-[10px] font-medium text-[#0D1B2A]/40 uppercase tracking-[0.4em]">Đang kiến tạo lộ trình...</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-[#F5F0E8] overflow-hidden selection:bg-[#C9A84C]/30 transition-all duration-700">
            {/* Top Navigation (Luxury Minimalist) */}
            <header className="h-20 bg-[#F5F0E8] border-b border-[#C9A84C]/10 flex items-center justify-between px-8 sticky top-0 z-40">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-3 hover:bg-white/50 lg:hidden focus:outline-none transition-colors"
                        aria-label={isSidebarOpen ? 'Đóng menu' : 'Mở menu'}
                    >
                        <Menu size={18} color={ICON_COLOR} />
                    </button>
                    <div className="flex flex-col">
                        <h1 className="font-garamond text-2xl text-[#0D1B2A] tracking-wider leading-none">
                            Hành Trình <span className="italic font-normal">Ikigai</span>
                        </h1>
                        <span className="text-[10px] font-medium text-[#C9A84C] uppercase tracking-[0.4em] mt-1">
                            Chuẩn mực của sự định hướng
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-10 flex-1 max-w-2xl justify-end">
                    <div className="hidden sm:flex flex-col gap-2 w-full max-w-[240px]" aria-label={`Tiến độ: ${progressPercent}%`}>
                        <div className="flex justify-between text-[9px] font-medium text-[#0D1B2A]/40 tracking-[0.3em] uppercase">
                            <span>TIẾN ĐỘ HOÀN TẤT</span>
                            <span className="tabular-nums">{progressPercent}%</span>
                        </div>
                        <div className="h-[2px] w-full bg-[#C9A84C]/10 overflow-hidden">
                            <div
                                className="h-full bg-[#C9A84C] transition-all duration-1000 ease-out"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>

                    <Link href="/dashboard" className="text-[10px] font-medium text-[#0D1B2A]/60 hover:text-[#58181F] transition-all tracking-[0.2em] uppercase border-l border-[#C9A84C]/20 pl-8 h-6 flex items-center">
                        Tạm dừng
                    </Link>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar - Syllabus (Luxury Column) */}
                <AnimatePresence mode="wait">
                    {isSidebarOpen && (
                        <motion.aside
                            initial={{ x: -320, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -320, opacity: 0 }}
                            transition={{ duration: 0.8, ease: EASING }}
                            className="bg-[#F5F0E8] border-r border-[#C9A84C]/10 w-full lg:w-80 flex flex-col transition-all duration-700 fixed lg:relative inset-0 z-30"
                        >
                            <div className="p-6 border-b border-[#C9A84C]/10 lg:hidden flex justify-between items-center bg-[#F5F0E8]">
                                <span className="font-garamond text-xl text-[#0D1B2A] italic">Nội dung hành trình</span>
                                <button
                                    onClick={() => setIsSidebarOpen(false)}
                                    aria-label="Đóng menu"
                                    className="p-1 focus:outline-none"
                                >
                                    <X size={18} color={ICON_COLOR} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto overflow-x-hidden pt-8 pb-10">
                                <div className="px-8 py-2 text-[10px] font-medium text-[#C9A84C] uppercase tracking-[0.4em] mb-6">
                                    Lộ trình đào tạo
                                </div>
                                {SYLLABUS.map(module => (
                                    <div key={module.id} className="mb-1">
                                        <button
                                            onClick={() => toggleModule(module.id)}
                                            className={`
                                        w-full px-8 py-4 flex items-center justify-between transition-all duration-500 group outline-none
                                        ${expandedModules.includes(module.id) ? 'bg-white/40 border-y border-[#C9A84C]/5' : 'hover:bg-white/20'}
                                    `}
                                            aria-expanded={expandedModules.includes(module.id)}
                                        >
                                            <span className={`text-[11px] font-medium text-left tracking-[0.15em] uppercase transition-colors ${expandedModules.includes(module.id) ? 'text-[#0D1B2A]' : 'text-[#0D1B2A]/50'}`}>
                                                {module.title}
                                            </span>
                                            {expandedModules.includes(module.id)
                                                ? <ChevronUp size={14} color={ICON_COLOR} />
                                                : <ChevronDown size={14} className="opacity-40 group-hover:opacity-100" color={ICON_COLOR} />
                                            }
                                        </button>
                                        {expandedModules.includes(module.id) ? (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.6, ease: EASING }}
                                                className="mt-0 space-y-0 overflow-hidden"
                                            >
                                                {Array.from({ length: module.range[1] - module.range[0] + 1 }, (_, i) => {
                                                    const num = module.range[0] + i;
                                                    const status = getDayStatus(num);
                                                    const isActive = selectedDay === num;

                                                    return (
                                                        <button
                                                            key={num}
                                                            onClick={() => {
                                                                if (status !== DayStatus.LOCKED) {
                                                                    setSelectedDay(num);
                                                                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                                                                }
                                                            }}
                                                            className={`
                                                        w-full px-10 py-5 flex items-center gap-5 transition-all duration-700 text-left outline-none
                                                        ${isActive ? 'bg-[#1A1A2E] text-[#F5F0E8] shadow-2xl z-10' : 'hover:bg-white/60'}
                                                        ${status === DayStatus.LOCKED ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer'}
                                                    `}
                                                            aria-current={isActive ? 'step' : undefined}
                                                            disabled={status === DayStatus.LOCKED}
                                                        >
                                                            <div className="shrink-0">
                                                                {status === DayStatus.COMPLETED ? (
                                                                    <CheckCircle2 size={12} color={isActive ? "#C9A84C" : ICON_COLOR} className="opacity-80" />
                                                                ) : status === DayStatus.UNLOCKED || isActive ? (
                                                                    <div className={`w-3 h-3 rounded-full border border-[#C9A84C] ${isActive ? 'bg-[#C9A84C] animate-pulse' : ''}`} />
                                                                ) : (
                                                                    <div className="w-3 h-3 rounded-full border border-[#C9A84C]/30" />
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className={`text-[9px] font-medium uppercase tracking-[0.3em] leading-none mb-1.5 ${isActive ? 'text-[#C9A84C]' : 'text-[#C9A84C]/60'}`}>
                                                                    Bài {num}
                                                                </p>
                                                                <p className={`text-[11px] font-light truncate tracking-widest ${isActive ? 'text-[#F5F0E8]' : 'text-[#0D1B2A]/80'}`}>
                                                                    Bản sắc cá nhân
                                                                </p>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </motion.div>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>

                {/* Main Content Area (Luxury Canvas) */}
                <main className="flex-1 flex flex-col overflow-hidden relative bg-[#F5F0E8]">
                    <AnimatePresence mode="wait">
                        {contentLoading ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex-1 overflow-y-auto px-8 py-20 lg:px-24"
                            >
                                <div className="max-w-3xl mx-auto flex flex-col gap-10 animate-pulse">
                                    <div className="h-10 bg-[#C9A84C]/5 w-3/4" />
                                    <div className="h-64 bg-[#C9A84C]/5" />
                                    <div className="h-40 bg-[#C9A84C]/5" />
                                </div>
                            </motion.div>
                        ) : dayContent ? (
                            <motion.div
                                key={selectedDay}
                                initial={{ opacity: 0, y: 30, scale: 1.01 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -30, scale: 0.99 }}
                                transition={{ duration: 1, ease: EASING }}
                                className="flex-1 overflow-y-auto px-8 py-20 lg:px-24 custom-scrollbar"
                            >
                                <div className="max-w-5xl mx-auto space-y-24 pb-24">
                                    {/* Lesson Header */}
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-10 pb-4">
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3 text-[#C9A84C] font-medium text-[9px] uppercase tracking-[0.4em]">
                                                <PlayCircle size={14} strokeWidth={1} />
                                                <span>Nội dung bài học</span>
                                            </div>
                                            <h2 className="text-4xl lg:text-5xl font-garamond text-[#0D1B2A] leading-[1.2] font-normal">
                                                Bài {selectedDay}: <span className="italic">{dayContent?.topic}</span>
                                            </h2>
                                        </div>
                                        <button
                                            onClick={handleSubmit}
                                            className="px-10 py-5 bg-[#0D1B2A] text-[#F5F0E8] text-[10px] tracking-[0.3em] uppercase transition-all duration-700 hover:bg-[#58181F] shrink-0"
                                            disabled={getDayStatus(selectedDay) === DayStatus.COMPLETED || !answer.trim()}
                                        >
                                            {getDayStatus(selectedDay) === DayStatus.COMPLETED ? 'Hoàn tất ✓' : 'Xác nhận'}
                                        </button>
                                    </div>

                                    {/* Reading Content */}
                                    <article className="prose prose-slate lg:prose-lg max-w-none text-[#0D1B2A]/70 leading-relaxed font-inter font-light">
                                        <p className="text-xl font-medium text-[#0D1B2A] italic border-l border-[#C9A84C] pl-10 py-2 font-garamond">
                                            {dayContent?.prompt}
                                        </p>
                                        <div className="mt-12 p-10 bg-white/40 border border-[#C9A84C]/10 shadow-sm backdrop-blur-sm text-lg leading-[2]">
                                            <p>Nội dung lý thuyết chi tiết của bài học sẽ hiển thị tại đây…</p>
                                            <p className="mt-6">Ikigai là khái niệm sống của người Nhật, có nghĩa là “lý do để thức dậy mỗi sáng”. Việc tìm ra Ikigai giúp bạn có một cuộc sống cân bằng và ý nghĩa hơn giữa đam mê, sứ mệnh, công việc và chuyên môn.</p>
                                        </div>
                                    </article>

                                    {/* Journaling Box (Obsidian Vellum) */}
                                    <div className="p-16 bg-[#1A1A2E] border border-[#C9A84C]/10 space-y-12 relative overflow-hidden group shadow-2xl">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#C9A84C]/5 blur-[100px] rounded-full -mr-32 -mt-32" />

                                        <div className="flex items-center gap-6 relative z-10">
                                            <div className="w-10 h-10 border border-[#C9A84C]/20 flex items-center justify-center text-[#C9A84C] group-hover:border-[#C9A84C] transition-colors duration-700">
                                                <CheckCircle2 size={18} strokeWidth={1} />
                                            </div>
                                            <h3 className="text-xl font-garamond text-[#F5F0E8] italic tracking-wide">Nhật ký thực hành</h3>
                                        </div>

                                        <div className="relative z-10">
                                            <textarea
                                                id="journal-input"
                                                value={answer}
                                                onChange={(e) => setAnswer(e.target.value)}
                                                placeholder="Ghi lại sự chắt lọc của bạn..."
                                                className="w-full h-64 p-0 bg-transparent border-none focus:ring-0 outline-none transition-all resize-none text-[#F5F0E8]/90 placeholder:text-[#F5F0E8]/10 text-xl font-light leading-relaxed font-inter"
                                                disabled={getDayStatus(selectedDay) === DayStatus.COMPLETED}
                                                aria-label="Khung ghi chép thực hành"
                                            />
                                            <div className="h-[1px] w-full bg-[#C9A84C]/20 mt-4" />
                                        </div>

                                        <div className="flex flex-col sm:flex-row justify-between items-center gap-8 relative z-10">
                                            <p className="text-[9px] font-medium text-[#C9A84C]/50 uppercase tracking-[0.4em]">
                                                {getDayStatus(selectedDay) === DayStatus.COMPLETED ? 'Hệ thống đã ghi nhận' : 'Tự động lưu vào di sản số'}
                                            </p>
                                            <button
                                                onClick={handleSubmit}
                                                disabled={getDayStatus(selectedDay) === DayStatus.COMPLETED || !answer.trim()}
                                                className="bg-[#F5F0E8] text-[#0D1B2A] text-[10px] font-medium py-4 px-12 tracking-[0.3em] uppercase transition-all duration-700 hover:bg-[#C9A84C] hover:text-[#0D1B2A]"
                                            >
                                                Lưu kết quả
                                            </button>
                                        </div>
                                    </div>

                                    {/* Community Section */}
                                    <div className="pt-24 border-t border-[#C9A84C]/10">
                                        <div className="flex items-center gap-4 mb-12">
                                            <MessageSquare size={18} color={ICON_COLOR} strokeWidth={1} />
                                            <h2 className="text-2xl font-garamond text-[#0D1B2A] italic">Cộng đồng hội tụ</h2>
                                        </div>

                                        <div className="space-y-12">
                                            <div className="flex gap-6 items-center border-b border-[#0D1B2A]/5 pb-6">
                                                <div className="w-10 h-10 border border-[#C9A84C]/20 flex items-center justify-center text-[#0D1B2A] text-[10px] uppercase font-medium">
                                                    {user?.full_name?.charAt(0) || 'V'}
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Để lại lời nhắn cho cộng đồng..."
                                                    className="flex-1 bg-transparent border-none focus:ring-0 text-[11px] tracking-[0.1em] uppercase font-light outline-none placeholder:text-[#0D1B2A]/20"
                                                />
                                                <button className="text-[#C9A84C] hover:text-[#0D1B2A] transition-colors">
                                                    <Send size={16} strokeWidth={1} />
                                                </button>
                                            </div>

                                            {MOCK_COMMENTS.map(comment => (
                                                <div key={comment.id} className="flex gap-8 group">
                                                    <div className="w-10 h-10 border border-[#C9A84C]/10 flex items-center justify-center text-[#C9A84C] text-[10px] font-medium">
                                                        {comment.user.charAt(0)}
                                                    </div>
                                                    <div className="space-y-4 flex-1">
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-[10px] font-medium text-[#0D1B2A] uppercase tracking-widest">{comment.user}</span>
                                                            <span className="text-[8px] text-[#0D1B2A]/30 font-medium uppercase tracking-[0.2em]">{comment.time}</span>
                                                        </div>
                                                        <p className="text-[13px] text-[#0D1B2A]/60 leading-relaxed font-light italic">
                                                            “{comment.text}”
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="locked"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="max-w-xl mx-auto text-center py-32 flex flex-col items-center gap-10"
                            >
                                <div className="w-20 h-20 border border-[#C9A84C]/20 flex items-center justify-center text-[#C9A84C]/40">
                                    <Lock size={32} strokeWidth={1} />
                                </div>
                                <div className="space-y-6">
                                    <h3 className="text-3xl font-garamond text-[#0D1B2A]">Cánh cửa còn khép lại</h3>
                                    <p className="text-[#0D1B2A]/50 font-light tracking-wide leading-relaxed uppercase text-[10px]">
                                        Hãy hoàn thiện các bài học trước đó để mở lối cho hành trình Ikigai.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedDay(1)}
                                    className="px-8 py-4 border border-[#0D1B2A] text-[#0D1B2A] text-[9px] tracking-[0.3em] uppercase hover:bg-[#0D1B2A] hover:text-[#F5F0E8] transition-all duration-700"
                                >
                                    Trở về khởi đầu
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Lesson Navigation Sticky Bottom (Luxury Bar) */}
                    <div className="h-24 bg-[#F5F0E8] border-t border-[#C9A84C]/10 flex items-center justify-between px-10 sm:px-16 shrink-0 relative z-40">
                        <button
                            disabled={selectedDay === 1}
                            onClick={() => setSelectedDay(selectedDay - 1)}
                            className="flex items-center gap-4 text-[10px] font-medium text-[#0D1B2A]/40 hover:text-[#0D1B2A] disabled:opacity-20 transition-all uppercase tracking-[0.4em] group focus:outline-none"
                            aria-label="Bài học trước"
                        >
                            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" strokeWidth={1} />
                            <span className="hidden sm:inline">Trở trước</span>
                        </button>

                        <div className="flex flex-col items-center" aria-label={`Đang ở bài ${selectedDay}`}>
                            <span className="text-[8px] font-medium text-[#C9A84C]/60 uppercase tracking-[0.4em] mb-1">Hiện tại</span>
                            <span className="text-sm font-garamond text-[#0D1B2A] tracking-widest uppercase">BÀI {selectedDay}</span>
                        </div>

                        <button
                            disabled={selectedDay === 30 || getDayStatus(selectedDay + 1) === DayStatus.LOCKED}
                            onClick={() => setSelectedDay(selectedDay + 1)}
                            className="flex items-center gap-4 text-[10px] font-medium text-[#0D1B2A] hover:text-[#58181F] disabled:opacity-20 transition-all uppercase tracking-[0.3em] group focus:outline-none"
                            aria-label="Bài học tiếp theo"
                        >
                            <span className="hidden sm:inline">Tiếp theo</span>
                            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" strokeWidth={1} />
                        </button>
                    </div>
                </main>
            </div>
        </div>
    );
}

