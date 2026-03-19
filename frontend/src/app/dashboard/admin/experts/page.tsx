"use client";

import { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import { useAuthStore } from '@/store/useAuthStore';

export default function AdminExpertsPage() {
    const { token } = useAuthStore();
    const [experts, setExperts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('ALL');

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
                <h1 className="text-2xl font-bold text-gray-800">Expert Management</h1>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="border rounded-md px-3 py-1"
                >
                    <option value="ALL">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                </select>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600">
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
                                <tr key={exp.id} className="hover:bg-gray-50">
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
                                                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleReject(exp.id)}
                                                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
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
        </div>
    );
}
