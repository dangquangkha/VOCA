"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminService, AdminStats } from '@/services/adminService';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuthStore } from '@/store/useAuthStore';
import {
    Users,
    ShieldCheck,
    LayoutGrid,
    ClipboardList,
    Mail,
    Banknote,
    RotateCcw,
    Activity,
    ArrowUpRight,
    Search,
    Bell,
    Home,
    AlertCircle
} from 'lucide-react';

export default function AdminDashboardPage() {
    const { token } = useAuthStore();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return;

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

    const navItems = [
        { href: '/', title: 'Return to Home', icon: Home },
        { href: '/dashboard/admin/users', title: 'User Management', icon: Users },
        { href: '/dashboard/admin/experts', title: 'Expert Verification', icon: ShieldCheck },
        { href: '/dashboard/admin/moderation', title: 'System Moderation', icon: LayoutGrid },
        { href: '/dashboard/admin/account-actions', title: 'Audit Protocol', icon: ClipboardList },
        { href: '/dashboard/admin/emails', title: 'Communication Logs', icon: Mail },
        { href: '/dashboard/admin/disputes', title: 'Resolution Center', icon: AlertCircle },
        { href: '/dashboard/admin/withdrawals', title: 'Withdrawal Claims', icon: Banknote },
        { href: '/dashboard/admin/refunds', title: 'Refund Requests', icon: RotateCcw },
    ];

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#0046EA]/5">
            <div className="space-y-4 text-center">
                <div className="w-12 h-12 border-[0.5px] border-[#0F0C17]/10 border-t-[#0046EA] rounded-full animate-spin mx-auto" />
                <p className="text-[#0F0C17]/50 font-sans uppercase text-[10px] tracking-[0.2em]">Synchronizing Strategic Command...</p>
            </div>
        </div>
    );

    const statItems = [
        { label: 'Total Users', value: stats?.total_users, trend: '+12.5%', detail: 'Registered Base' },
        { label: 'Verified Experts', value: stats?.total_experts, trend: '+5.2%', detail: 'Industry Leaders' },
        { label: 'Active Sessions', value: stats?.total_bookings, trend: '+8.1%', detail: 'Pending/Confirmed' },
        { label: 'Gross Revenue', value: stats?.total_revenue, trend: '+15.4%', detail: 'System Credits' }
    ];

    return (
        <DashboardLayout>
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-12 pb-24"
            >
                {/* ── Header ── */}
                <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-8 bg-[#00A4FD] rounded-full" />
                            <h1 className="text-[clamp(40px,5vw,56px)] font-garamond italic text-[#171716] leading-none font-bold">Bàn điều hành</h1>
                        </div>
                        <p className="text-[10px] font-black text-black/40 uppercase tracking-[0.4em] ml-5">Administrative Command Center • Status: Operational</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="h-12 px-6 bg-black/5 rounded-2xl flex items-center gap-3 border border-black/5">
                            <Activity className="w-4 h-4 text-[#00A4FD]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-black/60">System Load: Stable</span>
                        </div>
                    </div>
                </header>

                {/* ── Key Metrics ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {statItems.map((stat, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white border border-black/5 rounded-[32px] p-8 group hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-500"
                        >
                            <div className="flex items-start justify-between mb-6">
                                <h3 className="text-black/30 font-black uppercase text-[9px] tracking-[0.2em]">{stat.label}</h3>
                                <span className="text-[#00A4FD] text-[9px] flex items-center gap-1 font-black bg-[#00A4FD]/5 px-2 py-1 rounded-full border border-[#00A4FD]/10">
                                    <ArrowUpRight className="w-3 h-3" />
                                    {stat.trend}
                                </span>
                            </div>
                            <p className="text-5xl font-garamond italic font-bold text-[#171716] leading-none mb-4 group-hover:text-[#0046EA] transition-colors">
                                {typeof stat.value === 'number' ? (stat.label.includes('Revenue') ? `${stat.value.toLocaleString()} CR` : stat.value.toLocaleString()) : '0'}
                            </p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-black/20">
                                {stat.detail}
                            </p>
                        </motion.div>
                    ))}
                </div>

                {/* ── Tactical Overview ── */}
                <div className="grid grid-cols-12 gap-10">
                    {/* Main Stats/Charts Area */}
                    <div className="col-span-12 lg:col-span-8 space-y-10">
                        <div className="bg-white border border-black/5 rounded-[40px] overflow-hidden shadow-sm h-full flex flex-col">
                            <div className="p-8 border-b border-black/5 flex items-center justify-between bg-[#F5F8FF]/50">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-black/40">Thống kê Doanh thu & Phiên tư vấn</h3>
                                <div className="flex gap-4">
                                    {['7D', '30D', '1Y'].map(t => (
                                        <button key={t} className={`text-[9px] font-black uppercase tracking-widest ${t === '30D' ? 'text-[#00A4FD] border-b-2 border-[#00A4FD]' : 'text-black/20 hover:text-black/40'}`}>
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex-1 p-10 flex items-center justify-center min-h-[400px]">
                                <div className="w-full h-full border-2 border-dashed border-black/5 rounded-[32px] flex flex-col items-center justify-center gap-6 group hover:border-[#00A4FD]/20 transition-all">
                                    <div className="w-20 h-20 bg-[#00A4FD]/5 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Activity className="w-8 h-8 text-[#00A4FD]/40 group-hover:text-[#00A4FD]" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-black/20">Dữ liệu phân tích đang được tổng hợp</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Panel */}
                    <div className="col-span-12 lg:col-span-4 space-y-10">
                        <div className="bg-[#171716] rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00A4FD]/10 blur-[40px] rounded-full -mr-16 -mt-16" />
                            
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-10 border-b border-white/10 pb-6">
                                    <h3 className="text-xl font-garamond italic font-bold">Cần xử lý</h3>
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#FFE900] animate-pulse shadow-[0_0_15px_rgba(255,233,0,0.5)]" />
                                </div>

                                <div className="space-y-6">
                                    {[
                                        { title: "Khiếu nại đang chờ", count: stats?.open_disputes || 0, urgency: "High", icon: AlertCircle, href: '/dashboard/admin/disputes' },
                                        { title: "Yêu cầu rút tiền", count: stats?.pending_withdrawals || 0, urgency: "High", icon: Banknote, href: '/dashboard/admin/withdrawals' },
                                        { title: "Xác minh Chuyên gia", count: stats?.pending_experts || 0, urgency: "Med", icon: ShieldCheck, href: '/dashboard/admin/experts' },
                                        { title: "Hoàn tiền chưa xử lý", count: stats?.pending_refunds || 0, urgency: "Low", icon: RotateCcw, href: '/dashboard/admin/refunds' }
                                    ].map((action, i) => (
                                        <Link key={i} href={action.href} className="flex items-center justify-between group p-2 hover:bg-white/5 rounded-2xl transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-[#00A4FD] group-hover:border-[#00A4FD] transition-all">
                                                    <action.icon className="w-4 h-4 text-white/40 group-hover:text-white" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white/80 group-hover:text-white">{action.title}</p>
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-white/20">{action.urgency} Urgency</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg font-garamond italic font-bold text-[#FFE900]">{action.count}</span>
                                                <ArrowUpRight className="w-3 h-3 text-white/20 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Quick Protocol */}
                        <div className="bg-[#F5F8FF] rounded-[40px] p-8 border border-black/5">
                            <h4 className="text-[10px] font-black text-black/40 uppercase tracking-[0.3em] mb-6 border-b border-black/5 pb-4">Giao thức nhanh</h4>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: 'Gửi Email', icon: Mail, href: '/dashboard/admin/emails' },
                                    { label: 'Audit Log', icon: ClipboardList, href: '/dashboard/admin/account-actions' }
                                ].map(tool => (
                                    <Link key={tool.label} href={tool.href} className="flex flex-col items-center gap-3 p-4 bg-white border border-black/5 rounded-2xl hover:border-[#00A4FD] transition-all group">
                                        <tool.icon className="w-5 h-5 text-black/20 group-hover:text-[#00A4FD]" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-black/40">{tool.label}</span>
                                    </Link>
                                ))}
                            </div>
                </div>
                </div>
            </div>
        </motion.div>
      </DashboardLayout>
    );
}
