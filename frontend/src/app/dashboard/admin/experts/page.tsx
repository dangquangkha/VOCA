"use client";

import { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import { useAuthStore } from '@/store/useAuthStore';

export default function AdminExpertsPage() {
    const { token } = useAuthStore();
    const [experts, setExperts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('ALL');

    // Create Expert Modal State
    const [showModal, setShowModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [formData, setFormData] = useState({ full_name: '', email: '', password: '' });
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const fetchExperts = async () => {
        try {
            setLoading(true);
            const status = filter === 'ALL' ? undefined : filter;
            const data = await adminService.getExperts(status);
            setExperts(data);
        } catch (error) {
            console.error("Failed to fetch experts", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!token) return;
        fetchExperts();
    }, [filter, token]);

    const handleCreateExpert = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        setErrorMsg(null);
        try {
            await adminService.createExpert(formData);
            setShowModal(false);
            setFormData({ full_name: '', email: '', password: '' });
            fetchExperts(); // Refresh
            alert("Tạo chuyên gia thành công!");
        } catch (error: any) {
            // Remove console.error to prevent Next.js Dev overlay for expected validation errors
            setErrorMsg(error.response?.data?.detail || "Tạo chuyên gia thất bại. Vui lòng thử lại.");
        } finally {
            setCreating(false);
        }
    };

    const handleApprove = async (id: number) => {
        if (!confirm("Approve this expert?")) return;
        try {
            await adminService.updateKYC(id, 'APPROVED');
            fetchExperts(); // Refresh
        } catch (e) {
            alert("Failed to approve");
        }
    };

    const handleReject = async (id: number) => {
        if (!confirm("Reject this expert?")) return;
        try {
            await adminService.updateKYC(id, 'REJECTED');
            fetchExperts(); // Refresh
        } catch (e) {
            alert("Failed to reject");
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Quản Lý Chuyên Gia</h1>
                <div className="flex gap-4">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="border rounded-md px-3 py-2 text-sm"
                        suppressHydrationWarning
                    >
                        <option value="ALL">Tất cả trạng thái</option>
                        <option value="PENDING">Chờ duyệt</option>
                        <option value="APPROVED">Đã duyệt</option>
                        <option value="REJECTED">Đã từ chối</option>
                    </select>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-[#0046EA] text-white px-4 py-2 rounded-md font-bold text-sm hover:bg-[#0038ba] transition-colors"
                        suppressHydrationWarning
                    >
                        + Tạo Chuyên Gia Mới
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-2xl border border-[#0F0C17]/10 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-white text-[#0F0C17]/50 border-b border-[#0F0C17]/10">
                        <tr>
                            <th className="px-6 py-3 font-semibold">ID</th>
                            <th className="px-6 py-3 font-semibold">Bio</th>
                            <th className="px-6 py-3 font-semibold">LinkedIn</th>
                            <th className="px-6 py-3 font-semibold text-center">Review Status</th>
                            <th className="px-6 py-3 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={5} className="px-6 py-8 text-center">Loading...</td></tr>
                        ) : experts.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No experts found.</td></tr>
                        ) : (
                            experts.map((exp) => (
                                <tr key={exp.id} className="border-b border-[#0F0C17]/10 hover:bg-white/50 transition-colors">
                                    <td className="px-6 py-3 text-gray-600">#{exp.id}</td>
                                    <td className="px-6 py-3 text-gray-800 max-w-xs truncate">{exp.bio || 'N/A'}</td>
                                    <td className="px-6 py-3 text-blue-600 truncate">
                                        <a href={exp.linkedin_url} target="_blank" rel="noreferrer" className="hover:underline">View Profile</a>
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${exp.kyc_status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                            exp.kyc_status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {exp.kyc_status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-right space-x-2">
                                        {exp.kyc_status === 'PENDING' && (
                                            <>
                                                <button
                                                    onClick={() => handleApprove(exp.id)}
                                                    className="px-3 py-1 bg-green-600 text-[#0F0C17] rounded hover:bg-green-700 text-xs"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleReject(exp.id)}
                                                    className="px-3 py-1 bg-red-600 text-[#0F0C17] rounded hover:bg-red-700 text-xs"
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Expert Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                        <div className="bg-[#0046EA] p-6 text-white text-center">
                            <h2 className="text-xl font-bold font-garamond italic">Tạo Chuyên Gia Mới</h2>
                            <p className="text-xs text-white/70 mt-1">Cấp tài khoản nhanh cho chuyên gia</p>
                        </div>
                        <form onSubmit={handleCreateExpert} className="p-6 space-y-4">
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
                                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#0046EA] focus:border-transparent outline-none"
                                    placeholder="Nguyễn Văn A"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#0046EA] focus:border-transparent outline-none"
                                    placeholder="chuyengia@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Mật Khẩu Mặc Định</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#0046EA] focus:border-transparent outline-none"
                                    placeholder="Cấp mật khẩu..."
                                />
                            </div>
                            
                            <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="px-6 py-2 bg-[#0046EA] text-[#FFE900] text-sm font-bold uppercase tracking-wider rounded-lg hover:bg-[#0038ba] transition-colors disabled:opacity-50"
                                >
                                    {creating ? 'Đang Tạo...' : 'Tạo Tài Khoản'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
