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
            const detail = error.response?.data?.detail;
            toast.error(Array.isArray(detail) ? detail.map((e: any) => e.msg).join(', ') : (detail || "Failed to create user"));
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
            const detail = error.response?.data?.detail;
            toast.error(Array.isArray(detail) ? detail.map((e: any) => e.msg).join(', ') : (detail || "Failed to update user"));
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
        <div className="p-8 max-w-7xl mx-auto min-h-screen">
            {/* Header */}
            <div className="mb-10">
                <h1 className="text-4xl font-serif italic text-[#0F0C17] tracking-tight">User Management</h1>
                <p className="mt-2 text-[#0F0C17]/50 font-sans text-sm tracking-wide font-light">Manage all users with advanced filtering and search</p>
            </div>

            {/* Search & Filters */}
            <div className="bg-white border border-[#0F0C17]/10 rounded-sm p-6 mb-8 space-y-6 transition-all duration-300">
                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1">
                        <SearchBar onSearch={handleSearch} />
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-gradient-to-r from-[#0046EA] to-[#00A4FD] text-white font-bold uppercase tracking-[0.15em] text-xs px-8 py-3 rounded-sm hover:opacity-90 transition-all duration-300 whitespace-nowrap border-0"
                    >
                        + Create User
                    </button>
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
                    <FilterPanel
                        roleFilter={roleFilter}
                        statusFilter={statusFilter}
                        activeFilter={activeFilter}
                        onRoleChange={(val) => { setRoleFilter(val); setPage(1); }}
                        onStatusChange={(val) => { setStatusFilter(val); setPage(1); }}
                        onActiveChange={(val) => { setActiveFilter(val); setPage(1); }}
                        onClearFilters={handleClearFilters}
                    />
                    <div className="text-[10px] uppercase tracking-widest text-[#0F0C17]/50">
                        Pool: <span className="text-[#0046EA] font-medium">{totalUsers}</span> accounts
                    </div>
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
                <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white border border-[#0F0C17]/10 rounded-sm p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <h2 className="text-2xl font-serif italic text-[#0F0C17] mb-6">Create New Account</h2>
                        <div className="space-y-5">
                            <input
                                type="email"
                                placeholder="Email Address *"
                                value={formData.email || ""}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="bg-transparent border-[0.5px] border-[#0F0C17]/20 rounded-sm px-4 py-3 w-full text-[#0F0C17] placeholder-[var(--color-ivory-45)] focus:border-[#0046EA] focus:ring-0 text-sm font-light transition-all"
                                required
                            />
                            <input
                                type="password"
                                placeholder="Password (min 8 chars) *"
                                value={(formData as UserCreateDto).password || ""}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="bg-transparent border-[0.5px] border-[#0F0C17]/20 rounded-sm px-4 py-3 w-full text-[#0F0C17] placeholder-[var(--color-ivory-45)] focus:border-[#0046EA] focus:ring-0 text-sm font-light transition-all"
                                required
                                minLength={8}
                            />
                            <input
                                type="text"
                                placeholder="Full Name *"
                                value={formData.full_name || ""}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                className="bg-transparent border-[0.5px] border-[#0F0C17]/20 rounded-sm px-4 py-3 w-full text-[#0F0C17] placeholder-[var(--color-ivory-45)] focus:border-[#0046EA] focus:ring-0 text-sm font-light transition-all"
                                required
                            />
                            <input
                                type="text"
                                placeholder="Phone Number *"
                                value={formData.phone_number || ""}
                                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                className="bg-transparent border-[0.5px] border-[#0F0C17]/20 rounded-sm px-4 py-3 w-full text-[#0F0C17] placeholder-[var(--color-ivory-45)] focus:border-[#0046EA] focus:ring-0 text-sm font-light transition-all"
                                required
                            />
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-widest text-[#0F0C17]/50 ml-1">Account Role</label>
                                <select
                                    value={formData.role || "STUDENT"}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                                    className="bg-transparent border-[0.5px] border-[#0F0C17]/20 rounded-sm px-4 py-3 w-full text-[#0F0C17] focus:border-[#0046EA] focus:ring-0 text-sm font-light"
                                >
                                    <option value="STUDENT" className="bg-white">Student</option>
                                    <option value="EXPERT" className="bg-white">Expert</option>
                                    <option value="ADMIN" className="bg-white">Admin</option>
                                </select>
                            </div>
                            <input
                                type="number"
                                placeholder="Initial Credits"
                                value={formData.credits || 0}
                                onChange={(e) => setFormData({ ...formData, credits: Number(e.target.value) })}
                                className="bg-transparent border-[0.5px] border-[#0F0C17]/20 rounded-sm px-4 py-3 w-full text-[#0F0C17] placeholder-[var(--color-ivory-45)] focus:border-[#0046EA] focus:ring-0 text-sm font-light transition-all"
                            />
                        </div>
                        <div className="mt-10 flex justify-end gap-4">
                            <button
                                onClick={() => { setShowCreateModal(false); setFormData({}); }}
                                className="px-6 py-2 text-[#0F0C17]/50 hover:text-[#0F0C17] uppercase tracking-widest text-[10px] font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                className="bg-transparent border border-[#0F0C17]/10 text-[#0F0C17] uppercase tracking-[0.15em] text-[10px] px-8 py-2.5 rounded-sm hover:bg-[#0046EA]/5 transition-all duration-300 font-medium"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedUser && (
                <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white border border-[#0F0C17]/10 rounded-sm p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <h2 className="text-2xl font-serif italic text-[#0F0C17] mb-6">Modify Account <span className="text-[#0046EA] not-italic text-sm ml-2">#{selectedUser.id}</span></h2>
                        <div className="space-y-5">
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-widest text-[#0F0C17]/50 ml-1">Full Name</label>
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    value={formData.full_name || ""}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    className="bg-transparent border-[0.5px] border-[#0F0C17]/20 rounded-sm px-4 py-3 w-full text-[#0F0C17] focus:border-[#0046EA] focus:ring-0 text-sm font-light transition-all"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-widest text-[#0F0C17]/50 ml-1">Phone Number</label>
                                <input
                                    type="text"
                                    placeholder="Phone Number"
                                    value={formData.phone_number || ""}
                                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                    className="bg-transparent border-[0.5px] border-[#0F0C17]/20 rounded-sm px-4 py-3 w-full text-[#0F0C17] focus:border-[#0046EA] focus:ring-0 text-sm font-light transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-widest text-[#0F0C17]/50 ml-1">Role</label>
                                    <select
                                        value={formData.role || selectedUser.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                                        className="bg-transparent border-[0.5px] border-[#0F0C17]/20 rounded-sm px-4 py-3 w-full text-[#0F0C17] focus:border-[#0046EA] focus:ring-0 text-sm font-light appearance-none"
                                    >
                                        <option value="STUDENT" className="bg-white">Student</option>
                                        <option value="EXPERT" className="bg-white">Expert</option>
                                        <option value="ADMIN" className="bg-white">Admin</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-widest text-[#0F0C17]/50 ml-1">Status</label>
                                    <select
                                        value={formData.account_status || selectedUser.account_status}
                                        onChange={(e) => setFormData({ ...formData, account_status: e.target.value as any })}
                                        className="bg-transparent border-[0.5px] border-[#0F0C17]/20 rounded-sm px-4 py-3 w-full text-[#0F0C17] focus:border-[#0046EA] focus:ring-0 text-sm font-light appearance-none"
                                    >
                                        <option value="ACTIVE" className="bg-white">Active</option>
                                        <option value="SUSPENDED" className="bg-white">Suspended</option>
                                        <option value="BANNED" className="bg-white">Banned</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-widest text-[#0F0C17]/50 ml-1">Credits</label>
                                <input
                                    type="number"
                                    placeholder="Credits"
                                    value={formData.credits !== undefined ? formData.credits : selectedUser.credits}
                                    onChange={(e) => setFormData({ ...formData, credits: Number(e.target.value) })}
                                    className="bg-transparent border-[0.5px] border-[#0F0C17]/20 rounded-sm px-4 py-3 w-full text-[#0F0C17] focus:border-[#0046EA] focus:ring-0 text-sm font-light transition-all"
                                />
                            </div>
                            <label className="flex items-center space-x-3 group cursor-pointer pt-2">
                                <input
                                    type="checkbox"
                                    checked={formData.is_active !== undefined ? formData.is_active : selectedUser.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="rounded-sm bg-transparent border-[#0F0C17]/20 text-[#0046EA] focus:ring-0 focus:ring-offset-0"
                                />
                                <span className="text-[10px] uppercase tracking-widest text-[#0F0C17]/50 group-hover:text-[#0F0C17]/70 transition-colors">Mark as Active</span>
                            </label>
                        </div>
                        <div className="mt-10 flex justify-end gap-4">
                            <button
                                onClick={() => { setShowEditModal(false); setFormData({}); setSelectedUser(null); }}
                                className="px-6 py-2 text-[#0F0C17]/50 hover:text-[#0F0C17] uppercase tracking-widest text-[10px] font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdate}
                                className="bg-transparent border border-[#0F0C17]/10 text-[#0F0C17] uppercase tracking-[0.15em] text-[10px] px-8 py-2.5 rounded-sm hover:bg-[#0046EA]/5 transition-all duration-300 font-medium"
                            >
                                Update Account
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && selectedUser && (
                <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white border border-[#0F0C17]/10 rounded-sm p-8 max-w-md w-full shadow-2xl">
                        <h2 className="text-2xl font-serif italic text-red-500 mb-4">Terminate Account</h2>
                        <p className="mb-8 text-[#0F0C17]/70 font-sans text-sm leading-relaxed">
                            Are you certain you wish to remove <strong>{selectedUser.email}</strong>? This action may have irreversible consequences depending on the method.
                        </p>
                        <div className="space-y-3 mb-8">
                            <button
                                onClick={() => handleDelete(false)}
                                className="w-full px-4 py-3 bg-white border border-[#0F0C17]/10 text-[#0F0C17] rounded-sm hover:border-[var(--color-gold-dim)] hover:text-[#0046EA] transition-all uppercase tracking-widest text-[10px] font-medium"
                            >
                                Soft Delete (Deactivate)
                            </button>
                            <button
                                onClick={() => handleDelete(true)}
                                className="w-full px-4 py-3 bg-[var(--color-burgundy)] text-[#0F0C17] rounded-sm hover:opacity-90 transition-all uppercase tracking-widest text-[10px] font-medium"
                            >
                                Hard Delete (Permanent)
                            </button>
                        </div>
                        <button
                            onClick={() => { setShowDeleteModal(false); setSelectedUser(null); }}
                            className="w-full px-4 py-2 text-[#0F0C17]/50 hover:text-[#0F0C17] text-[10px] uppercase tracking-widest font-medium transition-colors"
                        >
                            Retain Account
                        </button>
                    </div>
                </div>
            )}

            {/* Toast Notifications */}
            <ToastContainer toasts={toast.toasts} onDismiss={toast.dismissToast} />
        </div>
    );
}
