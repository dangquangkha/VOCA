'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, Clock, TrendingUp, ArrowUpRight, Loader2 } from 'lucide-react';
import { expertService } from '@/services/expertService';
import { ExpertStats } from '@/types/payment';

export default function RevenueSummary() {
    const [stats, setStats] = React.useState<ExpertStats | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchStats = async () => {
            console.log("RevenueSummary: fetchStats effect started");
            try {
                const data = await expertService.getFinancialStats();
                console.log("RevenueSummary: AXIOS SUCCESS:", data);
                setStats(data);
            } catch (axiosError: any) {
                console.warn("RevenueSummary: AXIOS FAILED (Network Error?), trying FETCH fallback...", axiosError);

                // Nuclear fallback: Direct fetch to rule out Axios
                try {
                    const token = localStorage.getItem('auth-storage') ? JSON.parse(localStorage.getItem('auth-storage')!).state.token : null;
                    const res = await fetch('http://127.0.0.1:8000/api/v1/payments/expert/stats', {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (res.ok) {
                        const data = await res.json();
                        console.log("RevenueSummary: FETCH SUCCESS!", data);
                        setStats(data);
                    } else {
                        console.error("RevenueSummary: FETCH ALSO FAILED:", res.status, res.statusText);
                    }
                } catch (fetchError) {
                    console.error("RevenueSummary: FETCH TOTALLY FAILED (Network/CORS):", fetchError);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading || !stats) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[220px]">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm animate-pulse flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-slate-200 animate-spin" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
            {/* Available to Withdraw */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between hover:border-emerald-200 transition-all group">
                <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Wallet size={20} />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Sẵn sàng</span>
                </div>
                <div>
                    <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Số dư khả dụng</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900">{stats.available.toLocaleString('vi-VN')}</span>
                        <span className="text-xs font-bold text-slate-400">CR</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">≈ {(stats.available * 1000).toLocaleString('vi-VN')} VNĐ</p>
                </div>
                <button className="mt-6 w-full py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 group-hover:scale-[1.02]">
                    Rút tiền ngay <ArrowUpRight size={14} />
                </button>
            </div>

            {/* Escrow / Pending Hold */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between hover:border-amber-200 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-12 -mt-12 opacity-50"></div>

                <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Clock size={20} />
                    </div>
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Escrow</span>
                </div>
                <div className="relative z-10">
                    <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Tiền đang chờ duyệt</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900">{stats.escrow.toLocaleString('vi-VN')}</span>
                        <span className="text-xs font-bold text-slate-400">CR</span>
                    </div>
                    <p className="text-[10px] text-amber-600 font-medium mt-1 pr-4 leading-tight">
                        Tự động giải ngân sau 24h khiếu nại của học viên.
                    </p>
                </div>
                <div className="mt-6 h-1 w-full bg-slate-100 rounded-full overflow-hidden relative z-10">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '65%' }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-amber-500 rounded-full"
                    />
                </div>
            </div>

            {/* Monthly Total */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between hover:border-blue-200 transition-all group">
                <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <TrendingUp size={20} />
                    </div>
                    <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold">
                        +{stats.trend}% <ArrowUpRight size={12} />
                    </div>
                </div>
                <div>
                    <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Tổng thu nhập tháng</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900">{stats.monthly_total.toLocaleString('vi-VN')}</span>
                        <span className="text-xs font-bold text-slate-400">CR</span>
                    </div>
                </div>
                {/* Simple Sparkline Mockup */}
                <div className="mt-6 h-12 flex items-end gap-1">
                    {[30, 45, 35, 60, 55, 70, 85, 65, 90, 100].map((h, i) => (
                        <motion.div
                            key={i}
                            initial={{ height: 0 }}
                            animate={{ height: `${h}%` }}
                            transition={{ delay: i * 0.05, duration: 0.5 }}
                            className="flex-1 bg-blue-100 rounded-t-sm group-hover:bg-blue-200 transition-colors"
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
