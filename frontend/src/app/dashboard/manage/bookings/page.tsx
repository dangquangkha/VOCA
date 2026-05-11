'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar,
    Clock,
    User,
    ChevronRight,
    Video,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Star,
    MessageSquare,
    Zap,
    Download,
    RefreshCcw,
    ArrowRight,
    Home,
    Heart,
    Quote
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { Booking, BookingStatus } from '@/types/booking';
import { useAuthStore } from '@/store/useAuthStore';
import { ReviewModal } from '@/components/ReviewModal';
import { MentorSupportModal } from '@/components/MentorSupportModal';
import Link from 'next/link';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusBadge(status: BookingStatus) {
    const isSpecial = status === BookingStatus.REJECTED || status === BookingStatus.CANCELLED;
    const isPending = status === BookingStatus.PENDING;
    const isLive = status === BookingStatus.IN_PROGRESS;

    const baseClasses = "px-2 py-1 text-[10px] uppercase tracking-[0.2em] font-medium border rounded-sm w-fit inline-block transition-all duration-500";

    if (isPending) return {
        cls: `${baseClasses} border-[var(--color-gold-dim)] text-[#0046EA] bg-transparent shadow-[0_0_15px_rgba(201,168,76,0.05)]`,
        text: 'ĐANG CHỜ'
    };

    if (isSpecial) return {
        cls: `${baseClasses} border-[var(--color-ivory-45)] text-[#0F0C17]/50 bg-transparent`,
        text: status === BookingStatus.REJECTED ? 'ĐÃ TỪ CHỐI' : 'ĐÃ HỦY'
    };

    if (isLive) return {
        cls: `${baseClasses} border-[#0046EA] text-[#0046EA] bg-[var(--color-gold-faint)] animate-pulse`,
        text: 'ĐANG DIỄN RA'
    };

    return {
        cls: `${baseClasses} border-[#0F0C17]/10 text-[#0F0C17]/70`,
        text: status === BookingStatus.COMPLETED ? 'HOÀN THÀNH' : status
    };
}

/** BR-37.1: Check-in window = [T-5min, T+10min] */
function getCheckinWindow(startTime: string): { canCheckin: boolean; windowClosed: boolean; windowOpen: boolean; secondsToOpen: number } {
    const start = new Date(startTime).getTime();
    const now = Date.now();
    const windowOpen = start - 5 * 60 * 1000;
    const windowClose = start + 10 * 60 * 1000;
    return {
        canCheckin: now >= windowOpen && now <= windowClose,
        windowClosed: now > windowClose,
        windowOpen: now >= windowOpen,
        secondsToOpen: Math.max(0, Math.ceil((windowOpen - now) / 1000)),
    };
}

// ─── Components ───────────────────────────────────────────────────────────────

/** UC-13: Reject with reason modal */
function RejectModal({
    booking,
    onClose,
    onConfirm,
    loading,
}: {
    booking: Booking;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    loading: boolean;
}) {
    const [reason, setReason] = useState('');
    const presets = ['Bận đột xuất', 'Không đúng chuyên môn', 'Thời gian không phù hợp', 'Khác'];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/90 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white border border-[var(--color-gold-dim)] p-12 w-full max-w-xl mx-4 shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-sm"
            >
                <div className="space-y-6 mb-10">
                    <h3 className="text-3xl font-serif italic text-[#0F0C17]">Từ chối lịch hẹn</h3>
                    <p className="text-[#0F0C17]/50 font-light text-sm leading-relaxed">
                        Mã lịch hẹn: <span className="text-[#0046EA]/80 italic font-serif">#{booking.id}</span>.
                        Vui lòng chọn lý do để thông báo cho đối tác. Khoản tín dụng (Credits) sẽ được hoàn trả lập tức.
                    </p>
                </div>

                <div className="flex flex-wrap gap-3 mb-8">
                    {presets.map(p => (
                        <button
                            key={p}
                            onClick={() => setReason(p)}
                            className={`px-4 py-2 text-[10px] uppercase tracking-widest transition-all duration-300 border font-medium
                                ${reason === p
                                    ? 'bg-[#0046EA] border-[#0046EA] text-[var(--color-navy)]'
                                    : 'border-[#0F0C17]/10 text-[#0F0C17]/50 hover:border-[var(--color-gold-dim)] hover:text-[#0046EA]'
                                }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>

                <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Diễn giải thêm lý do chiến thuật của bạn..."
                    rows={4}
                    className="w-full bg-[#0046EA]/5 border border-[#0F0C17]/10 p-6 text-sm text-[#0F0C17] font-light focus:border-[var(--color-gold-dim)] transition-all outline-none resize-none placeholder:text-[var(--color-ivory-10)] mb-10"
                />

                <div className="flex gap-6">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 py-4 border border-[#0F0C17]/10 text-[#0F0C17]/50 text-[10px] uppercase tracking-[0.3em] font-medium hover:bg-[var(--color-ivory-10)] transition-all"
                    >
                        HỦY BỎ
                    </button>
                    <button
                        onClick={() => onConfirm(reason)}
                        disabled={!reason.trim() || loading}
                        className="flex-1 py-4 bg-[#0046EA] text-[var(--color-navy)] text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-[var(--color-ivory)] transition-all disabled:opacity-30 shadow-lg"
                    >
                        XÁC NHẬN TỪ CHỐI
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

import { useSearchParams } from 'next/navigation';

export default function ManageBookingsPage() {
    const { user } = useAuthStore();
    const searchParams = useSearchParams();
    const highlightId = searchParams.get('booking');
    
    // isProvider: dùng cho breadcrumb & label hiển thị (cả EXPERT lẫn MENTOR)
    const isProvider = user?.role === 'EXPERT' || user?.role === 'MENTOR';
    // isExpert: dùng cho action buttons (Accept/Reject/Meeting URL) — CHỈ EXPERT
    const isExpert = user?.role === 'EXPERT';
    const isStudent = user?.role === 'STUDENT';
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [ratingBooking, setRatingBooking] = useState<Booking | null>(null);
    const [rejectingBooking, setRejectingBooking] = useState<Booking | null>(null);
    const [supportingBooking, setSupportingBooking] = useState<Booking | null>(null);
    const [, setTick] = useState(0); // force re-render for countdown

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    const fetchBookings = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data } = await api.get('bookings/');
            setBookings(data);
        } catch (error) {
            console.error('Failed to fetch bookings', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBookings();
        // Re-render every 30s so check-in window state updates
        const interval = setInterval(() => setTick(t => t + 1), 30_000);
        return () => clearInterval(interval);
    }, [fetchBookings]);

    // UC-38.1: Scroll to highlighted booking from notification
    useEffect(() => {
        if (!isLoading && highlightId) {
            const el = document.getElementById(`booking-${highlightId}`);
            if (el) {
                setTimeout(() => {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.classList.add('ring-2', 'ring-[var(--color-gold)]', 'ring-offset-4', 'ring-offset-[var(--color-obsidian)]');
                    setTimeout(() => {
                        el.classList.remove('ring-2', 'ring-[var(--color-gold)]', 'ring-offset-4', 'ring-offset-[var(--color-obsidian)]');
                    }, 3000);
                }, 500);
            }
        }
    }, [isLoading, highlightId]);

    const updateStatus = async (bookingId: number, status: BookingStatus, extra?: Record<string, string>) => {
        setActionLoading(bookingId);
        try {
            await api.put(`bookings/${bookingId}`, { status, ...extra });
            await fetchBookings();
        } catch (error: any) {
            const msg = error.response?.data?.detail || error.message || 'Action failed';
            alert(msg);
            await fetchBookings();
        } finally {
            setActionLoading(null);
        }
    };

    const handleCheckin = async (bookingId: number) => {
        setActionLoading(bookingId);
        try {
            await api.post(`bookings/${bookingId}/checkin`);
            await fetchBookings();
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Check-in failed');
        } finally {
            setActionLoading(null);
        }
    };

    const handleNoShowResolve = async (bookingId: number) => {
        setActionLoading(bookingId);
        try {
            await api.post(`bookings/${bookingId}/resolve-noshow`);
            await fetchBookings();
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Failed to resolve');
        } finally {
            setActionLoading(null);
        }
    };

    const handleRejectConfirm = async (reason: string) => {
        if (!rejectingBooking) return;
        setActionLoading(rejectingBooking.id);
        try {
            await api.put(`bookings/${rejectingBooking.id}`, {
                status: BookingStatus.REJECTED,
                rejection_reason: reason,
            });
            setRejectingBooking(null);
            await fetchBookings();
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Failed to reject');
        } finally {
            setActionLoading(null);
        }
    };

    // ── Render helpers ──

    const renderCheckinSection = (booking: Booking) => {
        const window = getCheckinWindow(booking.start_time);
        const myCheckin = isStudent ? booking.student_checked_in_at : booking.expert_checked_in_at;
        const otherCheckin = isStudent ? booking.expert_checked_in_at : booking.student_checked_in_at;

        if (!window.canCheckin && !window.windowClosed) {
            const mins = Math.ceil(window.secondsToOpen / 60);
            return (
                <div className="flex items-center gap-3 text-[10px] text-ivory/20 uppercase tracking-[0.2em] font-sans mt-4">
                    <Clock className="w-3 h-3" strokeWidth={1} />
                    Check-in mở sau {mins} phút
                </div>
            );
        }

        if (window.windowClosed && booking.status === BookingStatus.CONFIRMED) {
            return (
                <button
                    onClick={() => handleNoShowResolve(booking.id)}
                    className="mt-4 px-6 py-3 border border-amber-500/30 text-amber-500 text-[10px] uppercase tracking-widest font-sans hover:bg-amber-500/5 transition-all duration-700"
                >
                    Xử lý No-Show
                </button>
            );
        }

        if (window.canCheckin) {
            if (myCheckin) {
                return (
                    <div className="flex items-center gap-3 text-[10px] text-emerald-500/60 uppercase tracking-[0.2em] font-sans mt-4">
                        <CheckCircle2 className="w-3 h-3" strokeWidth={1} />
                        Đã điểm danh {otherCheckin ? '' : '(Đang chờ)'}
                    </div>
                );
            }
            return (
                <button
                    onClick={() => handleCheckin(booking.id)}
                    className="mt-4 px-6 py-3 bg-emerald-500 text-obsidian text-[10px] uppercase tracking-widest font-sans hover:bg-emerald-400 transition-all duration-700"
                >
                    Điểm danh ngay
                </button>
            );
        }
        return null;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
                <div className="w-12 h-12 border border-[var(--color-gold-dim)] border-t-[var(--color-gold)] animate-spin mb-8" />
                <p className="text-[10px] text-[#0046EA] uppercase tracking-[0.5em] font-sans">Đang truy vấn lịch hẹn...</p>
            </div>
        );
    }

    const totalPages = Math.ceil(bookings.length / itemsPerPage);
    const paginatedBookings = bookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="bg-white min-h-screen selection:bg-[#0046EA]/10 text-[#171716] font-dm-sans pb-40">
            {/* ── Header Section (The Sky) ── */}
            <div className="bg-[#0046EA] pt-24 pb-32 px-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(0,164,253,0.3)_0%,transparent_70%)]" />
                <div className="max-w-[1400px] mx-auto relative z-10">
                    <nav className="flex items-center gap-4 mb-12">
                        <Link
                            href={isProvider ? "/dashboard/expert" : "/dashboard"}
                            className="flex items-center gap-2 text-[10px] font-black text-white/40 hover:text-white transition-all uppercase tracking-[0.2em]"
                        >
                            Bàn làm việc
                        </Link>
                        <ChevronRight size={10} className="text-white/20" />
                        <span className="text-[10px] font-black text-[#FFE900] uppercase tracking-[0.2em]">Quản lý lịch hẹn</span>
                    </nav>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-[2px] bg-[#FFE900]" />
                                <span className="text-[10px] text-[#FFE900] tracking-[0.5em] font-black uppercase">Phiên tư vấn Chiến lược</span>
                            </div>
                            <h1 className="text-[clamp(40px,5vw,68px)] font-garamond italic font-bold text-white tracking-tight leading-none">
                                Quản lý lịch hẹn
                            </h1>
                        </div>
                        <Link 
                            href="/dashboard/wallet"
                            className="inline-flex items-center justify-center h-14 px-8 bg-transparent border border-white/20 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-[#0046EA] transition-all rounded-none mb-2 w-fit"
                        >
                            Quản lý Ví (Wallet)
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-8 -mt-16 relative z-20">
                <div className="space-y-12">
                    <AnimatePresence mode="popLayout">
                        {bookings.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="py-32 text-center border-2 border-dashed border-black/5 rounded-[48px] bg-[#F5F8FF]"
                            >
                                <p className="text-[10px] text-black/30 font-black uppercase tracking-[0.4em]">Không tìm thấy dữ liệu lịch hẹn</p>
                            </motion.div>
                        ) : (
                            paginatedBookings.map((booking, idx) => {
                                const badge = getStatusBadge(booking.status);
                                const isConfirmed = booking.status === BookingStatus.CONFIRMED;
                                const isInProgress = booking.status === BookingStatus.IN_PROGRESS;

                                return (
                                    <motion.div
                                        key={booking.id}
                                        id={`booking-${booking.id}`}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.8, delay: idx * 0.05 }}
                                        className="group relative"
                                    >
                                        <div className="bg-[#00A4FD] border-[6px] border-[#00A4FD] rounded-none shadow-sm hover:shadow-2xl hover:bg-[#D20048] hover:border-[#D20048] transition-all duration-700 overflow-hidden text-white">
                                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                                                {/* Status Strip */}
                                                <div className={`lg:col-span-1 py-4 lg:py-0 flex lg:flex-col items-center justify-center gap-4 border-b lg:border-b-0 lg:border-r border-white/10 ${isInProgress ? 'bg-white/20' : 'bg-white/5'}`}>
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/40 [writing-mode:vertical-lr] hidden lg:block rotate-180">STATUS</span>
                                                    <div className="w-2 h-2 rounded-full bg-[#FFE900] animate-pulse" />
                                                </div>

                                                <div className="lg:col-span-11 grid grid-cols-1 md:grid-cols-12 gap-10 p-12 lg:p-16 items-start">
                                                    {/* Date & Time */}
                                                    <div className="md:col-span-4 lg:col-span-3 space-y-6">
                                                        <div className="px-4 py-1.5 bg-white/20 border border-white/20 text-white text-[10px] font-black uppercase tracking-widest rounded-none w-fit">
                                                            {badge.text}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-3xl font-garamond italic font-bold text-white leading-tight">
                                                                {new Date(booking.start_time).toLocaleDateString('vi-VN', {
                                                                    weekday: 'long', day: 'numeric', month: 'long'
                                                                })}
                                                            </h3>
                                                            <p className="text-xl text-[#FFE900] font-garamond italic mt-2">
                                                                lúc {new Date(booking.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </div>
                                                        <p className="text-[9px] text-white/40 font-black tracking-[0.3em] uppercase">ID: #{booking.id}</p>
                                                    </div>

                                                    {/* Details & Notes */}
                                                    <div className="md:col-span-8 lg:col-span-6 space-y-10">
                                                        <div>
                                                            <p className="text-white/40 uppercase text-[9px] font-black tracking-[0.4em] mb-6 flex items-center gap-4">
                                                                <span className="w-6 h-px bg-white/20" /> Ghi chú Chiến lược
                                                            </p>
                                                            {booking.student_note ? (
                                                                <div className="relative pl-10">
                                                                    <Quote className="absolute left-0 top-0 w-8 h-8 text-white/10" />
                                                                    <p className="text-white font-garamond italic text-lg leading-relaxed">
                                                                        &ldquo;{booking.student_note}&rdquo;
                                                                    </p>
                                                                </div>
                                                            ) : (
                                                                <p className="text-white/40 italic text-sm font-garamond">Học viên chưa cập nhật yêu cầu cụ thể.</p>
                                                            )}
                                                        </div>

                                                        {booking.rejection_reason && (
                                                            <div className="p-8 bg-[#FFF5F8] border border-pink-500/10 rounded-3xl flex gap-6 items-start">
                                                                <AlertCircle className="text-pink-500 w-5 h-5 mt-1 flex-shrink-0" />
                                                                <div>
                                                                    <p className="text-pink-500/50 text-[9px] font-black uppercase tracking-widest mb-2">Lý do từ chối</p>
                                                                    <p className="text-pink-500 text-sm font-bold italic font-garamond">{booking.rejection_reason}</p>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {(isConfirmed || isInProgress) && booking.meeting_url && (
                                                            <div className="flex flex-wrap items-center gap-6 pt-4">
                                                                <a
                                                                    href={booking.meeting_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className={`h-16 px-8 rounded-2xl flex items-center gap-4 text-[11px] font-black uppercase tracking-widest transition-all duration-300 shadow-lg shadow-blue-500/10
                                                                        ${isInProgress
                                                                            ? 'bg-[#0046EA] text-white hover:scale-105 active:scale-95'
                                                                            : 'bg-white border border-black/5 text-[#0046EA] hover:bg-[#F5F8FF]'
                                                                        }`}
                                                                >
                                                                    <Video className="w-5 h-5" />
                                                                    {isInProgress ? 'Tham gia Hội nghị ngay' : 'Phòng họp Trực tuyến'}
                                                                </a>
                                                                {renderCheckinSection(booking)}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Profile & Tactical Actions */}
                                                    <div className="md:col-span-12 lg:col-span-3 flex flex-col justify-between items-end text-right space-y-8 h-full">
                                                        <div className="space-y-4">
                                                            <div className="flex flex-col items-end">
                                                                <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.3em] mb-2">
                                                                    {isProvider ? 'Học viên' : 'Chuyên gia'}
                                                                </p>
                                                                <h4 className="font-garamond italic text-2xl font-bold text-white">
                                                                    {isProvider
                                                                        ? booking.student?.full_name || 'Khách hàng'
                                                                        : booking.expert?.user?.full_name || 'Chuyên gia'}
                                                                </h4>
                                                            </div>
                                                            <div className="h-12 px-5 bg-white/10 border border-white/10 rounded-none flex items-center justify-center gap-3">
                                                                {booking.is_pwyw ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <Heart size={12} className="text-[#FFE900]" />
                                                                        <span className="text-sm text-[#FFE900] font-bold">
                                                                            {booking.pwyw_amount > 0 ? `${booking.pwyw_amount} Xu` : 'Tùy hỷ'}
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-baseline gap-2">
                                                                        <span className="text-lg font-bold text-[#FFE900]">{booking.total_amount}</span>
                                                                        <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">CREDITS</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Actions Strip */}
                                                        <div className="flex flex-col gap-3 w-full">
                                                            {isExpert && booking.status === BookingStatus.PENDING && (
                                                                <div className="flex flex-col gap-3">
                                                                    <button
                                                                        onClick={() => setRejectingBooking(booking)}
                                                                        className="h-14 w-full bg-white border border-black/5 text-black/40 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-pink-50 hover:text-pink-500 transition-all"
                                                                    >
                                                                        Từ chối
                                                                    </button>
                                                                    <button
                                                                        onClick={() => updateStatus(booking.id, BookingStatus.CONFIRMED)}
                                                                        className="h-14 w-full bg-[#171716] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#0046EA] transition-all shadow-xl"
                                                                    >
                                                                        Xác nhận Lịch
                                                                    </button>
                                                                </div>
                                                            )}

                                                            {isProvider && (isConfirmed || isInProgress) && (
                                                                <button
                                                                    onClick={() => {
                                                                        const url = prompt('Nhập URL phòng họp (Meet, Zoom...):', booking.meeting_url ?? '');
                                                                        if (url) {
                                                                            if (!url.match(/^https?:\/\//)) { alert('URL phải bắt đầu bằng http(s)://'); return; }
                                                                            api.put(`bookings/${booking.id}`, { meeting_url: url }).then(() => fetchBookings());
                                                                        }
                                                                    }}
                                                                    className={`h-14 w-full rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all
                                                                        ${booking.meeting_url
                                                                            ? 'bg-white border border-black/5 text-black/40 hover:text-[#0046EA]'
                                                                            : 'bg-[#FFE900] text-[#0046EA] shadow-lg shadow-yellow-500/20'
                                                                        }`}
                                                                >
                                                                    {booking.meeting_url ? 'Cập nhật Phòng' : 'Thiết lập Phòng'}
                                                                </button>
                                                            )}

                                                            {isStudent && (isConfirmed || isInProgress) && (
                                                                <button
                                                                    onClick={() => {
                                                                        if (booking.is_pwyw) {
                                                                            updateStatus(booking.id, BookingStatus.COMPLETED)
                                                                                .then(() => setSupportingBooking(booking));
                                                                        } else {
                                                                            updateStatus(booking.id, BookingStatus.COMPLETED);
                                                                        }
                                                                    }}
                                                                    className="h-14 w-full bg-[#171716] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#0046EA] transition-all"
                                                                >
                                                                    Hoàn tất Phiên
                                                                </button>
                                                            )}

                                                            {isStudent && booking.is_pwyw && booking.status === BookingStatus.COMPLETED && booking.pwyw_amount === 0 && (
                                                                <button
                                                                    onClick={() => setSupportingBooking(booking)}
                                                                    className="h-14 w-full bg-[#FFE900]/10 border border-[#FFE900]/20 text-[#FFE900] text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#FFE900]/20 transition-all flex items-center justify-center gap-2"
                                                                >
                                                                    <Heart size={12} /> Ủng hộ Cố vấn
                                                                </button>
                                                            )}

                                                            {isStudent && booking.status === BookingStatus.COMPLETED && (
                                                                <button
                                                                    onClick={() => setRatingBooking(booking)}
                                                                    className="h-14 w-full bg-[#0046EA] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#171716] transition-all"
                                                                >
                                                                    Gửi Đánh giá
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </AnimatePresence>

                    {/* Pagination UI */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-12">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 border border-[#0F0C17]/10 text-xs font-bold uppercase tracking-widest disabled:opacity-30 hover:bg-[#0F0C17]/5 transition-all"
                            >
                                Trước
                            </button>
                            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-black/40">
                                Trang {currentPage} / {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 border border-[#0F0C17]/10 text-xs font-bold uppercase tracking-widest disabled:opacity-30 hover:bg-[#0F0C17]/5 transition-all"
                            >
                                Sau
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals are handled separately by their own Shinkai-styled components */}
            {rejectingBooking && (
                <RejectModal
                    booking={rejectingBooking}
                    onClose={() => setRejectingBooking(null)}
                    onConfirm={handleRejectConfirm}
                    loading={actionLoading === rejectingBooking.id}
                />
            )}
            {ratingBooking && (
                <ReviewModal
                    bookingId={ratingBooking.id}
                    expertName={ratingBooking.expert?.user?.full_name ?? 'Expert'}
                    onClose={() => setRatingBooking(null)}
                    onSuccess={() => { setRatingBooking(null); fetchBookings(); }}
                />
            )}
            {supportingBooking && supportingBooking.expert && (
                <MentorSupportModal
                    booking={supportingBooking}
                    mentor={supportingBooking.expert}
                    onClose={() => setSupportingBooking(null)}
                    onSuccess={() => { setSupportingBooking(null); fetchBookings(); }}
                />
            )}
        </div>
    );
}
