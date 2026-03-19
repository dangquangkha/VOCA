'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar as CalendarIcon, Clock, ChevronRight, CheckCircle2, AlertCircle, Home, ShieldCheck, Award, MessageSquare } from 'lucide-react';
import api from '@/lib/api';
import { Expert } from '@/types/expert';
import { useAuthStore } from '@/store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';

interface TimeSlot { start: string; end: string; }

const DAY_NAMES = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MONTH_NAMES = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

const EASING: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Build next-14-days calendar entries */
function buildCalendar(availabilities: Expert['availabilities']) {
    const availableDays = new Set((availabilities || []).map(a => a.day_of_week));
    const entries: { dateStr: string; day: number; label: string; month: string; available: boolean }[] = [];
    const today = new Date();

    for (let i = 0; i < 14; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        entries.push({
            dateStr,
            day: d.getDate(),
            label: DAY_LABELS[d.getDay()],
            month: MONTH_NAMES[d.getMonth()],
            available: availableDays.has(d.getDay()),
        });
    }
    return entries;
}

export default function BookingPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuthStore();

    const [expert, setExpert] = useState<Expert | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [note, setNote] = useState('');
    const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);

    useEffect(() => {
        if (params.id) fetchExpert(params.id as string);
    }, [params.id]);

    const fetchExpert = async (id: string) => {
        try {
            const { data } = await api.get(`experts/${id}`);
            setExpert(data);
        } catch {
            setError('Không thể tải thông tin chuyên gia.');
        } finally {
            setIsLoading(false);
        }
    };

    /* Build time slots when date selected */
    useEffect(() => {
        if (!expert || !selectedDate) { setAvailableSlots([]); return; }
        const dateObj = new Date(selectedDate);
        const avail = expert.availabilities.find(a => a.day_of_week === dateObj.getDay());
        if (avail) {
            const slots: TimeSlot[] = [];
            let h = parseInt(avail.start_time.split(':')[0]);
            const end = parseInt(avail.end_time.split(':')[0]);
            while (h < end) {
                slots.push({ start: `${String(h).padStart(2, '0')}:00`, end: `${String(h + 1).padStart(2, '0')}:00` });
                h++;
            }
            setAvailableSlots(slots);
        } else {
            setAvailableSlots([]);
        }
    }, [selectedDate, expert]);

    const handleBooking = async () => {
        if (!expert || !selectedDate || !selectedTime) return;
        setIsSubmitting(true);
        setError('');
        try {
            const startDT = new Date(`${selectedDate}T${selectedTime}:00`);
            const endDT = new Date(startDT.getTime() + 60 * 60 * 1000);
            await api.post('bookings/', {
                expert_id: expert.id,
                start_time: startDT.toISOString(),
                end_time: endDT.toISOString(),
                student_note: note,
            });
            setSuccess(true);
            setTimeout(() => router.push('/dashboard/manage/bookings'), 2500);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Đặt lịch thất bại. Vui lòng thử lại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    /* ─── Loading ─── */
    if (isLoading) return (
        <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
            <div className="flex flex-col items-center gap-8">
                <div className="w-12 h-12 border border-[#C9A84C]/20 border-t-[#C9A84C] rounded-full animate-spin" />
                <p className="text-[#0A1018]/20 font-normal uppercase tracking-[0.4em] text-[10px] font-sans">Đang chuẩn bị lịch…</p>
            </div>
        </div>
    );

    if (!expert) return (
        <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center text-center p-8">
            <div className="bg-[#FAF7F2]/40 backdrop-blur-3xl border border-[#C9A84C]/10 p-12 max-w-sm rounded-[2px] shadow-2xl">
                <div className="text-4xl mb-8 grayscale opacity-20">😕</div>
                <p className="text-[#0A1018] font-serif italic text-xl mb-10">{error || 'Không tìm thấy chuyên gia'}</p>
                <Link href="/dashboard/experts">
                    <button className="w-full bg-[#0A1018] text-[#F5F0E8] py-4 rounded-[2px] font-sans text-[11px] uppercase tracking-[0.2em] transition-all hover:bg-[#C9A84C] hover:text-[#0A1018]">
                        Quay lại
                    </button>
                </Link>
            </div>
        </div>
    );

    /* ─── Success ─── */
    if (success) return (
        <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[2px] shadow-[0_64px_128px_-16px_rgba(10,16,24,0.1)] border border-[#C9A84C]/10 p-16 text-center max-w-md w-full relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-[#C9A84C]" />
                <div className="w-20 h-20 rounded-full border border-[#C9A84C]/20 flex items-center justify-center mx-auto mb-10 shadow-sm">
                    <CheckCircle2 className="w-8 h-8 text-[#C9A84C]" strokeWidth={1} />
                </div>
                <h2 className="text-3xl font-serif italic text-[#0A1018] mb-4">Đã tiếp nhận yêu cầu</h2>
                <div className="bg-[#FAF7F2]/60 p-8 rounded-[1px] mb-10 border border-[#C9A84C]/5">
                    <p className="text-[#0A1018]/60 text-sm font-sans italic leading-relaxed">
                        Bạn đã đặt lịch tư vấn cùng <span className="font-bold text-[#0A1018]">{expert.user?.full_name}</span> thành công vào lúc:
                    </p>
                    <div className="mt-6 flex flex-col items-center gap-2">
                        <span className="text-[#C9A84C] font-serif italic text-2xl">{selectedTime}</span>
                        <span className="text-[#0A1018]/20 font-sans font-bold uppercase text-[9px] tracking-[0.4em]">{selectedDate}</span>
                    </div>
                </div>
                <p className="text-[10px] text-[#0A1018]/20 font-sans uppercase tracking-[0.4em] animate-pulse">Đang chuyển hướng…</p>
            </motion.div>
        </div>
    );

    const calendar = buildCalendar(expert.availabilities);
    const avatarSrc = expert.user?.avatar_url
        || `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.user?.full_name || 'Expert')}&background=0F172A&color=fff&size=128`;

    const today = new Date();
    const minDate = today.toISOString().split('T')[0];

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
                        href="/"
                        className="flex items-center gap-2 text-[10px] font-normal text-white/50 hover:text-[#C9A84C] transition-all uppercase tracking-[0.2em] font-sans"
                    >
                        <Home size={12} strokeWidth={1.5} />
                        Trang chủ
                    </Link>
                    <ChevronRight size={10} className="text-white/20" />
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 text-[10px] font-normal text-white/50 hover:text-[#C9A84C] transition-all uppercase tracking-[0.2em] font-sans"
                    >
                        Bàn làm việc
                    </Link>
                    <ChevronRight size={10} className="text-white/20" />
                    <Link
                        href="/dashboard/experts"
                        className="flex items-center gap-2 text-[10px] font-normal text-white/50 hover:text-[#C9A84C] transition-all uppercase tracking-[0.2em] font-sans"
                    >
                        Cố vấn
                    </Link>
                    <ChevronRight size={10} className="text-white/20" />
                    <Link
                        href={`/dashboard/experts/${expert.id}`}
                        className="text-[10px] font-normal text-white/50 hover:text-[#C9A84C] transition-all uppercase tracking-[0.2em] font-sans truncate max-w-[150px]"
                    >
                        {expert.user?.full_name}
                    </Link>
                    <ChevronRight size={10} className="text-white/20" />
                    <span className="text-[10px] font-normal text-[#C9A84C] uppercase tracking-[0.2em] font-sans">Đặt lịch tư vấn</span>
                </nav>
            </div>

            <main className="max-w-[1400px] mx-auto px-8 py-32">
                <div className="grid lg:grid-cols-12 gap-16 items-start">

                    {/* ── Forms (Left) ── */}
                    <div className="lg:col-span-8 space-y-16">
                        <header className="space-y-6">
                            <motion.h1
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 1.2, ease: EASING }}
                                className="text-[clamp(40px,5vw,68px)] font-serif italic text-[#0A1018] tracking-tight leading-[1.20] font-light"
                            >
                                Đặt lịch tư vấn
                            </motion.h1>
                            <p className="text-[#0A1018]/80 font-normal text-[17px] font-sans max-w-xl leading-[1.85] tracking-[0.02em]">
                                Chọn thời điểm phù hợp nhất cho buổi kết nối tinh hoa của bạn.
                            </p>
                        </header>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-start gap-5 bg-red-50/50 border border-red-100/20 text-red-900 rounded-[2px] p-8"
                            >
                                <AlertCircle className="w-6 h-6 flex-shrink-0 text-red-600" strokeWidth={1.5} />
                                <div className="font-sans text-[11px] uppercase tracking-[0.1em] leading-relaxed font-bold">{error}</div>
                            </motion.div>
                        )}

                        {/* Step 1: Date */}
                        <div className="bg-[#FAF7F2]/40 backdrop-blur-3xl border border-[#C9A84C]/10 rounded-[2px] p-12 space-y-12">
                            <div className="flex items-center gap-6">
                                <span className="w-10 h-10 rounded-full border border-[#C9A84C]/20 flex items-center justify-center text-[11px] font-sans font-normal text-[#C9A84C] uppercase tracking-[0.14em]">01</span>
                                <h3 className="text-[10px] font-normal text-[#0A1018]/80 uppercase tracking-[0.4em] font-sans">Chọn thời điểm</h3>
                            </div>

                            <div className="grid grid-cols-4 sm:grid-cols-7 gap-4">
                                {calendar.map(entry => (
                                    <button
                                        key={entry.dateStr}
                                        disabled={!entry.available}
                                        onClick={() => { setSelectedDate(entry.dateStr); setSelectedTime(''); }}
                                        className={`flex flex-col items-center py-6 px-3 rounded-[1px] transition-all duration-700 relative overflow-hidden group
                                            ${selectedDate === entry.dateStr
                                                ? 'bg-[#0A1018] text-[#F5F0E8] shadow-xl'
                                                : entry.available
                                                    ? 'bg-white border border-[#C9A84C]/5 text-[#0A1018] hover:border-[#C9A84C]/40'
                                                    : 'opacity-10 grayscale pointer-events-none'
                                            }`}
                                    >
                                        <span className={`text-[10px] font-normal uppercase tracking-[0.14em] mb-3 ${selectedDate === entry.dateStr ? 'text-[#C9A84C]' : 'text-[#0A1018]/40'}`}>{entry.label}</span>
                                        <span className="text-xl font-serif italic tabular-nums">{entry.day}</span>
                                        {entry.available && selectedDate !== entry.dateStr && (
                                            <span className="absolute bottom-2 w-1 h-1 rounded-full bg-[#C9A84C]/20 group-hover:bg-[#C9A84C]" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="pt-10 border-t border-[#C9A84C]/5 flex items-center gap-6">
                                <span className="text-[10px] font-normal text-[#0A1018]/40 uppercase tracking-[0.4em] font-sans">Hoặc chọn thủ công</span>
                                <input
                                    type="date"
                                    min={minDate}
                                    className="flex-1 bg-transparent border-b border-[#0A1018]/10 text-sm font-serif italic text-[#0A1018] py-2 focus:outline-none focus:border-[#C9A84C] transition-all cursor-pointer"
                                    value={selectedDate}
                                    onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(''); }}
                                />
                            </div>

                            {selectedDate && availableSlots.length === 0 && (
                                <p className="text-[11px] text-[#C97B3A] italic font-serif">Chuyên gia hiện không có lịch trống vào ngày này.</p>
                            )}
                        </div>

                        {/* Step 2: Time */}
                        <AnimatePresence>
                            {selectedDate && availableSlots.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    className="bg-[#FAF7F2]/40 backdrop-blur-3xl border border-[#C9A84C]/10 rounded-[2px] p-12 space-y-12"
                                >
                                    <div className="flex items-center gap-6">
                                        <span className="w-10 h-10 rounded-full border border-[#C9A84C]/20 flex items-center justify-center text-[11px] font-sans font-normal text-[#C9A84C] uppercase tracking-[0.14em]">02</span>
                                        <h3 className="text-[10px] font-normal text-[#0A1018]/80 uppercase tracking-[0.4em] font-sans">Chọn khung giờ</h3>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {availableSlots.map(slot => (
                                            <button
                                                key={slot.start}
                                                onClick={() => setSelectedTime(slot.start)}
                                                className={`py-5 px-4 text-[14px] font-sans tracking-[0.02em] font-light rounded-[2px] border transition-all duration-700 text-center tabular-nums shadow-sm
                                                ${selectedTime === slot.start
                                                        ? 'bg-[#0A1018] text-[#F5F0E8] border-[#0A1018] shadow-lg'
                                                        : 'bg-white border-[#C9A84C]/5 text-[#0A1018]/80 hover:border-[#C9A84C]/40 hover:text-[#0A1018]'
                                                    }`}
                                            >
                                                {slot.start}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Step 3: Note */}
                        <div className={`bg-[#FAF7F2]/40 backdrop-blur-3xl border border-[#C9A84C]/10 rounded-[2px] p-12 space-y-12 transition-all duration-700 ${!selectedTime ? 'opacity-20 pointer-events-none' : ''}`}>
                            <div className="flex items-center gap-6">
                                <span className="w-10 h-10 rounded-full border border-[#C9A84C]/20 flex items-center justify-center text-[11px] font-sans font-normal text-[#C9A84C] uppercase tracking-[0.14em]">03</span>
                                <h3 className="text-[10px] font-normal text-[#0A1018]/80 uppercase tracking-[0.4em] font-sans">Thông tin bổ sung</h3>
                            </div>
                            <textarea
                                rows={4}
                                placeholder="Hãy mô tả ngắn gọn vấn đề bạn muốn thảo luận cùng chuyên gia…"
                                className="w-full bg-transparent border-b border-[#0A1018]/20 text-[15px] font-sans font-light text-[#0A1018] py-4 placeholder:text-[#0A1018]/20 focus:outline-none focus:border-[#A85C1E] transition-all resize-none tracking-[0.02em]"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* ── Sidebar (Right) ── */}
                    <div className="lg:col-span-4 lg:sticky lg:top-36 h-fit">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-[#0A1018] p-12 rounded-[2px] shadow-2xl relative overflow-hidden border border-white/10"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9A84C]/5 blur-[60px] rounded-full" />

                            {/* Mini Profile */}
                            <div className="flex items-center gap-6 mb-16 relative z-10">
                                <img src={avatarSrc} alt={expert.user?.full_name}
                                    className="w-14 h-14 rounded-[2px] object-cover border border-white/10 shadow-xl" />
                                <div className="space-y-1">
                                    <p className="text-[#A85C1E] text-[10px] font-normal uppercase tracking-[0.2em] font-sans">Cố vấn đồng hành</p>
                                    <h3 className="text-white font-serif italic text-xl leading-tight font-light">{expert.user?.full_name}</h3>
                                </div>
                            </div>

                            <div className="space-y-10">
                                <div className="p-8 border border-white/10 bg-white/[0.04] rounded-[2px] space-y-6">
                                    <h4 className="text-[10px] font-normal text-white/70 uppercase tracking-[0.4em] font-sans">Phiên tư vấn</h4>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-[11px] font-sans uppercase tracking-[0.1em] text-white/60">
                                            <span>Thời lượng</span>
                                            <span className="text-white/80">60 Phút</span>
                                        </div>
                                        {selectedDate && (
                                            <div className="flex justify-between items-center text-[11px] font-sans uppercase tracking-[0.1em] text-white/60">
                                                <span>Ngày hẹn</span>
                                                <span className="text-[#C9A84C] italic font-serif text-[13px] lowercase">{selectedDate}</span>
                                            </div>
                                        )}
                                        {selectedTime && (
                                            <div className="flex justify-between items-center text-[10px] font-sans uppercase tracking-[0.14em] text-white/70">
                                                <span>Khung giờ</span>
                                                <span className="text-[#A85C1E] italic font-serif text-[13px] lowercase">{selectedTime}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-6 border-t border-white/10 flex justify-between items-baseline">
                                        <span className="text-[10px] font-normal text-white/80 uppercase tracking-[0.2em] font-sans">Đầu tư</span>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-serif italic text-[#C9A84C] font-light">{expert.hourly_rate}</span>
                                            <span className="text-white/70 text-[10px] font-sans uppercase tracking-widest">Xu</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleBooking}
                                    disabled={!selectedDate || !selectedTime || isSubmitting}
                                    className="w-full py-7 bg-[#C9A84C] text-[#0A1018] font-sans text-[11px] font-normal uppercase tracking-[0.14em] rounded-[2px] transition-all duration-700 hover:bg-white hover:shadow-xl active:scale-[0.98] disabled:opacity-20 flex items-center justify-center gap-4"
                                >
                                    {isSubmitting ? (
                                        <div className="w-5 h-5 border border-[#0A1018]/20 border-t-[#0A1018] rounded-full animate-spin" />
                                    ) : (
                                        <>Xác nhận đặt lịch <ChevronRight size={14} strokeWidth={1} /></>
                                    )}
                                </button>

                                <div className="mt-14 space-y-7 pt-12 border-t border-white/10 opacity-40">
                                    {[
                                        { text: 'Giao dịch Mã hóa', icon: ShieldCheck },
                                        { text: 'Hỗ trợ Toàn cầu', icon: MessageSquare },
                                        { text: 'Cam kết Tinh hoa', icon: Award }
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-5 text-[10px] font-normal text-white uppercase tracking-[0.15em] font-sans">
                                            <item.icon size={13} className="text-[#C9A84C]" strokeWidth={1} />
                                            {item.text}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </main>
        </motion.div>
    );
}
