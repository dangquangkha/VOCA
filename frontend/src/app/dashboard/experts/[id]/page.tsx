'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Star, Briefcase, Calendar, ShieldCheck, Linkedin, MessageSquare, ChevronRight, ArrowLeft, Quote, Clock, Award, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { Expert } from '@/types/expert';
import { motion, AnimatePresence } from 'framer-motion';

const DAY_NAMES = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
const EASING: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function ExpertProfilePage() {
    const params = useParams();
    const [expert, setExpert] = useState<Expert | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (params.id) fetchExpert(params.id as string);
    }, [params.id]);

    const fetchExpert = async (id: string) => {
        setIsLoading(true);
        try {
            const { data } = await api.get(`/experts/${id}`);
            setExpert(data);
        } catch {
            setError('Không thể tải thông tin chuyên gia. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    /* ─── Loading state ─── */
    if (isLoading) return (
        <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
            <div className="flex flex-col items-center gap-8">
                <div className="w-12 h-12 border border-[#C9A84C]/20 border-t-[#C9A84C] rounded-full animate-spin" />
                <p className="text-[#0A1018]/40 font-normal uppercase tracking-[0.4em] text-[10px] font-sans">Đang truy vấn tinh hoa…</p>
            </div>
        </div>
    );

    if (error || !expert) return (
        <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center p-16 bg-white/40 backdrop-blur-3xl rounded-[2px] border border-[#C9A84C]/10 max-w-lg mx-4 shadow-2xl"
            >
                <div className="text-6xl mb-8 grayscale opacity-40 italic font-serif">Aura</div>
                <h2 className="text-2xl font-serif italic text-[#0A1018] mb-4">Nhân tài chưa hiển thị</h2>
                <p className="text-[#0A1018]/80 font-sans font-light mb-10 leading-relaxed text-sm uppercase tracking-widest">{error || 'Hồ sơ chuyên gia không tồn tại hoặc đã bị gỡ bỏ.'}</p>
                <Link href="/dashboard/experts">
                    <button className="w-full bg-[#0A1018] text-[#F5F0E8] rounded-[2px] py-5 gap-3 font-sans text-[11px] uppercase tracking-[0.3em] flex items-center justify-center transition-all hover:bg-[#C9A84C] hover:text-[#0A1018]">
                        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> Quay lại Sàn Chuyên gia
                    </button>
                </Link>
            </motion.div>
        </div>
    );

    const tagList = expert.tags ? expert.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    const avatarSrc = expert.user?.avatar_url
        || `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.user?.full_name || 'Expert')}&background=0A1018&color=C9A84C&size=200`;
    const canBook = expert.availabilities.length > 0;

    return (
        <div className="min-h-screen bg-[#F5F0E8] selection:bg-[#C9A84C]/20 pb-44">
            {/* ── Breadcrumb ── */}
            <div className="bg-[#0A1018] border-b border-white/5">
                <nav className="max-w-[1400px] mx-auto px-8 py-6 flex items-center gap-4">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-[10px] font-normal text-white/50 hover:text-[#C9A84C] transition-all uppercase tracking-[0.2em] font-sans"
                    >
                        <Home size={12} strokeWidth={1.5} />
                        Trang chủ
                    </Link>
                    <ChevronRight size={10} className="text-white/40" />
                    <Link
                        href="/dashboard"
                        className="text-[10px] font-normal text-white/50 hover:text-[#C9A84C] transition-all uppercase tracking-[0.2em] font-sans"
                    >
                        Bàn làm việc
                    </Link>
                    <ChevronRight size={10} className="text-white/40" />
                    <Link
                        href="/dashboard/experts"
                        className="flex items-center gap-2 text-[10px] font-normal text-white/50 hover:text-[#C9A84C] transition-all uppercase tracking-[0.2em] font-sans"
                    >
                        Cố vấn
                    </Link>
                    <ChevronRight size={10} className="text-white/40" />
                    <span className="text-[10px] font-normal text-[#C9A84C] uppercase tracking-[0.2em] font-sans truncate max-w-[200px]">
                        {expert.user?.full_name}
                    </span>
                </nav>
            </div>

            {/* ── Hero section ── */}
            <section className="bg-[#0A1018] pt-24 pb-32 px-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#C9A84C]/5 blur-[120px] rounded-full -mr-96 -mt-96" />
                <div className="max-w-[1400px] mx-auto relative z-10">
                    <div className="grid lg:grid-cols-12 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 1.2, ease: EASING }}
                            className="lg:col-span-4"
                        >
                            <div className="relative inline-block group">
                                <div className="w-64 h-64 md:w-80 md:h-80 rounded-[2px] border border-white/10 p-2 bg-white/5 backdrop-blur-3xl transform transition-transform duration-1000 group-hover:scale-[1.02]">
                                    <div className="w-full h-full overflow-hidden rounded-[1px] grayscale-[0.2] transition-all duration-1000 group-hover:grayscale-0">
                                        <img src={avatarSrc} alt={expert.user?.full_name} className="w-full h-full object-cover" />
                                    </div>
                                </div>
                                {expert.kyc_status === 'APPROVED' && (
                                    <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-[#C9A84C] border-4 border-[#0A1018] flex items-center justify-center shadow-2xl rounded-full">
                                        <ShieldCheck className="w-6 h-6 text-[#0A1018]" strokeWidth={1.5} />
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1.2, ease: EASING, delay: 0.1 }}
                            className="lg:col-span-8 space-y-8"
                        >
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-[0.5px] bg-[#C9A84C]/40" />
                                    <span className="font-sans text-[10px] text-[#C9A84C] tracking-[0.4em] uppercase">Elite Member</span>
                                </div>
                                <h1 className="text-[clamp(40px,5vw,68px)] font-serif italic text-white tracking-tight leading-[1.20] font-light">
                                    {expert.user?.full_name}
                                </h1>
                                {tagList.length > 0 && (
                                    <p className="text-[#A85C1E] font-sans uppercase tracking-[0.2em] text-[10px] font-normal">
                                        {tagList.slice(0, 3).join(' ✦ ')}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-12 pt-4">
                                <div className="flex items-center gap-4 group">
                                    <div className="w-12 h-12 flex items-center justify-center border border-[#C9A84C]/20 bg-white/5 text-[#C9A84C] rounded-[2px] transition-colors group-hover:bg-[#C9A84C] group-hover:text-[#0A1018]">
                                        <Star className="w-5 h-5 fill-current" strokeWidth={1} />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-2xl font-serif italic text-white leading-none font-light">{expert.rating.toFixed(2)}</div>
                                        <div className="text-[10px] text-white/70 font-sans uppercase tracking-[0.2em] font-normal">{expert.total_reviews} Phản hồi</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 group">
                                    <div className="w-12 h-12 flex items-center justify-center border border-[#C9A84C]/20 bg-white/5 text-[#C9A84C] rounded-[2px] transition-colors group-hover:bg-[#C9A84C] group-hover:text-[#0A1018]">
                                        <Briefcase className="w-5 h-5" strokeWidth={1.5} />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-2xl font-serif italic text-white leading-none font-light">{expert.experience_years} Năm</div>
                                        <div className="text-[10px] text-white/70 font-sans uppercase tracking-[0.2em] font-normal">Thâm niên</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 group">
                                    <div className="w-12 h-12 flex items-center justify-center border border-[#C9A84C]/20 bg-white/5 text-[#C9A84C] rounded-[2px] transition-colors group-hover:bg-[#C9A84C] group-hover:text-[#0A1018]">
                                        <Clock className="w-5 h-5" strokeWidth={1.5} />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-2xl font-serif italic text-white leading-none font-light">{expert.hourly_rate}</div>
                                        <div className="text-[10px] text-white/70 font-sans uppercase tracking-[0.2em] font-normal">Xu / Giờ</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            <div className="max-w-[1400px] mx-auto px-8 -mt-16 relative z-20">
                <div className="grid lg:grid-cols-12 gap-16">
                    {/* ── Main content (Left) ── */}
                    <div className="lg:col-span-8 space-y-16">

                        {/* Bio Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, ease: EASING }}
                            className="bg-[#FAF7F2]/40 backdrop-blur-3xl border border-[#C9A84C]/10 p-12 md:p-16 rounded-[2px] shadow-[0_64px_128px_-16px_rgba(10,16,24,0.05)]"
                        >
                            <h2 className="text-[10px] font-normal text-[#0A1018]/60 uppercase tracking-[0.4em] mb-12 flex items-center gap-4">
                                <span className="w-8 h-[0.5px] bg-[#C9A84C]/40" /> Sứ mệnh & Tinh hoa
                            </h2>
                            <div className="relative">
                                <Quote className="absolute -top-6 -left-6 w-12 h-12 text-[#C9A84C]/5" />
                                <p className="text-[#2A1608]/80 text-[17px] font-sans font-light leading-[1.85] whitespace-pre-line border-l border-[#C9A84C]/20 pl-10 tracking-[0.02em]">
                                    {expert.bio || 'Chuyên gia này hiện chưa cập nhật tiểu sử chi tiết.'}
                                </p>
                            </div>

                            {tagList.length > 0 && (
                                <div className="flex flex-wrap gap-4 mt-16 pt-16 border-t border-[#C9A84C]/10">
                                    {tagList.map(tag => (
                                        <span key={tag} className="px-5 py-2.5 bg-[#FAF7F2]/60 text-[#0A1018]/80 text-[10px] font-normal uppercase tracking-[0.2em] rounded-[1px] border border-[#C9A84C]/5 hover:border-[#C9A84C]/40 transition-colors font-sans">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </motion.div>

                        {/* Social/Links Section */}
                        {expert.linkedin_url && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1, ease: EASING }}
                                className="bg-[#FAF7F2]/40 backdrop-blur-3xl border border-[#C9A84C]/10 p-8 flex flex-col md:flex-row items-center justify-between gap-8 rounded-[2px] group hover:border-[#C9A84C]/30 transition-all duration-700"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 bg-blue-700 text-white flex items-center justify-center rounded-[2px] shadow-xl transform transition-transform duration-700 group-hover:scale-105">
                                        <Linkedin className="w-6 h-6" strokeWidth={1.5} />
                                    </div>
                                    <div className="space-y-1 text-center md:text-left">
                                        <div className="text-sm font-serif italic text-[#0A1018] uppercase tracking-tight">Mạng lưới Chuyên nghiệp</div>
                                        <div className="text-[10px] text-[#0A1018]/60 font-sans tracking-wide truncate max-w-[200px]">{expert.linkedin_url}</div>
                                    </div>
                                </div>
                                <a href={expert.linkedin_url} target="_blank" rel="noopener noreferrer">
                                    <button className="px-10 py-4.5 border border-[#0A1018]/10 text-[#0A1018]/80 text-[10px] font-normal uppercase tracking-[0.3em] font-sans hover:bg-[#0A1018] hover:text-[#F5F0E8] transition-all rounded-[2px]">
                                        Kết nối tinh hoa →
                                    </button>
                                </a>
                            </motion.div>
                        )}

                        {/* Reviews Section */}
                        <div className="space-y-12">
                            <h2 className="text-[10px] font-normal text-[#0A1018]/60 uppercase tracking-[0.4em] flex items-center gap-4">
                                <span className="w-8 h-[0.5px] bg-[#C9A84C]/40" /> Thẩm định Tín nhiệm
                            </h2>

                            {expert.reviews && expert.reviews.length > 0 ? (
                                <div className="grid gap-8">
                                    {expert.reviews.map((review, idx) => (
                                        <motion.div
                                            key={review.id}
                                            initial={{ opacity: 0, y: 15 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.8, ease: EASING, delay: idx * 0.1 }}
                                            className="bg-white/40 p-10 border border-[#C9A84C]/10 rounded-[2px] group hover:bg-white transition-all duration-700"
                                        >
                                            <div className="flex items-start gap-8">
                                                <div className="relative flex-shrink-0">
                                                    <img
                                                        src={review.student_avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.student_full_name)}&background=FAF7F2&color=0A1018&size=80`}
                                                        alt={review.student_full_name}
                                                        className="w-14 h-14 rounded-[2px] border border-[#C9A84C]/10"
                                                    />
                                                </div>
                                                <div className="flex-1 space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-serif italic text-[24px] text-[#0A1018] font-light">{review.student_full_name}</h4>
                                                        <span className="text-[10px] text-[#0A1018]/60 font-sans uppercase tracking-[0.2em] font-normal">
                                                            {new Date(review.created_at).toLocaleDateString('vi-VN')}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} size={13} className={i < review.rating ? 'fill-[#C9A84C] text-[#C9A84C]' : 'text-[#0A1018]/5'} strokeWidth={1} />
                                                        ))}
                                                    </div>
                                                    <p className="text-[#2A1608]/80 text-[15px] font-sans font-light leading-[1.75] pt-2 tracking-[0.02em]">
                                                        "{review.comment || 'Chuyên gia xuất sắc.'}"
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-20 border border-dashed border-[#C9A84C]/20 text-center rounded-[2px]">
                                    <p className="text-[10px] text-[#0A1018]/20 uppercase tracking-[0.4em] font-sans">Khởi tạo chương mới – Hãy để đánh giá đầu tiên là của bạn.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Sidebar content (Right) ── */}
                    <div className="lg:col-span-4 space-y-8 lg:sticky lg:top-36 h-fit">

                        {/* Booking Card */}
                        <div className="bg-[#0A1018] p-12 rounded-[2px] shadow-2xl relative overflow-hidden border border-white/10">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9A84C]/5 blur-[60px] rounded-full" />

                            <div className="space-y-3 mb-12">
                                <span className="text-[12px] font-normal text-white/60 uppercase tracking-[0.2em] font-sans">Chi phí đầu tư</span>
                                <div className="flex items-baseline gap-3">
                                    <span className="text-5xl font-serif italic text-[#C9A84C]">{expert.hourly_rate}</span>
                                    <span className="text-white/70 text-[13px] font-sans uppercase tracking-[0.15em]">Xu / Giờ</span>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <Link href={`/dashboard/experts/${expert.id}/book`} className="block">
                                    <button
                                        disabled={!canBook}
                                        className="w-full py-7 bg-[#C9A84C] text-[#0A1018] font-sans text-[11px] font-normal uppercase tracking-[0.14em] rounded-[2px] transition-all duration-700 hover:bg-white hover:shadow-xl active:scale-[0.98] disabled:opacity-20 flex items-center justify-center gap-4"
                                    >
                                        {canBook ? 'Đặt lịch ngay' : 'Danh sách chờ'}
                                        {canBook && <ChevronRight size={14} strokeWidth={1} />}
                                    </button>
                                </Link>
                                <Link href={`/dashboard/chat?with=${expert.user_id}`} className="block">
                                    <button className="w-full py-7 border border-white/20 text-white/70 font-sans text-[11px] font-normal uppercase tracking-[0.14em] rounded-[2px] transition-all duration-700 hover:bg-white/5 hover:text-white flex items-center justify-center gap-4">
                                        <MessageSquare size={16} strokeWidth={1} /> Hội thoại trực tiếp
                                    </button>
                                </Link>
                            </div>

                            <div className="mt-14 space-y-7 pt-12 border-t border-white/10">
                                {[
                                    { text: 'Giao dịch Mã hóa', icon: ShieldCheck },
                                    { text: 'Hỗ trợ Toàn cầu', icon: MessageSquare },
                                    { text: 'Cam kết Tinh hoa', icon: Award }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-5 text-[11px] font-normal text-white/80 uppercase tracking-[0.15em] font-sans">
                                        <item.icon size={14} className="text-[#C9A84C]/80" strokeWidth={1.5} />
                                        {item.text}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Availability Sidebar */}
                        <div className="bg-[#FAF7F2]/60 backdrop-blur-3xl border border-[#C9A84C]/20 p-12 rounded-[2px]">
                            <h3 className="text-[13px] font-normal text-[#0A1018]/80 uppercase tracking-[0.3em] mb-10 flex items-center gap-5">
                                <span className="w-10 h-[0.5px] bg-[#C9A84C]/40" /> Thời gian trống
                            </h3>

                            {expert.availabilities.length > 0 ? (
                                <div className="space-y-4">
                                    {expert.availabilities.map(slot => (
                                        <div key={slot.id} className="flex items-center justify-between p-5 bg-white/60 border border-[#C9A84C]/5 hover:border-[#C9A84C]/30 transition-all rounded-[1px] group shadow-sm">
                                            <span className="text-[14px] font-normal text-[#0A1018]/80 uppercase tracking-[0.1em] font-sans">{DAY_NAMES[slot.day_of_week]}</span>
                                            <span className="text-[14px] font-sans text-[#C97B3A] font-medium tracking-widest bg-[#FAF7F2] px-4 py-2 rounded-[1px] border border-[#C9A84C]/10 shadow-inner">
                                                {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 grayscale opacity-30">
                                    <Calendar className="w-10 h-10 mx-auto mb-5" strokeWidth={1} />
                                    <p className="text-[11px] font-normal text-[#0A1018] uppercase tracking-[0.3em] font-sans">Chưa cập nhật</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
