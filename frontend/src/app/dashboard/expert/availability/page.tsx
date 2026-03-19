'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Plus, Trash2, Save, ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';

interface TimeSlot {
    id?: number; // Added from API perspective
    day_of_week: number;
    start_time: string;
    end_time: string;
}

const DAYS = [
    { label: 'Thứ Hai', value: 1 },
    { label: 'Thứ Ba', value: 2 },
    { label: 'Thứ Tư', value: 3 },
    { label: 'Thứ Năm', value: 4 },
    { label: 'Thứ Sáu', value: 5 },
    { label: 'Thứ Bảy', value: 6 },
    { label: 'Chủ Nhật', value: 0 },
];

const EASING: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function AvailabilityPage() {
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Fetch
    useEffect(() => {
        const fetchAvailability = async () => {
            try {
                const { data } = await api.get('/experts/me/availability');
                // Ensure data is sorted by day
                const sortedData = (data || []).sort((a: TimeSlot, b: TimeSlot) => {
                    const d1 = a.day_of_week === 0 ? 7 : a.day_of_week;
                    const d2 = b.day_of_week === 0 ? 7 : b.day_of_week;
                    return d1 - d2;
                });
                setSlots(sortedData);
            } catch (err) {
                console.error("Failed to fetch availability", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAvailability();
    }, []);

    const addSlot = () => {
        setSlots([...slots, { day_of_week: 1, start_time: '09:00', end_time: '17:00' }]);
    };

    const removeSlot = (index: number) => {
        setSlots(slots.filter((_, i) => i !== index));
    };

    const updateSlot = (index: number, field: keyof TimeSlot, value: any) => {
        const newSlots = [...slots];
        newSlots[index] = { ...newSlots[index], [field]: value };
        setSlots(newSlots);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await api.post('/experts/me/availability', slots);
            // Re-fetch to get IDs and stable order
            const { data } = await api.get('/experts/me/availability');
            setSlots(data);
        } catch (err) {
            console.error("Failed to save", err);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return (
        <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
            <div className="flex flex-col items-center gap-8">
                <div className="w-12 h-12 border border-[#C9A84C]/20 border-t-[#C9A84C] rounded-full animate-spin" />
                <p className="text-[#0A1018]/20 font-normal uppercase tracking-[0.4em] text-[10px] font-sans">Đang truy vấn lịch trình…</p>
            </div>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-[#F5F0E8] selection:bg-[#C9A84C]/20 pb-44"
        >
            {/* ── Breadcrumbs ── */}
            <div className="bg-[#0A1018] border-b border-white/5">
                <nav className="max-w-[1400px] mx-auto px-8 py-6 flex items-center gap-4">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 text-[10px] font-normal text-white/30 hover:text-[#C9A84C] transition-all uppercase tracking-[0.2em] font-sans"
                    >
                        <Home size={12} strokeWidth={1.5} />
                        Bàn làm việc
                    </Link>
                    <ChevronRight size={10} className="text-white/10" />
                    <span className="text-[10px] font-normal text-[#C9A84C] uppercase tracking-[0.2em] font-sans">Quản lý Lịch biểu</span>
                </nav>
            </div>

            <main className="max-w-[1400px] mx-auto px-8 py-32">
                <header className="mb-20 space-y-6">
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1.2, ease: EASING }}
                        className="text-5xl md:text-6xl font-serif italic text-[#0A1018] tracking-tight"
                    >
                        Thời gian biểu Cố vấn
                    </motion.h1>
                    <p className="text-[#0A1018]/40 font-normal text-[10px] uppercase tracking-[0.4em] font-sans max-w-xl leading-relaxed">
                        Thiết lập khung giờ làm việc định kỳ hàng tuần. Lịch trình này sẽ được hiển thị để học viên đăng ký tư vấn trực tiếp.
                    </p>
                </header>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.2, ease: EASING, delay: 0.2 }}
                    className="bg-[#FAF7F2]/40 backdrop-blur-3xl border border-[#C9A84C]/10 rounded-[2px] shadow-[0_64px_128px_-16px_rgba(10,16,24,0.05)] overflow-hidden"
                >
                    <div className="p-12 md:p-16 space-y-12">
                        <div className="flex items-center justify-between border-b border-[#C9A84C]/10 pb-10">
                            <h3 className="text-[10px] font-normal text-[#0A1018]/30 uppercase tracking-[0.4em] flex items-center gap-4">
                                <Calendar size={14} className="text-[#C9A84C]" strokeWidth={1.5} />
                                Các khung giờ hiện hữu
                            </h3>
                            <button
                                onClick={addSlot}
                                className="flex items-center gap-3 text-[10px] font-normal text-[#C97B3A] uppercase tracking-[0.2em] font-sans hover:text-[#0A1018] transition-all"
                            >
                                <Plus size={14} strokeWidth={1.5} />
                                Thêm khung giờ
                            </button>
                        </div>

                        <div className="space-y-6">
                            <AnimatePresence mode="popLayout">
                                {slots.length > 0 ? (
                                    slots.map((slot, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.98 }}
                                            transition={{ duration: 0.6, ease: EASING }}
                                            className="flex flex-col md:flex-row items-start md:items-center gap-10 p-8 bg-white/40 border border-transparent hover:border-[#C9A84C]/20 transition-all rounded-[1px] group"
                                        >
                                            <div className="w-full md:w-56 space-y-2">
                                                <label className="block text-[9px] font-sans text-[#0A1018]/30 uppercase tracking-[0.2em]">Ngày trong tuần</label>
                                                <select
                                                    value={slot.day_of_week}
                                                    onChange={(e) => updateSlot(index, 'day_of_week', parseInt(e.target.value))}
                                                    className="w-full bg-transparent border-b border-[#0A1018]/10 text-sm font-serif italic text-[#0A1018] py-2 focus:outline-none focus:border-[#C9A84C] transition-all appearance-none cursor-pointer"
                                                >
                                                    {DAYS.map((day) => (
                                                        <option key={day.value} value={day.value}>{day.label}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="flex flex-1 items-center gap-8 w-full">
                                                <div className="flex-1 space-y-2">
                                                    <label className="block text-[9px] font-sans text-[#0A1018]/30 uppercase tracking-[0.2em]">Bắt đầu</label>
                                                    <div className="relative">
                                                        <input
                                                            type="time"
                                                            value={slot.start_time.slice(0, 5)}
                                                            onChange={(e) => updateSlot(index, 'start_time', e.target.value)}
                                                            className="w-full bg-transparent border-b border-[#0A1018]/10 text-sm font-sans text-[#0A1018] py-2 focus:outline-none focus:border-[#C9A84C] transition-all cursor-pointer tabular-nums"
                                                        />
                                                        <Clock size={12} className="absolute right-0 top-3 text-[#0A1018]/20 pointer-events-none" strokeWidth={1.5} />
                                                    </div>
                                                </div>

                                                <div className="pt-6 text-[#C9A84C]/30 font-light">—</div>

                                                <div className="flex-1 space-y-2">
                                                    <label className="block text-[9px] font-sans text-[#0A1018]/30 uppercase tracking-[0.2em]">Kết thúc</label>
                                                    <div className="relative">
                                                        <input
                                                            type="time"
                                                            value={slot.end_time.slice(0, 5)}
                                                            onChange={(e) => updateSlot(index, 'end_time', e.target.value)}
                                                            className="w-full bg-transparent border-b border-[#0A1018]/10 text-sm font-sans text-[#0A1018] py-2 focus:outline-none focus:border-[#C9A84C] transition-all cursor-pointer tabular-nums"
                                                        />
                                                        <Clock size={12} className="absolute right-0 top-3 text-[#0A1018]/20 pointer-events-none" strokeWidth={1.5} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-4 md:pt-6">
                                                <button
                                                    onClick={() => removeSlot(index)}
                                                    className="p-3 text-[#0A1018]/20 hover:text-red-800 transition-all rounded-full hover:bg-red-50"
                                                    title="Loại bỏ"
                                                >
                                                    <Trash2 size={16} strokeWidth={1.5} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="py-20 text-center border border-dashed border-[#C9A84C]/20 rounded-[1px]">
                                        <p className="text-[10px] text-[#0A1018]/20 uppercase tracking-[0.4em] font-sans">Chưa có khung giờ nào được thiết lập.</p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="pt-16 border-t border-[#C9A84C]/10 flex flex-col md:flex-row justify-between items-center gap-8">
                            <p className="text-[9px] text-[#0A1018]/30 font-sans uppercase tracking-[0.2em] italic">
                                * Lưu ý: Các thay đổi sẽ có hiệu lực ngay sau khi lưu.
                            </p>
                            <div className="flex items-center gap-6 w-full md:w-auto">
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex-1 md:flex-none bg-[#0A1018] text-[#F5F0E8] px-16 py-5 rounded-[2px] font-sans text-[11px] uppercase tracking-[0.3em] transition-all hover:bg-[#C9A84C] hover:text-[#0A1018] disabled:opacity-20 flex items-center justify-center gap-4"
                                >
                                    {isSaving ? (
                                        <div className="w-4 h-4 border border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Save size={14} strokeWidth={1.5} />
                                    )}
                                    Lưu Lịch biểu
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </main>
        </motion.div>
    );
}
