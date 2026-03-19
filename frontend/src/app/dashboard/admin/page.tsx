"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminService, AdminStats } from '@/services/adminService';
import { useAuthStore } from '@/store/useAuthStore';

export default function AdminDashboardPage() {
    const { token } = useAuthStore();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return; // Wait for hydration

        const fetchStats = async () => {
            try {
                const data = await adminService.getStats();
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch admin stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [token]);

    if (loading) return <div className="p-6">Loading stats...</div>;

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Total Users</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{stats?.total_users}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Experts</h3>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{stats?.total_experts}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Bookings</h3>
                    <p className="text-3xl font-bold text-purple-600 mt-2">{stats?.total_bookings}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Revenue (Credits)</h3>
                    <p className="text-3xl font-bold text-green-600 mt-2">{stats?.total_revenue}</p>
                </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                <Link href="/dashboard/admin/users" className="block bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Manage Users</h3>
                    <p className="text-gray-600">View list of registered students and their details.</p>
                </Link>
                <Link href="/dashboard/admin/experts" className="block bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Manage Experts</h3>
                    <p className="text-gray-600">Review KYC applications and manage expert profiles.</p>
                </Link>
                <Link href="/dashboard/admin/moderation" className="block bg-white p-6 rounded-xl shadow-sm border border-red-100 hover:shadow-md transition-shadow">
                    <h3 className="text-xl font-semibold text-red-600 mb-2">🚨 Account Moderation</h3>
                    <p className="text-gray-600">Suspend/Ban users and experts. Manage violations.</p>
                </Link>
                <Link href="/dashboard/admin/account-actions" className="block bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Action History</h3>
                    <p className="text-gray-600">View audit log of all moderation actions.</p>
                </Link>
                <Link href="/dashboard/admin/emails" className="block bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Email Logs</h3>
                    <p className="text-gray-600">View sent system emails (Reset Links, etc.).</p>
                </Link>
                <Link href="/dashboard/admin/withdrawals" className="block bg-white p-6 rounded-xl shadow-sm border border-emerald-100 hover:shadow-md transition-shadow">
                    <h3 className="text-xl font-semibold text-emerald-700 mb-2">💸 Yêu cầu Rút tiền</h3>
                    <p className="text-gray-600">Duyệt hoặc từ chối yêu cầu rút tiền của Chuyên gia.</p>
                </Link>
                <Link href="/dashboard/admin/refunds" className="block bg-white p-6 rounded-xl shadow-sm border border-orange-100 hover:shadow-md transition-shadow">
                    <h3 className="text-xl font-semibold text-orange-600 mb-2">🏦 Yêu cầu Hoàn tiền</h3>
                    <p className="text-gray-600">Xử lý yêu cầu hoàn tiền (Credits → Ngân hàng) từ học viên.</p>
                </Link>
            </div>
        </div>
    );
}
