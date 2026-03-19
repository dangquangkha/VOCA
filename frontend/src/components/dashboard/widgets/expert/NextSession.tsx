'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Video, FileText, CheckCircle2, Loader2 } from 'lucide-react';
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
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-100 animate-spin" />
            </div>
        );
    }

    if (!nextSession) {
        return (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm h-full flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 mb-4">
                    <Calendar size={32} />
                </div>
                <h3 className="font-bold text-slate-800">Không có lịch hẹn</h3>
                <p className="text-xs text-slate-400 mt-2 max-w-[200px]">Bạn hiện không có lịch hẹn nào sắp tới.</p>
            </div>
        );
    }

    const isReady = timeLeft <= 300; // 5 mins before

    return (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm h-full flex flex-col hover:border-blue-200 transition-all group">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-800">Lịch hẹn tiếp theo</h3>
                <span className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg uppercase tracking-wider animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                    Sắp diễn ra
                </span>
            </div>

            <div className="space-y-6 flex-1">
                {/* Student Info */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-50 group-hover:bg-blue-50/30 group-hover:border-blue-50 transition-all">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold overflow-hidden">
                        {nextSession.student?.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-slate-900 text-sm leading-tight">{nextSession.student?.full_name}</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">{nextSession.student?.email}</p>
                    </div>
                    <button className="p-2 rounded-lg bg-white border border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all hover:scale-105 shadow-sm">
                        <FileText size={18} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                        <p className="text-sm font-bold text-slate-700">{nextSession.student_note || "Tư vấn hướng nghiệp"}</p>
                    </div>

                    {/* Countdown */}
                    <div className="bg-slate-900 rounded-2xl p-4 text-center">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">Thời gian đếm ngược</p>
                        <div className="text-3xl font-mono font-black text-white tracking-widest">
                            {formatTime(timeLeft)}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3">
                <a
                    href={nextSession.meeting_url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`
                        flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-xs transition-all
                        ${isReady && nextSession.meeting_url
                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100 hover:scale-[1.02]'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-80'}
                    `}
                    onClick={(e) => (!isReady || !nextSession.meeting_url) && e.preventDefault()}
                >
                    <Video size={16} />
                    Tham gia Meet
                </a>
                <button
                    onClick={handleCheckin}
                    disabled={!isReady || nextSession.expert_checked_in_at !== null && nextSession.expert_checked_in_at !== undefined}
                    className={`
                        flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-xs border transition-all
                        ${isReady && !nextSession.expert_checked_in_at
                            ? 'border-emerald-500 text-emerald-600 bg-emerald-50/50 hover:bg-emerald-50 hover:scale-[1.02]'
                            : 'border-slate-200 text-slate-300 cursor-not-allowed'}
                    `}
                >
                    <CheckCircle2 size={16} />
                    {nextSession.expert_checked_in_at ? 'Đã Check-in' : 'Check-in'}
                </button>
            </div>
        </div>
    );
}
