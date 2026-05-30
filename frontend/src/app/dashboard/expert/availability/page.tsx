'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Plus, Trash2, Save, ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ui/Toast";

interface TimeSlot {
    id?: number; // Added from API perspective
    day_of_week: number;
    start_time: string;
    end_time: string;
    max_participants: number;
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
    const toast = useToast();

    // Fetch
    useEffect(() => {
        const fetchAvailability = async () => {
            try {
                const { data } = await api.get('experts/me/availability');
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
        setSlots([...slots, { day_of_week: 1, start_time: '09:00', end_time: '17:00', max_participants: 1 }]);
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
            await api.post('experts/me/availability', slots);
            // Re-fetch to get IDs and stable order
            const { data } = await api.get('experts/me/availability');
            setSlots(data);
            toast.success("Cập nhật lịch biểu thành công!");
        } catch (err: any) {
            console.error("Failed to save", err);
            toast.error(err.response?.data?.detail || "Không thể lưu lịch biểu. Vui lòng thử lại.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="flex flex-col items-center gap-8">
                <div className="w-12 h-12 border-2 border-[#0046EA]/10 border-t-[#0046EA] rounded-full animate-spin" />
                <p className="text-[#0046EA] font-black uppercase tracking-[0.4em] text-[10px] font-dm-sans">Đang truy vấn lịch trình…</p>
            </div>
        </div>
    );

    return (
        <div className="bg-white min-h-screen selection:bg-[#0046EA]/10 text-[#171716] font-dm-sans pb-44">
            {/* ── Header Section (The Sky) ── */}
            <div className="bg-[#0046EA] pt-24 pb-32 px-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(0,164,253,0.3)_0%,transparent_70%)]" />
                <div className="max-w-[1400px] mx-auto relative z-10">
                    <nav className="flex items-center gap-4 mb-12">
                        <Link
                            href="/dashboard/expert"
                            className="flex items-center gap-2 text-[10px] font-black text-white/40 hover:text-white transition-all uppercase tracking-[0.2em]"
                        >
                            Bàn làm việc
                        </Link>
                        <ChevronRight size={10} className="text-white/20" />
                        <span className="text-[10px] font-black text-[#FFE900] uppercase tracking-[0.2em]">Quản lý Lịch biểu</span>
                    </nav>

                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-[2px] bg-[#FFE900]" />
                            <span className="text-[10px] text-[#FFE900] tracking-[0.5em] font-black uppercase">Availability Protocol</span>
                        </div>
                        <h1 className="text-[clamp(40px,5vw,68px)] font-garamond italic font-bold text-white tracking-tight leading-none">
                            Thời gian biểu Cố vấn
                        </h1>
                        <p className="max-w-2xl text-white/60 font-dm-sans text-sm font-light leading-relaxed">
                            Thiết lập khung giờ làm việc định kỳ hàng tuần. Lịch trình này sẽ được hiển thị để học viên đăng ký tư vấn chiến lược trực tiếp.
                        </p>
                    </div>
                </div>
            </div>

            <main className="max-w-[1400px] mx-auto px-8 -mt-16 relative z-20">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.2, ease: EASING }}
                    className="bg-white border border-black/5 rounded-[48px] shadow-2xl overflow-hidden"
                >
                    <div className="p-12 md:p-16 space-y-12">
                        <div className="flex items-center justify-between border-b border-black/5 pb-12">
                            <h3 className="text-[#171716]/40 uppercase text-[10px] font-black tracking-[0.4em] flex items-center gap-4">
                                <Calendar size={14} className="text-[#0046EA]" />
                                DANH SÁCH KHUNG GIỜ CHIẾN LƯỢC
                            </h3>
                            <button
                                onClick={addSlot}
                                className="h-12 px-6 bg-[#F5F8FF] text-[#0046EA] text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-[#0046EA] hover:text-white transition-all duration-500 flex items-center gap-3 shadow-sm"
                            >
                                <Plus size={14} />
                                THÊM KHUNG GIỜ
                            </button>
                        </div>

                        <div className="space-y-8">
                            <AnimatePresence mode="popLayout">
                                {slots.length > 0 ? (
                                    slots.map((slot, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.98 }}
                                            transition={{ duration: 0.6, ease: EASING }}
                                            className="grid grid-cols-1 md:grid-cols-12 items-center gap-10 p-10 bg-[#00A4FD] border-[6px] border-[#00A4FD] rounded-none hover:bg-[#D20048] hover:border-[#D20048] shadow-sm hover:shadow-2xl transition-all duration-500 group text-white"
                                        >
                                            <div className="md:col-span-3 space-y-4">
                                                <label className="block text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Ngày</label>
                                                <div className="relative">
                                                    <select
                                                        value={slot.day_of_week}
                                                        onChange={(e) => updateSlot(index, 'day_of_week', parseInt(e.target.value))}
                                                        className="w-full bg-white/10 border border-white/20 text-lg font-garamond italic font-bold text-white px-6 py-4 rounded-none focus:outline-none focus:border-white transition-all appearance-none cursor-pointer"
                                                    >
                                                        {DAYS.map((day) => (
                                                            <option key={day.value} value={day.value} className="text-black">{day.label}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronRight size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-white rotate-90 pointer-events-none" />
                                                </div>
                                            </div>

                                            <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-8 items-end">
                                                <div className="space-y-4">
                                                    <label className="block text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Bắt đầu</label>
                                                    <div className="relative">
                                                        <input
                                                            type="time"
                                                            value={slot.start_time.slice(0, 5)}
                                                            onChange={(e) => updateSlot(index, 'start_time', e.target.value)}
                                                            className="w-full bg-white/10 border border-white/20 text-xl font-black text-white px-6 py-4 rounded-none focus:outline-none focus:border-white transition-all cursor-pointer tabular-nums"
                                                        />
                                                        <Clock size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <label className="block text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Kết thúc</label>
                                                    <div className="relative">
                                                        <input
                                                            type="time"
                                                            value={slot.end_time.slice(0, 5)}
                                                            onChange={(e) => updateSlot(index, 'end_time', e.target.value)}
                                                            className="w-full bg-white/10 border border-white/20 text-xl font-black text-white px-6 py-4 rounded-none focus:outline-none focus:border-white transition-all cursor-pointer tabular-nums"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="md:col-span-2 space-y-4">
                                                <label className="block text-[9px] font-black text-white/40 uppercase tracking-[0.3em]" title="Giới hạn số học viên có thể đăng ký chung khung giờ">Max Số Người</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={100}
                                                        value={slot.max_participants || 1}
                                                        onChange={(e) => updateSlot(index, 'max_participants', parseInt(e.target.value) || 1)}
                                                        className="w-full bg-white/10 border border-white/20 text-xl font-black text-white px-6 py-4 rounded-none focus:outline-none focus:border-white transition-all tabular-nums text-center"
                                                    />
                                                </div>
                                            </div>

                                            <div className="md:col-span-1 flex justify-end">
                                                <button
                                                    onClick={() => removeSlot(index)}
                                                    className="w-14 h-14 bg-white/10 border border-white/20 text-white/40 hover:text-white hover:bg-red-500 hover:border-red-500 transition-all duration-500 rounded-none flex items-center justify-center"
                                                    title="Loại bỏ"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="py-32 flex flex-col items-center justify-center bg-[#F5F8FF] border-2 border-dashed border-black/5 rounded-[40px]">
                                        <Calendar size={48} className="text-[#0046EA]/20 mb-6" />
                                        <p className="text-[#171716]/30 font-black uppercase text-[10px] tracking-[0.4em]">
                                            CHƯA CÓ KHUNG GIỜ NÀO ĐƯỢC THIẾT LẬP.
                                        </p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="pt-16 border-t border-black/5 flex flex-col md:flex-row justify-between items-center gap-12">
                            <div className="flex items-center gap-4">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#FFE900]" />
                                <p className="text-[10px] text-black/30 font-black uppercase tracking-[0.3em]">
                                    Cập nhật lịch biểu sẽ có hiệu lực tức thì trên hồ sơ của bạn.
                                </p>
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="h-16 px-16 bg-[#171716] text-white text-[11px] font-black uppercase tracking-[0.4em] rounded-full hover:bg-[#0046EA] transition-all duration-700 disabled:opacity-20 flex items-center justify-center gap-4 shadow-2xl"
                            >
                                {isSaving ? (
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Save size={16} />
                                )}
                                LƯU LỊCH BIỂU CHIẾN LƯỢC
                            </button>
                        </div>
                    </div>
                </motion.div>
            </main>

            <ToastContainer toasts={toast.toasts} onDismiss={toast.dismissToast} />
        </div>
    );
}
