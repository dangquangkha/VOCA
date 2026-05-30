'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Star, ShieldCheck, Linkedin, MessageSquare, ChevronRight, ArrowLeft, Quote, Heart, AlertTriangle, Calendar, Award, BookOpen, FileText } from 'lucide-react';
import api from '@/lib/api';
import { Expert } from '@/types/expert';
import { motion, AnimatePresence } from 'framer-motion';
import { getAvatarUrl } from '@/utils/url-utils';

const DAY_NAMES = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
const EASING: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function ExpertProfilePage() {
    const params = useParams();
    const router = useRouter();
    const [expert, setExpert] = useState<Expert | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [requiredQuiz, setRequiredQuiz] = useState<{ id: number; title: string } | null>(null);
    const [hasCompletedRequired, setHasCompletedRequired] = useState(false);
    const [showQuizModal, setShowQuizModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PORTFOLIO'>('OVERVIEW');
    const [posts, setPosts] = useState<any[]>([]);

    useEffect(() => {
        if (params.id) {
            fetchExpert(params.id as string);
            checkRequiredQuiz(params.id as string);
            fetchPosts(params.id as string);
        }
    }, [params.id]);

    const fetchPosts = async (id: string) => {
        try {
            const { data } = await api.get(`experts/${id}/posts`);
            if (data && data.items) {
                setPosts(data.items);
            }
        } catch (err) {
            console.error("Failed to fetch posts", err);
        }
    };

    const checkRequiredQuiz = async (expertId: string) => {
        try {
            const { data } = await api.get(`experts/quizzes/expert/${expertId}`);
            const required = data.find((q: any) => q.is_required_for_booking && q.is_active);
            if (required) {
                setRequiredQuiz({ id: required.id, title: required.title });
                const statusRes = await api.get(`experts/quizzes/${required.id}/check-completed`);
                setHasCompletedRequired(statusRes.data.completed);
            }
        } catch (err) {
            console.error("Failed to check required quiz", err);
        }
    };

    const fetchExpert = async (id: string) => {
        setIsLoading(true);
        try {
            const { data } = await api.get(`experts/${id}`);
            setExpert(data);
        } catch {
            setError('Không thể tải thông tin chuyên gia. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="flex flex-col items-center gap-8">
                <div className="w-12 h-12 border-2 border-black/5 border-t-[#0046EA] rounded-full animate-spin" />
                <p className="text-black/30 font-black uppercase tracking-[0.5em] text-[10px] font-dm-sans">TRUY VẤN TINH HOA...</p>
            </div>
        </div>
    );

    if (error || !expert) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center p-16 bg-[#F5F8FF] rounded-[64px] border border-black/5 max-w-lg mx-4 shadow-2xl"
            >
                <div className="text-6xl mb-8 opacity-20 italic font-garamond text-[#0046EA]">Aura</div>
                <h2 className="text-3xl font-garamond italic font-bold text-[#171716] mb-6">Nhân tài chưa hiển thị</h2>
                <p className="text-black/40 font-dm-sans font-black mb-12 leading-relaxed text-[11px] uppercase tracking-[0.3em]">{error || 'Hồ sơ chuyên gia không tồn tại hoặc đã bị gỡ bỏ.'}</p>
                <Link href="/dashboard/experts">
                    <button className="w-full bg-[#0046EA] text-[#FFE900] rounded-full py-6 gap-4 font-dm-sans text-[11px] font-black uppercase tracking-[0.4em] flex items-center justify-center transition-all hover:bg-[#171716] shadow-xl">
                        <ArrowLeft className="w-4 h-4" strokeWidth={2.5} /> QUAY LẠI SÀN CHUYÊN GIA
                    </button>
                </Link>
            </motion.div>
        </div>
    );

    const tagList = expert.tags ? expert.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    const avatarSrc = getAvatarUrl(expert.user?.avatar_url, expert.user?.full_name);
    const canBook = expert.availabilities.length > 0;
    const isMentor = expert.user?.role === 'MENTOR';

    return (
        <div className="min-h-screen bg-white selection:bg-[#0046EA]/20 pb-44 font-dm-sans">
            {/* Breadcrumb */}
            <div className="bg-white border-b border-black/5 sticky top-0 z-[30]">
                <nav className="max-w-[1400px] mx-auto px-8 py-6 flex items-center gap-4">
                    <Link href="/" className="text-[10px] font-black text-black/30 hover:text-[#0046EA] transition-all uppercase tracking-[0.2em]">TRANG CHỦ</Link>
                    <ChevronRight size={10} className="text-black/10" />
                    <Link href="/dashboard" className="text-[10px] font-black text-black/30 hover:text-[#0046EA] transition-all uppercase tracking-[0.2em]">BÀN LÀM VIỆC</Link>
                    <ChevronRight size={10} className="text-black/10" />
                    <Link href="/dashboard/experts" className="text-[10px] font-black text-black/30 hover:text-[#0046EA] transition-all uppercase tracking-[0.2em]">CỐ VẤN</Link>
                    <ChevronRight size={10} className="text-black/10" />
                    <span className="text-[10px] font-black text-[#0046EA] uppercase tracking-[0.2em] truncate max-w-[200px]">{expert.user?.full_name}</span>
                </nav>
            </div>

            {/* Hero Section */}
            <section className="bg-[#0046EA] pt-32 pb-44 px-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(0,164,253,0.4)_0%,transparent_70%)]" />
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent" />
                <div className="max-w-[1400px] mx-auto relative z-10">
                    <div className="grid lg:grid-cols-12 gap-20 items-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1.2, ease: EASING }}
                            className="lg:col-span-4 justify-self-center lg:justify-self-start"
                        >
                            <div className="relative group">
                                <div className="shinkai-avatar-glow w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden shadow-2xl">
                                    <img 
                                        src={avatarSrc} 
                                        alt={expert.user?.full_name} 
                                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = getAvatarUrl(null, expert.user?.full_name);
                                        }}
                                    />
                                </div>
                                {expert.kyc_status === 'APPROVED' && (
                                    <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-[#FFE900] border-4 border-[#0046EA] flex items-center justify-center shadow-xl rounded-full z-20">
                                        <ShieldCheck className="w-8 h-8 text-[#0046EA]" strokeWidth={2.5} />
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 1.2, ease: EASING, delay: 0.1 }}
                            className="lg:col-span-8 space-y-10"
                        >
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-[2px] bg-[#FFE900]" />
                                    <span className="text-[10px] text-[#FFE900] tracking-[0.5em] font-black uppercase">THE ELITE PROTOCOL</span>
                                </div>
                                <h1 className="text-[clamp(48px,6vw,96px)] font-garamond italic text-white tracking-tight leading-[1.05] font-bold">
                                    {expert.user?.full_name}
                                </h1>
                                {tagList.length > 0 && (
                                    <div className="flex flex-wrap gap-3">
                                        {tagList.slice(0, 4).map(tag => (
                                            <span key={tag} className="px-5 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-16 pt-8">
                                <div className="space-y-3">
                                    <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">HỆ SỐ TÍN NHIỆM</p>
                                    <div className="flex items-center gap-4">
                                        <span className="text-6xl font-garamond italic text-white font-bold">{expert.rating.toFixed(2)}</span>
                                        <div className="flex flex-col">
                                            <div className="flex gap-1">
                                                {[...Array(5)].map((_, i) => <Star key={i} size={12} className="fill-[#FFE900] text-[#FFE900]" />)}
                                            </div>
                                            <span className="text-[10px] text-white/60 font-black uppercase tracking-widest mt-1">{expert.total_reviews} REVIEWS</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-px h-16 bg-white/10" />
                                <div className="space-y-3">
                                    <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">KINH NGHIỆM THỰC CHIẾN</p>
                                    <div className="flex items-baseline gap-3">
                                        <span className="text-6xl font-garamond italic text-white font-bold">{expert.experience_years}</span>
                                        <span className="text-2xl font-garamond italic text-white/40 uppercase tracking-widest">NĂM</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            <div className="max-w-[1400px] mx-auto px-8 -mt-24 relative z-20">
                <div className="grid lg:grid-cols-12 gap-16">
                    {/* Main Content (Left) */}
                    <div className="lg:col-span-8 space-y-12">
                        {/* Custom Tabs */}
                        <div className="flex flex-wrap gap-4 border-b border-black/5 pb-6">
                            <button 
                                onClick={() => setActiveTab('OVERVIEW')}
                                className={`text-[12px] uppercase tracking-[0.2em] px-6 py-3.5 rounded-xl transition-all duration-300 ${
                                    activeTab === 'OVERVIEW' 
                                        ? 'bg-[#FFE900] text-[#0046EA] hover:text-red-600 font-black shadow-lg scale-105 border-2 border-white' 
                                        : 'bg-[#FFE900]/80 text-[#0046EA] hover:text-red-600 font-bold opacity-90 border-2 border-transparent'
                                }`}
                            >
                                TỔNG QUAN
                            </button>
                            <button 
                                onClick={() => setActiveTab('PORTFOLIO')}
                                className={`text-[12px] uppercase tracking-[0.2em] px-6 py-3.5 rounded-xl transition-all duration-300 ${
                                    activeTab === 'PORTFOLIO' 
                                        ? 'bg-[#FFE900] text-[#0046EA] hover:text-red-600 font-black shadow-lg scale-105 border-2 border-white' 
                                        : 'bg-[#FFE900]/80 text-[#0046EA] hover:text-red-600 font-bold opacity-90 border-2 border-transparent'
                                }`}
                            >
                                BÀI VIẾT & TÀI LIỆU
                            </button>
                        </div>

                        {activeTab === 'OVERVIEW' ? (
                            <div className="space-y-20">
                                <motion.div
                                    initial={{ opacity: 0, y: 40 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                            className="bg-white border border-black/5 p-12 md:p-20 rounded-[64px] shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#0046EA]/5 blur-[100px] rounded-full -mr-64 -mt-64" />
                            <h2 className="text-[11px] font-black text-[#171716] uppercase tracking-[0.5em] mb-16 flex items-center gap-6">
                                <span className="w-12 h-px bg-[#0046EA]" /> SỨ MỆNH & TẦM NHÌN
                            </h2>
                            <div className="relative">
                                <Quote className="absolute -top-12 -left-12 w-24 h-24 text-[#0046EA]/5" />
                                <p className="text-[#171716] text-[22px] font-garamond italic leading-[1.8] whitespace-pre-line pl-8 border-l-4 border-[#0046EA]">
                                    {expert.bio || 'Hành trình vĩ đại luôn bắt đầu từ những bước chân thầm lặng. Chuyên gia đang hoàn thiện hồ sơ tinh hoa.'}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3 mt-20">
                                {tagList.map(tag => (
                                    <span key={tag} className="px-6 py-2.5 bg-[#F5F8FF] text-[#0046EA] text-[10px] font-black uppercase tracking-widest border border-black/5 rounded-full hover:bg-[#0046EA] hover:text-[#FFE900] transition-all cursor-default shadow-sm">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </motion.div>

                        {/* LinkedIn */}
                        {expert.linkedin_url && (
                            <motion.div
                                whileHover={{ scale: 1.01 }}
                                className="bg-[#F5F8FF] border border-black/5 p-12 flex flex-col md:flex-row items-center justify-between gap-10 rounded-[48px] group transition-all shadow-sm"
                            >
                                <div className="flex items-center gap-10">
                                    <div className="w-20 h-20 bg-[#0077b5] text-white flex items-center justify-center rounded-[24px] shadow-xl shadow-blue-500/20 group-hover:rotate-6 transition-transform">
                                        <Linkedin className="w-10 h-10" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-garamond italic font-bold text-[#171716]">Mạng lưới Chuyên nghiệp</h3>
                                        <p className="text-[10px] font-black text-black/30 uppercase tracking-[0.4em] mt-1">HỒ SƠ LINKEDIN ĐÃ XÁC THỰC</p>
                                    </div>
                                </div>
                                <a href={expert.linkedin_url} target="_blank" rel="noopener noreferrer" className="h-16 px-12 bg-white border border-black/10 text-black text-[11px] font-black uppercase tracking-[0.4em] rounded-full flex items-center justify-center hover:bg-[#171716] hover:text-[#FFE900] transition-all duration-700 shadow-sm">
                                    KẾT NỐI TINH HOA →
                                </a>
                            </motion.div>
                        )}

                        {/* Reviews */}
                        <div className="space-y-12">
                            <h2 className="text-[11px] font-black text-black/40 uppercase tracking-[0.5em] flex items-center gap-6">
                                <span className="w-12 h-px bg-black/10" /> THẨM ĐỊNH TÍN NHIỆM
                            </h2>

                            <div className="grid gap-12">
                                {expert.reviews && expert.reviews.length > 0 ? (
                                    expert.reviews.map((review, idx) => (
                                        <motion.div
                                            key={review.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="bg-[#00A4FD] p-12 border-[6px] border-[#00A4FD] rounded-0 shadow-sm hover:shadow-2xl hover:bg-[#D20048] hover:border-[#D20048] transition-all group"
                                        >
                                            <div className="flex items-start gap-10">
                                                <div className="relative shrink-0">
                                                    <img
                                                        src={getAvatarUrl(review.student_avatar_url, review.student_full_name)}
                                                        alt={review.student_full_name}
                                                        className="w-20 h-20 rounded-0 object-cover border-[4px] border-white/20"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = getAvatarUrl(null, review.student_full_name);
                                                        }}
                                                    />
                                                </div>
                                                <div className="flex-1 space-y-5">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-garamond italic text-3xl font-bold text-white">{review.student_full_name}</h4>
                                                        <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">
                                                            {new Date(review.created_at).toLocaleDateString('vi-VN')}
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} size={14} className={i < review.rating ? 'fill-[#FFE900] text-[#FFE900]' : 'text-white/20'} />
                                                        ))}
                                                    </div>
                                                    <p className="text-white text-[21px] font-garamond italic leading-relaxed">
                                                        "{review.comment || 'Một buổi tư vấn vô cùng giá trị và khai sáng.'}"
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="p-24 border-2 border-dashed border-black/5 text-center rounded-[64px] bg-[#F5F8FF]">
                                        <p className="text-[11px] text-black/30 font-black uppercase tracking-[0.5em]">CHƯA CÓ THẨM ĐỊNH — HÃY LÀ NGƯỜI ĐẦU TIÊN GHI DẤU</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    ) : (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {posts.length > 0 ? (
                                    <div className="grid gap-6">
                                        {posts.map(post => (
                                            <Link href={`/dashboard/experts/${expert.id}/post/${post.slug}`} key={post.id}>
                                                <div className="bg-white border border-black/5 p-8 rounded-2xl hover:border-[#0046EA] hover:shadow-lg transition-all group flex items-start gap-6 cursor-pointer">
                                                    <div className={`p-4 rounded-xl ${post.type === 'ARTICLE' ? 'bg-blue-50 text-[#0046EA]' : 'bg-purple-50 text-purple-600'}`}>
                                                        {post.type === 'DOCUMENT' ? <BookOpen size={24} /> : <FileText size={24} />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="text-2xl font-serif italic font-bold text-[#171716] group-hover:text-[#0046EA] transition-colors mb-2">{post.title}</h3>
                                                        <p className="text-gray-500 line-clamp-2 text-sm leading-relaxed">{post.content ? post.content.substring(0, 150) + '...' : 'Không có mô tả'}</p>
                                                        <div className="flex items-center gap-4 mt-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                            <span>{new Date(post.created_at).toLocaleDateString('vi-VN')}</span>
                                                            <span>•</span>
                                                            <span>{post.views_count} LƯỢT XEM</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-24 bg-[#F5F8FF] rounded-[48px] border border-dashed border-black/10">
                                        <BookOpen className="w-16 h-16 mx-auto mb-6 text-black/10" strokeWidth={1} />
                                        <p className="text-[11px] font-black text-black/30 uppercase tracking-[0.5em]">CHUYÊN GIA CHƯA ĐĂNG BÀI VIẾT NÀO</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sidebar Content (Right) */}
                    <div className="lg:col-span-4 space-y-12 lg:sticky lg:top-36 h-fit">
                        {/* Booking Card */}
                        <div className="bg-[#171716] p-12 rounded-[64px] shadow-2xl relative overflow-hidden text-white border border-white/5">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#0046EA]/20 blur-[100px] rounded-full -mr-32 -mt-32" />
                            <div className="relative z-10 space-y-12">
                                <div className="space-y-4">
                                    {isMentor ? (
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-4 px-6 py-3 bg-white/10 rounded-full w-fit border border-white/10">
                                                <Heart className="w-4 h-4 text-[#FFE900]" />
                                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FFE900]">CỐ VẤN CỘNG ĐỒNG</span>
                                            </div>
                                            <p className="text-white/60 text-lg italic font-garamond leading-relaxed">Đặt lịch miễn phí · Lan tỏa giá trị tinh thần</p>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">MỨC ĐẦU TƯ ĐỀ XUẤT</p>
                                            <div className="flex items-baseline gap-4">
                                                <span className="text-7xl font-garamond italic font-bold text-[#FFE900] tracking-tighter">{expert.hourly_rate}</span>
                                                <span className="text-xl font-garamond italic text-white/40 uppercase tracking-widest">CREDITS / H</span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    {canBook && requiredQuiz && !hasCompletedRequired ? (
                                        <button
                                            onClick={() => setShowQuizModal(true)}
                                            className="group relative w-full h-20 bg-[#0046EA] text-[#FFE900] font-black uppercase tracking-[0.5em] text-[11px] rounded-full shadow-2xl hover:bg-white hover:text-[#0046EA] transition-all duration-700 overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                            <span className="relative z-10 flex items-center justify-center gap-4">ĐẶT LỊCH NGAY <ChevronRight size={16} /></span>
                                        </button>
                                    ) : (
                                        <Link href={`/dashboard/experts/${expert.id}/book`} className="block">
                                            <button
                                                disabled={!canBook}
                                                className="group relative w-full h-20 bg-[#0046EA] text-[#FFE900] font-black uppercase tracking-[0.5em] text-[11px] rounded-full shadow-2xl hover:bg-white hover:text-[#0046EA] transition-all duration-700 overflow-hidden disabled:opacity-20"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                                <span className="relative z-10 flex items-center justify-center gap-4">
                                                    {canBook ? 'ĐẶT LỊCH NGAY' : 'HẾT LỊCH TRỐNG'}
                                                    {canBook && <ChevronRight size={16} />}
                                                </span>
                                            </button>
                                        </Link>
                                    )}
                                    
                                    <Link href={`/dashboard/chat?with=${expert.user_id}`} className="block">
                                        <button className="w-full h-16 border border-white/10 text-white/40 font-black uppercase tracking-[0.3em] text-[10px] rounded-full hover:bg-white/5 hover:text-white transition-all flex items-center justify-center gap-4">
                                            <MessageSquare size={16} /> NHẮN TIN TRỰC TIẾP
                                        </button>
                                    </Link>
                                </div>

                                <div className="pt-10 border-t border-white/10 space-y-6">
                                    {[
                                        { text: 'GIAO DỊCH AN TOÀN 100%', icon: ShieldCheck },
                                        { text: 'HỖ TRỢ 24/7 TẬN TÂM', icon: MessageSquare },
                                        { text: 'CAM KẾT CHẤT LƯỢNG TINH HOA', icon: Award }
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-4 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">
                                            <item.icon size={14} className="text-[#00A4FD]" />
                                            {item.text}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Availability */}
                        <div className="bg-[#F5F8FF] border border-black/5 p-12 rounded-[64px] shadow-sm">
                            <h3 className="text-[11px] font-black text-[#171716] uppercase tracking-[0.5em] mb-12 flex items-center gap-5">
                                <div className="w-2 h-2 rounded-full bg-[#0046EA] shadow-[0_0_10px_#0046EA]" /> KHUNG GIỜ VÀNG
                            </h3>

                            {expert.availabilities.length > 0 ? (
                                <div className="space-y-4">
                                    {expert.availabilities.map(slot => (
                                        <div key={slot.id} className="flex items-center justify-between p-6 bg-white border border-black/5 rounded-[28px] group hover:border-[#0046EA] hover:shadow-lg transition-all duration-500">
                                            <span className="text-[12px] font-black text-black/40 uppercase tracking-[0.2em]">{DAY_NAMES[slot.day_of_week]}</span>
                                            <span className="text-[14px] font-bold text-[#0046EA] tabular-nums tracking-wider">
                                                {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16">
                                    <Calendar className="w-16 h-16 mx-auto mb-6 text-black/5" strokeWidth={1} />
                                    <p className="text-[10px] font-black text-black/20 uppercase tracking-[0.5em]">LỊCH TRÌNH ĐANG CẬP NHẬT</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quiz Modal */}
            <AnimatePresence>
                {showQuizModal && requiredQuiz && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowQuizModal(false)}
                            className="absolute inset-0 bg-[#0046EA]/20 backdrop-blur-3xl"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-xl bg-white border border-black/5 p-16 rounded-[64px] shadow-2xl text-center"
                        >
                            <div className="w-24 h-24 bg-[#FFE900] rounded-full flex items-center justify-center text-[#0046EA] mx-auto mb-12 shadow-2xl shadow-yellow-500/20">
                                <AlertTriangle className="w-12 h-12" strokeWidth={2.5} />
                            </div>
                            <h3 className="text-4xl font-garamond italic font-bold text-[#171716] mb-6">Giao thức bắt buộc</h3>
                            <p className="text-[#171716]/60 text-[20px] font-garamond italic leading-relaxed mb-16">
                                Chuyên gia {expert.user?.full_name} yêu cầu bạn hoàn thành khảo sát <span className="text-[#0046EA] font-bold">"{requiredQuiz.title}"</span> để tối ưu hóa buổi tư vấn sắp tới.
                            </p>
                            <div className="flex flex-col gap-4">
                                <button 
                                    onClick={() => router.push(`/dashboard/roadmap/quiz/${requiredQuiz.id}`)}
                                    className="w-full h-20 bg-[#171716] text-[#FFE900] font-black uppercase tracking-[0.5em] text-[11px] rounded-full hover:bg-[#0046EA] transition-all duration-700 shadow-xl"
                                >
                                    BẮT ĐẦU KHẢO SÁT NGAY
                                </button>
                                <button 
                                    onClick={() => setShowQuizModal(false)}
                                    className="text-[10px] font-black text-black/30 uppercase tracking-[0.4em] hover:text-black transition-all py-4"
                                >
                                    ĐỂ THỰC HIỆN SAU
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
