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
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
                <option value="">All Roles</option>
                <option value="STUDENT">Student</option>
                <option value="EXPERT">Expert</option>
                <option value="ADMIN">Admin</option>
            </select>

            <select
                value={statusFilter}
                onChange={(e) => onStatusChange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="BANNED">Banned</option>
            </select>

            <select
                value={activeFilter}
                onChange={(e) => onActiveChange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
                <option value="">Active Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
            </select>

            {hasActiveFilters && (
                <button
                    onClick={onClearFilters}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                    Clear Filters
                </button>
            )}
        </div>
    );
}
