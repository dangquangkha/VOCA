'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar as CalendarIcon, Clock, ChevronRight, CheckCircle2, AlertCircle, Home, ShieldCheck, Award, MessageSquare, Zap, Heart } from 'lucide-react';
import api from '@/lib/api';
import { Expert } from '@/types/expert';
import { useAuthStore } from '@/store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/store/useToastStore';
import { getAvatarUrl } from '@/utils/url-utils';

interface TimeSlot { start: string; end: string; }

const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MONTH_NAMES = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

const EASING: [number, number, number, number] = [0.22, 1, 0.36, 1];

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
            const isMentor = expert?.user?.role === 'MENTOR';
            toast.success(isMentor ? "Đặt lịch thành công! Hãy ủng hộ Cố vấn sau buổi học." : "Booking confirmed successfully!");
            setTimeout(() => router.push('/dashboard/manage/bookings'), 2500);
        } catch (err: any) {
            const msg = err.response?.data?.detail || 'Đặt lịch thất bại. Vui lòng thử lại.';
            setError(msg);
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isMentor = expert?.user?.role === 'MENTOR';

    if (isLoading) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="flex flex-col items-center gap-8">
                <div className="w-12 h-12 border-2 border-[#00A4FD]/10 border-t-[#00A4FD] rounded-full animate-spin" />
                <p className="text-[#00A4FD] font-black uppercase tracking-[0.4em] text-[10px]">ACCESSING SCHEDULE REGISTRY...</p>
            </div>
        </div>
    );

    if (!expert) return (
        <div className="min-h-screen bg-white flex items-center justify-center p-8">
            <div className="bg-[#00A4FD] border-[6px] border-[#00A4FD] p-12 max-w-sm rounded-none text-center shadow-2xl text-white">
                <div className="text-4xl mb-6 font-garamond italic font-bold opacity-30 tracking-widest">404_VOID</div>
                <p className="text-2xl font-garamond italic font-bold mb-8">{error || 'Chuyên gia không tồn tại'}</p>
                <Link href="/dashboard/experts">
                    <button className="w-full bg-white text-[#00A4FD] py-4 rounded-none font-black text-[11px] uppercase tracking-widest hover:bg-[#FFE900] hover:text-[#0046EA] transition-all duration-500">
                        RETURN TO MARKETPLACE
                    </button>
                </Link>
            </div>
        </div>
    );

    if (success) return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#00A4FD] rounded-none shadow-[0_0_100px_rgba(0,164,253,0.3)] border-[6px] border-[#00A4FD] p-16 text-center max-w-md w-full relative overflow-hidden text-white"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-[#FFE900]" />
                <div className="w-20 h-20 rounded-none bg-white/20 flex items-center justify-center mx-auto mb-10 border border-white/30">
                    <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={1.5} />
                </div>
                <h2 className="text-4xl font-garamond italic font-bold mb-4 uppercase tracking-tight">Booking Secured</h2>
                <div className="bg-white/10 p-8 rounded-none mb-10 border border-white/20">
                    <p className="text-white/60 text-sm italic mb-6 leading-relaxed font-dm-sans">
                        Buổi tư vấn chiến lược cùng <span className="text-[#FFE900] font-black not-italic">{expert.user?.full_name}</span> đã được ghi nhận:
                    </p>
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-4xl font-garamond italic font-bold text-[#FFE900]">{selectedTime}</span>
                        <span className="text-white/40 font-black uppercase text-[10px] tracking-widest">{selectedDate}</span>
                    </div>
                </div>
                <p className="text-[10px] text-[#FFE900] font-black uppercase tracking-[0.4em] animate-pulse">Initializing strategic alignment...</p>
            </motion.div>
        </div>
    );

    const calendar = buildCalendar(expert.availabilities);
    const avatarSrc = getAvatarUrl(expert.user?.avatar_url, expert.user?.full_name);
    const minDate = new Date().toISOString().split('T')[0];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-white pb-44 selection:bg-[#00A4FD]/10"
        >
            {/* Header / Breadcrumb */}
            <div className="bg-white border-b border-black/5 sticky top-0 z-50">
                <nav className="max-w-[1400px] mx-auto px-8 py-6 flex items-center gap-4">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-[10px] font-black text-black/40 hover:text-[#00A4FD] transition-all uppercase tracking-[0.2em]"
                    >
                        <Home size={12} strokeWidth={2} />
                        Trang chủ
                    </Link>
                    <ChevronRight size={10} className="text-black/20" />
                    <Link
                        href="/dashboard"
                        className="text-[10px] font-black text-black/40 hover:text-[#00A4FD] transition-all uppercase tracking-[0.2em]"
                    >
                        Bàn làm việc
                    </Link>
                    <ChevronRight size={10} className="text-black/20" />
                    <Link
                        href="/dashboard/experts"
                        className="text-[10px] font-black text-black/40 hover:text-[#00A4FD] transition-all uppercase tracking-[0.2em]"
                    >
                        Sàn Chuyên gia
                    </Link>
                    <ChevronRight size={10} className="text-black/20" />
                    <span className="text-[10px] font-black text-[#00A4FD] uppercase tracking-[0.2em]">Đặt lịch tư vấn</span>
                </nav>
            </div>

            <main className="max-w-[1400px] mx-auto px-6 py-20">
                <div className="grid lg:grid-cols-12 gap-12 items-start">

                    {/* Booking Form (Left) */}
                    <div className="lg:col-span-8 space-y-12">
                        <header className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-[2px] bg-[#00A4FD]" />
                                <span className="text-[10px] text-[#00A4FD] tracking-[0.5em] font-black uppercase">Booking Protocol</span>
                            </div>
                            <motion.h1
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, ease: EASING }}
                                className="text-[clamp(40px,5vw,72px)] font-garamond italic font-bold text-[#171716] tracking-tight leading-none"
                            >
                                Tư vấn Chiến lược
                            </motion.h1>
                            <p className="text-black/40 text-lg max-w-xl font-dm-sans font-light leading-relaxed">
                                Khởi tạo buổi tư vấn chuyên sâu cùng các cố vấn hàng đầu trong lĩnh vực của bạn.
                            </p>
                        </header>

                        {error && (
                            <motion.div className="flex items-center gap-4 bg-red-50 border-[6px] border-red-500 text-red-600 p-8 rounded-none font-black text-[10px] uppercase tracking-wider">
                                <AlertCircle className="w-5 h-5" />
                                {error}
                            </motion.div>
                        )}

                        {/* Date Selection */}
                        <section className="bg-white border-[6px] border-black/5 p-12 space-y-12 transition-all duration-700 shadow-sm hover:shadow-2xl">
                            <div className="flex items-center gap-6">
                                <div className="w-10 h-10 rounded-none bg-[#00A4FD] flex items-center justify-center text-white font-black text-xs">01</div>
                                <h3 className="text-[10px] font-black text-black/30 uppercase tracking-[0.4em]">SELECT TIMELINE</h3>
                            </div>

                            <div className="grid grid-cols-4 sm:grid-cols-7 gap-4">
                                {calendar.map(entry => (
                                    <button
                                        key={entry.dateStr}
                                        disabled={!entry.available}
                                        onClick={() => { setSelectedDate(entry.dateStr); setSelectedTime(''); }}
                                        className={`group flex flex-col items-center py-6 border-[3px] transition-all duration-300 cursor-pointer
                                            ${selectedDate === entry.dateStr
                                                ? 'bg-[#FFE900] border-[#FFE900] text-[#0046EA] shadow-xl scale-[1.03]'
                                                : entry.available
                                                    ? 'bg-[#00A4FD] border-[#00A4FD] text-white hover:bg-[#0086D4] hover:border-[#0086D4]'
                                                    : 'bg-[#F9FAFB] border-black/5 text-black/20 cursor-not-allowed pointer-events-none'
                                            }`}
                                    >
                                        <span className={`text-[10px] font-black uppercase tracking-wider mb-1 transition-all duration-300
                                            ${selectedDate === entry.dateStr 
                                                ? 'text-[#0046EA]/80' 
                                                : entry.available
                                                    ? 'text-white/80'
                                                    : 'text-black/30'
                                            }`}>
                                            {entry.label}
                                        </span>
                                        <span className={`text-2xl font-garamond italic font-bold transition-all duration-300
                                            ${selectedDate === entry.dateStr
                                                ? 'text-[#0046EA]'
                                                : entry.available
                                                    ? 'text-white'
                                                    : 'text-black/35'
                                            }`}>
                                            {entry.day}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            <div className="pt-8 border-t border-black/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <span className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em]">Manual Date Override</span>
                                <input
                                    type="date"
                                    min={minDate}
                                    className="bg-[#F5F8FF] border-[3px] border-black/5 px-6 py-3 text-sm font-black tracking-widest text-[#171716] uppercase focus:outline-none focus:border-[#00A4FD] transition-all"
                                    value={selectedDate}
                                    onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(''); }}
                                />
                            </div>
                        </section>

                        {/* Time Selection */}
                        <AnimatePresence>
                            {selectedDate && availableSlots.length > 0 && (
                                <motion.section
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-[#00A4FD] border-[6px] border-[#00A4FD] rounded-none p-12 space-y-12 shadow-2xl text-white"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="w-10 h-10 rounded-none bg-white flex items-center justify-center text-[#00A4FD] font-black text-xs">02</div>
                                        <h3 className="text-[10px] font-black text-white/60 uppercase tracking-[0.4em]">Chọn Khung giờ</h3>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {availableSlots.map(slot => (
                                            <button
                                                key={slot.start}
                                                onClick={() => setSelectedTime(slot.start)}
                                                className={`py-5 px-4 text-sm font-black tracking-widest rounded-none border-[3px] transition-all duration-500
                                                ${selectedTime === slot.start
                                                        ? 'bg-white border-white text-[#00A4FD] shadow-xl'
                                                        : 'bg-white/10 border-white/20 text-white/60 hover:border-white hover:text-white'
                                                    }`}
                                            >
                                                {slot.start}
                                            </button>
                                        ))}
                                    </div>
                                </motion.section>
                            )}
                        </AnimatePresence>

                        {/* Context / Notes */}
                        <section className={`bg-white border-[6px] border-black/5 rounded-none p-12 space-y-12 transition-all duration-700 shadow-sm ${!selectedTime ? 'opacity-30 grayscale pointer-events-none' : 'hover:shadow-2xl'}`}>
                            <div className="flex items-center gap-6">
                                <div className="w-10 h-10 rounded-none bg-[#00A4FD] flex items-center justify-center text-white font-black text-xs">03</div>
                                <h3 className="text-[10px] font-black text-black/30 uppercase tracking-[0.4em]">Nội dung cần Cố vấn</h3>
                            </div>
                            <textarea
                                rows={4}
                                placeholder="Hãy mô tả ngắn gọn vấn đề bạn cần chuyên gia giải đáp để buổi tư vấn hiệu quả hơn..."
                                className="w-full bg-[#F5F8FF] border-[3px] border-black/5 rounded-none p-6 text-base text-[#171716] font-dm-sans placeholder:text-black/20 focus:outline-none focus:border-[#00A4FD] transition-all resize-none leading-relaxed"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                        </section>
                    </div>

                    {/* Order Summary (Right) */}
                    <div className="lg:col-span-4 lg:sticky lg:top-32 h-fit">
                        <motion.aside
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-[#0046EA] border-[6px] border-[#0046EA] p-10 rounded-none shadow-2xl relative overflow-hidden text-white"
                        >
                            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-[80px] rounded-full -mr-24 -mt-24" />

                            <div className="flex items-center gap-6 mb-12 relative z-10">
                                <div className="w-20 h-20 rounded-none border-[3px] border-white/20 overflow-hidden ring-[6px] ring-white/10 group-hover:ring-[#FFE900] transition-all">
                                    <img src={avatarSrc} alt={expert.user?.full_name} className="w-full h-full object-cover" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-[#FFE900] uppercase tracking-widest">Active Advisor</p>
                                    <h3 className="text-white font-garamond italic font-bold text-2xl leading-tight">{expert.user?.full_name}</h3>
                                </div>
                            </div>

                            <div className="space-y-8 relative z-10">
                                {/* MENTOR PWYW notice */}
                                {isMentor && (
                                    <div className="flex items-start gap-4 p-6 rounded-none bg-white/10 border border-white/20">
                                        <Heart className="w-5 h-5 text-[#FFE900] shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[10px] font-black text-[#FFE900] uppercase tracking-widest mb-1">Chế độ Tùy hỷ</p>
                                            <p className="text-white/60 text-[10px] leading-relaxed font-dm-sans">Không cần credit. Hãy ủng hộ Cố vấn sau buổi học tùy tâm.</p>
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-4 border-b border-white/10">
                                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Dịch vụ</span>
                                        <span className="text-xs text-white font-black uppercase tracking-wider">
                                            {isMentor ? 'Cố vấn Cộng đồng' : 'Tư vấn Chiến lược'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-4 border-b border-white/10">
                                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Thời lượng</span>
                                        <span className="text-xs text-white font-black uppercase tracking-wider">60 Phút</span>
                                    </div>
                                    {selectedDate && (
                                        <div className="flex justify-between items-center py-4 border-b border-white/10">
                                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Triển khai</span>
                                            <span className="text-xs text-[#FFE900] font-black uppercase tracking-widest">{selectedDate}</span>
                                        </div>
                                    )}
                                    {selectedTime && (
                                        <div className="flex justify-between items-center py-4 border-b border-white/10">
                                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Thời gian</span>
                                            <span className="text-xs text-[#FFE900] font-black uppercase tracking-widest">{selectedTime}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-8 flex justify-between items-end">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                                            {isMentor ? 'Chi phí' : 'Khoản đầu tư'}
                                        </p>
                                        {!isMentor && <p className="text-[10px] text-white/40 italic font-dm-sans">Ký quỹ an toàn</p>}
                                    </div>
                                    {isMentor ? (
                                        <div className="flex items-center gap-2">
                                            <Heart className="w-6 h-6 text-[#FFE900]" />
                                            <span className="text-3xl font-garamond italic font-bold text-[#FFE900]">Tùy hỷ</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-5xl font-garamond italic font-bold text-[#FFE900]">{expert.hourly_rate}</span>
                                            <span className="text-[9px] text-white/40 font-black uppercase tracking-widest">Credits</span>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={handleBooking}
                                    disabled={!selectedDate || !selectedTime || isSubmitting}
                                    className="w-full h-16 bg-[#FFE900] text-[#0046EA] hover:bg-white transition-all duration-700 text-[11px] font-black uppercase tracking-[0.4em] rounded-none shadow-2xl disabled:opacity-20 flex items-center justify-center gap-4"
                                >
                                    {isSubmitting ? (
                                        <div className="w-5 h-5 border-2 border-[#0046EA]/30 border-t-[#0046EA] rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            Xác nhận Đặt lịch <ChevronRight size={16} />
                                        </>
                                    )}
                                </button>

                                <div className="mt-8 space-y-4 pt-8 border-t border-white/10">
                                    {(isMentor ? [
                                        { text: 'KHÔNG CẦN CREDIT', icon: Heart, color: 'text-[#FFE900]' },
                                        { text: 'KÊNH TRÒ CHUYỆN BẢO MẬT', icon: MessageSquare, color: 'text-white' },
                                        { text: 'CỐ VẤN ĐÃ XÁC MINH', icon: Award, color: 'text-[#FFE900]' }
                                    ] : [
                                        { text: 'BẢO VỆ KÝ QUỸ TỨC THÌ', icon: ShieldCheck, color: 'text-[#FFE900]' },
                                        { text: 'KÊNH TRÒ CHUYỆN BẢO MẬT', icon: MessageSquare, color: 'text-white' },
                                        { text: 'CHUYÊN GIA KIỆT XUẤT', icon: Award, color: 'text-[#FFE900]' }
                                    ]).map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-4 text-[9px] font-black text-white/40 uppercase tracking-widest">
                                            <item.icon size={12} className={item.color as any} />
                                            {item.text}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.aside>
                    </div>
                </div>
            </main>
        </motion.div>
    );
}

