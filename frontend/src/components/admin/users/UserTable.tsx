import { User } from "@/services/userService";

interface UserTableProps {
    users?: User[];  // Optional to allow undefined
    loading: boolean;
    sortBy: string;
    sortDesc: boolean;
    onSort: (column: string) => void;
    onEdit: (user: User) => void;
    onDelete: (user: User) => void;
    onAdjustCredits: (user: User) => void;
}

export default function UserTable({
    users = [],  // Default to empty array
    loading,
    sortBy,
    sortDesc,
    onSort,
    onEdit,
    onDelete,
    onAdjustCredits
}: UserTableProps) {
    const getSortIcon = (column: string) => {
        if (sortBy !== column) return null;
        return sortDesc ? " ↓" : " ↑";
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            ACTIVE: "text-[#0046EA]",
            SUSPENDED: "text-red-500",
            BANNED: "text-red-500",
        };
        const dotColors = {
            ACTIVE: "bg-[#0046EA]",
            SUSPENDED: "bg-red-500",
            BANNED: "bg-[var(--color-burgundy)]",
        };

        return (
            <div className="flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${dotColors[status as keyof typeof dotColors] || "bg-gray-400"}`}></span>
                <span className={`text-[10px] tracking-widest uppercase font-medium ${styles[status as keyof typeof styles] || "text-gray-400"}`}>
                    {status}
                </span>
            </div>
        );
    };

    const getRoleBadge = (role: string) => {
        if (role === 'EXPERT') {
            return (
                <span className="border border-[var(--color-gold-dim)] text-[#0046EA] bg-transparent px-2 py-0.5 rounded-sm text-[10px] tracking-widest uppercase font-medium">
                    EXPERT
                </span>
            );
        }
        if (role === 'STUDENT') {
            return (
                <span className="border border-[#0046EA]/30 text-[#0046EA] bg-transparent px-2 py-0.5 rounded-sm text-[10px] tracking-widest uppercase font-medium">
                    STUDENT
                </span>
            );
        }
        return (
            <span className="border border-[#0F0C17]/10 text-[#0F0C17]/50 bg-transparent px-2 py-0.5 rounded-sm text-[10px] tracking-widest uppercase font-medium">
                {role}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="bg-white border-[0.5px] border-[#0F0C17]/10 rounded-sm overflow-hidden">
                <div className="p-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0046EA]"></div>
                    <p className="mt-4 text-[#0F0C17]/50 font-sans text-sm tracking-wide">Loading users...</p>
                </div>
            </div>
        );
    }

    // Defensive check - ensure users is an array
    const safeUsers = Array.isArray(users) ? users : [];

    if (safeUsers.length === 0) {
        return (
            <div className="bg-white border-[0.5px] border-[#0F0C17]/10 rounded-sm overflow-hidden">
                <div className="p-16 text-center">
                    <svg className="mx-auto h-12 w-12 text-[#0F0C17]/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="mt-4 text-[#0F0C17] font-serif italic text-xl">No users found</p>
                    <p className="text-sm text-[#0F0C17]/50 mt-1 font-sans">Try adjusting your filters or search query</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border-[0.5px] border-[#0F0C17]/10 rounded-sm overflow-hidden transition-all duration-300">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#0F0C17]/10">
                    <thead>
                        <tr className="border-b border-[#0F0C17]/10">
                            <th
                                onClick={() => onSort("id")}
                                className="px-6 py-4 text-left text-[10px] font-medium text-[#0F0C17]/50 uppercase tracking-widest cursor-pointer hover:text-[#0046EA] transition-colors"
                            >
                                ID{getSortIcon("id")}
                            </th>
                            <th
                                onClick={() => onSort("email")}
                                className="px-6 py-4 text-left text-[10px] font-medium text-[#0F0C17]/50 uppercase tracking-widest cursor-pointer hover:text-[#0046EA] transition-colors"
                            >
                                Email{getSortIcon("email")}
                            </th>
                            <th
                                onClick={() => onSort("full_name")}
                                className="px-6 py-4 text-left text-[10px] font-medium text-[#0F0C17]/50 uppercase tracking-widest cursor-pointer hover:text-[#0046EA] transition-colors"
                            >
                                Name{getSortIcon("full_name")}
                            </th>
                            <th className="px-6 py-4 text-left text-[10px] font-medium text-[#0F0C17]/50 uppercase tracking-widest">
                                Role
                            </th>
                            <th className="px-6 py-4 text-left text-[10px] font-medium text-[#0F0C17]/50 uppercase tracking-widest">
                                Status
                            </th>
                            <th
                                onClick={() => onSort("credits")}
                                className="px-6 py-4 text-left text-[10px] font-medium text-[#0F0C17]/50 uppercase tracking-widest cursor-pointer hover:text-[#0046EA] transition-colors"
                            >
                                Credits{getSortIcon("credits")}
                            </th>
                            <th className="px-6 py-4 text-left text-[10px] font-medium text-[#0F0C17]/50 uppercase tracking-widest">
                                Active
                            </th>
                            <th className="px-6 py-4 text-left text-[10px] font-medium text-[#0F0C17]/50 uppercase tracking-widest">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#0F0C17]/10">
                        {safeUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-white transition-colors duration-200">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#0F0C17]/70 font-sans font-light">
                                    #{user.id}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#0F0C17]/70 font-sans font-light">
                                    {user.email}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#0F0C17] font-sans font-light">
                                    {user.full_name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-sans">
                                    {getRoleBadge(user.role)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-sans">
                                    {getStatusBadge(user.account_status)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#0046EA] font-sans font-light">
                                    {user.credits.toLocaleString('vi-VN')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {user.is_active ? (
                                        <span className="text-[#0046EA] text-xs">●</span>
                                    ) : (
                                        <span className="text-[#0F0C17]/30 text-xs">○</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-xs space-x-4">
                                    <button
                                        onClick={() => onEdit(user)}
                                        className="text-[#0F0C17]/50 hover:text-[#0046EA] uppercase tracking-wider font-medium transition-colors duration-200"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => onAdjustCredits(user)}
                                        className="text-[#0F0C17]/50 hover:text-[#00A4FD] uppercase tracking-wider font-medium transition-colors duration-200"
                                    >
                                        Credits
                                    </button>
                                    <button
                                        onClick={() => onDelete(user)}
                                        className="text-[#0F0C17]/50 hover:text-red-500 uppercase tracking-wider font-medium transition-colors duration-200"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
