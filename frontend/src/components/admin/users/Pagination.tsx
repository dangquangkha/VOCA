interface PaginationProps {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
}

/**
 * Tạo mảng các trang hiển thị với dấu "..." khi cần.
 * Luôn hiển thị: trang đầu, trang cuối, trang hiện tại và 1 trang lân cận mỗi bên.
 */
function getPageRange(currentPage: number, totalPages: number): (number | "...")[] {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | "...")[] = [];
    const delta = 1; // số trang lân cận mỗi bên của trang hiện tại

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
}: PaginationProps) {
    const pageSizeOptions = [10, 20, 50, 100];
    const pageRange = getPageRange(currentPage, totalPages);

    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    return (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 flex-wrap gap-3">
            {/* Thông tin tổng số bản ghi */}
            <div className="text-sm text-gray-600">
                Hiển thị{" "}
                <span className="font-semibold text-gray-800">{startItem}–{endItem}</span>{" "}
                trong{" "}
                <span className="font-semibold text-gray-800">{totalItems}</span>{" "}
                kết quả
            </div>

            <div className="flex items-center gap-4">
                {/* Chọn số dòng/trang */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Số dòng/trang:</span>
                    <select
                        value={pageSize}
                        onChange={(e) => onPageSizeChange(Number(e.target.value))}
                        className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {pageSizeOptions.map((size) => (
                            <option key={size} value={size}>
                                {size}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Các nút phân trang */}
                {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                        {/* Nút < */}
                        <button
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            aria-label="Trang trước"
                            className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                            &#8249;
                        </button>

                        {pageRange.map((page, idx) =>
                            page === "..." ? (
                                <span
                                    key={`ellipsis-${idx}`}
                                    className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm select-none"
                                >
                                    …
                                </span>
                            ) : (
                                <button
                                    key={page}
                                    onClick={() => onPageChange(page)}
                                    aria-current={page === currentPage ? "page" : undefined}
                                    className={`w-8 h-8 flex items-center justify-center rounded border text-sm font-medium transition
                                        ${page === currentPage
                                            ? "border-gray-800 text-gray-900 font-semibold bg-white ring-1 ring-gray-800"
                                            : "border-transparent text-gray-600 hover:bg-gray-100"
                                        }`}
                                >
                                    {page}
                                </button>
                            )
                        )}

                        {/* Nút > */}
                        <button
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === totalPages || totalPages === 0}
                            aria-label="Trang sau"
                            className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                            &#8250;
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
