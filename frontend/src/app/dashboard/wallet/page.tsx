'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { PaymentTransaction, TransactionType, TransactionStatus, PaymentDepositResponse, RefundRequestCreate } from '@/types/payment';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { paymentService } from '@/services/paymentService';
import Pagination from '@/components/admin/users/Pagination';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Wallet, 
    History, 
    ArrowDownToLine, 
    ArrowUpFromLine, 
    RefreshCw, 
    ShieldCheck, 
    CreditCard, 
    Landmark, 
    Info, 
    ChevronRight,
    CheckCircle2,
    X
} from 'lucide-react';

export default function WalletPage() {
    const { user, updateUser } = useAuthStore();
    const [history, setHistory] = useState<PaymentTransaction[]>([]);
    const [amount, setAmount] = useState<number>(100);
    const [isLoading, setIsLoading] = useState(false);
    const [isHistoryLoading, setIsHistoryLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    // Pagination State
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const [paymentDetails, setPaymentDetails] = useState<PaymentDepositResponse | null>(null);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const processedTrxIds = useRef<Set<number>>(new Set());

    // Refund state
    const [showRefundForm, setShowRefundForm] = useState(false);
    const [refundLoading, setRefundLoading] = useState(false);
    const [refundForm, setRefundForm] = useState<RefundRequestCreate>({
        amount: 0, bank_name: '', bank_account: '', account_holder: ''
    });
    const [refundSuccess, setRefundSuccess] = useState<string | null>(null);

    const balance = user?.credits ?? 0;

    const fetchHistory = async () => {
        setIsHistoryLoading(true);
        try {
            const data = await paymentService.getHistory(page, pageSize);
            setHistory(data.items);
            setTotalItems(data.total);
            setTotalPages(data.total_pages);
        } catch (error) {
            console.error("Failed to fetch history", error);
        } finally {
            setIsHistoryLoading(false);
        }
    };

    const fetchUser = async () => {
        setIsLoading(true);
        try {
            const { data } = await api.get('users/me');
            updateUser(data);
            return data;
        } catch (error) {
            console.error("Failed to sync user", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setMounted(true);
        fetchHistory();
        fetchUser();

        return () => {
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        };
    }, [page, pageSize]);

    // Polling Logic
    useEffect(() => {
        if (!paymentDetails) {
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
            return;
        }

        const pollStatus = async () => {
            try {
                const { data } = await api.get<PaymentTransaction>(`payments/${paymentDetails.transaction_id}`);
                if (data.status === TransactionStatus.COMPLETED && !processedTrxIds.current.has(paymentDetails.transaction_id)) {
                    processedTrxIds.current.add(paymentDetails.transaction_id);
                    setPaymentDetails(null);
                    fetchUser();
                    fetchHistory();
                }
            } catch (error) {
                console.error("Polling error", error);
            }
        };

        pollingIntervalRef.current = setInterval(pollStatus, 3000);

        return () => {
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        };
    }, [paymentDetails]);

    // WebSocket Sync Logic
    const { notifications } = useNotificationStore();
    useEffect(() => {
        if (!notifications.length) return;

        const latestNotification = notifications[0];
        const isPaymentSuccess = latestNotification.type === 'payment' &&
            (latestNotification.title.toLowerCase().includes('thành công') ||
                latestNotification.message.toLowerCase().includes('thành công'));

        if (isPaymentSuccess) {
            fetchUser();
            fetchHistory();

            if (paymentDetails && !processedTrxIds.current.has(paymentDetails.transaction_id)) {
                processedTrxIds.current.add(paymentDetails.transaction_id);
                setPaymentDetails(null);
            }
        }
    }, [notifications]);

    const handleTopUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (amount < 10) {
            alert("Minimum deposit is 10 Credits (10,000 VND)");
            return;
        }

        setIsLoading(true);
        try {
            const { data } = await api.post<PaymentDepositResponse>('payments/topup', { amount });
            setPaymentDetails(data);
        } catch (error: any) {
            alert(error.response?.data?.detail || "Top Up Failed");
        } finally {
            setIsLoading(false);
        }
    };

    const cancelPayment = () => {
        setPaymentDetails(null);
    }

    const pendingCredits = history
        .filter(trx => trx.status === TransactionStatus.PENDING && (trx.type === TransactionType.DEPOSIT || trx.type === TransactionType.BOOKING_REFUND))
        .reduce((sum, trx) => sum + trx.amount, 0);

    return (
        <div className="min-h-screen bg-white font-dm-sans selection:bg-[#0046EA]/20 pb-24">
            {/* Header Section */}
            <header className="bg-[#0046EA] pt-20 pb-32 px-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(0,164,253,0.4)_0%,transparent_70%)]" />
                <div className="max-w-6xl mx-auto relative z-10">
                    <nav className="flex items-center gap-4 mb-8">
                        <Link
                            href={user?.role === 'EXPERT' || user?.role === 'MENTOR' ? "/dashboard/expert" : "/dashboard"}
                            className="flex items-center gap-2 text-[10px] font-black text-white/40 hover:text-white transition-all uppercase tracking-[0.2em]"
                        >
                            Bàn làm việc
                        </Link>
                        <ChevronRight size={10} className="text-white/20" />
                        <span className="text-[10px] font-black text-[#FFE900] uppercase tracking-[0.2em]">Quản lý Ví</span>
                    </nav>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-[2px] bg-[#FFE900]" />
                                <span className="text-[10px] text-[#FFE900] tracking-[0.5em] font-black uppercase">NGÂN KHỐ DI SẢN</span>
                            </div>
                            <h1 className="text-6xl font-garamond italic font-bold text-white tracking-tight leading-none">
                                Ví của bạn
                            </h1>
                        </div>
                        <div className="flex items-center gap-8 bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-[40px] shadow-2xl">
                            <div className="space-y-2">
                                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">SỐ DƯ HIỆN TẠI</p>
                                <div className="flex items-baseline gap-3">
                                    <span className="text-5xl font-garamond italic font-bold text-[#FFE900] tabular-nums">
                                        {balance.toLocaleString('vi-VN')}
                                    </span>
                                    <span className="text-xl font-garamond italic text-white/40 uppercase tracking-widest">Credits</span>
                                </div>
                            </div>
                            <div className="w-px h-16 bg-white/10" />
                            <div className="space-y-2">
                                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">ĐANG XỬ LÝ</p>
                                <div className="flex items-baseline gap-3">
                                    <span className="text-3xl font-garamond italic font-bold text-white/60 tabular-nums">
                                        {pendingCredits.toLocaleString('vi-VN')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-8 -mt-16 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Top Up Form */}
                    <div className="lg:col-span-4">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white border border-black/5 rounded-[48px] shadow-2xl p-10 space-y-10"
                        >
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 bg-[#F5F8FF] text-[#0046EA] flex items-center justify-center rounded-2xl">
                                    <ArrowDownToLine size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-garamond italic font-bold text-[#171716]">Nạp Credits</h3>
                                    <p className="text-[9px] font-black text-black/30 uppercase tracking-[0.2em] mt-1">1 Credit = 1,000 VND</p>
                                </div>
                            </div>

                            <form onSubmit={handleTopUp} className="space-y-8">
                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-black/40 uppercase tracking-widest">SỐ LƯỢNG MUỐN NẠP</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="10"
                                            value={amount}
                                            onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                                            className="w-full bg-[#F5F8FF] border-2 border-transparent focus:border-[#0046EA]/20 focus:bg-white rounded-3xl p-6 text-3xl font-garamond italic font-bold text-[#171716] focus:outline-none transition-all tabular-nums"
                                        />
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-black/20 font-black text-[10px] uppercase tracking-widest">
                                            CREDITS
                                        </div>
                                    </div>
                                    <div className="p-4 bg-[#FFE900]/10 border border-[#FFE900]/20 rounded-2xl flex items-center justify-between">
                                        <span className="text-[10px] font-black text-black/40 uppercase tracking-widest">Tương ứng</span>
                                        <span className="text-lg font-garamond italic font-bold text-[#0046EA]">
                                            {mounted ? (amount * 1000).toLocaleString('vi-VN') : (amount * 1000)} VND
                                        </span>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading || amount <= 0 || !!paymentDetails}
                                    className="w-full h-20 bg-[#0046EA] text-[#FFE900] font-black uppercase tracking-[0.5em] text-[11px] rounded-full shadow-xl hover:bg-[#171716] transition-all duration-700 disabled:opacity-20 group"
                                >
                                    <span className="flex items-center justify-center gap-4">
                                        {isLoading ? 'ĐANG XỬ LÝ...' : 'NẠP QUA QR CODE'}
                                        <ChevronRight size={16} className="group-hover:translate-x-2 transition-transform" />
                                    </span>
                                </button>
                            </form>

                            <div className="pt-6 border-t border-black/5 flex items-center gap-4 text-[9px] font-black text-black/20 uppercase tracking-[0.2em]">
                                <ShieldCheck size={14} className="text-[#0046EA]" />
                                Thanh toán bảo mật bởi VietQR & NAPAS
                            </div>
                        </motion.div>
                    </div>

                    {/* QR Code / History Section */}
                    <div className="lg:col-span-8 space-y-12">
                        <AnimatePresence mode="wait">
                            {paymentDetails ? (
                                <motion.div
                                    key="qr-section"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-white border border-black/5 rounded-[64px] shadow-2xl p-12 text-center space-y-10 relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#0046EA]/5 blur-[100px] rounded-full -mr-32 -mt-32" />
                                    
                                    <div className="space-y-4 relative z-10">
                                        <h3 className="text-3xl font-garamond italic font-bold text-[#171716]">Quét mã thanh toán</h3>
                                        <p className="text-[10px] font-black text-black/30 uppercase tracking-[0.4em]">VUI LÒNG CHUYỂN KHOẢN CHÍNH XÁC NỘI DUNG</p>
                                    </div>

                                    <div className="flex flex-col md:flex-row items-center gap-12 bg-[#F5F8FF] p-10 rounded-[48px] border border-black/5">
                                        <div className="shrink-0 bg-white p-6 rounded-3xl shadow-xl border border-black/5">
                                            <img
                                                src={paymentDetails.qr_url}
                                                alt="VietQR Code"
                                                className="w-64 h-64 object-contain"
                                            />
                                        </div>
                                        <div className="flex-1 text-left space-y-6">
                                            <div className="space-y-2">
                                                <p className="text-[9px] font-black text-black/30 uppercase tracking-widest">SỐ TIỀN</p>
                                                <p className="text-3xl font-garamond italic font-bold text-[#0046EA]">
                                                    {paymentDetails.amount_vnd.toLocaleString('vi-VN')} VND
                                                </p>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-[9px] font-black text-black/30 uppercase tracking-widest">NỘI DUNG CHUYỂN KHOẢN</p>
                                                <div className="p-4 bg-white border border-[#0046EA]/20 rounded-2xl flex items-center justify-between">
                                                    <span className="font-mono text-xl font-bold text-[#171716] tracking-tighter">{paymentDetails.content}</span>
                                                    <button 
                                                        onClick={() => navigator.clipboard.writeText(paymentDetails.content)}
                                                        className="text-[9px] font-black text-[#0046EA] uppercase tracking-widest hover:underline"
                                                    >
                                                        Sao chép
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 text-[10px] text-black/50 font-garamond italic leading-relaxed">
                                                <Info size={14} className="text-[#0046EA] shrink-0" />
                                                Hệ thống sẽ tự động cập nhật ngay sau khi nhận được tiền.
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={cancelPayment}
                                        className="text-[10px] font-black text-black/30 uppercase tracking-[0.5em] hover:text-[#D20048] transition-colors py-4"
                                    >
                                        HỦY GIAO DỊCH NÀY
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="history-section"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="bg-white border border-black/5 rounded-[48px] shadow-xl overflow-hidden flex flex-col min-h-[600px]"
                                >
                                    <div className="p-10 border-b border-black/5 flex items-center justify-between bg-[#F5F8FF]">
                                        <div className="flex items-center gap-5">
                                            <History size={20} className="text-[#0046EA]" />
                                            <h3 className="text-xl font-garamond italic font-bold text-[#171716]">Lịch sử giao dịch</h3>
                                        </div>
                                        <RefreshCw 
                                            size={16} 
                                            className={`text-black/20 cursor-pointer hover:text-[#0046EA] transition-all ${isHistoryLoading ? 'animate-spin' : ''}`}
                                            onClick={fetchHistory}
                                        />
                                    </div>

                                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                                        {isHistoryLoading ? (
                                            <div className="p-20 text-center space-y-4">
                                                <div className="w-10 h-10 border-2 border-black/5 border-t-[#0046EA] rounded-full animate-spin mx-auto" />
                                                <p className="text-[10px] font-black text-black/20 uppercase tracking-widest">ĐANG TRUY VẤN DỮ LIỆU...</p>
                                            </div>
                                        ) : history.length === 0 ? (
                                            <div className="p-20 text-center opacity-30">
                                                <History size={48} className="mx-auto mb-6" strokeWidth={1} />
                                                <p className="text-[10px] font-black uppercase tracking-widest">Chưa có giao dịch nào được ghi nhận</p>
                                            </div>
                                        ) : (
                                            <ul className="divide-y divide-black/5">
                                                {history.map((trx) => {
                                                    const isDeposit = trx.type === TransactionType.DEPOSIT || trx.type === TransactionType.BOOKING_REFUND || trx.type === TransactionType.BOOKING_RELEASE;
                                                    const isPending = trx.status === TransactionStatus.PENDING || trx.status === TransactionStatus.PENDING_PAYOUT;

                                                    const statusConfig = {
                                                        [TransactionStatus.COMPLETED]: { label: 'THÀNH CÔNG', color: 'text-[#0046EA]', icon: <CheckCircle2 size={10} className="mr-2" /> },
                                                        [TransactionStatus.PENDING]: { label: 'ĐANG XỬ LÝ', color: 'text-black/30', icon: <RefreshCw size={10} className="mr-2 animate-spin" /> },
                                                        [TransactionStatus.FAILED]: { label: 'THẤT BẠI', color: 'text-[#D20048]', icon: <X size={10} className="mr-2" /> },
                                                        [TransactionStatus.REFUNDED]: { label: 'ĐÃ HOÀN TIỀN', color: 'text-black/50', icon: <ArrowUpFromLine size={10} className="mr-2" /> },
                                                    };

                                                    const config = statusConfig[trx.status as TransactionStatus] || { label: trx.status, color: '' };

                                                    return (
                                                        <li key={trx.id} className="p-8 hover:bg-[#F5F8FF] transition-all duration-500 group">
                                                            <div className="flex justify-between items-center gap-10">
                                                                <div className="flex items-center gap-6 flex-1 min-w-0">
                                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isDeposit ? 'bg-[#0046EA]/10 text-[#0046EA]' : 'bg-[#D20048]/10 text-[#D20048]'}`}>
                                                                        {isDeposit ? <ArrowDownToLine size={20} /> : <ArrowUpFromLine size={20} />}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-lg font-garamond italic font-bold text-[#171716] truncate">
                                                                            {trx.description || (trx.type === TransactionType.DEPOSIT ? 'Nạp Credits' : trx.type)}
                                                                        </p>
                                                                        <div className="flex items-center gap-4 mt-2">
                                                                            <span className="text-[10px] font-black text-black/20 uppercase tracking-widest">
                                                                                {mounted ? new Date(trx.created_at).toLocaleDateString('vi-VN') : ''}
                                                                            </span>
                                                                            <span className={`text-[9px] font-black uppercase tracking-widest flex items-center ${config.color}`}>
                                                                                {config.label}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <span className={`text-2xl font-garamond italic font-bold tabular-nums ${isPending ? 'text-black/20' : isDeposit ? 'text-[#0046EA]' : 'text-[#D20048]'}`}>
                                                                        {isDeposit ? '+' : '-'} {trx.amount.toLocaleString('vi-VN')}
                                                                    </span>
                                                                    <p className="text-[9px] font-black text-black/10 uppercase tracking-widest mt-1">CREDITS</p>
                                                                </div>
                                                            </div>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        )}
                                    </div>
                                    {totalItems > 0 && (
                                        <div className="p-8 bg-[#F5F8FF] border-t border-black/5">
                                            <Pagination
                                                currentPage={page}
                                                totalPages={totalPages}
                                                pageSize={pageSize}
                                                totalItems={totalItems}
                                                onPageChange={setPage}
                                                onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
                                                variant="dark"
                                            />
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Refund Section */}
                <motion.div 
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-12 bg-[#171716] border border-white/5 rounded-[64px] p-12 text-white relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-96 h-96 bg-[#0046EA]/10 blur-[100px] rounded-full -mr-48 -mt-48 pointer-events-none" />
                    
                    <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-10 relative z-10">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/10 text-[#FFE900] flex items-center justify-center rounded-2xl border border-white/10">
                                    <Landmark size={24} />
                                </div>
                                <h3 className="text-3xl font-garamond italic font-bold">Hoàn tiền về ngân hàng</h3>
                            </div>
                            <p className="text-[10px] text-white/30 uppercase tracking-[0.4em] font-black">XỬ LÝ TRONG 1-3 NGÀY LÀM VIỆC • BR-36.1 COMPLIANT</p>
                        </div>
                        {!showRefundForm && (
                            <button
                                onClick={() => { setShowRefundForm(true); setRefundSuccess(null); }}
                                disabled={balance <= 0}
                                className="h-16 px-10 bg-white text-[#0046EA] font-black uppercase tracking-[0.5em] text-[11px] rounded-full shadow-2xl hover:bg-[#FFE900] hover:text-[#0046EA] transition-all duration-700 disabled:opacity-20"
                            >
                                TẠO YÊU CẦU HOÀN TIỀN
                            </button>
                        )}
                    </div>

                    <AnimatePresence>
                        {refundSuccess && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-[#0046EA]/20 border border-[#0046EA]/40 text-[#0046EA] rounded-3xl p-6 text-sm mb-10 flex items-center gap-4"
                            >
                                <CheckCircle2 className="shrink-0" />
                                <span className="font-bold tracking-wide uppercase text-[10px]">{refundSuccess}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {showRefundForm && (
                        <motion.form
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            onSubmit={async (e) => {
                                e.preventDefault();
                                if (refundForm.amount <= 0 || refundForm.amount > balance) {
                                    alert(`Amount must be between 1 and ${balance} credits`);
                                    return;
                                }
                                setRefundLoading(true);
                                try {
                                    await api.post('payments/refund-request', refundForm);
                                    setRefundSuccess(`YÊU CẦU HOÀN ${refundForm.amount} CREDITS ĐÃ ĐƯỢC GỬI THÀNH CÔNG.`);
                                    setShowRefundForm(false);
                                    setRefundForm({ amount: 0, bank_name: '', bank_account: '', account_holder: '' });
                                    fetchUser();
                                    fetchHistory();
                                } catch (err: any) {
                                    alert(err.response?.data?.detail || 'Failed to submit refund request');
                                } finally {
                                    setRefundLoading(false);
                                }
                            }}
                            className="space-y-12 relative z-10"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest">SỐ CREDITS MUỐN RÚT</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={balance}
                                        value={refundForm.amount || ''}
                                        onChange={e => setRefundForm(f => ({ ...f, amount: parseInt(e.target.value) || 0 }))}
                                        className="w-full bg-white/5 border-2 border-transparent focus:border-[#0046EA] rounded-3xl p-6 text-2xl font-garamond italic font-bold text-white focus:outline-none transition-all tabular-nums"
                                        required
                                    />
                                    <p className="text-[10px] text-[#FFE900]/60 italic">≈ {((refundForm.amount || 0) * 1000).toLocaleString('vi-VN')} VND</p>
                                </div>
                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest">NGÂN HÀNG</label>
                                    <input
                                        type="text"
                                        value={refundForm.bank_name}
                                        onChange={e => setRefundForm(f => ({ ...f, bank_name: e.target.value }))}
                                        placeholder="VD: MB Bank, Vietcombank..."
                                        className="w-full bg-white/5 border-2 border-transparent focus:border-[#0046EA] rounded-3xl p-6 text-xl font-garamond italic text-white focus:outline-none transition-all"
                                        required
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest">SỐ TÀI KHOẢN</label>
                                    <input
                                        type="text"
                                        value={refundForm.bank_account}
                                        onChange={e => setRefundForm(f => ({ ...f, bank_account: e.target.value }))}
                                        className="w-full bg-white/5 border-2 border-transparent focus:border-[#0046EA] rounded-3xl p-6 text-xl font-garamond italic text-white focus:outline-none transition-all"
                                        required
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest">TÊN CHỦ TÀI KHOẢN</label>
                                    <input
                                        type="text"
                                        value={refundForm.account_holder}
                                        onChange={e => setRefundForm(f => ({ ...f, account_holder: e.target.value }))}
                                        placeholder="ĐÚNG TÊN TRÊN THẺ"
                                        className="w-full bg-white/5 border-2 border-transparent focus:border-[#0046EA] rounded-3xl p-6 text-xl font-garamond italic text-white focus:outline-none transition-all uppercase"
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div className="flex flex-col md:flex-row gap-6 pt-6 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setShowRefundForm(false)}
                                    disabled={refundLoading}
                                    className="h-16 px-12 border border-white/10 text-white/40 font-black uppercase tracking-[0.4em] text-[10px] rounded-full hover:text-white hover:bg-white/5 transition-all"
                                >
                                    HỦY BỎ
                                </button>
                                <button
                                    type="submit"
                                    disabled={refundLoading}
                                    className="h-16 px-12 bg-[#0046EA] text-[#FFE900] font-black uppercase tracking-[0.5em] text-[11px] rounded-full shadow-2xl hover:bg-white hover:text-[#0046EA] transition-all duration-700"
                                >
                                    {refundLoading ? 'ĐANG GỬI...' : 'XÁC NHẬN YÊU CẦU'}
                                </button>
                            </div>
                        </motion.form>
                    )}
                </motion.div>
            </main>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(0, 70, 234, 0.1);
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
}

