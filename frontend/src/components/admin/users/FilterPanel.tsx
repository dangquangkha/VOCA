interface FilterPanelProps {
    roleFilter: string;
    statusFilter: string;
    activeFilter: string;
    onRoleChange: (role: string) => void;
    onStatusChange: (status: string) => void;
    onActiveChange: (active: string) => void;
    onClearFilters: () => void;
}

export default function FilterPanel({
    roleFilter,
    statusFilter,
    activeFilter,
    onRoleChange,
    onStatusChange,
    onActiveChange,
    onClearFilters
}: FilterPanelProps) {
    const hasActiveFilters = roleFilter || statusFilter || activeFilter;

    return (
        <div className="flex flex-wrap gap-3 items-center">
            <select
                value={roleFilter}
                onChange={(e) => onRoleChange(e.target.value)}
                className="bg-transparent border-[0.5px] border-[#0F0C17]/20 rounded-sm px-3 py-2 text-[#0F0C17] text-xs tracking-wide focus:border-[#0046EA] focus:ring-0 transition-all duration-300 cursor-pointer"
            >
                <option value="" className="bg-white text-[#0F0C17]">All Roles</option>
                <option value="STUDENT" className="bg-white text-[#0F0C17]">Student</option>
                <option value="EXPERT" className="bg-white text-[#0F0C17]">Expert</option>
                <option value="ADMIN" className="bg-white text-[#0F0C17]">Admin</option>
            </select>

            <select
                value={statusFilter}
                onChange={(e) => onStatusChange(e.target.value)}
                className="bg-transparent border-[0.5px] border-[#0F0C17]/20 rounded-sm px-3 py-2 text-[#0F0C17] text-xs tracking-wide focus:border-[#0046EA] focus:ring-0 transition-all duration-300 cursor-pointer"
            >
                <option value="" className="bg-white text-[#0F0C17]">All Statuses</option>
                <option value="ACTIVE" className="bg-white text-[#0F0C17]">Active</option>
                <option value="SUSPENDED" className="bg-white text-[#0F0C17]">Suspended</option>
                <option value="BANNED" className="bg-white text-[#0F0C17]">Banned</option>
            </select>

            <select
                value={activeFilter}
                onChange={(e) => onActiveChange(e.target.value)}
                className="bg-transparent border-[0.5px] border-[#0F0C17]/20 rounded-sm px-3 py-2 text-[#0F0C17] text-xs tracking-wide focus:border-[#0046EA] focus:ring-0 transition-all duration-300 cursor-pointer"
            >
                <option value="" className="bg-white text-[#0F0C17]">Active Status</option>
                <option value="true" className="bg-white text-[#0F0C17]">Active Only</option>
                <option value="false" className="bg-white text-[#0F0C17]">Inactive Only</option>
            </select>

            {hasActiveFilters && (
                <button
                    onClick={onClearFilters}
                    className="text-[10px] uppercase tracking-[0.1em] text-[#0F0C17]/50 hover:text-[#0046EA] transition-colors font-medium border-b border-transparent hover:border-[#0046EA] ml-2"
                >
                    Clear Filters
                </button>
            )}
        </div>
    );
}
