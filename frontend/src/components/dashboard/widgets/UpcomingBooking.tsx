import React from 'react';
import Link from 'next/link';
import { Calendar, Clock, Video, ShieldCheck, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
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
            <div className="bg-[var(--color-navy-mid)] border border-[var(--color-ivory-10)] p-14 h-full flex flex-col items-center justify-center gap-6 shadow-xl rounded-sm">
                <Loader2 className="w-10 h-10 text-[var(--color-cyan)] animate-spin" strokeWidth={1} />
                <span className="text-[11px] font-bold text-[var(--color-ivory-40)] uppercase tracking-[0.5em]">Đang đối soát lịch hẹn...</span>
            </div>
        );
    }

    if (!nextSession) {
        return (
            <div className="bg-[var(--color-navy-mid)] border border-[var(--color-ivory-10)] p-14 flex flex-col items-center justify-center text-center group transition-all duration-700 hover:border-[var(--color-cyan)]/20 shadow-xl font-dm-sans rounded-sm h-full">
                <div className="w-24 h-24 border border-[var(--color-ivory-10)] flex items-center justify-center text-[var(--color-cyan)]/40 mb-10 group-hover:bg-[var(--color-cyan)]/5 group-hover:border-[var(--color-cyan)]/30 transition-all duration-700">
                    <Calendar size={40} strokeWidth={1} />
                </div>
                <h3 className="font-serif text-2xl text-[var(--color-ivory)] italic mb-4">Chưa có lịch hẹn</h3>
                <p className="font-sans text-[10px] text-[var(--color-ivory-40)] uppercase tracking-widest max-w-[240px] leading-relaxed">Kết nối với chuyên gia để khai phá tiềm năng của bạn.</p>
                <Link href="/dashboard/experts" className="w-full mt-14">
                    <button
                        suppressHydrationWarning
                        className="w-full bg-transparent border border-[var(--color-cyan)]/30 text-[var(--color-ivory-60)] uppercase tracking-widest text-xs py-4 hover:bg-[var(--color-cyan)]/10 hover:text-[var(--color-cyan)] transition-all"
                    >
                        Khám phá chuyên gia
                    </button>
                </Link>
            </div>
        );
    }

    const isReady = timeLeft <= 600; // 10 mins before

    return (
        <div className="bg-[var(--color-navy-mid)] border border-[var(--color-ivory-10)] p-10 flex flex-col h-full group hover:border-[var(--color-cyan)]/20 transition-all duration-700 shadow-xl font-dm-sans rounded-sm">
            <div className="flex items-center justify-between mb-10">
                <h3 className="font-serif text-2xl text-[var(--color-ivory)] italic">Lịch hẹn sắp tới</h3>
                <div className="flex items-center gap-4 bg-[var(--color-cyan)]/5 px-4 py-1.5 border border-[var(--color-cyan)]/20">
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-cyan)] animate-pulse" />
                    <span className="text-[10px] font-bold text-[var(--color-cyan)] uppercase tracking-[0.3em]">Ưu tiên</span>
                </div>
            </div>

            <div className="space-y-10 flex-1">
                <div className="flex gap-8 p-6 border border-[var(--color-ivory-10)] bg-black/20 group-hover:bg-black/30 transition-all duration-700 shadow-sm">
                    <div className="w-14 h-14 border border-[var(--color-cyan)]/20 flex items-center justify-center text-[var(--color-cyan)] shrink-0 bg-[var(--color-navy-dark)]">
                        <Calendar size={20} strokeWidth={1.25} />
                    </div>
                    <div className="flex flex-col justify-center overflow-hidden">
                        <p className="font-bold text-[var(--color-ivory)] text-[13px] uppercase tracking-[0.2em] truncate">{nextSession.expert?.user?.full_name || 'Hội đồng chuyên môn'}</p>
                        <div className="flex items-center gap-5 mt-4">
                            <span className="flex items-center gap-2.5 text-[11px] text-[var(--color-ivory-60)] font-bold uppercase tracking-[0.1em]">
                                <Clock size={14} color="var(--color-cyan)" strokeWidth={1.5} />
                                {new Date(nextSession.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })} • {new Date(nextSession.start_time).toLocaleDateString('vi-VN')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* UC-Expert Quiz Prompt */}
                {nextSession.quiz_status === 'PENDING' && (
                    <Link href={`/dashboard/student/bookings/${nextSession.id}/quiz`} className="block">
                        <div className="bg-amber/10 border border-amber/30 p-4 flex items-center justify-between group/quiz hover:bg-amber/20 transition-all cursor-pointer">
                            <div className="flex items-center gap-4">
                                <AlertCircle size={20} className="text-amber animate-pulse" />
                                <div>
                                    <p className="text-[10px] font-bold text-amber uppercase tracking-widest">Cần chuẩn bị</p>
                                    <p className="text-[11px] text-ivory-70 font-light mt-0.5">Vui lòng điền khảo sát để chuyên gia hỗ trợ bạn tốt nhất.</p>
                                </div>
                            </div>
                            <ChevronRight size={16} className="text-amber group-hover/quiz:translate-x-1 transition-transform" />
                        </div>
                    </Link>
                )}

                <div className="bg-[var(--color-obsidian)] p-8 text-center relative overflow-hidden shadow-2xl border border-[var(--color-ivory-10)]">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-cyan)]/5 blur-3xl -mr-16 -mt-16 opacity-50" />
                    <p className="text-[10px] font-bold text-[var(--color-ivory-40)] uppercase tracking-[0.5em] mb-4">Đếm ngược khởi động</p>
                    <div className="text-4xl font-serif italic text-[var(--color-cyan)] tracking-[0.3em] tabular-nums font-light">
                        {formatTime(timeLeft)}
                    </div>
                </div>

                <div className="relative group/tooltip">
                    <div className="flex items-center gap-4 py-2 text-[10px] font-bold text-[var(--color-cyan)] uppercase tracking-[0.2em]">
                        <ShieldCheck size={18} strokeWidth={1.25} />
                        Bảo chứng CareerPath (Escrow)
                    </div>

                    <div className="absolute bottom-full left-0 mb-6 w-80 p-8 bg-[var(--color-obsidian)] text-[var(--color-ivory)] text-[11px] opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-20 shadow-[0_40px_80px_rgba(0,0,0,0.5)] leading-relaxed border border-[var(--color-cyan)]/20 translate-y-2 group-hover/tooltip:translate-y-0 duration-500">
                        <p className="font-serif text-lg italic text-[var(--color-cyan)] mb-5 tracking-wide">Quyền lợi Người học</p>
                        <p className="font-sans font-light text-[var(--color-ivory-60)] leading-loose">Hệ thống tạm giữ phí dịch vụ và chỉ chuyển giao khi buổi tư vấn được xác nhận hoàn tất đầy đủ chất lượng.</p>
                        <div className="absolute top-full left-8 border-[10px] border-transparent border-t-[var(--color-obsidian)]"></div>
                    </div>
                </div>
            </div>

            <div className="mt-14 flex gap-6">
                <a
                    href={nextSession.meeting_url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`
                        flex-1 flex items-center justify-center gap-4 py-4 text-[11px] font-bold tracking-[0.4em] uppercase transition-all duration-700 shadow-xl
                        ${isReady && nextSession.meeting_url
                            ? 'bg-[var(--color-cyan)] text-[var(--color-obsidian)] hover:opacity-90'
                            : 'bg-black/20 border border-[var(--color-ivory-10)] text-[var(--color-ivory-20)] cursor-not-allowed'}
                    `}
                    onClick={(e) => (!isReady || !nextSession.meeting_url) && e.preventDefault()}
                >
                    <Video size={18} strokeWidth={1.25} />
                    Hành lang họp
                </a>
                <Link href="/dashboard/chat" className="w-16 h-16 border border-[var(--color-ivory-10)] flex items-center justify-center text-[var(--color-ivory-40)] hover:text-[var(--color-cyan)] hover:bg-black/20 hover:border-[var(--color-cyan)]/30 transition-all duration-700 shadow-sm">
                    <ChevronRight size={20} strokeWidth={1.25} />
                </Link>
            </div>
        </div>
    );
}
