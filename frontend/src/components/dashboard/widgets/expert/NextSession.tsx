'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Video, FileText, CheckCircle2, Loader2, XCircle, AlertTriangle } from 'lucide-react';
import { bookingService } from '@/services/bookingService';
import { Booking, BookingStatus } from '@/types/booking';
import axios from 'axios';

export default function NextSession() {
    const [nextSession, setNextSession] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        const fetchNextSession = async () => {
            try {
                const bookings = await bookingService.getBookings();
                const now = new Date();
                // Find closest upcoming session
                const upcoming = bookings
                    .filter(b =>
                        (b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.IN_PROGRESS) &&
                        new Date(b.end_time) > now
                    )
                    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0];

                if (upcoming) {
                    setNextSession(upcoming);
                    const diff = Math.floor((new Date(upcoming.start_time).getTime() - now.getTime()) / 1000);
                    setTimeLeft(diff > 0 ? diff : 0);
                }
            } catch (error) {
                console.error("Failed to fetch next session", error);
            } finally {
                setLoading(false);
            }
        };
        fetchNextSession();
    }, []);

    useEffect(() => {
        if (!nextSession) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [nextSession]);

    const handleCheckin = async () => {
        if (!nextSession) return;
        try {
            const updated = await bookingService.checkin(nextSession.id);
            setNextSession(updated);
            alert("Check-in thành công!");
        } catch (error) {
            if (axios.isAxiosError(error)) {
                alert(error.response?.data?.detail || "Check-in thất bại");
            } else {
                alert("Đã có lỗi xảy ra");
            }
        }
    };

    const formatTime = (seconds: number) => {
        if (seconds <= 0) return "00:00";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return h > 0
            ? `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
            : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="bg-[var(--color-navy-mid)] rounded-sm p-8 border border-[var(--color-ivory-10)] h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[var(--color-ivory-10)] animate-spin" />
            </div>
        );
    }

    if (!nextSession) {
        return (
            <div className="bg-[var(--color-navy-mid)] rounded-sm p-8 border border-[var(--color-ivory-10)] h-full flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-sm bg-[var(--color-navy)] flex items-center justify-center text-[var(--color-ivory-10)] border border-[var(--color-ivory-10)] mb-6">
                    <Calendar size={32} />
                </div>
                <h3 className="font-serif italic text-lg text-[var(--color-ivory-70)]">Không có lịch hẹn</h3>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-ivory-20)] mt-4 max-w-[200px]">Bạn hiện không có lịch hẹn nào sắp tới.</p>
            </div>
        );
    }

    const isReady = timeLeft <= 300; // 5 mins before

    return (
        <div className="bg-[var(--color-navy-mid)] rounded-sm p-8 border border-[var(--color-ivory-10)] h-full flex flex-col hover:border-[var(--color-gold-line)] transition-all group shadow-2xl font-sans">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-[11px] font-medium text-[var(--color-ivory-45)] uppercase tracking-[0.3em]">Lịch hẹn tiếp theo</h3>
                <span className="flex items-center gap-2 text-[9px] font-medium text-[var(--color-gold)] border border-[var(--color-gold-dim)] px-2.5 py-1 rounded-full uppercase tracking-widest bg-transparent animate-pulse">
                    <span className="w-1 h-1 rounded-full bg-[var(--color-gold)] shadow-[0_0_8px_var(--color-gold)]"></span>
                    Sắp diễn ra
                </span>
            </div>

            <div className="space-y-8 flex-1">
                {/* Student Info */}
                <div className="flex items-center gap-5 p-5 rounded-sm bg-[var(--color-navy)] border border-[var(--color-ivory-10)] transition-all group-hover:border-[var(--color-gold-line)]">
                    <div className="w-12 h-12 rounded-sm bg-gradient-to-br from-[var(--color-gold)] to-[var(--color-gold-deep)] flex items-center justify-center text-[var(--color-navy)] font-serif italic text-lg shadow-lg">
                        {nextSession.student?.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                        <p className="font-serif italic text-[var(--color-ivory)] text-lg leading-tight">{nextSession.student?.full_name}</p>
                        <p className="text-[10px] text-[var(--color-ivory-20)] font-light mt-1 tracking-wide">{nextSession.student?.email}</p>
                    </div>
                    <button className="p-2.5 rounded-sm bg-transparent border border-[var(--color-ivory-10)] text-[var(--color-ivory-45)] hover:text-[var(--color-gold)] hover:border-[var(--color-gold-line)] transition-all group-hover:scale-105">
                        <FileText size={18} />
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold)] mt-1.5 opacity-60"></div>
                        <p className="text-sm font-light text-[var(--color-ivory-70)] leading-relaxed">{nextSession.student_note || "Tư vấn hướng nghiệp"}</p>
                    </div>

                    {/* Countdown */}
                    <div className="bg-[var(--color-obsidian)] rounded-sm p-6 text-center border border-[var(--color-ivory-10)] shadow-inner">
                        <p className="text-[9px] font-medium text-[var(--color-ivory-20)] uppercase tracking-[0.4em] mb-3">Thời gian đếm ngược</p>
                        <div className="text-3xl font-mono font-medium text-[var(--color-gold)] tracking-[0.3em]">
                            {formatTime(timeLeft)}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-4">
                <a
                    href={nextSession.meeting_url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`
                        flex items-center justify-center gap-2 py-3.5 rounded-sm font-medium text-[10px] uppercase tracking-[0.3em] transition-all
                        ${isReady && nextSession.meeting_url
                            ? 'bg-[var(--color-gold-faint)] text-[var(--color-gold)] border border-[var(--color-gold-line)] hover:bg-[var(--color-gold-dim)] hover:text-[var(--color-ivory)] shadow-lg shadow-[rgba(201,168,76,0.1)]'
                            : 'bg-transparent border border-[var(--color-ivory-10)] text-[var(--color-ivory-20)] cursor-not-allowed'}
                    `}
                    onClick={(e) => (!isReady || !nextSession.meeting_url) && e.preventDefault()}
                >
                    <Video size={16} className="opacity-70" />
                    Tham gia Meet
                </a>
                <button
                    onClick={handleCheckin}
                    disabled={!isReady || (nextSession.expert_checked_in_at !== null && nextSession.expert_checked_in_at !== undefined)}
                    className={`
                        flex items-center justify-center gap-2 py-3.5 rounded-sm font-medium text-[10px] uppercase tracking-[0.3em] border transition-all
                        ${isReady && !nextSession.expert_checked_in_at
                            ? 'border-[var(--color-gold-line)] text-[var(--color-ivory-70)] hover:bg-[var(--color-gold-faint)] hover:text-[var(--color-gold)]'
                            : 'border-[var(--color-ivory-10)] text-[var(--color-ivory-20)] cursor-not-allowed'}
                    `}
                >
                    <CheckCircle2 size={16} className="opacity-70" />
                    {nextSession.expert_checked_in_at ? 'Đã Check-in' : 'Check-in'}
                </button>
            </div>

            {/* UC-Expert Cancellation */}
            <div className="mt-4 pt-4 border-t border-[var(--color-ivory-10)]">
                <button 
                    onClick={async () => {
                        const isLate = (new Date(nextSession.start_time).getTime() - new Date().getTime()) < 12 * 3600 * 1000;
                        const message = isLate 
                            ? "CẢNH BÁO: Bạn đang hủy lịch trong vòng 12h trước buổi hẹn. Bạn sẽ bị trừ 0.1 điểm đánh giá và ghi nhận 1 lần hủy muộn. Bạn có chắc chắn muốn hủy?"
                            : "Bạn có chắc chắn muốn hủy buổi hẹn này? Số tiền sẽ được hoàn trả cho học viên.";
                        
                        if (window.confirm(message)) {
                            try {
                                await bookingService.updateBooking(nextSession.id, { status: BookingStatus.CANCELLED_BY_EXPERT });
                                alert("Hủy lịch thành công.");
                                window.location.reload();
                            } catch (err) {
                                alert("Hủy lịch thất bại.");
                            }
                        }
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 text-[9px] uppercase tracking-widest text-[var(--color-ivory-45)] hover:text-[var(--color-neon-orange)] transition-colors"
                >
                    <XCircle size={14} />
                    Hủy buổi hẹn
                </button>
            </div>
        </div>
    );
}
