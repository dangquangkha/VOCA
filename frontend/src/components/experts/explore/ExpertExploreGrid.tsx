'use client';

import React from 'react';
import { ExpertExploreCard, EnhancedExpert } from './ExpertExploreCard';
import { motion, AnimatePresence } from 'framer-motion';

interface ExpertExploreGridProps {
    experts: EnhancedExpert[];
    isLoading: boolean;
}

const EASING: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const ExpertExploreGrid: React.FC<ExpertExploreGridProps> = ({ experts, isLoading }) => {
    if (isLoading) {
        return (
            <div className="flex flex-col gap-8">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-[#FAF7F2]/40 border border-[#C9A84C]/5 overflow-hidden flex flex-col md:flex-row h-full md:h-auto animate-pulse rounded-[2px]">
                        {/* Skeleton Left - Identity */}
                        <div className="p-8 md:p-10 flex flex-col items-center md:items-start md:border-r border-[#C9A84C]/10 md:min-w-[220px] bg-[#FAF7F2]/40">
                            <div className="w-28 h-28 md:w-32 md:h-32 bg-[#0A1018]/5 rounded-[1px] mb-6" />
                            <div className="w-24 h-4 bg-[#C9A84C]/10 rounded-[1px]" />
                        </div>

                        {/* Skeleton Middle - Content */}
                        <div className="p-8 md:p-10 flex-1 flex flex-col justify-center gap-8">
                            <div className="space-y-4">
                                <div className="h-8 w-2/3 bg-[#0A1018]/5 rounded-[1px]" />
                                <div className="h-3 w-1/3 bg-[#C9A84C]/5 rounded-[1px]" />
                            </div>
                            <div className="h-16 w-full bg-[#0A1018]/5 rounded-[1px]" />
                            <div className="flex gap-4">
                                <div className="w-20 h-8 bg-[#C9A84C]/5 rounded-[1px]" />
                                <div className="w-20 h-8 bg-[#C9A84C]/5 rounded-[1px]" />
                            </div>
                        </div>

                        {/* Skeleton Right - Price/CTA */}
                        <div className="p-8 md:p-10 md:border-l border-[#C9A84C]/10 flex flex-col justify-center items-center md:items-end gap-8 bg-[#FAF7F2]/20 md:min-w-[260px]">
                            <div className="space-y-2 flex flex-col items-center md:items-end w-full">
                                <div className="h-2 w-12 bg-[#0A1018]/5 rounded-[1px]" />
                                <div className="h-8 w-20 bg-[#0A1018]/5 rounded-[1px]" />
                            </div>
                            <div className="w-full flex flex-col gap-3">
                                <div className="h-12 bg-[#0A1018]/5 rounded-[2px]" />
                                <div className="h-12 bg-[#0A1018]/5 rounded-[2px]" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            <AnimatePresence mode="popLayout">
                {experts.map((expert, index) => (
                    <motion.div
                        key={expert.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: EASING, delay: index * 0.05 }}
                    >
                        <ExpertExploreCard expert={expert} priority={index < 2} />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};
