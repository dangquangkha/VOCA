import { User } from "@/services/userService";

interface UserTableProps {
    users?: User[];  // Optional to allow undefined
    loading: boolean;
    sortBy: string;
    sortDesc: boolean;
    onSort: (column: string) => void;
    onEdit: (user: User) => void;
    onDelete: (user: User) => void;
}

export default function UserTable({
    users = [],  // Default to empty array
    loading,
    sortBy,
    sortDesc,
    onSort,
    onEdit,
    onDelete
}: UserTableProps) {
    const getSortIcon = (column: string) => {
        if (sortBy !== column) return null;
        return sortDesc ? " ↓" : " ↑";
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            ACTIVE: "bg-green-100 text-green-800 border-green-200",
            SUSPENDED: "bg-yellow-100 text-yellow-800 border-yellow-200",
            BANNED: "bg-red-100 text-red-800 border-red-200",
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800"}`}>
                {status}
            </span>
        );
    };

    const getRoleBadge = (role: string) => {
        const styles = {
            STUDENT: "bg-blue-100 text-blue-800 border-blue-200",
            EXPERT: "bg-purple-100 text-purple-800 border-purple-200",
            ADMIN: "bg-red-100 text-red-800 border-red-200",
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[role as keyof typeof styles] || "bg-gray-100 text-gray-800"}`}>
                {role}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-600">Loading users...</p>
                </div>
            </div>
        );
    }

    // Defensive check - ensure users is an array
    const safeUsers = Array.isArray(users) ? users : [];

    if (safeUsers.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-8 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="mt-2 text-gray-600">No users found</p>
                    <p className="text-sm text-gray-500">Try adjusting your filters or search query</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th
                                onClick={() => onSort("id")}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition"
                            >
                                ID{getSortIcon("id")}
                            </th>
                            <th
                                onClick={() => onSort("email")}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition"
                            >
                                Email{getSortIcon("email")}
                            </th>
                            <th
                                onClick={() => onSort("full_name")}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition"
                            >
                                Name{getSortIcon("full_name")}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Status
                            </th>
                            <th
                                onClick={() => onSort("credits")}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition"
                            >
                                Credits{getSortIcon("credits")}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Active
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {safeUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50 transition">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {user.id}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {user.email}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {user.full_name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {getRoleBadge(user.role)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {getStatusBadge(user.account_status)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {user.credits.toLocaleString('vi-VN')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {user.is_active ? (
                                        <span className="text-green-600 font-medium">✓</span>
                                    ) : (
                                        <span className="text-red-600 font-medium">✗</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                    <button
                                        onClick={() => onEdit(user)}
                                        className="text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => onDelete(user)}
                                        className="text-red-600 hover:text-red-800 font-medium"
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
