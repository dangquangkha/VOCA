"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { userService, type User, type UserQueryParams, type UserCreateDto, type UserUpdateDto } from "@/services/userService";
import { useToast } from "@/hooks/useToast";

// Components
import SearchBar from "@/components/admin/users/SearchBar";
import FilterPanel from "@/components/admin/users/FilterPanel";
import UserTable from "@/components/admin/users/UserTable";
import Pagination from "@/components/admin/users/Pagination";
import ToastContainer from "@/components/ui/Toast";

export default function UserManagementPage() {
    const { token } = useAuthStore();
    const toast = useToast();

    // Data state
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalUsers, setTotalUsers] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Filter & search state
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [activeFilter, setActiveFilter] = useState<string>("");

    // Pagination & sorting state
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(6);
    const [sortBy, setSortBy] = useState("created_at");
    const [sortDesc, setSortDesc] = useState(true);

    // Modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // Form state
    const [formData, setFormData] = useState<any>({});

    // Fetch users
    const fetchUsers = useCallback(async () => {
        if (!token) return;

        setLoading(true);
        try {
            const params: UserQueryParams = {
                skip: (page - 1) * pageSize,
                limit: pageSize,
                sort_by: sortBy,
                sort_desc: sortDesc,
            };

            if (search) params.search = search;
            if (roleFilter) params.role = roleFilter;
            if (statusFilter) params.account_status = statusFilter;
            if (activeFilter !== "") params.is_active = activeFilter === "true";

            const response = await userService.getUsers(params);
            setUsers(response.items);
            setTotalUsers(response.total);
            setTotalPages(response.total_pages);
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Failed to fetch users");
        } finally {
            setLoading(false);
        }
    }, [token, page, pageSize, sortBy, sortDesc, search, roleFilter, statusFilter, activeFilter]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Handle sort
    const handleSort = (column: string) => {
        if (sortBy === column) {
            setSortDesc(!sortDesc);
        } else {
            setSortBy(column);
            setSortDesc(true);
        }
    };

    // Handle search
    const handleSearch = useCallback((query: string) => {
        setSearch(query);
        setPage(1); // Reset to first page
    }, []);

    // Clear all filters
    const handleClearFilters = () => {
        setRoleFilter("");
        setStatusFilter("");
        setActiveFilter("");
        setPage(1);
    };

    // Handle create
    const handleCreate = async () => {
        try {
            await userService.createUser(formData as UserCreateDto);
            toast.success("User created successfully!");
            setShowCreateModal(false);
            setFormData({});
            fetchUsers();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Failed to create user");
        }
    };

    // Handle update
    const handleUpdate = async () => {
        if (!selectedUser) return;
        try {
            await userService.updateUser(selectedUser.id, formData as UserUpdateDto);
            toast.success("User updated successfully!");
            setShowEditModal(false);
            setFormData({});
            setSelectedUser(null);
            fetchUsers();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Failed to update user");
        }
    };

    // Handle delete
    const handleDelete = async (hardDelete: boolean = false) => {
        if (!selectedUser) return;
        try {
            await userService.deleteUser(selectedUser.id, hardDelete);
            toast.success(hardDelete ? "User permanently deleted!" : "User deactivated!");
            setShowDeleteModal(false);
            setSelectedUser(null);
            fetchUsers();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Failed to delete user");
        }
    };

    // Open edit modal
    const openEditModal = (user: User) => {
        setSelectedUser(user);
        setFormData({
            email: user.email,
            full_name: user.full_name,
            phone_number: user.phone_number,
            role: user.role,
            credits: user.credits,
            is_active: user.is_active,
            account_status: user.account_status,
        });
        setShowEditModal(true);
    };

    // Open delete modal
    const openDeleteModal = (user: User) => {
        setSelectedUser(user);
        setShowDeleteModal(true);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                <p className="mt-1 text-gray-600">Manage all users with advanced filtering and search</p>
            </div>

            {/* Search & Filters */}
            <div className="bg-white p-6 rounded-lg shadow mb-6 space-y-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1">
                        <SearchBar onSearch={handleSearch} />
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium whitespace-nowrap"
                    >
                        + Create User
                    </button>
                </div>
                <FilterPanel
                    roleFilter={roleFilter}
                    statusFilter={statusFilter}
                    activeFilter={activeFilter}
                    onRoleChange={(val) => { setRoleFilter(val); setPage(1); }}
                    onStatusChange={(val) => { setStatusFilter(val); setPage(1); }}
                    onActiveChange={(val) => { setActiveFilter(val); setPage(1); }}
                    onClearFilters={handleClearFilters}
                />
                <div className="text-sm text-gray-600">
                    Total: <span className="font-medium">{totalUsers}</span> users
                </div>
            </div>

            {/* Table */}
            <UserTable
                users={users}
                loading={loading}
                sortBy={sortBy}
                sortDesc={sortDesc}
                onSort={handleSort}
                onEdit={openEditModal}
                onDelete={openDeleteModal}
            />

            {/* Pagination */}
            <Pagination
                currentPage={page}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={totalUsers}
                onPageChange={setPage}
                onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
            />

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-4">Create User</h2>
                        <div className="space-y-4">
                            <input
                                type="email"
                                placeholder="Email *"
                                value={formData.email || ""}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="border rounded-lg px-3 py-2 w-full"
                                required
                            />
                            <input
                                type="password"
                                placeholder="Password (min 8 chars) *"
                                value={(formData as UserCreateDto).password || ""}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="border rounded-lg px-3 py-2 w-full"
                                required
                            />
                            <input
                                type="text"
                                placeholder="Full Name *"
                                value={formData.full_name || ""}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                className="border rounded-lg px-3 py-2 w-full"
                                required
                            />
                            <input
                                type="text"
                                placeholder="Phone Number"
                                value={formData.phone_number || ""}
                                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                className="border rounded-lg px-3 py-2 w-full"
                            />
                            <select
                                value={formData.role || "STUDENT"}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                                className="border rounded-lg px-3 py-2 w-full"
                            >
                                <option value="STUDENT">Student</option>
                                <option value="EXPERT">Expert</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                            <input
                                type="number"
                                placeholder="Credits"
                                value={formData.credits || 0}
                                onChange={(e) => setFormData({ ...formData, credits: Number(e.target.value) })}
                                className="border rounded-lg px-3 py-2 w-full"
                            />
                        </div>
                        <div className="mt-6 flex justify-end space-x-2">
                            <button
                                onClick={() => { setShowCreateModal(false); setFormData({}); }}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-4">Edit User #{selectedUser.id}</h2>
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Full Name"
                                value={formData.full_name || ""}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                className="border rounded-lg px-3 py-2 w-full"
                            />
                            <input
                                type="text"
                                placeholder="Phone Number"
                                value={formData.phone_number || ""}
                                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                className="border rounded-lg px-3 py-2 w-full"
                            />
                            <select
                                value={formData.role || selectedUser.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                                className="border rounded-lg px-3 py-2 w-full"
                            >
                                <option value="STUDENT">Student</option>
                                <option value="EXPERT">Expert</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                            <input
                                type="number"
                                placeholder="Credits"
                                value={formData.credits !== undefined ? formData.credits : selectedUser.credits}
                                onChange={(e) => setFormData({ ...formData, credits: Number(e.target.value) })}
                                className="border rounded-lg px-3 py-2 w-full"
                            />
                            <select
                                value={formData.account_status || selectedUser.account_status}
                                onChange={(e) => setFormData({ ...formData, account_status: e.target.value as any })}
                                className="border rounded-lg px-3 py-2 w-full"
                            >
                                <option value="ACTIVE">Active</option>
                                <option value="SUSPENDED">Suspended</option>
                                <option value="BANNED">Banned</option>
                            </select>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={formData.is_active !== undefined ? formData.is_active : selectedUser.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="rounded"
                                />
                                <span>Is Active</span>
                            </label>
                        </div>
                        <div className="mt-6 flex justify-end space-x-2">
                            <button
                                onClick={() => { setShowEditModal(false); setFormData({}); setSelectedUser(null); }}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdate}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Update
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h2 className="text-2xl font-bold mb-4 text-red-600">Delete User</h2>
                        <p className="mb-4 text-gray-700">
                            Are you sure you want to delete user <strong>{selectedUser.email}</strong>?
                        </p>
                        <div className="space-y-2 mb-4">
                            <button
                                onClick={() => handleDelete(false)}
                                className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium"
                            >
                                Soft Delete (Deactivate)
                            </button>
                            <button
                                onClick={() => handleDelete(true)}
                                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                            >
                                Hard Delete (Permanent)
                            </button>
                        </div>
                        <button
                            onClick={() => { setShowDeleteModal(false); setSelectedUser(null); }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Toast Notifications */}
            <ToastContainer toasts={toast.toasts} onDismiss={toast.dismissToast} />
        </div>
    );
}
