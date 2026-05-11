"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

interface User {
    id: number;
    email: string;
    full_name: string;
    role: "STUDENT" | "EXPERT" | "ADMIN";
    account_status: "ACTIVE" | "SUSPENDED" | "BANNED";
    credits: number;
    is_active: boolean;
}

import Pagination from "@/components/admin/users/Pagination";

export default function ModerationPage() {
    const { token } = useAuthStore();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [actionType, setActionType] = useState<"ban" | "unban" | "suspend" | "unsuspend">("ban");
    const [reason, setReason] = useState("");
    const [notes, setNotes] = useState("");
    const [forfeitCredits, setForfeitCredits] = useState(false);

    // Pagination State
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    useEffect(() => {
        if (!token) return; // Wait for hydration
        fetchUsers();
    }, [token, page, pageSize]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get("admin/users", {
                params: {
                    skip: (page - 1) * pageSize,
                    limit: pageSize
                }
            });
            // Handle both paginated and non-paginated (just in case, though we know it's paginated now)
            if (response.data.items) {
                setUsers(response.data.items);
                setTotalItems(response.data.total);
                setTotalPages(response.data.total_pages);
            } else if (Array.isArray(response.data)) {
                setUsers(response.data);
            } else {
                console.error("Unexpected response format", response.data);
                setUsers([]);
            }
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async () => {
        if (!selectedUser) return;

        try {
            let endpoint = "";
            let payload: any = { notes };

            if (actionType === "ban") {
                endpoint = `/admin/moderation/users/${selectedUser.id}/ban`;
                payload = { reason, notes, forfeit_credits: forfeitCredits };
            } else if (actionType === "unban") {
                endpoint = `/admin/moderation/users/${selectedUser.id}/unban`;
                payload = { notes, restore_credits: false, previous_balance: 0 };
            } else if (actionType === "suspend") {
                endpoint = `/admin/moderation/experts/${selectedUser.id}/suspend`;
                payload = { reason, notes, acknowledge_booking_cancellation: true };
            } else if (actionType === "unsuspend") {
                endpoint = `/admin/moderation/experts/${selectedUser.id}/unsuspend`;
            }

            await api.post(endpoint, payload);
            alert(`User ${actionType} successful!`);
            setShowModal(false);
            fetchUsers();
            setReason("");
            setNotes("");
            setForfeitCredits(false);
        } catch (error: any) {
            alert(`Failed: ${error.response?.data?.detail || error.message}`);
        }
    };

    const openModal = (user: User, action: typeof actionType) => {
        setSelectedUser(user);
        setActionType(action);
        setShowModal(true);
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            ACTIVE: "bg-[#0046EA]/10 text-[#0046EA]",
            SUSPENDED: "bg-red-500/10 text-red-500",
            BANNED: "bg-[var(--color-burgundy)]/10 text-red-500",
        };
        return (
            <span className={`px-2 py-1 rounded-sm text-[10px] uppercase tracking-widest font-bold border border-current/20 ${styles[status as keyof typeof styles]}`}>
                {status}
            </span>
        );
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8">
            <div className="max-w-[1400px] mx-auto px-8 py-12">
                <h1 className="text-3xl font-bold mb-6">Account Moderation</h1>

                <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-[#0F0C17]/10">
                    <table className="min-w-full divide-y divide-[#0F0C17]/10">
                        <thead className="bg-[#0F0C17]/5">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-[#0F0C17]/60 uppercase">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-[#0F0C17]/60 uppercase">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-[#0F0C17]/60 uppercase">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-[#0F0C17]/60 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-[#0F0C17]/60 uppercase">Credits</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-[#0F0C17]/60 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-transparent divide-y divide-[#0F0C17]/10">
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-[#0F0C17]/90">{user.full_name || "N/A"}</div>
                                        <div className="text-xs text-[#0F0C17]/50">ID: {user.id}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#0F0C17]/70">{user.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 py-1 text-xs rounded bg-[#0F0C17]/10 text-[#0F0C17]/80">{user.role}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(user.account_status)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#0F0C17]/70">{user.credits}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                        {user.account_status === "ACTIVE" && (
                                            <>
                                                {user.role === "EXPERT" && (
                                                    <button
                                                        onClick={() => openModal(user, "suspend")}
                                                        className="text-yellow-500 hover:text-yellow-400"
                                                    >
                                                        Suspend
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => openModal(user, "ban")}
                                                    className="text-red-500 hover:text-red-400 font-medium"
                                                >
                                                    Ban
                                                </button>
                                            </>
                                        )}
                                        {user.account_status === "SUSPENDED" && user.role === "EXPERT" && (
                                            <button
                                                onClick={() => openModal(user, "unsuspend")}
                                                className="text-green-500 hover:text-green-400"
                                            >
                                                Unsuspend
                                            </button>
                                        )}
                                        {user.account_status === "BANNED" && (
                                            <button
                                                onClick={() => openModal(user, "unban")}
                                                className="text-green-500 hover:text-green-400"
                                            >
                                                Unban
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalItems > 0 && (
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        pageSize={pageSize}
                        totalItems={totalItems}
                        onPageChange={setPage}
                        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
                    />
                )}
            </div>

            {/* Modal */}
            {showModal && selectedUser && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-xl flex items-center justify-center p-4 z-[200]">
                    <div className="bg-white rounded-xl border border-[#0F0C17]/10 p-8 w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold mb-4">
                            {actionType.charAt(0).toUpperCase() + actionType.slice(1)} User: {selectedUser.full_name}
                        </h2>

                        {(actionType === "ban" || actionType === "suspend") && (
                            <>
                                <div className="mb-4">
                                    <label className="block text-xs font-medium text-[#0F0C17]/50 uppercase tracking-widest mb-2">Reason</label>
                                    <select
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        className="w-full bg-white border border-[#0F0C17]/10 rounded-sm px-4 py-3 text-sm text-[#0F0C17] outline-none focus:border-[#0F0C17]/10 transition-all"
                                    >
                                        <option value="">Select reason...</option>
                                        <option value="Harassment">Harassment</option>
                                        <option value="Payment Fraud">Payment Fraud</option>
                                        <option value="Spam">Spam</option>
                                        <option value="Fake Account">Fake Account</option>
                                        <option value="Violation of Terms">Violation of Terms</option>
                                        <option value="Low Quality">Low Quality</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                {actionType === "ban" && (
                                    <div className="mb-4">
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={forfeitCredits}
                                                onChange={(e) => setForfeitCredits(e.target.checked)}
                                                className="mr-2"
                                            />
                                            <span className="text-sm">Forfeit all credits</span>
                                        </label>
                                    </div>
                                )}
                            </>
                        )}

                        <div className="mb-8">
                            <label className="block text-xs font-medium text-[#0F0C17]/50 uppercase tracking-widest mb-2">Notes (Optional)</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full bg-white border border-[#0F0C17]/10 rounded-sm px-4 py-3 text-sm text-[#0F0C17] outline-none focus:border-[#0F0C17]/10 transition-all min-h-[100px]"
                                rows={3}
                                placeholder="Internal notes..."
                            />
                        </div>

                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-5 py-2.5 border border-[#0F0C17]/20 rounded-sm text-[#0F0C17]/70 hover:bg-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAction}
                                className={`px-4 py-2 rounded text-[#0F0C17] ${actionType === "ban" || actionType === "suspend"
                                    ? "bg-red-600 hover:bg-red-700"
                                    : "bg-green-600 hover:bg-green-700"
                                    }`}
                            >
                                Confirm {actionType.charAt(0).toUpperCase() + actionType.slice(1)}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
