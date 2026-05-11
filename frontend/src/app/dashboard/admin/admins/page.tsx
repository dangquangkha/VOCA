"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { userService, type User, type UserCreateDto } from "@/services/userService";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ui/Toast";

export default function AdminManagementPage() {
    const { token } = useAuthStore();
    const toast = useToast();

    // Data state
    const [admins, setAdmins] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState<Partial<UserCreateDto>>({
        full_name: '',
        email: '',
        password: '',
        role: 'ADMIN',
        is_active: true,
        is_superuser: false,
    });
    const [creating, setCreating] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Fetch admins
    const fetchAdmins = useCallback(async () => {
        if (!token) return;

        setLoading(true);
        try {
            // Fetch users with ADMIN role
            const response = await userService.getUsers({
                role: 'ADMIN',
                limit: 100, // Load up to 100 admins for simplicity
            });
            setAdmins(response.items);
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Failed to fetch admins");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchAdmins();
    }, [fetchAdmins]);

    // Handle create
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        setErrorMsg(null);
        try {
            await userService.createUser({
                ...formData,
                role: 'ADMIN' // Ensure role is always ADMIN
            } as UserCreateDto);
            
            toast.success("Tạo Quản trị viên thành công!");
            setShowCreateModal(false);
            setFormData({ full_name: '', email: '', password: '', role: 'ADMIN', is_active: true, is_superuser: false });
            fetchAdmins();
        } catch (error: any) {
            setErrorMsg(error.response?.data?.detail || "Tạo quản trị viên thất bại. Vui lòng thử lại.");
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Quản Lý Quản Trị Viên (Admins)</h1>
                    <p className="text-sm text-gray-500 mt-1">Quản lý các tài khoản có quyền truy cập hệ thống quản trị.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-black text-white px-4 py-2 rounded-md font-bold text-sm hover:bg-gray-800 transition-colors"
                >
                    + Tạo Quản Trị Viên Mới
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-2xl border border-[#0F0C17]/10 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-white text-[#0F0C17]/50 border-b border-[#0F0C17]/10">
                        <tr>
                            <th className="px-6 py-3 font-semibold">ID</th>
                            <th className="px-6 py-3 font-semibold">Họ và Tên</th>
                            <th className="px-6 py-3 font-semibold">Email</th>
                            <th className="px-6 py-3 font-semibold text-center">Trạng Thái</th>
                            <th className="px-6 py-3 font-semibold text-center">Superuser</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={5} className="px-6 py-8 text-center">Đang tải...</td></tr>
                        ) : admins.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Chưa có quản trị viên nào.</td></tr>
                        ) : (
                            admins.map((admin) => (
                                <tr key={admin.id} className="border-b border-[#0F0C17]/10 hover:bg-white/50 transition-colors">
                                    <td className="px-6 py-3 text-gray-600">#{admin.id}</td>
                                    <td className="px-6 py-3 text-gray-800 font-medium">{admin.full_name}</td>
                                    <td className="px-6 py-3 text-gray-600">{admin.email}</td>
                                    <td className="px-6 py-3 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${admin.account_status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {admin.account_status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        {admin.is_superuser ? (
                                            <span className="text-purple-600 font-bold">YES</span>
                                        ) : (
                                            <span className="text-gray-400">NO</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Admin Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                        <div className="bg-black p-6 text-white text-center">
                            <h2 className="text-xl font-bold font-garamond italic">Tạo Quản Trị Viên Mới</h2>
                            <p className="text-xs text-white/70 mt-1">Cấp tài khoản có quyền Admin</p>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            {errorMsg && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 font-medium">
                                    ⚠️ {errorMsg}
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Họ và Tên</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                                    placeholder="Admin Name"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                                    placeholder="admin@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Mật Khẩu Mặc Định</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                                    placeholder="Cấp mật khẩu (min 8 ký tự)..."
                                />
                            </div>
                            
                            <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="px-6 py-2 bg-black text-white text-sm font-bold uppercase tracking-wider rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                                >
                                    {creating ? 'Đang Tạo...' : 'Tạo Tài Khoản'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ToastContainer toasts={toast.toasts} onDismiss={toast.dismissToast} />
        </div>
    );
}
