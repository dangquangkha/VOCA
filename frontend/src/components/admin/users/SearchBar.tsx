import { useState, useEffect } from "react";

interface SearchBarProps {
    onSearch: (query: string) => void;
    placeholder?: string;
}

export default function SearchBar({ onSearch, placeholder = "Search by email, name, or phone..." }: SearchBarProps) {
    const [searchQuery, setSearchQuery] = useState("");

    // Debounced search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            onSearch(searchQuery);
        }, 300); // 300ms debounce

        return () => clearTimeout(timeoutId);
    }, [searchQuery, onSearch]);

    const handleClear = () => {
        setSearchQuery("");
    };

    return (
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-[#0F0C17]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={placeholder}
                className="block w-full pl-9 pr-10 py-2.5 bg-transparent border-[0.5px] border-[#0F0C17]/20 rounded-sm text-[#0F0C17] placeholder-[var(--color-ivory-45)] focus:border-[#0046EA] focus:ring-0 font-sans text-sm font-light transition-all duration-300"
            />
            {searchQuery && (
                <button
                    onClick={handleClear}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#0F0C17]/50 hover:text-[#0046EA] transition-colors"
                >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
        </div>
    );
}
