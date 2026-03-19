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
            const response = await api.get("/admin/users", {
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
            ACTIVE: "bg-green-100 text-green-800",
            SUSPENDED: "bg-yellow-100 text-yellow-800",
            BANNED: "bg-red-100 text-red-800",
        };
        return (
            <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status as keyof typeof styles]}`}>
                {status}
            </span>
        );
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Account Moderation</h1>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credits</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{user.full_name || "N/A"}</div>
                                    <div className="text-xs text-gray-500">ID: {user.id}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">{user.role}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(user.account_status)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.credits}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                    {user.account_status === "ACTIVE" && (
                                        <>
                                            {user.role === "EXPERT" && (
                                                <button
                                                    onClick={() => openModal(user, "suspend")}
                                                    className="text-yellow-600 hover:text-yellow-900"
                                                >
                                                    Suspend
                                                </button>
                                            )}
                                            <button
                                                onClick={() => openModal(user, "ban")}
                                                className="text-red-600 hover:text-red-900 font-medium"
                                            >
                                                Ban
                                            </button>
                                        </>
                                    )}
                                    {user.account_status === "SUSPENDED" && user.role === "EXPERT" && (
                                        <button
                                            onClick={() => openModal(user, "unsuspend")}
                                            className="text-green-600 hover:text-green-900"
                                        >
                                            Unsuspend
                                        </button>
                                    )}
                                    {user.account_status === "BANNED" && (
                                        <button
                                            onClick={() => openModal(user, "unban")}
                                            className="text-green-600 hover:text-green-900"
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

            {/* Modal */}
            {showModal && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">
                            {actionType.charAt(0).toUpperCase() + actionType.slice(1)} User: {selectedUser.full_name}
                        </h2>

                        {(actionType === "ban" || actionType === "suspend") && (
                            <>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-1">Reason</label>
                                    <select
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        className="w-full border rounded px-3 py-2"
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

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                                rows={3}
                                placeholder="Internal notes..."
                            />
                        </div>

                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 border rounded hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAction}
                                className={`px-4 py-2 rounded text-white ${actionType === "ban" || actionType === "suspend"
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
