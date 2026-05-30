'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { getAvatarUrl } from '@/utils/url-utils';
import {
    FileText,
    BookOpen,
    FlaskConical,
    Eye,
    Calendar,
    Search,
    SlidersHorizontal,
    ChevronRight,
    TrendingUp,
    Clock,
    Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EASING = [0.22, 1, 0.36, 1] as any;

type PostType = 'ARTICLE' | 'RESEARCH_PAPER' | 'DOCUMENT';
type SortBy = 'newest' | 'most_viewed';

interface FeedPost {
    id: number;
    expert_id: number;
    title: string;
    slug: string;
    type: PostType;
    content: string | null;
    views_count: number;
    created_at: string;
    expert_name: string;
    expert_avatar: string | null;
}

interface FeedResponse {
    items: FeedPost[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

const TYPE_CONFIG: Record<PostType, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
    ARTICLE: {
        label: 'Bài viết',
        icon: <FileText size={14} />,
        color: 'text-[#0046EA]',
        bg: 'bg-[#0046EA]/10',
    },
    RESEARCH_PAPER: {
        label: 'Nghiên cứu',
        icon: <FlaskConical size={14} />,
        color: 'text-purple-600',
        bg: 'bg-purple-50',
    },
    DOCUMENT: {
        label: 'Tài liệu',
        icon: <BookOpen size={14} />,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
    },
};

export default function ExpertPostsFeed() {
    const router = useRouter();

    const [posts, setPosts] = useState<FeedPost[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [sortBy, setSortBy] = useState<SortBy>('newest');
    const [filterType, setFilterType] = useState<PostType | ''>('');

    const LIMIT = 8;

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 400);
        return () => clearTimeout(timer);
    }, [search]);

    // Reset & refetch on filter/sort/search change
    useEffect(() => {
        setPage(1);
        setPosts([]);
        fetchFeed(1, true);
    }, [debouncedSearch, sortBy, filterType]);

    const fetchFeed = useCallback(
        async (pageNum: number, reset = false) => {
            if (reset) setLoading(true);
            else setLoadingMore(true);

            try {
                const params: Record<string, any> = {
                    page: pageNum,
                    limit: LIMIT,
                    sort_by: sortBy,
                };
                if (filterType) params.post_type = filterType;
                if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

                const { data } = await api.get<FeedResponse>('experts/feed', { params });
                setPosts(prev => (reset ? data.items : [...prev, ...data.items]));
                setTotal(data.total);
                setTotalPages(data.total_pages);
            } catch (err) {
                console.error('Failed to fetch experts feed', err);
            } finally {
                setLoading(false);
                setLoadingMore(false);
            }
        },
        [debouncedSearch, sortBy, filterType]
    );

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchFeed(nextPage);
    };

    const handleCardClick = (post: FeedPost) => {
        router.push(`/dashboard/experts/${post.expert_id}/post/${post.slug}`);
    };

    const excerpt = (content: string | null, max = 120) => {
        if (!content) return 'Không có mô tả.';
        const plain = content.replace(/[#*>\-`]/g, '').trim();
        return plain.length > max ? plain.slice(0, max) + '…' : plain;
    };

    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-[40px] p-10 shadow-lg">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-[2px] bg-[#FFE900]" />
                            <span className="text-[9px] font-black text-[#0046EA]/50 tracking-[0.5em] uppercase">
                                Expert Knowledge Hub
                            </span>
                        </div>
                        <h2 className="text-3xl font-garamond italic font-bold text-[#0046EA]">
                            Bài viết & Tài liệu Chuyên gia
                        </h2>
                        <p className="text-[11px] text-black/40 font-black uppercase tracking-[0.3em]">
                            {total > 0 ? `${total} bài viết được xuất bản` : 'Đang tải dữ liệu...'}
                        </p>
                    </div>

                    {/* Sort Buttons */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <SlidersHorizontal size={14} className="text-black/20" />
                        {([
                            { id: 'newest', label: 'Mới nhất', icon: <Clock size={12} /> },
                            { id: 'most_viewed', label: 'Xem nhiều', icon: <TrendingUp size={12} /> },
                        ] as { id: SortBy; label: string; icon: React.ReactNode }[]).map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => setSortBy(opt.id)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${
                                    sortBy === opt.id
                                        ? 'bg-[#0046EA] text-white shadow-lg shadow-[#0046EA]/20'
                                        : 'bg-white/60 text-black/40 border border-black/5 hover:border-[#0046EA]/30 hover:text-[#0046EA]'
                                }`}
                            >
                                {opt.icon}
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filter + Search Bar */}
                <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-8 border-t border-black/5">
                    {/* Type Filter */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {([
                            { id: '', label: 'Tất cả' },
                            { id: 'ARTICLE', label: 'Bài viết' },
                            { id: 'RESEARCH_PAPER', label: 'Nghiên cứu' },
                            { id: 'DOCUMENT', label: 'Tài liệu' },
                        ] as { id: PostType | ''; label: string }[]).map(f => (
                            <button
                                key={f.id}
                                onClick={() => setFilterType(f.id)}
                                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 border ${
                                    filterType === f.id
                                        ? 'bg-[#FFE900] text-[#0046EA] border-[#FFE900] shadow-sm'
                                        : 'bg-white/50 text-black/40 border-black/5 hover:border-[#0046EA]/20 hover:text-[#0046EA]'
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {/* Search Input */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Tìm kiếm bài viết..."
                            className="w-full bg-white/70 border border-black/5 rounded-full py-2.5 pl-10 pr-4 text-[11px] font-medium text-[#171716] placeholder:text-black/20 focus:outline-none focus:border-[#0046EA]/30 focus:ring-2 focus:ring-[#0046EA]/10 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Posts Grid */}
            {loading ? (
                <div className="flex justify-center py-24">
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-10 h-10 border-2 border-[#0046EA]/10 border-t-[#0046EA] rounded-full animate-spin" />
                        <p className="text-[10px] font-black text-black/30 uppercase tracking-[0.5em]">Đang tải bài viết...</p>
                    </div>
                </div>
            ) : posts.length === 0 ? (
                <div className="text-center py-24 bg-white/50 backdrop-blur-md border border-white/80 rounded-[40px]">
                    <BookOpen size={48} className="mx-auto mb-6 text-black/10" strokeWidth={1} />
                    <p className="text-[11px] font-black text-black/30 uppercase tracking-[0.5em]">
                        {debouncedSearch || filterType ? 'Không tìm thấy bài viết phù hợp' : 'Chưa có bài viết nào được xuất bản'}
                    </p>
                </div>
            ) : (
                <>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`${sortBy}-${filterType}-${debouncedSearch}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.6, ease: EASING }}
                            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6"
                        >
                            {posts.map((post, idx) => {
                                const typeInfo = TYPE_CONFIG[post.type];
                                const avatar = getAvatarUrl(post.expert_avatar, post.expert_name);
                                return (
                                    <motion.div
                                        key={post.id}
                                        initial={{ opacity: 0, y: 24 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, ease: EASING, delay: idx * 0.05 }}
                                        onClick={() => handleCardClick(post)}
                                        className="group bg-white/80 backdrop-blur-md border border-white/80 rounded-[28px] p-7 shadow-sm hover:shadow-xl hover:border-[#0046EA]/20 hover:-translate-y-1 transition-all duration-500 cursor-pointer flex flex-col gap-5"
                                    >
                                        {/* Type badge */}
                                        <div className="flex items-center justify-between">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${typeInfo.bg} ${typeInfo.color}`}>
                                                {typeInfo.icon}
                                                {typeInfo.label}
                                            </span>
                                            <ChevronRight
                                                size={14}
                                                className="text-black/20 group-hover:text-[#0046EA] group-hover:translate-x-1 transition-all duration-300"
                                            />
                                        </div>

                                        {/* Title */}
                                        <div className="flex-1">
                                            <h3 className="text-xl font-garamond italic font-bold text-[#171716] group-hover:text-[#0046EA] transition-colors leading-snug line-clamp-2 mb-3">
                                                {post.title}
                                            </h3>
                                            <p className="text-[12px] text-black/40 leading-relaxed line-clamp-3 font-dm-sans">
                                                {excerpt(post.content)}
                                            </p>
                                        </div>

                                        {/* Footer: Expert info + stats */}
                                        <div className="pt-4 border-t border-black/5 flex items-center justify-between gap-3">
                                            {/* Expert */}
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <img
                                                    src={avatar}
                                                    alt={post.expert_name}
                                                    className="w-8 h-8 rounded-full object-cover flex-shrink-0 border-2 border-white shadow-sm"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = getAvatarUrl(null, post.expert_name);
                                                    }}
                                                />
                                                <span className="text-[10px] font-black text-black/50 uppercase tracking-widest truncate">
                                                    {post.expert_name}
                                                </span>
                                            </div>

                                            {/* Stats */}
                                            <div className="flex items-center gap-3 flex-shrink-0 text-[9px] font-black text-black/30 uppercase tracking-widest">
                                                <span className="flex items-center gap-1">
                                                    <Eye size={11} />
                                                    {post.views_count}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={11} />
                                                    {new Date(post.created_at).toLocaleDateString('vi-VN')}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    </AnimatePresence>

                    {/* Load More */}
                    {page < totalPages && (
                        <div className="flex justify-center pt-4">
                            <button
                                onClick={handleLoadMore}
                                disabled={loadingMore}
                                className="flex items-center gap-3 px-10 py-4 bg-white/60 backdrop-blur-md border border-white/80 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-[#0046EA] hover:bg-[#0046EA] hover:text-white hover:border-[#0046EA] transition-all duration-700 shadow-sm disabled:opacity-50"
                            >
                                {loadingMore ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <ChevronRight size={14} />
                                )}
                                {loadingMore ? 'Đang tải...' : `Tải thêm (${total - posts.length} bài còn lại)`}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
