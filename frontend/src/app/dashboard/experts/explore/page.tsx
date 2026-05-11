'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ExpertExploreHero } from '@/components/experts/explore/ExpertExploreHero';
import { ExpertExploreSidebar } from '@/components/experts/explore/ExpertExploreSidebar';
import { ExpertExploreGrid } from '@/components/experts/explore/ExpertExploreGrid';
import { ExpertPagination } from '@/components/experts/ExpertPagination';
import { ExpertEmptyState } from '@/components/experts/ExpertEmptyState';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { Expert } from '@/types/expert';
import { EnhancedExpert } from '@/components/experts/explore/ExpertExploreCard';
import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';

const EASING: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Mock Enrichment Helpers
const mockEnrichExpert = (expert: Expert): EnhancedExpert => {
    // Use expert ID as a seed for consistent mocking
    const seed = expert.id;

    const industries = ['IT', 'Marketing'];
    const industry = industries[seed % 2];

    const tiers: Array<'peer' | 'pro' | 'elite'> = ['peer', 'pro', 'elite'];
    let tier = tiers[seed % 3];

    // Logic adjustment: Higher price/XP leads to higher tier
    if (expert.hourly_rate > 500 || expert.experience_years > 8) tier = 'elite';
    else if (expert.hourly_rate > 200 || expert.experience_years > 3) tier = 'pro';

    const itTitles = ['Frontend Developer', 'Backend Engineer', 'Solutions Architect', 'Data Scientist', 'Mobile Dev', 'Security Specialist'];
    const marketingTitles = ['Growth Marketer', 'Content Strategist', 'SEO Manager', 'Brand Lead', 'Performance Ads Expert', 'Marketing Director'];

    const title = industry === 'IT' ? itTitles[seed % itTitles.length] : marketingTitles[seed % marketingTitles.length];

    const itSkills = ['React', 'NodeJS', 'Python', 'AWS', 'Flutter', 'NextJS', 'PostgreSQL', 'Docker'];
    const marketingSkills = ['Facebook Ads', 'Google Analytics', 'Copywriting', 'SEO', 'Email Marketing', 'CRM', 'Tiktok Ads'];

    const pool = industry === 'IT' ? itSkills : marketingSkills;
    const skills = [pool[seed % pool.length], pool[(seed + 1) % pool.length], pool[(seed + 2) % pool.length]];

    return {
        ...expert,
        jobTitle: expert.bio?.split('.')[0] || `${title} @ Global Tech`, // Use bio if exists as fallback
        tier,
        isOnline: seed % 4 !== 0, // 75% online
        skills,
    };
};

export default function ExpertExplorePage() {
    // State
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('default');
    const [industry, setIndustry] = useState<'it' | 'marketing'>('it');
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
    const [selectedTiers, setSelectedTiers] = useState<string[]>([]);
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);
    const [minRating, setMinRating] = useState(0);

    const [experts, setExperts] = useState<EnhancedExpert[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(3);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch Logic
    const fetchExperts = useCallback(async () => {
        setIsLoading(true);
        try {
            // Map industry and skills to tags for backend filtering
            const tags = [industry, ...selectedSkills].filter(Boolean).join(',');
            
            const { data } = await api.get('experts', {
                params: {
                    q: searchQuery || undefined,
                    tag: tags || undefined,
                    min_price: priceRange[0],
                    max_price: priceRange[1],
                    min_rating: minRating || undefined,
                    sort_by: sortBy !== 'default' ? sortBy : undefined,
                    page: currentPage,
                    limit: pageSize
                }
            });

            const rawItems = data.items || (Array.isArray(data) ? data : []);
            const enrichedItems = rawItems.map(mockEnrichExpert);

            setExperts(enrichedItems);
            // Support both 'total' and 'total_items' from backend
            setTotalItems(data.total_items || data.total || enrichedItems.length);
        } catch (err) {
            console.error('Failed to fetch explore experts', err);
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery, priceRange, minRating, currentPage, pageSize, industry, selectedSkills, sortBy]);

    useEffect(() => {
        fetchExperts();
    }, [fetchExperts]);

    // Handlers
    const handleToggleSkill = (skill: string) => {
        setSelectedSkills(prev =>
            prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
        );
    };

    const handleToggleTier = (tier: string) => {
        setSelectedTiers(prev =>
            prev.includes(tier) ? prev.filter(t => t !== tier) : [...prev, tier]
        );
    };

    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize);
        setCurrentPage(1);
    };

    const handleReset = () => {
        setSearchQuery('');
        setSortBy('default');
        setIndustry('it');
        setSelectedSkills([]);
        setSelectedTiers([]);
        setPriceRange([0, 2000]);
        setMinRating(0);
        setCurrentPage(1);
        setPageSize(3);
    };

    // Memoized Filtered List (Client-side filtering for simulated attributes)
    const filteredExperts = useMemo(() => {
        return experts.filter(exp => {
            if (selectedTiers.length > 0 && !selectedTiers.includes(exp.tier)) return false;
            return true;
        });
    }, [experts, selectedTiers]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-[var(--color-navy)] selection:bg-[var(--color-cyan)]/20 pb-44"
        >
            {/* Breadcrumbs */}
            <div className="bg-white border-b border-black/10">
                <nav className="max-w-[1400px] mx-auto px-8 py-6 flex items-center gap-4">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-[10px] font-black text-black/40 hover:text-[#00A4FD] transition-all uppercase tracking-[0.2em] font-sans"
                    >
                        <Home size={12} strokeWidth={2} />
                        Trang chủ
                    </Link>
                    <ChevronRight size={10} className="text-black/20" />
                    <Link
                        href="/dashboard"
                        className="text-[10px] font-black text-black/40 hover:text-[#00A4FD] transition-all uppercase tracking-[0.2em] font-sans"
                    >
                        Bàn làm việc
                    </Link>
                    <ChevronRight size={10} className="text-black/20" />
                    <Link
                        href="/dashboard/experts"
                        className="text-[10px] font-black text-black/40 hover:text-[#00A4FD] transition-all uppercase tracking-[0.2em] font-sans"
                    >
                        Cố vấn
                    </Link>
                    <ChevronRight size={10} className="text-black/20" />
                    <span className="text-[10px] font-black text-[#00A4FD] uppercase tracking-[0.2em] font-sans">Khám phá tinh hoa</span>
                </nav>
            </div>

            <ExpertExploreHero
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onSearchSubmit={fetchExperts}
                sortBy={sortBy}
                onSortChange={setSortBy}
            />

            <main className="max-w-[1400px] mx-auto px-8 py-32">
                <div className="flex flex-col lg:flex-row gap-24">
                    {/* Sidebar */}
                    <ExpertExploreSidebar
                        industry={industry}
                        onIndustryChange={setIndustry}
                        selectedSkills={selectedSkills}
                        onToggleSkill={handleToggleSkill}
                        tiers={selectedTiers}
                        onToggleTier={handleToggleTier}
                        priceRange={priceRange}
                        onPriceChange={setPriceRange}
                        minRating={minRating}
                        onRatingChange={setMinRating}
                        onReset={handleReset}
                    />

                    {/* Grid Area */}
                    <div className="flex-1 space-y-20">
                        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b-[6px] border-[#00A4FD]/20 pb-12 px-2">
                            <div className="space-y-4">
                                <h2 className="text-[clamp(36px,4.2vw,54px)] font-serif italic font-bold text-black tracking-tight leading-[1.25]">Kết quả chọn lọc</h2>
                                <p className="text-black/40 font-black text-[10px] uppercase tracking-[0.4em] font-sans">
                                    {isLoading ? 'Đang truy vấn tinh hoa…' : `Hiển thị ${filteredExperts.length} trong tổng số ${totalItems} nhân tài.`}
                                </p>
                            </div>
                        </header>

                        <AnimatePresence mode="wait">
                            {isLoading ? (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <ExpertExploreGrid experts={[]} isLoading={true} />
                                </motion.div>
                            ) : filteredExperts.length > 0 ? (
                                <motion.div
                                    key="grid"
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    transition={{ duration: 1.2, ease: EASING }}
                                >
                                    <ExpertExploreGrid experts={filteredExperts} isLoading={false} />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="bg-white p-32 border-[6px] border-[#00A4FD]/20 shadow-2xl flex items-center justify-center rounded-0"
                                >
                                    <ExpertEmptyState onReset={handleReset} />
                                </motion.div>
                            )
                            }
                        </AnimatePresence>

                        {/* Pagination */}
                        {(totalItems > pageSize || currentPage > 1) && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8 }}
                                className="pt-20 border-t-[6px] border-[#00A4FD]/20"
                            >
                                <ExpertPagination
                                    currentPage={currentPage}
                                    totalPages={Math.ceil(totalItems / pageSize)}
                                    pageSize={pageSize}
                                    totalItems={totalItems}
                                    onPageChange={setCurrentPage}
                                    onPageSizeChange={handlePageSizeChange}
                                />
                            </motion.div>
                        )}
                    </div>
                </div>
            </main>
        </motion.div>
    );
}
