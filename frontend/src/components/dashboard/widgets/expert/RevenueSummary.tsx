'use client';

import React from 'react';
import { AxiosError } from 'axios';
import { motion } from 'framer-motion';
import { Wallet, Clock, TrendingUp, ArrowUpRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { expertService } from '@/services/expertService';
import { ExpertStats } from '@/types/payment';

export default function RevenueSummary() {
    const router = useRouter();
    const [stats, setStats] = React.useState<ExpertStats | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [isChecking, setIsChecking] = React.useState(false);

    const handleWithdrawClick = async () => {
        setIsChecking(true);
        try {
            const profile = await expertService.getProfile();
            // If any of these are missing, they need to update bank info
            if (!profile.bank_account || !profile.bank_name || !profile.bank_holder_name) {
                router.push('/dashboard/expert/wallet');
            } else {
                // If they have bank info, go to the wallet page anyway where the withdrawal form is
                router.push('/dashboard/expert/wallet');
            }
        } catch (error) {
            console.error("Failed to check bank info", error);
            // Fallback to wallet page if anything fails
            router.push('/dashboard/expert/wallet');
        } finally {
            setIsChecking(false);
        }
    };

    React.useEffect(() => {
        const fetchStats = async () => {
            console.log("RevenueSummary: fetchStats effect started");
            try {
                const data = await expertService.getFinancialStats();
                console.log("RevenueSummary: AXIOS SUCCESS:", data);
                setStats(data);
            } catch (axiosError: unknown) {
                console.error("RevenueSummary: Failed to fetch stats", axiosError);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading || !stats) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[220px]">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-[var(--color-navy-mid)] rounded-sm p-8 border border-[var(--color-ivory-10)] animate-pulse flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-[var(--color-ivory-10)] animate-spin" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full font-sans">
            {/* Available to Withdraw */}
            <div className="bg-[var(--color-navy-mid)] rounded-sm p-8 border border-[var(--color-ivory-10)] flex flex-col justify-between hover:border-[var(--color-gold-line)] transition-all group shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-gold-faint)] rounded-full -mr-16 -mt-16 opacity-10 group-hover:opacity-20 transition-opacity"></div>

                <div className="flex items-center justify-between mb-8 relative z-10">
                    <div className="w-10 h-10 rounded-sm bg-[var(--color-amber)]/10 text-[var(--color-amber)] flex items-center justify-center border border-[var(--color-amber)]/20">
                        <Wallet size={20} />
                    </div>
                    <span className="text-[10px] font-medium text-[var(--color-amber)] border border-[var(--color-amber)]/30 px-2.5 py-1 rounded-full uppercase tracking-widest bg-transparent">Sẵn sàng</span>
                </div>

                <div className="relative z-10">
                    <h3 className="text-[var(--color-ivory-45)] text-[10px] font-medium uppercase tracking-[0.3em] mb-3">Số dư khả dụng</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-serif italic text-[var(--color-amber)]">{stats.available.toLocaleString('vi-VN')}</span>
                        <span className="text-xs font-medium text-[var(--color-amber)]/40 tracking-widest uppercase">CR</span>
                    </div>
                    <p className="text-[10px] text-[var(--color-ivory-20)] uppercase tracking-wider mt-2 font-light">
                        ≈ <span className="text-[var(--color-ivory-45)]">{(stats.available * 1000).toLocaleString('vi-VN')} VNĐ</span>
                    </p>
                </div>

                <button
                    onClick={handleWithdrawClick}
                    disabled={isChecking}
                    className="mt-8 relative z-10 w-full py-4 bg-gradient-to-r from-[var(--color-gold)] to-[var(--color-teal-mid)] text-[var(--color-navy)] rounded-sm text-[10px] uppercase tracking-[0.4em] font-bold hover:opacity-90 transition-all duration-300 flex items-center justify-center gap-2 group-hover:scale-[1.01] disabled:opacity-50 disabled:cursor-wait border-0"
                >
                    {isChecking ? <Loader2 size={14} className="animate-spin" /> : <>Rút tiền ngay <ArrowUpRight size={14} /></>}
                </button>
            </div>

            {/* Escrow / Pending Hold */}
            <div className="bg-[var(--color-navy-mid)] rounded-sm p-8 border border-[var(--color-ivory-10)] flex flex-col justify-between hover:border-[var(--color-gold-line)] transition-all group relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-ivory-10)] rounded-full -mr-16 -mt-16 opacity-10"></div>

                <div className="flex items-center justify-between mb-8 relative z-10">
                    <div className="w-10 h-10 rounded-sm bg-[var(--color-navy)] text-[var(--color-ivory-45)] flex items-center justify-center border border-[var(--color-ivory-10)] group-hover:text-[var(--color-gold)] group-hover:border-[var(--color-gold-line)] transition-all">
                        <Clock size={20} />
                    </div>
                    <span className="text-[10px] font-medium text-[var(--color-ivory-45)] border border-[var(--color-ivory-10)] px-2.5 py-1 rounded-full uppercase tracking-widest">Escrow</span>
                </div>

                <div className="relative z-10">
                    <h3 className="text-[var(--color-ivory-45)] text-[10px] font-medium uppercase tracking-[0.3em] mb-3">Tiền chờ duyệt</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-serif italic text-[var(--color-terra)]">{stats.escrow.toLocaleString('vi-VN')}</span>
                        <span className="text-xs font-medium text-[var(--color-terra)]/40 tracking-widest uppercase">CR</span>
                    </div>
                    <p className="text-[10px] text-[var(--color-gold-dim)] font-light mt-3 pr-4 leading-relaxed uppercase tracking-wider italic">
                        Tự động giải ngân sau 24h
                    </p>
                </div>

                <div className="mt-8 h-[0.5px] w-full bg-[var(--color-ivory-10)] relative z-10 overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '65%' }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-[var(--color-teal-mid)] shadow-[0_0_8px_var(--color-teal-mid)]"
                    />
                </div>
            </div>

            {/* Monthly Total */}
            <div className="bg-[var(--color-navy-mid)] rounded-sm p-8 border border-[var(--color-ivory-10)] flex flex-col justify-between hover:border-[var(--color-gold-line)] transition-all group shadow-2xl relative overflow-hidden">
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-[var(--color-gold-faint)] rounded-full -mr-20 -mb-20 opacity-5"></div>

                <div className="flex items-center justify-between mb-8 relative z-10">
                    <div className="w-10 h-10 rounded-sm bg-[var(--color-gold-faint)] text-[var(--color-gold)] flex items-center justify-center border border-[var(--color-gold-line)]">
                        <TrendingUp size={20} />
                    </div>
                    <div className="flex items-center gap-1.5 text-[var(--color-teal-mid)] text-[10px] font-bold tracking-widest uppercase">
                        +{stats.trend}% <ArrowUpRight size={12} className="opacity-60" />
                    </div>
                </div>

                <div className="relative z-10">
                    <h3 className="text-[var(--color-ivory-45)] text-[10px] font-medium uppercase tracking-[0.3em] mb-3">Tổng thu nhập tháng</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-serif italic text-[var(--color-amber)]">{stats.monthly_total.toLocaleString('vi-VN')}</span>
                        <span className="text-xs font-medium text-[var(--color-amber)]/40 tracking-widest uppercase">CR</span>
                    </div>
                </div>

                {/* Simple Sparkline Mockup */}
                <div className="mt-8 h-12 flex items-end gap-1.5 relative z-10">
                    {[30, 45, 35, 60, 40, 70, 85, 65, 90, 100].map((h, i) => (
                        <motion.div
                            key={i}
                            initial={{ height: 0 }}
                            animate={{ height: `${h}%` }}
                            transition={{ delay: i * 0.05, duration: 0.8, ease: "easeOut" }}
                            className="flex-1 bg-[var(--color-ivory-10)] rounded-t-[1px] group-hover:bg-[var(--color-ivory-20)] transition-colors duration-500"
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
