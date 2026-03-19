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
                    icon: <CheckCircle2 size={20} />,
                    colorClass: 'bg-emerald-100 text-emerald-600',
                    bgClass: 'bg-slate-50 border-slate-50 hover:bg-white hover:border-blue-100',
                    title: 'Giải ngân buổi tư vấn',
                    amountPrefix: '+'
                };
            case TransactionType.WITHDRAWAL:
                return {
                    icon: <CreditCard size={20} />,
                    colorClass: 'bg-slate-200 text-slate-600',
                    bgClass: 'bg-slate-50 border-slate-50 hover:bg-white hover:border-blue-100',
                    title: 'Yêu cầu rút tiền',
                    amountPrefix: '-'
                };
            default:
                return {
                    icon: <AlertCircle size={20} />,
                    colorClass: 'bg-slate-100 text-slate-400',
                    bgClass: 'bg-slate-50 border-slate-50',
                    title: activity.type,
                    amountPrefix: ''
                };
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-slate-200 animate-spin" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm h-full flex flex-col hover:border-blue-200 transition-all group overflow-hidden">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-800">Hoạt động gần đây</h3>
                <button className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg uppercase tracking-wider hover:bg-blue-100 transition-colors">
                    Xem tất cả
                </button>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1">
                {activities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-300">
                        <AlertCircle size={32} strokeWidth={1} />
                        <p className="text-xs font-medium mt-2">Chưa có hoạt động nào</p>
                    </div>
                ) : (
                    activities.map((activity, i) => {
                        const config = getActivityConfig(activity);
                        return (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                key={activity.id}
                                className={`p-4 rounded-2xl border flex items-center gap-4 transition-all hover:scale-[1.01] cursor-pointer group/item
                                    ${activity.status === TransactionStatus.FAILED
                                        ? 'bg-red-50 border-red-100'
                                        : config.bgClass}
                                `}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                                    ${activity.status === TransactionStatus.FAILED ? 'bg-red-100 text-red-600' : config.colorClass}
                                `}>
                                    {activity.status === TransactionStatus.FAILED ? <AlertCircle size={20} /> : config.icon}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className={`text-xs font-bold truncate ${activity.status === TransactionStatus.FAILED ? 'text-red-700' : 'text-slate-900'}`}>{config.title}</p>
                                        <p className={`text-[10px] font-black flex-shrink-0 ${config.amountPrefix === '+' ? 'text-emerald-600' : 'text-slate-500'}`}>
                                            {config.amountPrefix}{activity.amount.toLocaleString('vi-VN')} CR
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                        <p className="text-[10px] text-slate-400 font-medium truncate">{activity.description || 'Không có mô tả'}</p>
                                        <p className="text-[10px] text-slate-400 font-bold ml-2">
                                            {mounted ? new Date(activity.created_at).toLocaleDateString('vi-VN') : ''}
                                        </p>
                                    </div>
                                </div>

                                <div className="hidden group-hover/item:block">
                                    <ArrowUpRight size={14} className="text-slate-300 group-hover/item:text-blue-500 transition-colors" />
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-center">
                <p className="text-[10px] text-slate-400 font-medium italic">Dữ liệu được cập nhật thời gian thực</p>
            </div>
        </div>
    );
}
