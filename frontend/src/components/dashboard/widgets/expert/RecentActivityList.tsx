'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, CreditCard, ArrowUpRight, Loader2 } from 'lucide-react';
import { paymentService } from '@/services/paymentService';
import { PaymentTransaction, TransactionType, TransactionStatus } from '@/types/payment';

export default function RecentActivityList() {
    const [activities, setActivities] = React.useState<PaymentTransaction[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
        const fetchHistory = async () => {
            try {
                const data = await paymentService.getHistory(1, 10);
                setActivities(data.items);
            } catch (error) {
                console.error("Failed to fetch payment history", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const getActivityConfig = (activity: PaymentTransaction) => {
        switch (activity.type) {
            case TransactionType.BOOKING_RELEASE:
                return {
                    icon: <CheckCircle2 size={18} />,
                    colorClass: 'bg-[var(--color-navy)] text-[var(--color-amber)] border-[var(--color-amber)]/20',
                    bgClass: 'bg-[var(--color-navy)] border-[var(--color-ivory-10)] hover:border-[var(--color-amber)]/30',
                    title: 'Giải ngân buổi tư vấn',
                    amountPrefix: '+'
                };
            case TransactionType.WITHDRAWAL:
                return {
                    icon: <CreditCard size={18} />,
                    colorClass: 'bg-[var(--color-obsidian)] text-[var(--color-ivory-45)] border-[var(--color-ivory-10)]',
                    bgClass: 'bg-[var(--color-navy)] border-[var(--color-ivory-10)] hover:border-[var(--color-gold-line)]',
                    title: 'Yêu cầu rút tiền',
                    amountPrefix: '-'
                };
            default:
                return {
                    icon: <AlertCircle size={18} />,
                    colorClass: 'bg-transparent text-[var(--color-ivory-20)] border-[var(--color-ivory-10)]',
                    bgClass: 'bg-[var(--color-navy)] border-[var(--color-ivory-10)]',
                    title: activity.type,
                    amountPrefix: ''
                };
        }
    };

    if (loading) {
        return (
            <div className="bg-[var(--color-navy-mid)] rounded-sm p-8 border border-[var(--color-ivory-10)] h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[var(--color-ivory-10)] animate-spin" />
            </div>
        );
    }

    return (
        <div className="bg-[var(--color-navy-mid)] rounded-sm p-8 border border-[var(--color-ivory-10)] h-full flex flex-col hover:border-[var(--color-gold-line)] transition-all group overflow-hidden shadow-2xl font-sans">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-[11px] font-medium text-[var(--color-ivory-45)] uppercase tracking-[0.3em]">Hoạt động gần đây</h3>
                <button className="text-[9px] font-medium text-[var(--color-gold-dim)] bg-transparent border border-[var(--color-gold-line)] px-3 py-1.5 rounded-full uppercase tracking-widest hover:bg-[var(--color-gold-faint)] hover:text-[var(--color-gold)] transition-colors">
                    Xem tất cả
                </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-1">
                {activities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-[var(--color-ivory-10)]">
                        <AlertCircle size={32} strokeWidth={1} />
                        <p className="text-[10px] uppercase tracking-widest mt-4">Chưa có hoạt động nào</p>
                    </div>
                ) : (
                    activities.map((activity, i) => {
                        const config = getActivityConfig(activity);
                        return (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                key={activity.id}
                                className={`p-4 rounded-sm border flex items-center gap-5 transition-all hover:scale-[1.01] cursor-pointer group/item
                                    ${activity.status === TransactionStatus.FAILED
                                        ? 'bg-[var(--color-navy)] border-[var(--color-burgundy)]/30'
                                        : config.bgClass}
                                `}
                            >
                                <div className={`w-10 h-10 rounded-sm border flex items-center justify-center flex-shrink-0 transition-all
                                    ${activity.status === TransactionStatus.FAILED ? 'bg-[var(--color-obsidian)] text-[var(--color-burgundy)] border-[var(--color-burgundy)]/20' : config.colorClass}
                                `}>
                                    {activity.status === TransactionStatus.FAILED ? <AlertCircle size={18} /> : config.icon}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className={`text-xs font-medium truncate tracking-wide ${activity.status === TransactionStatus.FAILED ? 'text-[var(--color-burgundy)]' : 'text-[var(--color-ivory-70)]'}`}>{config.title}</p>
                                        <p className={`text-[10px] font-medium tracking-widest flex-shrink-0 ${config.amountPrefix === '+' ? 'text-[var(--color-amber)]' : 'text-[var(--color-ivory-45)]'}`}>
                                            {config.amountPrefix}{activity.amount.toLocaleString('vi-VN')} CR
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <p className="text-[10px] text-[var(--color-ivory-20)] font-light truncate uppercase tracking-wider">{activity.description || 'Không có mô tả'}</p>
                                        <p className="text-[10px] text-[var(--color-ivory-20)] font-medium ml-2 uppercase tracking-tighter opacity-60">
                                            {mounted ? new Date(activity.created_at).toLocaleDateString('vi-VN') : ''}
                                        </p>
                                    </div>
                                </div>

                                <div className="hidden group-hover/item:block opacity-40">
                                    <ArrowUpRight size={14} className="text-[var(--color-ivory)] group-hover/item:text-[var(--color-gold)] transition-colors" />
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>

            <div className="mt-6 pt-6 border-t border-[var(--color-ivory-10)] flex items-center justify-center">
                <p className="text-[9px] text-[var(--color-ivory-20)] font-light italic uppercase tracking-[0.2em]">Dữ liệu Strategic Command • Real-time Sync</p>
            </div>
        </div>
    );
}
