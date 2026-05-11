'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExpertCard } from './ExpertCard';
import { Expert } from '@/types/expert';

interface ExpertGridProps {
    experts: Expert[];
    isLoading: boolean;
    viewMode?: 'grid' | 'list';
}

const EASING: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const ExpertGrid: React.FC<ExpertGridProps> = ({ experts, isLoading, viewMode = 'grid' }) => {
    if (isLoading && experts.length === 0) {
        return (
            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-6"}>
                {[1, 2, 3].map((n) => (
                    <div key={n} className={`bg-[#FFFFFF]/40 backdrop-blur-sm p-10 border border-[#0046EA]/5 animate-pulse transition-all duration-1000 rounded-[2px] ${viewMode === 'grid' ? 'h-[420px]' : 'h-[200px]'}`}>
                        <div className="flex items-start gap-8">
                            <div className="w-24 h-24 bg-[#0F0C17]/5 shrink-0 border border-[#0046EA]/5 rounded-[2px]" />
                            <div className="flex-1 space-y-6 pt-2">
                                <div className="h-[2px] bg-[#0F0C17]/5 w-1/2" />
                                <div className="space-y-3">
                                    <div className="h-[1px] bg-[#0F0C17]/5 w-full" />
                                    <div className="h-[1px] bg-[#0F0C17]/5 w-2/3" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (experts.length === 0) {
        return null; // Handle this in parent with ExpertEmptyState
    }

    return (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[24px]" : "flex flex-col gap-[24px]"}>
            <AnimatePresence mode="popLayout">
                {experts.map((expert, idx) => (
                    <motion.div
                        key={expert.id}
                        initial={{ opacity: 0, y: 20, scale: 1.05 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.9, ease: EASING, delay: idx * 0.1 }}
                    >
                        <ExpertCard expert={expert} viewMode={viewMode} />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};
