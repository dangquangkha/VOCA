import React from 'react';
import Link from 'next/link';
import { Calendar, Clock, Video, ShieldCheck, ChevronRight, Loader2 } from 'lucide-react';
import { bookingService } from '@/services/bookingService';
import { Booking, BookingStatus } from '@/types/booking';

export default function UpcomingBooking() {
    const [nextSession, setNextSession] = React.useState<Booking | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [timeLeft, setTimeLeft] = React.useState(0);

    React.useEffect(() => {
        const fetchNextSession = async () => {
            try {
                const bookings = await bookingService.getBookings();
                const now = new Date();
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

    React.useEffect(() => {
        if (!nextSession) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [nextSession]);

    const formatTime = (seconds: number) => {
        if (seconds <= 0) return "00:00:00";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="bg-white/60 border border-[#C9A84C]/20 p-14 backdrop-blur-xl h-full flex flex-col items-center justify-center gap-6 shadow-xl">
                <Loader2 className="w-10 h-10 text-[#C9A84C] animate-spin" strokeWidth={1} />
                <span className="text-[11px] font-bold text-[#0D1B2A]/60 uppercase tracking-[0.5em]">Đang đối soát lịch hẹn...</span>
            </div>
        );
    }

    if (!nextSession) {
        return (
            <div className="bg-white/60 border border-[#C9A84C]/15 p-14 backdrop-blur-xl h-full flex flex-col items-center justify-center text-center group transition-all duration-700 hover:border-[#C9A84C]/40 shadow-xl font-dm-sans">
                <div className="w-24 h-24 border border-[#C9A84C]/20 flex items-center justify-center text-[#C9A84C]/40 mb-10 group-hover:bg-[#C9A84C]/5 group-hover:border-[#C9A84C]/40 transition-all duration-700">
                    <Calendar size={40} strokeWidth={1} />
                </div>
                <h3 className="font-garamond text-3xl text-[#0D1B2A] italic mb-4">Chưa có lịch hẹn</h3>
                <p className="text-[10px] text-[#0D1B2A]/60 font-bold uppercase tracking-[0.4em] max-w-[240px] leading-relaxed">Kết nối với chuyên gia để khai phá tiềm năng của bạn.</p>
                <Link href="/dashboard/experts">
                    <button
                        suppressHydrationWarning
                        className="mt-14 px-10 py-5 bg-[#0D1B2A] text-[#F5F0E8] text-[11px] font-bold tracking-[0.5em] uppercase transition-all duration-700 hover:bg-[#C9A84C] hover:text-[#0D1B2A] shadow-lg"
                    >
                        Khám phá chuyên gia
                    </button>
                </Link>
            </div>
        );
    }

    const isReady = timeLeft <= 600; // 10 mins before

    return (
        <div className="bg-white/60 border border-[#C9A84C]/20 p-12 backdrop-blur-xl flex flex-col h-full group hover:border-[#C9A84C]/50 transition-all duration-700 shadow-xl font-dm-sans">
            <div className="flex items-center justify-between mb-12">
                <h3 className="font-garamond text-3xl text-[#0D1B2A] italic">Lịch hẹn sắp tới</h3>
                <div className="flex items-center gap-4 bg-[#C9A84C]/10 px-4 py-1.5 border border-[#C9A84C]/20">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#C9A84C] animate-pulse" />
                    <span className="text-[10px] font-bold text-[#C9A84C] uppercase tracking-[0.3em]">Ưu tiên</span>
                </div>
            </div>

            <div className="space-y-10 flex-1">
                <div className="flex gap-8 p-8 border border-[#C9A84C]/10 bg-white/60 group-hover:bg-white/80 transition-all duration-700 shadow-sm">
                    <div className="w-16 h-16 border border-[#C9A84C]/30 flex items-center justify-center text-[#C9A84C] shrink-0 bg-white shadow-inner">
                        <Calendar size={24} strokeWidth={1.25} />
                    </div>
                    <div className="flex flex-col justify-center overflow-hidden">
                        <p className="font-bold text-[#0D1B2A] text-[13px] uppercase tracking-[0.2em] truncate">{nextSession.expert?.user?.full_name || 'Hội đồng chuyên môn'}</p>
                        <div className="flex items-center gap-5 mt-4">
                            <span className="flex items-center gap-2.5 text-[11px] text-[#0D1B2A]/70 font-bold uppercase tracking-[0.1em]">
                                <Clock size={14} color="#C9A84C" strokeWidth={1.5} />
                                {new Date(nextSession.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })} • {new Date(nextSession.start_time).toLocaleDateString('vi-VN')}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-[#0D1B2A] p-10 text-center relative overflow-hidden shadow-2xl border border-[#C9A84C]/10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9A84C]/10 blur-3xl -mr-16 -mt-16 opacity-50" />
                    <p className="text-[10px] font-bold text-[#F5F0E8]/40 uppercase tracking-[0.5em] mb-6">Đếm ngược khởi động</p>
                    <div className="text-5xl font-garamond italic text-[#C9A84C] tracking-[0.3em] tabular-nums font-light">
                        {formatTime(timeLeft)}
                    </div>
                </div>

                <div className="relative group/tooltip">
                    <div className="flex items-center gap-4 py-2 text-[10px] font-bold text-[#C9A84C] uppercase tracking-[0.2em]">
                        <ShieldCheck size={18} strokeWidth={1.25} />
                        Bảo chứng CareerPath (Escrow)
                    </div>

                    <div className="absolute bottom-full left-0 mb-6 w-80 p-8 bg-[#0D1B2A] text-[#F5F0E8] text-[11px] opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-20 shadow-[0_40px_80px_rgba(0,0,0,0.5)] leading-relaxed border border-[#C9A84C]/30 translate-y-2 group-hover/tooltip:translate-y-0 duration-500">
                        <p className="font-garamond text-lg italic text-[#C9A84C] mb-5 tracking-wide">Quyền lợi Người học</p>
                        <p className="font-dm-sans font-light text-[#F5F0E8]/70 leading-loose">Hệ thống tạm giữ phí dịch vụ và chỉ chuyển giao khi buổi tư vấn được xác nhận hoàn tất đầy đủ chất lượng.</p>
                        <div className="absolute top-full left-8 border-[10px] border-transparent border-t-[#0D1B2A]"></div>
                    </div>
                </div>
            </div>

            <div className="mt-14 flex gap-6">
                <a
                    href={nextSession.meeting_url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`
                        flex-1 flex items-center justify-center gap-4 py-6 text-[11px] font-bold tracking-[0.4em] uppercase transition-all duration-700 shadow-lg
                        ${isReady && nextSession.meeting_url
                            ? 'bg-[#0D1B2A] text-[#F5F0E8] hover:bg-[#C9A84C] hover:text-[#0D1B2A]'
                            : 'bg-black/5 border border-[#0D1B2A]/10 text-[#0D1B2A]/20 cursor-not-allowed'}
                    `}
                    onClick={(e) => (!isReady || !nextSession.meeting_url) && e.preventDefault()}
                >
                    <Video size={20} strokeWidth={1.25} />
                    Tham gia phòng họp
                </a>
                <Link href="/dashboard/chat" className="w-20 h-20 border border-[#0D1B2A]/15 flex items-center justify-center text-[#0D1B2A]/40 hover:text-[#C9A84C] hover:bg-white hover:border-[#C9A84C] transition-all duration-700 shadow-sm">
                    <ChevronRight size={24} strokeWidth={1.25} />
                </Link>
            </div>
        </div>
    );
}
