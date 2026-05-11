'use client';

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import Link from 'next/link';
import { Quote, LayoutGrid, List, ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { ExpertHero } from '@/components/experts/ExpertHero';
import { ExpertSearch } from '@/components/experts/ExpertSearch';
import { ExpertGrid } from '@/components/experts/ExpertGrid';
import { ExpertPagination } from '@/components/experts/ExpertPagination';
import { ExpertEmptyState } from '@/components/experts/ExpertEmptyState';
import { Expert } from '@/types/expert';

interface FetchExpertsParams {
    page?: number;
    limit?: number;
    q?: string;
    role?: string;
    min_rating?: string | number;
    min_price?: string | number;
    max_price?: string | number;
    viewMode?: 'grid' | 'list';
}

const EASING: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function ExpertsMarketplacePage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [minRating, setMinRating] = useState('');
    const [selectedRole, setSelectedRole] = useState<'ALL' | 'EXPERT' | 'MENTOR'>('ALL');

    const [experts, setExperts] = useState<Expert[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(3);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const [isLoading, setIsLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const [gritStatus, setGritStatus] = useState<{ is_grit_verified: boolean } | null>(null);

    useEffect(() => {
        const fetchGrit = async () => {
            try {
                const { data } = await api.get('roadmap/grit-status');
                setGritStatus(data);
            } catch (err) {
                console.error("Failed to fetch grit status", err);
            }
        };
        fetchGrit();
    }, []);

    const fetchExperts = useCallback(async (params: FetchExpertsParams = {}) => {
        setIsLoading(true);
        try {
            const {
                page: fetchPage,
                limit: fetchLimit,
                q: qValue,
                min_price: minP,
                max_price: maxP,
                min_rating: minR,
                role: rValue,
                ...rest
            } = params;

            const { data } = await api.get('experts', {
                params: {
                    q: qValue,
                    min_price: minP,
                    max_price: maxP,
                    min_rating: minR,
                    role: rValue === 'ALL' ? undefined : rValue,
                    page: fetchPage,
                    limit: fetchLimit,
                    ...rest
                },
            });

            startTransition(() => {
                if (data.items) {
                    setExperts(data.items);
                    setTotalItems(data.total);
                } else if (Array.isArray(data)) {
                    setExperts(data);
                    setTotalItems(data.length);
                }
                setIsLoading(false);
            });
        } catch (err) {
            console.error('Failed to fetch experts', err);
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchExperts({
            page: 1,
            limit: pageSize,
            q: searchQuery || undefined,
            min_price: minPrice || undefined,
            max_price: maxPrice || undefined,
            min_rating: minRating || undefined,
            role: selectedRole
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageSize, fetchExperts, selectedRole]);

    const handleSearch = () => {
        setCurrentPage(1);
        fetchExperts({
            page: 1,
            limit: pageSize,
            q: searchQuery || undefined,
            min_price: minPrice || undefined,
            max_price: maxPrice || undefined,
            min_rating: minRating || undefined
        });
    };

    const handleReset = () => {
        setSearchQuery('');
        setMinPrice('');
        setMaxPrice('');
        setMinRating('');
        setSelectedRole('ALL');
        setCurrentPage(1);
        fetchExperts({
            page: 1,
            limit: pageSize,
            q: undefined,
            min_price: undefined,
            max_price: undefined,
            min_rating: undefined,
            role: 'ALL'
        });
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        fetchExperts({
            page,
            limit: pageSize,
            q: searchQuery || undefined,
            min_price: minPrice || undefined,
            max_price: maxPrice || undefined,
            min_rating: minRating || undefined
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePrevPage = () => {
        if (currentPage > 1) handlePageChange(currentPage - 1);
    };

    const handleNextPage = () => {
        if (currentPage < Math.ceil(totalItems / pageSize)) handlePageChange(currentPage + 1);
    };

    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize);
        setCurrentPage(1);
        fetchExperts({
            page: 1,
            limit: newSize,
            q: searchQuery || undefined,
            min_price: minPrice || undefined,
            max_price: maxPrice || undefined,
            min_rating: minRating || undefined
        });
    };

    return (
        <div className="min-h-screen bg-transparent selection:bg-[#0046EA]/20 pb-44">
            {/* Breadcrumbs */}
            <div className="bg-transparent border-b border-[#0F0C17]/10">
                <nav className="max-w-[1400px] mx-auto px-8 py-6 flex items-center gap-4">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-[10px] font-bold text-[#0F0C17]/40 hover:text-[#0046EA] transition-all uppercase tracking-[0.2em] font-sans"
                    >
                        <Home size={12} strokeWidth={1.5} />
                        Trang chủ
                    </Link>
                    <ChevronRight size={10} className="text-[#0F0C17]/20" />
                    <Link
                        href="/dashboard"
                        className="text-[10px] font-bold text-[#0F0C17]/40 hover:text-[#0046EA] transition-all uppercase tracking-[0.2em] font-sans"
                    >
                        Bàn làm việc
                    </Link>
                    <ChevronRight size={10} className="text-[#0F0C17]/20" />
                    <span className="text-[10px] font-bold text-[#0046EA] uppercase tracking-[0.2em] font-sans">Sàn Chuyên gia</span>
                </nav>
            </div>

            {/* ── Hero ── */}
            <ExpertHero />

            {/* ── Search Bar (Floating) ── */}
            <ExpertSearch
                value={searchQuery}
                onChange={setSearchQuery}
                onSearch={handleSearch}
                isPending={isPending || isLoading}
                minPrice={minPrice}
                maxPrice={maxPrice}
                minRating={minRating}
                onMinPriceChange={setMinPrice}
                onMaxPriceChange={setMaxPrice}
                onMinRatingChange={setMinRating}
                onReset={handleReset}
            />

            {/* ── Experts Grid & Pagination Container ── */}
            <main className="max-w-[1400px] mx-auto px-8 mb-44">
                <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-16 gap-10">
                    <div className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 1, ease: EASING }}
                        >
                            <nav className="flex items-center gap-3 mb-4">
                                <span className="w-8 h-px bg-[#FFE900]" />
                                <span className="text-[10px] font-black text-[#FFE900] uppercase tracking-[0.4em]">Tinh hoa Hội tụ</span>
                            </nav>
                            <h2 className="text-[clamp(40px,5vw,64px)] font-garamond italic font-bold text-[#171716] tracking-tight leading-none">
                                {searchQuery ? `Kết quả cho "${searchQuery}"` : 'Cố vấn đắc lực'}
                            </h2>
                        </motion.div>
                        
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                            <p className="text-black/30 font-black uppercase tracking-[0.2em] text-[10px]">
                                {isLoading ? 'Đang truy vấn tinh hoa…' : `${totalItems} nhân tài phù hợp`}
                            </p>

                            {/* Role Switcher Tabs - Shinkai Style */}
                            <div className="flex items-center gap-1 p-1 bg-[#FFE900] rounded-2xl border border-[#FFE900]">
                                {[
                                    { id: 'ALL', label: 'Tất cả' },
                                    { id: 'EXPERT', label: 'Chuyên gia' },
                                    { id: 'MENTOR', label: 'Cố vấn' }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setSelectedRole(tab.id as any)}
                                        className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all duration-500 rounded-xl ${selectedRole === tab.id
                                            ? 'bg-[#0046EA] text-white shadow-lg shadow-blue-500/20'
                                            : 'text-[#0046EA]/40 hover:text-[#0046EA] hover:bg-white'
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 bg-[#FFE900] p-1.5 rounded-2xl border border-[#FFE900] relative">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-[#0046EA] shadow-sm' : 'text-[#0046EA]/20 hover:text-[#0046EA]'}`}
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-[#0046EA] shadow-sm' : 'text-[#0046EA]/20 hover:text-[#0046EA]'}`}
                        >
                            <List size={18} />
                        </button>
                    </div>
                </header>

                <div className="bg-white border border-black/5 overflow-hidden min-h-[600px] flex flex-col rounded-[48px] shadow-sm relative">
                    <div className="p-10 flex-1 relative group/carousel">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#0046EA]/5 blur-[80px] rounded-full -mr-32 -mt-32" />
                        
                        {experts.length > 0 ? (
                            <>
                                <ExpertGrid experts={experts} isLoading={isLoading} viewMode={viewMode} />

                                {/* Carousel Navigation - Premium Styling */}
                                <div className="hidden lg:block opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-700">
                                    <button
                                        onClick={handlePrevPage}
                                        disabled={currentPage === 1 || isLoading}
                                        className="absolute -left-6 top-1/2 -translate-y-1/2 w-14 h-14 bg-white border border-black/5 flex items-center justify-center text-black/20 hover:text-[#0046EA] disabled:opacity-0 transition-all z-20 hover:scale-110 active:scale-95 rounded-full shadow-xl"
                                    >
                                        <ChevronLeft size={24} />
                                    </button>
                                    <button
                                        onClick={handleNextPage}
                                        disabled={currentPage === Math.ceil(totalItems / pageSize) || isLoading}
                                        className="absolute -right-6 top-1/2 -translate-y-1/2 w-14 h-14 bg-white border border-black/5 flex items-center justify-center text-black/20 hover:text-[#0046EA] disabled:opacity-0 transition-all z-20 hover:scale-110 active:scale-95 rounded-full shadow-xl"
                                    >
                                        <ChevronRight size={24} />
                                    </button>
                                </div>
                            </>
                        ) : !isLoading && (
                            <ExpertEmptyState onReset={handleReset} />
                        )}
                    </div>

                    {/* Pagination - Professional Styling */}
                    {totalItems > 0 && (
                        <div className="bg-[#F5F8FF] border-t border-black/5">
                            <ExpertPagination
                                currentPage={currentPage}
                                totalPages={Math.ceil(totalItems / pageSize)}
                                pageSize={pageSize}
                                totalItems={totalItems}
                                onPageChange={handlePageChange}
                                onPageSizeChange={handlePageSizeChange}
                            />
                        </div>
                    )}
                </div>
            </main>

            {/* ── Testimonials ── */}
            <section className="max-w-[1400px] mx-auto px-8">
                <div className="bg-[#0046EA] p-20 md:p-32 text-white relative overflow-hidden rounded-[60px] shadow-2xl">
                    {/* Animated Background Elements */}
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/10 blur-[150px] rounded-full -mr-96 -mt-96" />
                    <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent" />
                    <div className="absolute top-1/4 left-10 w-2 h-2 bg-[#FFE900] rounded-full animate-ping" />
                    <div className="absolute bottom-1/4 right-10 w-2 h-2 bg-[#00A4FD] rounded-full animate-pulse" />

                    <div className="relative z-10 text-center mb-24 space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="flex flex-col items-center gap-6"
                        >
                            <span className="text-[#FFE900] font-black text-[10px] uppercase tracking-[0.5em]">Kinh nghiệm Thực chứng</span>
                            <h2 className="text-[clamp(40px,5vw,72px)] font-garamond italic font-bold tracking-tight leading-none">
                                Được tín nhiệm bởi <br />Hội đồng chuyên gia
                            </h2>
                            <div className="w-20 h-1 bg-[#FFE900] rounded-full" />
                        </motion.div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative z-10">
                        {[
                            { name: 'Anh Tuấn', role: 'Kỹ sư Phần mềm tại Shopee', text: 'Những lời khuyên tôi nhận được chỉ trong 1 giờ tư vấn đã giúp đội ngũ kỹ thuật tiết kiệm hàng tuần nghiên cứu. Rất đáng đầu tư.' },
                            { name: 'Minh Châu', role: 'Quản lý Sản phẩm tại VNG', text: 'Tôi đã tìm được người hướng dẫn tuyệt vời cho lộ trình chuyển sang PM. Chuyên gia đưa ra các lời khuyên rất thực tế.' },
                            { name: 'Quang Hải', role: 'Sáng lập tại TechStartup', text: 'Là một người khởi nghiệp lần đầu, nền tảng này đã kết nối tôi với một cố vấn CTO cực kỳ tài năng.' },
                        ].map((item, idx) => (
                            <motion.div
                                key={item.name}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-white/10 backdrop-blur-xl p-12 border border-white/20 flex flex-col justify-between hover:bg-white/20 transition-all group rounded-[40px] shadow-xl"
                            >
                                <div className="space-y-8">
                                    <Quote className="w-12 h-12 text-[#FFE900] opacity-20 group-hover:opacity-100 transition-opacity" />
                                    <p className="text-white text-xl font-garamond italic leading-relaxed">&ldquo;{item.text}&rdquo;</p>
                                </div>
                                <div className="flex items-center gap-6 mt-12 pt-8 border-t border-white/10">
                                    <div className="w-14 h-14 bg-white text-[#0046EA] rounded-2xl flex items-center justify-center font-bold text-lg shadow-lg">
                                        {item.name[0]}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black uppercase tracking-widest text-white">{item.name}</h4>
                                        <p className="text-[9px] text-white/50 font-black uppercase tracking-widest mt-1">{item.role}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}