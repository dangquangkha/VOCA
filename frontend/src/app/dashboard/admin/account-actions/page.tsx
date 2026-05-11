"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

interface AccountAction {
    id: number;
    action_type: string;
    target_user_id: number;
    admin_id: number;
    reason: string;
    notes: string | null;
    created_at: string;
    admin_email: string | null;
    target_user_email: string | null;
}

export default function AccountActionsPage() {
    const { token } = useAuthStore();
    const [actions, setActions] = useState<AccountAction[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("all");

    useEffect(() => {
        if (!token) return; // Wait for hydration
        fetchActions();
    }, [token]);

    const fetchActions = async () => {
        try {
            const response = await api.get("admin/account-actions/actions");
            setActions(response.data);
        } catch (error) {
            console.error("Failed to fetch account actions:", error);
        } finally {
            setLoading(false);
        }
    };

    const getActionBadge = (actionType: string) => {
        const styles = {
            SUSPEND_EXPERT: "bg-yellow-100 text-yellow-800",
            UNSUSPEND_EXPERT: "bg-green-100 text-green-800",
            BAN_USER: "bg-red-100 text-red-800",
            UNBAN_USER: "bg-blue-100 text-blue-800",
        };
        const labels = {
            SUSPEND_EXPERT: "Suspend Expert",
            UNSUSPEND_EXPERT: "Unsuspend Expert",
            BAN_USER: "Ban User",
            UNBAN_USER: "Unban User",
        };
        return (
            <span className={`px-2 py-1 rounded text-xs font-medium ${styles[actionType as keyof typeof styles] || "bg-gray-100 text-gray-800"}`}>
                {labels[actionType as keyof typeof labels] || actionType}
            </span>
        );
    };

    const filteredActions = filter === "all"
        ? actions
        : actions.filter(action => action.action_type === filter);

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Account Action History</h1>
                <p className="text-gray-600">Complete audit log of all account moderation actions</p>
            </div>

            {/* Filter */}
            <div className="mb-4">
                <label className="text-sm font-medium mr-2">Filter by action:</label>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="border rounded px-3 py-2"
                >
                    <option value="all">All Actions</option>
                    <option value="SUSPEND_EXPERT">Suspend Expert</option>
                    <option value="UNSUSPEND_EXPERT">Unsuspend Expert</option>
                    <option value="BAN_USER">Ban User</option>
                    <option value="UNBAN_USER">Unban User</option>
                </select>
            </div>

            <div className="max-w-[1400px] mx-auto px-8 py-12">
                <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-[#0F0C17]/10">
                    <table className="w-full text-left">
                        <thead className="bg-white text-[#0F0C17]/50 border-b border-[#0F0C17]/10">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                            </tr>
                        </thead>
                        <tbody className="bg-transparent divide-y divide-[#0F0C17]/10">
                            {filteredActions.map((action) => (
                                <tr key={action.id} className="hover:bg-white transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(action.created_at).toLocaleString('vi-VN')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getActionBadge(action.action_type)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <div>
                                            <div className="font-medium text-gray-900">ID: {action.target_user_id}</div>
                                            <div className="text-xs text-gray-500">{action.target_user_email || "N/A"}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {action.admin_email || `ID: ${action.admin_id}`}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {action.reason}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                        {action.notes || "-"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredActions.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            No actions found
                        </div>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                <div className="bg-white p-8 rounded-xl border border-[#0F0C17]/10 shadow-2xl">
                    <div className="text-sm text-gray-500">Total Actions</div>
                    <div className="text-2xl font-bold">{actions.length}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-sm text-gray-500">Suspensions</div>
                    <div className="text-2xl font-bold">
                        {actions.filter(a => a.action_type === "SUSPEND_EXPERT").length}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-sm text-gray-500">Bans</div>
                    <div className="text-2xl font-bold">
                        {actions.filter(a => a.action_type === "BAN_USER").length}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-sm text-gray-500">Restorations</div>
                    <div className="text-2xl font-bold">
                        {actions.filter(a => a.action_type.includes("UN")).length}
                    </div>
                </div>
            </div>
        </div>
    );
}
