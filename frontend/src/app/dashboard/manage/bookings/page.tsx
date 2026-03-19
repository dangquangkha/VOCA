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
    ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { Booking, BookingStatus } from '@/types/booking';
import { useAuthStore } from '@/store/useAuthStore';
import { ReviewModal } from '@/components/ReviewModal';
import Link from 'next/link';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusBadge(status: BookingStatus) {
    const map: Record<string, string> = {
        PENDING: 'border-[#C9A84C]/40 text-[#C9A84C] bg-[#C9A84C]/5',
        CONFIRMED: 'border-[#C9A84C]/20 text-[#C9A84C]/80 bg-[#C9A84C]/5',
        IN_PROGRESS: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5',
        COMPLETED: 'border-[#F5F0E8]/20 text-[#F5F0E8]/60 bg-white/[0.02]',
        RATED: 'border-[#F5F0E8]/20 text-[#F5F0E8]/60 bg-white/[0.02]',
        REJECTED: 'border-white/5 text-white/20 bg-white/[0.01]',
        CANCELLED: 'border-white/5 text-white/20 bg-white/[0.01]',
    };
    const label: Record<string, string> = {
        IN_PROGRESS: 'ĐANG DIỄN RA',
        PENDING: 'ĐANG CHỜ',
        CONFIRMED: 'ĐÃ XÁC NHẬN',
        COMPLETED: 'HOÀN THÀNH',
        REJECTED: 'ĐÃ TỪ CHỐI',
        CANCELLED: 'ĐÃ HỦY',
    };
    return {
        cls: map[status] ?? 'border-white/5 text-white/20',
        text: label[status] ?? status,
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#090C12]/90 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-[#090C12] border border-[#C9A84C]/20 p-10 w-full max-w-lg mx-4 space-y-8"
            >
                <div className="space-y-4">
                    <h3 className="text-3xl font-serif italic text-[#F5F0E8] font-light tracking-tight">Từ chối lịch hẹn</h3>
                    <p className="text-[#F5F0E8]/40 font-sans font-light text-sm leading-relaxed">
                        Mã lịch hẹn: <span className="text-[#C9A84C]/60 italic font-serif">#{booking.id}</span>.
                        Vui lòng chọn lý do để thông báo cho học viên. Khoản thanh toán sẽ được hoàn trả tuyệt đối.
                    </p>
                </div>

                <div className="flex flex-wrap gap-4">
                    {presets.map(p => (
                        <button
                            key={p}
                            onClick={() => setReason(p)}
                            className={`px-5 py-2 text-[10px] uppercase tracking-widest transition-all duration-700 border font-sans
                                ${reason === p
                                    ? 'bg-[#C9A84C] border-[#C9A84C] text-[#090C12]'
                                    : 'border-white/5 text-[#F5F0E8]/40 hover:border-[#C9A84C]/40 hover:text-[#C9A84C]'
                                }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>

                <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Diễn giải thêm lý do của bạn..."
                    rows={4}
                    className="w-full bg-white/[0.02] border border-white/5 p-6 text-sm text-[#F5F0E8] font-sans font-light focus:border-[#C9A84C]/40 transition-all outline-none resize-none placeholder:text-[#F5F0E8]/10"
                />

                <div className="flex gap-6 pt-4">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 py-4 border border-white/5 text-[#F5F0E8]/40 text-[10px] uppercase tracking-[0.3em] font-sans hover:bg-white/5 transition-all duration-700"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        onClick={() => onConfirm(reason)}
                        disabled={!reason.trim() || loading}
                        className="flex-1 py-4 bg-[#C9A84C] text-[#090C12] text-[10px] uppercase tracking-[0.3em] font-sans hover:bg-[#F5F0E8] transition-all duration-700 disabled:opacity-30"
                    >
                        Xác nhận từ chối
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ManageBookingsPage() {
    const { user } = useAuthStore();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [ratingBooking, setRatingBooking] = useState<Booking | null>(null);
    const [rejectingBooking, setRejectingBooking] = useState<Booking | null>(null);
    const [, setTick] = useState(0); // force re-render for countdown

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
            await api.put(`/bookings/${rejectingBooking.id}`, {
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
        const myCheckin = user?.role === 'STUDENT' ? booking.student_checked_in_at : booking.expert_checked_in_at;
        const otherCheckin = user?.role === 'STUDENT' ? booking.expert_checked_in_at : booking.student_checked_in_at;

        if (!window.canCheckin && !window.windowClosed) {
            const mins = Math.ceil(window.secondsToOpen / 60);
            return (
                <div className="flex items-center gap-3 text-[10px] text-[#F5F0E8]/20 uppercase tracking-[0.2em] font-sans mt-4">
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
                    className="mt-4 px-6 py-3 bg-emerald-500 text-[#090C12] text-[10px] uppercase tracking-widest font-sans hover:bg-emerald-400 transition-all duration-700"
                >
                    Điểm danh ngay
                </button>
            );
        }
        return null;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#090C12] flex flex-col items-center justify-center p-8 text-center">
                <div className="w-12 h-12 border border-[#C9A84C]/20 border-t-[#C9A84C] animate-spin mb-8" />
                <p className="text-[10px] text-[#C9A84C] uppercase tracking-[0.5em] font-sans">Đang truy vấn lịch hẹn...</p>
            </div>
        );
    }

    return (
        <div className="bg-[#090C12] min-h-screen selection:bg-[#C9A84C]/30 text-[#F5F0E8] font-sans pb-40">
            <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-20">
                <div className="mb-20 space-y-4">
                    <h1 className="text-[clamp(32px,5vw,52px)] font-serif italic text-[#F5F0E8] font-light tracking-tight">Quản lý lịch hẹn</h1>
                    <p className="text-[#F5F0E8]/40 font-sans font-light text-sm tracking-wide uppercase tracking-[0.2em]">Danh sách các phiên tư vấn chiến lược của bạn</p>
                </div>

                <div className="space-y-12">
                    <AnimatePresence mode="popLayout">
                        {bookings.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="py-20 text-center border border-white/5 bg-white/[0.01]"
                            >
                                <p className="text-[10px] text-[#F5F0E8]/20 uppercase tracking-[0.4em] font-sans">Không tìm thấy dữ liệu lịch hẹn</p>
                            </motion.div>
                        ) : (
                            bookings.map((booking, idx) => {
                                const badge = getStatusBadge(booking.status);
                                const isConfirmed = booking.status === BookingStatus.CONFIRMED;
                                const isInProgress = booking.status === BookingStatus.IN_PROGRESS;

                                return (
                                    <motion.div
                                        key={booking.id}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.9, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
                                        className="group relative"
                                    >
                                        <div className="absolute -inset-px bg-gradient-to-r from-[#C9A84C]/0 via-[#C9A84C]/10 to-[#C9A84C]/0 opacity-0 group-hover:opacity-100 transition-all duration-1000" />

                                        <div className="relative bg-white/[0.03] border border-white/5 group-hover:border-[#C9A84C]/20 p-8 md:p-12 transition-all duration-700">
                                            {/* Header */}
                                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-12">
                                                <div className="space-y-6">
                                                    <div className="flex items-center gap-6">
                                                        <span className={`px-4 py-1.5 text-[9px] uppercase tracking-[0.2em] font-sans border ${badge.cls}`}>
                                                            {badge.text}
                                                        </span>
                                                        <span className="text-[10px] text-[#F5F0E8]/20 font-sans tracking-[0.2em]">#{booking.id}</span>
                                                    </div>

                                                    <h3 className="text-3xl md:text-4xl font-serif italic text-[#F5F0E8] font-light tracking-tight leading-tight max-w-2xl">
                                                        {new Date(booking.start_time).toLocaleDateString('vi-VN', {
                                                            weekday: 'long', day: 'numeric', month: 'long'
                                                        })}
                                                        <span className="block text-2xl mt-2 text-[#C9A84C]/60 italic">
                                                            lúc {new Date(booking.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </h3>
                                                </div>

                                                <div className="flex flex-col items-start md:items-end gap-2 text-right">
                                                    <div className="flex items-center gap-3 text-[#F5F0E8]/40">
                                                        <User className="w-4 h-4" strokeWidth={1} />
                                                        <span className="text-xs uppercase tracking-widest font-sans">
                                                            {user?.role === 'EXPERT' ? 'Học viên' : 'Chuyên gia'}
                                                        </span>
                                                    </div>
                                                    <p className="text-xl font-serif italic text-[#F5F0E8] font-light">
                                                        {user?.role === 'EXPERT'
                                                            ? booking.student?.full_name || 'Học viên'
                                                            : booking.expert?.user?.full_name || 'Chuyên gia'}
                                                    </p>
                                                    <div className="mt-4 px-4 py-2 bg-white/[0.02] border border-white/5">
                                                        <span className="text-lg text-[#C9A84C] font-serif italic">{booking.total_amount}</span>
                                                        <span className="text-[9px] ml-2 text-[#F5F0E8]/20 uppercase tracking-widest">Credits</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Notes & Details */}
                                            <div className="grid md:grid-cols-2 gap-12 items-end pt-12 border-t border-white/5">
                                                <div className="space-y-8">
                                                    {booking.student_note && (
                                                        <div className="space-y-3">
                                                            <p className="text-[9px] text-[#F5F0E8]/20 uppercase tracking-[0.3em] font-sans">Ghi chú từ học viên</p>
                                                            <p className="text-sm text-[#F5F0E8]/60 font-sans font-light italic leading-relaxed bg-white/[0.01] p-6 border-l border-[#C9A84C]/20">
                                                                &ldquo;{booking.student_note}&rdquo;
                                                            </p>
                                                        </div>
                                                    )}

                                                    {booking.rejection_reason && (
                                                        <div className="space-y-3">
                                                            <p className="text-[9px] text-red-500/40 uppercase tracking-[0.3em] font-sans">Lý do từ chối</p>
                                                            <p className="text-sm text-red-400/60 font-sans font-light p-6 bg-red-500/[0.02] border border-red-500/10">
                                                                {booking.rejection_reason}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* Meeting Link UI */}
                                                    {booking.meeting_url && (isConfirmed || isInProgress) && (
                                                        <a
                                                            href={booking.meeting_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={`inline-flex items-center gap-4 px-8 py-5 text-[11px] uppercase tracking-[0.3em] transition-all duration-700
                                                                ${isInProgress
                                                                    ? 'bg-[#C9A84C] text-[#090C12] hover:bg-[#F5F0E8]'
                                                                    : 'border border-[#C9A84C]/40 text-[#C9A84C] hover:bg-[#C9A84C]/5'
                                                                }`}
                                                        >
                                                            <Video className="w-4 h-4" strokeWidth={1} />
                                                            {isInProgress ? '🚀 Vào phòng ngay' : 'Xem đường dẫn phòng'}
                                                        </a>
                                                    )}

                                                    {/* Check-in section */}
                                                    {(isConfirmed || isInProgress) && renderCheckinSection(booking)}
                                                </div>

                                                {/* Actions */}
                                                <div className="flex flex-wrap md:justify-end gap-6 pt-6">
                                                    {user?.role === 'EXPERT' && booking.status === BookingStatus.PENDING && (
                                                        <>
                                                            <button
                                                                onClick={() => setRejectingBooking(booking)}
                                                                className="px-8 py-4 border border-white/5 text-[#F5F0E8]/20 text-[10px] uppercase tracking-[0.3em] font-sans hover:text-red-400 hover:border-red-400/20 transition-all duration-700"
                                                            >
                                                                Hủy bỏ
                                                            </button>
                                                            <button
                                                                onClick={() => updateStatus(booking.id, BookingStatus.CONFIRMED)}
                                                                className="px-10 py-4 bg-[#C9A84C] text-[#090C12] text-[10px] uppercase tracking-[0.3em] font-sans hover:bg-[#F5F0E8] transition-all duration-700 shadow-xl shadow-black/40"
                                                            >
                                                                Xác nhận
                                                            </button>
                                                        </>
                                                    )}

                                                    {user?.role === 'EXPERT' && (isConfirmed || isInProgress) && (
                                                        <button
                                                            onClick={() => {
                                                                const url = prompt('Nhập URL phòng họp (Meet, Zoom...):', booking.meeting_url ?? '');
                                                                if (url) {
                                                                    if (!url.match(/^https?:\/\//)) { alert('URL phải bắt đầu bằng http(s)://'); return; }
                                                                    api.put(`bookings/${booking.id}`, { meeting_url: url }).then(() => fetchBookings());
                                                                }
                                                            }}
                                                            className="px-8 py-4 border border-white/5 text-[#F5F0E8]/40 text-[10px] uppercase tracking-[0.3em] font-sans hover:text-[#C9A84C] hover:border-[#C9A84C]/20 transition-all duration-700"
                                                        >
                                                            {booking.meeting_url ? 'Sửa đường dẫn' : 'Thêm đường dẫn'}
                                                        </button>
                                                    )}

                                                    {user?.role === 'STUDENT' && (isConfirmed || isInProgress) && (
                                                        <button
                                                            onClick={() => updateStatus(booking.id, BookingStatus.COMPLETED)}
                                                            className="px-10 py-4 bg-[#C9A84C] text-[#090C12] text-[10px] uppercase tracking-[0.3em] font-sans hover:bg-[#F5F0E8] transition-all duration-700"
                                                        >
                                                            Hoàn tất buổi họp
                                                        </button>
                                                    )}

                                                    {user?.role === 'STUDENT' && booking.status === BookingStatus.COMPLETED && (
                                                        <button
                                                            onClick={() => setRatingBooking(booking)}
                                                            className="px-10 py-4 bg-[#C9A84C] text-[#090C12] text-[10px] uppercase tracking-[0.3em] font-sans hover:bg-[#F5F0E8] transition-all duration-700"
                                                        >
                                                            Đánh giá chuyên gia
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Reject Modal */}
            {rejectingBooking && (
                <RejectModal
                    booking={rejectingBooking}
                    onClose={() => setRejectingBooking(null)}
                    onConfirm={handleRejectConfirm}
                    loading={actionLoading === rejectingBooking.id}
                />
            )}

            {/* Review Modal */}
            {ratingBooking && (
                <ReviewModal
                    bookingId={ratingBooking.id}
                    expertName={ratingBooking.expert?.user?.full_name ?? 'Expert'}
                    onClose={() => setRatingBooking(null)}
                    onSuccess={() => { setRatingBooking(null); fetchBookings(); }}
                />
            )}
        </div>
    );
}
