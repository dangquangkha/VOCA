'use client';

import React from 'react';

interface ExpertPaginationProps {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    pageSizeOptions?: number[];
    hidePageSize?: boolean;
}

/**
 * Tạo mảng các trang hiển thị với dấu "..." khi cần.
 */
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

export const ExpertPagination: React.FC<ExpertPaginationProps> = ({
    currentPage,
    totalPages,
    pageSize,
    totalItems,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [3, 10, 20, 50],
    hidePageSize = false,
}) => {
    const pageRange = getPageRange(currentPage, totalPages);

    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    if (totalItems === 0) return null;

    return (
        <div className="flex items-center justify-between px-10 py-8 bg-[#FAF7F2]/60 backdrop-blur-xl border-t border-[#C9A84C]/10 flex-wrap gap-8 mt-12 overflow-hidden font-sans">
            {/* Entry Info */}
            <div className="text-[10px] font-normal text-[#0A1018]/80 uppercase tracking-[0.2em]">
                Bản ghi kiến tạo{" "}
                <span className="text-[#0A1018]">{startItem}—{endItem}</span>{" "}
                /{" "}
                <span className="text-[#A85C1E]">{totalItems}</span>{" "}
                tinh hoa
            </div>

            <div className="flex items-center gap-12">
                {!hidePageSize && (
                    <div className="flex items-center gap-4 text-[10px] font-normal text-[#0A1018]/80 uppercase tracking-[0.2em]">
                        <span>Hiển thị:</span>
                        <div className="relative group/sel">
                            <select
                                value={pageSize}
                                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                                className="appearance-none bg-transparent border-b border-[#C9A84C]/30 px-4 py-1.5 pr-8 text-[#0A1018] font-normal text-xs focus:outline-none focus:border-[#C9A84C] cursor-pointer transition-all"
                            >
                                {pageSizeOptions.map((size) => (
                                    <option key={size} value={size}>
                                        {size}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#C9A84C]/40">
                                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="w-10 h-10 flex items-center justify-center border border-[#0A1018]/10 text-[#0A1018] hover:text-[#C97B3A] hover:border-[#C9A84C]/40 disabled:opacity-0 transition-all duration-700 rounded-[2px]"
                        >
                            <span className="text-lg font-light leading-none">‹</span>
                        </button>

                        {pageRange.map((page, idx) =>
                            page === "..." ? (
                                <span
                                    key={`ellipsis-${idx}`}
                                    className="w-10 h-10 flex items-center justify-center text-[#0A1018]/20 text-xs font-light"
                                >
                                    …
                                </span>
                            ) : (
                                <button
                                    key={page}
                                    onClick={() => onPageChange(page)}
                                    className={`w-10 h-10 flex items-center justify-center border text-[10px] font-normal uppercase tracking-widest transition-all duration-700 rounded-[2px]
                                        ${page === currentPage
                                            ? "bg-[#0A1018] border-[#0A1018] text-[#F5F0E8] shadow-lg shadow-[#0A1018]/20"
                                            : "border-transparent text-[#0A1018]/80 hover:text-[#A85C1E] hover:border-[#C9A84C]/20"
                                        }`}
                                >
                                    {page}
                                </button>
                            )
                        )}

                        <button
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="w-10 h-10 flex items-center justify-center border border-[#0A1018]/10 text-[#0A1018] hover:text-[#C97B3A] hover:border-[#C9A84C]/40 disabled:opacity-0 transition-all duration-700 rounded-[2px]"
                        >
                            <span className="text-lg font-light leading-none">›</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
