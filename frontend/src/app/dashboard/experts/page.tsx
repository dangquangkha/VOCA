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
    min_price?: string | number;
    max_price?: string | number;
    min_rating?: string | number;
}

const EASING: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function ExpertsMarketplacePage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [minRating, setMinRating] = useState('');

    const [experts, setExperts] = useState<Expert[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(3);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const [isLoading, setIsLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

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
                ...rest
            } = params;

            const { data } = await api.get('/experts/', {
                params: {
                    q: qValue,
                    min_price: minP,
                    max_price: maxP,
                    min_rating: minR,
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
            min_rating: minRating || undefined
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageSize, fetchExperts]);

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
        setCurrentPage(1);
        fetchExperts({
            page: 1,
            limit: pageSize,
            q: undefined,
            min_price: undefined,
            max_price: undefined,
            min_rating: undefined
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
        <div className="min-h-screen bg-[#F5F0E8] selection:bg-[#C9A84C]/20 pb-44">
            {/* Breadcrumbs */}
            <div className="bg-[#0A1018] border-b border-white/5">
                <nav className="max-w-[1400px] mx-auto px-8 py-6 flex items-center gap-4">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-[10px] font-normal text-white/50 hover:text-[#C9A84C] transition-all uppercase tracking-[0.2em] font-sans"
                    >
                        <Home size={12} strokeWidth={1.5} />
                        Trang chủ
                    </Link>
                    <ChevronRight size={10} className="text-white/10" />
                    <Link
                        href="/dashboard"
                        className="text-[10px] font-normal text-white/50 hover:text-[#C9A84C] transition-all uppercase tracking-[0.2em] font-sans"
                    >
                        Bàn làm việc
                    </Link>
                    <ChevronRight size={10} className="text-white/10" />
                    <span className="text-[10px] font-normal text-[#C9A84C] uppercase tracking-[0.2em] font-sans">Sàn Chuyên gia</span>
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
                <header className="flex flex-col md:flex-row justify-between items-end mb-16 gap-10">
                    <div className="space-y-6">
                        <motion.h2
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 1, ease: EASING }}
                            className="text-[clamp(38px,4.6vw,58px)] font-serif italic font-light text-[#0A1018] tracking-tight leading-[1.22]"
                        >
                            {searchQuery ? `Kết quả cho "${searchQuery}"` : 'Cố vấn đắc lực'}
                        </motion.h2>
                        <div className="flex items-center gap-6">
                            <p className="text-[#0A1018]/80 font-normal uppercase tracking-[0.2em] text-[10px] font-sans">
                                {isLoading ? 'Đang truy vấn dữ liệu…' : `${totalItems} nhân tài hiện hữu.`}
                            </p>
                            <span className="w-1.5 h-1.5 bg-[#C9A84C]/30 rounded-full" />
                            <Link
                                href="/dashboard/experts/explore"
                                className="text-[10px] font-normal text-[#A85C1E] uppercase tracking-[0.2em] font-sans hover:text-[#0A1018] transition-all border-b border-[#C9A84C]/20 pb-0.5"
                            >
                                Khám phá tinh hoa →
                            </Link>
                        </div>
                    </div>

                    <div className="flex items-center bg-[#FAF7F2]/80 backdrop-blur-md p-1 border border-[#C9A84C]/10 rounded-[2px] relative">
                        <motion.div
                            className="absolute bg-[#C9A84C]/10 border border-[#C9A84C]/20 rounded-[2px]"
                            style={{
                                width: '36px',
                                height: '36px',
                                top: '4px',
                            }}
                            animate={{
                                left: viewMode === 'grid' ? '4px' : '44px'
                            }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />

                        <button
                            onClick={() => setViewMode('grid')}
                            className={`relative z-10 w-9 h-9 flex items-center justify-center transition-colors duration-700 ${viewMode === 'grid' ? 'text-[#A85C1E]' : 'text-[#0A1018]/40 hover:text-[#0A1018]'}`}
                        >
                            <LayoutGrid size={16} strokeWidth={1.5} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`relative z-10 w-9 h-9 flex items-center justify-center transition-colors duration-700 ${viewMode === 'list' ? 'text-[#A85C1E]' : 'text-[#0A1018]/40 hover:text-[#0A1018]'}`}
                        >
                            <List size={16} strokeWidth={1.5} />
                        </button>
                    </div>
                </header>

                <div className="bg-[#FAF7F2]/40 backdrop-blur-3xl border border-[#C9A84C]/10 overflow-hidden min-h-[600px] flex flex-col rounded-[2px] shadow-[0_64px_128px_-16px_rgba(10,16,24,0.05)]">
                    <div className="p-8 flex-1 relative group/carousel">
                        {experts.length > 0 ? (
                            <>
                                <ExpertGrid experts={experts} isLoading={isLoading} viewMode={viewMode} />

                                {/* Carousel Navigation Buttons */}
                                <div className="hidden lg:block opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-700">
                                    <button
                                        onClick={handlePrevPage}
                                        disabled={currentPage === 1 || isLoading}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 backdrop-blur-md border border-[#C9A84C]/20 flex items-center justify-center text-[#0A1018]/80 hover:text-[#A85C1E] disabled:opacity-0 transition-all z-20 hover:scale-105 active:scale-95 rounded-full"
                                    >
                                        <ChevronLeft size={20} strokeWidth={1} />
                                    </button>
                                    <button
                                        onClick={handleNextPage}
                                        disabled={currentPage === Math.ceil(totalItems / pageSize) || isLoading}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 backdrop-blur-md border border-[#C9A84C]/20 flex items-center justify-center text-[#0A1018]/80 hover:text-[#A85C1E] disabled:opacity-0 transition-all z-20 hover:scale-105 active:scale-95 rounded-full"
                                    >
                                        <ChevronRight size={20} strokeWidth={1} />
                                    </button>
                                </div>
                            </>
                        ) : !isLoading && (
                            <ExpertEmptyState onReset={handleReset} />
                        )}
                    </div>

                    {/* Pagination */}
                    {totalItems > 0 && (
                        <ExpertPagination
                            currentPage={currentPage}
                            totalPages={Math.ceil(totalItems / pageSize)}
                            pageSize={pageSize}
                            totalItems={totalItems}
                            onPageChange={handlePageChange}
                            onPageSizeChange={handlePageSizeChange}
                        />
                    )}
                </div>
            </main>

            {/* ── Testimonials ─────────────────────────────────── */}
            <section className="max-w-[1400px] mx-auto px-8">
                <div className="bg-[#0A1018] p-16 md:p-24 text-[#F5F0E8] relative overflow-hidden rounded-[2px] border border-[#C9A84C]/20 shadow-4xl">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#C9A84C]/5 blur-[120px] rounded-full -mr-64 -mt-64" />
                    <div className="absolute bottom-0 left-0 w-full h-[0.5px] bg-gradient-to-r from-transparent via-[#C9A84C]/10 to-transparent" />

                    <div className="relative z-10 text-center mb-24 space-y-6">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.2, ease: EASING }}
                            className="text-[clamp(38px,4.6vw,58px)] font-serif italic font-light tracking-tight leading-tight"
                        >
                            Được tín nhiệm bởi <br />Hội đồng chuyên gia
                        </motion.h2>
                        <p className="text-[#A85C1E] font-normal text-[10px] uppercase tracking-[0.4em] font-sans">Lời chứng thực từ những hành trình vươn tầm</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative z-10">
                        {[
                            { name: 'Anh Tuấn', role: 'Kỹ sư Phần mềm tại Shopee', text: 'Những lời khuyên tôi nhận được chỉ trong 1 giờ tư vấn đã giúp đội ngũ kỹ thuật tiết kiệm hàng tuần nghiên cứu. Rất đáng đầu tư.' },
                            { name: 'Minh Châu', role: 'Quản lý Sản phẩm tại VNG', text: 'Tôi đã tìm được người hướng dẫn tuyệt vời cho lộ trình chuyển sang PM. Chuyên gia đưa ra các lời khuyên rất thực tế và sát với thị trường Việt Nam.' },
                            { name: 'Quang Hải', role: 'Sáng lập tại TechStartup', text: 'Là một người khởi nghiệp lần đầu, nền tảng này đã kết nối tôi với một cố vấn CTO, giúp chúng tôi tránh được những sai lầm lớn về hạ tầng ngay từ đầu.' },
                        ].map((item, idx) => (
                            <motion.div
                                key={item.name}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1, ease: EASING, delay: idx * 0.1 }}
                                className="bg-white/[0.03] backdrop-blur-xl p-10 border border-[#C9A84C]/10 flex flex-col justify-between hover:bg-white/[0.06] transition-all duration-700 group rounded-[2px]"
                            >
                                <div>
                                    <Quote className="w-10 h-10 text-[#C9A84C]/20 group-hover:text-[#C9A84C] mb-8 transition-colors duration-700" strokeWidth={1} />
                                    <p className="text-[#F5F0E8]/80 mb-10 leading-[1.60] font-serif italic text-[20px]">&ldquo;{item.text}&rdquo;</p>
                                </div>
                                <div className="flex items-center gap-6 border-t border-[#C9A84C]/10 pt-8">
                                    <div className="w-12 h-12 bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center text-[#C9A84C] font-light text-sm rounded-full">
                                        {item.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-[15px] font-normal text-[#F5F0E8] tracking-wide font-sans">{item.name}</h4>
                                        <p className="text-[9px] text-[#A85C1E] font-normal uppercase tracking-[0.2em]">{item.role}</p>
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