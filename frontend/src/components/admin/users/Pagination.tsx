'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    variant?: 'light' | 'dark';
}

function getPageRange(currentPage: number, totalPages: number): (number | "...")[] {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | "...")[] = [];
    const delta = 1;

    const left = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);

    pages.push(1);

    if (left > 2) pages.push("...");

    for (let i = left; i <= right; i++) {
        pages.push(i);
    }

    if (right < totalPages - 1) pages.push("...");

    pages.push(totalPages);

    return pages;
}

export default function Pagination({
    currentPage,
    totalPages,
    pageSize,
    totalItems,
    onPageChange,
    onPageSizeChange,
    variant = 'dark',
}: PaginationProps) {
    const pageSizeOptions = [10, 20, 50];
    const pageRange = getPageRange(currentPage, totalPages);

    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-2 py-4 font-dm-sans">
            {/* Records Info */}
            <div className="text-[10px] uppercase tracking-[0.2em] font-black text-black/30">
                Hiển thị{" "}
                <span className="text-[#0046EA]">{startItem}–{endItem}</span>{" "}
                trên{" "}
                <span className="text-[#0046EA]">{totalItems}</span>{" "}
                kết quả
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-8">
                {/* Rows per page */}
                <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.2em] font-black text-black/30">
                    <span>Số dòng:</span>
                    <div className="relative">
                        <select
                            value={pageSize}
                            onChange={(e) => onPageSizeChange(Number(e.target.value))}
                            className="appearance-none bg-white border border-black/5 rounded-full px-5 py-1.5 text-[10px] font-black text-[#0046EA] focus:outline-none focus:border-[#0046EA] transition-all cursor-pointer pr-10 shadow-sm"
                        >
                            {pageSizeOptions.map((size) => (
                                <option key={size} value={size}>
                                    {size}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-black/20">
                            <ChevronLeft size={10} className="-rotate-90" />
                        </div>
                    </div>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                        {/* Prev Button */}
                        <button
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="w-10 h-10 flex items-center justify-center rounded-full border border-black/5 bg-white text-black/20 hover:border-[#0046EA] hover:text-[#0046EA] transition-all disabled:opacity-10 disabled:cursor-not-allowed shadow-sm"
                        >
                            <ChevronLeft size={14} />
                        </button>

                        <div className="flex items-center gap-1">
                            {pageRange.map((page, idx) =>
                                page === "..." ? (
                                    <span
                                        key={`ellipsis-${idx}`}
                                        className="w-8 h-8 flex items-center justify-center text-[10px] font-black text-black/10"
                                    >
                                        …
                                    </span>
                                ) : (
                                    <button
                                        key={page}
                                        onClick={() => onPageChange(page)}
                                        className={`w-10 h-10 flex items-center justify-center rounded-full text-[10px] font-black transition-all duration-500
                                            ${page === currentPage
                                                ? "bg-[#0046EA] text-[#FFE900] shadow-lg shadow-[#0046EA]/20"
                                                : "bg-white border border-black/5 text-black/30 hover:border-[#0046EA] hover:text-[#0046EA] shadow-sm"
                                            }`}
                                    >
                                        {page}
                                    </button>
                                )
                            )}
                        </div>

                        {/* Next Button */}
                        <button
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="w-10 h-10 flex items-center justify-center rounded-full border border-black/5 bg-white text-black/20 hover:border-[#0046EA] hover:text-[#0046EA] transition-all disabled:opacity-10 disabled:cursor-not-allowed shadow-sm"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
