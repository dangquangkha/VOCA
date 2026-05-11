'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { PaymentTransaction, TransactionStatus, TransactionType, WithdrawalCreate } from '@/types/payment';
import { ChevronRight, Landmark, ArrowUpRight, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────────
const MIN_WITHDRAWAL = 5; // Updated from 200 to 5

// ─── Locale-safe number formatter (fixes SSR/client hydration mismatch) ────────
const fmt = (n: number) => n.toLocaleString('vi-VN');

// ─── Helpers ───────────────────────────────────────────────────────────────────
const statusBadge: Record<string, { label: string; className: string; icon: any }> = {
    PENDING_PAYOUT: { label: 'Đang chờ giải ngân', className: 'text-[var(--color-terra)] border-[var(--color-terra)]/20 bg-[var(--color-terra)]/5', icon: Clock },
    COMPLETED: { label: 'Đã giải ngân', className: 'text-[var(--color-amber)] border-[var(--color-amber)]/20 bg-[var(--color-amber)]/5', icon: CheckCircle2 },
    REJECTED_PAYOUT: { label: 'Bị từ chối', className: 'text-[var(--color-burgundy)] border-[var(--color-burgundy)]/20 bg-[var(--color-burgundy)]/5', icon: XCircle },
    PENDING: { label: 'Đang xử lý', className: 'text-[var(--color-teal-mid)] border-[var(--color-teal-mid)]/20 bg-[var(--color-teal-mid)]/5', icon: Clock },
    FAILED: { label: 'Thất bại', className: 'text-[var(--color-ivory-45)] border-[var(--color-ivory-10)] bg-[var(--color-ivory-10)]/5', icon: AlertCircle },
};

function StatusBadge({ status }: { status: string }) {
    const s = statusBadge[status] ?? { label: status, className: 'text-[var(--color-ivory-45)] border-[var(--color-ivory-10)]', icon: AlertCircle };
    const Icon = s.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-medium border ${s.className}`}>
            <Icon size={12} strokeWidth={2.5} />
            {s.label}
        </span>
    );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function ExpertWalletPage() {
    const { user, updateUser } = useAuthStore();

    // Bank info form
    const [bankForm, setBankForm] = useState({ bank_name: '', bank_account: '', bank_holder_name: '' });
    const [bankSaving, setBankSaving] = useState(false);
    const [bankMsg, setBankMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Withdrawal form
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawLoading, setWithdrawLoading] = useState(false);
    const [withdrawMsg, setWithdrawMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // History
    const [history, setHistory] = useState<PaymentTransaction[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);

    // Revenue
    const [totalRevenue, setTotalRevenue] = useState(0);

    // Load expert profile → bank info
    const loadProfile = useCallback(async () => {
        try {
            const { data } = await api.get('experts/me');
            setTotalRevenue(data.total_revenue || 0);
            setBankForm({
                bank_name: data.bank_name ?? '',
                bank_account: data.bank_account ?? '',
                bank_holder_name: data.bank_holder_name ?? '',
            });
        } catch (err) {
            console.error('Failed to load expert profile', err);
        }
    }, []);

    const loadHistory = useCallback(async () => {
        setHistoryLoading(true);
        try {
            const { data } = await api.get('payments/history', { params: { skip: 0, limit: 50 } });
            const withdrawals = (data.items as PaymentTransaction[]).filter(
                t => t.type === TransactionType.WITHDRAWAL
            );
            setHistory(withdrawals);
        } catch (err) {
            console.error('Failed to load history', err);
        } finally {
            setHistoryLoading(false);
        }
    }, []);

    // Sync user credits
    const syncUser = useCallback(async () => {
        try {
            const { data } = await api.get('users/me');
            updateUser(data);
        } catch (_) { }
    }, [updateUser]);

    useEffect(() => {
        loadProfile();
        loadHistory();
    }, [loadProfile, loadHistory]);

    const balance = user?.credits ?? 0;
    const hasBankInfo = bankForm.bank_account && bankForm.bank_name && bankForm.bank_holder_name;

    // ─── Handlers ──────────────────────────────────────────────────────────

    const handleSaveBank = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bankForm.bank_name || !bankForm.bank_account || !bankForm.bank_holder_name) {
            setBankMsg({ type: 'error', text: 'Vui lòng điền đầy đủ thông tin ngân hàng.' });
            return;
        }
        setBankSaving(true);
        setBankMsg(null);
        try {
            await api.patch('experts/me/bank', bankForm);
            setBankMsg({ type: 'success', text: '✅ Đã lưu thông tin ngân hàng thành công.' });
        } catch (err: any) {
            setBankMsg({ type: 'error', text: err?.response?.data?.detail ?? 'Lỗi khi lưu thông tin.' });
        } finally {
            setBankSaving(false);
        }
    };

    const handleWithdrawAll = () => {
        setWithdrawAmount(String(balance));
    };

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseInt(withdrawAmount);
        if (isNaN(amount) || amount < MIN_WITHDRAWAL) {
            setWithdrawMsg({ type: 'error', text: `Số tiền tối thiểu là ${fmt(MIN_WITHDRAWAL)} Credits (≈ ${fmt(MIN_WITHDRAWAL * 1000)}₫).` });
            return;
        }
        if (amount > balance) {
            setWithdrawMsg({ type: 'error', text: 'Số dư không đủ.' });
            return;
        }
        if (!hasBankInfo) {
            setWithdrawMsg({ type: 'error', text: 'Vui lòng cập nhật thông tin ngân hàng trước.' });
            return;
        }

        setWithdrawLoading(true);
        setWithdrawMsg(null);
        try {
            const payload: WithdrawalCreate = { amount };
            await api.post('payments/withdrawal-request', payload);
            setWithdrawMsg({ type: 'success', text: `✅ Lệnh rút ${fmt(amount)} Credits đã được tạo.` });
            setWithdrawAmount('');
            await syncUser();
            await loadHistory();
        } catch (err: any) {
            setWithdrawMsg({ type: 'error', text: err?.response?.data?.detail ?? 'Lỗi khi tạo lệnh rút tiền.' });
        } finally {
            setWithdrawLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white selection:bg-[#0046EA]/10 text-[#171716] font-dm-sans pb-44">
            {/* ── Header Section ── */}
            <div className="bg-[#0046EA] pt-24 pb-48 px-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(0,164,253,0.3)_0%,transparent_70%)]" />
                <div className="max-w-[1200px] mx-auto relative z-10">
                    <nav className="flex items-center gap-4 mb-12">
                        <Link
                            href="/dashboard/expert"
                            className="flex items-center gap-2 text-[10px] font-black text-white/40 hover:text-white transition-all uppercase tracking-[0.2em]"
                        >
                            Bàn làm việc
                        </Link>
                        <ChevronRight size={10} className="text-white/20" />
                        <span className="text-[10px] font-black text-[#FFE900] uppercase tracking-[0.2em]">Quản lý Tài chính</span>
                    </nav>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-[2px] bg-[#FFE900]" />
                                <span className="text-[10px] text-[#FFE900] tracking-[0.5em] font-black uppercase">Financial Protocol</span>
                            </div>
                            <h1 className="text-[clamp(40px,5vw,68px)] font-garamond italic font-bold text-white tracking-tight leading-none">
                                Ví Chuyên gia
                            </h1>
                            <p className="max-w-2xl text-white/60 font-dm-sans text-sm font-light leading-relaxed">
                                Quản lý thu nhập, thiết lập phương thức thanh toán và thực hiện các lệnh giải ngân chiến lược.
                            </p>
                        </div>

                        {/* Balance Card */}
                        <div className="bg-[#171716] rounded-[48px] p-12 border border-white/10 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-[#FFE900]/10 rounded-full -mr-24 -mt-24 blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                            <div className="relative z-10 space-y-4">
                                <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.4em]">Số dư khả dụng</p>
                                <div className="flex items-baseline gap-4">
                                    <span className="text-7xl font-garamond italic font-bold text-[#FFE900] tracking-tighter">
                                        {fmt(balance)}
                                    </span>
                                    <span className="text-xs font-black text-white/60 uppercase tracking-[0.3em]">Credits</span>
                                </div>
                                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                                    <p className="text-white/40 text-xs font-medium italic">
                                        ≈ {fmt(balance * 1000)} VNĐ
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#00A4FD] animate-pulse" />
                                        <span className="text-[9px] text-[#00A4FD] font-black uppercase tracking-widest">Hệ thống: Trực tuyến</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-[1200px] mx-auto px-8 -mt-24 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-12">
                    {/* Bank Info Form */}
                    <div className="lg:col-span-6 bg-white border border-black/5 rounded-[48px] p-12 shadow-2xl">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-10 h-10 rounded-2xl bg-[#F5F8FF] flex items-center justify-center text-[#0046EA]">
                                <Landmark size={20} />
                            </div>
                            <h2 className="text-2xl font-garamond italic font-bold text-[#171716]">Tài khoản Ngân hàng</h2>
                        </div>

                        <form onSubmit={handleSaveBank} className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-black/30 uppercase tracking-[0.3em] ml-2">Ngân hàng thụ hưởng</label>
                                <input
                                    type="text"
                                    placeholder="MB Bank, Vietcombank..."
                                    value={bankForm.bank_name}
                                    onChange={e => setBankForm(p => ({ ...p, bank_name: e.target.value }))}
                                    className="w-full bg-[#F5F8FF] border border-black/5 rounded-2xl px-6 py-4 text-sm font-bold placeholder-black/20 focus:outline-none focus:border-[#0046EA] transition-all"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-black/30 uppercase tracking-[0.3em] ml-2">Số tài khoản</label>
                                <input
                                    type="text"
                                    placeholder="0123456789"
                                    value={bankForm.bank_account}
                                    onChange={e => setBankForm(p => ({ ...p, bank_account: e.target.value }))}
                                    className="w-full bg-[#F5F8FF] border border-black/5 rounded-2xl px-6 py-4 text-sm font-bold placeholder-black/20 focus:outline-none focus:border-[#0046EA] transition-all"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-black/30 uppercase tracking-[0.3em] ml-2">Chủ tài khoản (Không dấu)</label>
                                <input
                                    type="text"
                                    placeholder="NGUYEN VAN A"
                                    value={bankForm.bank_holder_name}
                                    onChange={e => setBankForm(p => ({ ...p, bank_holder_name: e.target.value }))}
                                    className="w-full bg-[#F5F8FF] border border-black/5 rounded-2xl px-6 py-4 text-sm font-bold placeholder-black/20 focus:outline-none focus:border-[#0046EA] transition-all"
                                />
                            </div>

                            {bankMsg && (
                                <div className={`p-4 rounded-2xl text-[11px] font-bold tracking-tight border ${bankMsg.type === 'success'
                                    ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                    : 'bg-red-50 border-red-100 text-red-600'
                                    }`}>
                                    {bankMsg.text}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={bankSaving}
                                className="w-full h-16 bg-[#171716] text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-full hover:bg-[#0046EA] transition-all duration-500 disabled:opacity-20 flex items-center justify-center gap-4 shadow-xl"
                            >
                                {bankSaving ? 'Đang thực hiện...' : 'Cập nhật Thông tin'}
                            </button>
                        </form>
                    </div>

                    {/* Withdrawal Form */}
                    <div className="lg:col-span-6 bg-[#F5F8FF] border border-[#0046EA]/10 rounded-[48px] p-12 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#0046EA]/5 rounded-full -mr-16 -mt-16" />
                        
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-[#0046EA] shadow-sm">
                                <ArrowUpRight size={20} />
                            </div>
                            <h2 className="text-2xl font-garamond italic font-bold text-[#171716]">Lệnh giải ngân</h2>
                        </div>

                        {!hasBankInfo ? (
                            <div className="p-8 bg-white border border-red-100 rounded-[32px] text-xs font-bold text-red-500 flex flex-col items-center text-center gap-4">
                                <AlertCircle size={32} />
                                <p>Vui lòng cập nhật thông tin ngân hàng thụ hưởng trước khi thực hiện giao dịch.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleWithdraw} className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black text-[#0046EA]/40 uppercase tracking-[0.3em] ml-2">Số lượng rút (Credits)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min={MIN_WITHDRAWAL}
                                            max={balance}
                                            placeholder={`Tối thiểu ${MIN_WITHDRAWAL}`}
                                            value={withdrawAmount}
                                            onChange={e => setWithdrawAmount(e.target.value)}
                                            className="w-full bg-white border border-black/5 rounded-2xl px-6 py-6 text-2xl font-black text-[#0046EA] focus:outline-none focus:border-[#0046EA] transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleWithdrawAll}
                                            className="absolute right-6 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase tracking-widest text-[#0046EA]/40 hover:text-[#0046EA] transition-colors"
                                        >
                                            Rút hết
                                        </button>
                                    </div>
                                    {withdrawAmount && (
                                        <div className="flex items-center gap-2 px-2">
                                            <div className="w-1 h-1 rounded-full bg-[#FFE900]" />
                                            <p className="text-[10px] font-bold italic text-black/40">Dự kiến nhận: {fmt(parseInt(withdrawAmount) * 1000)} VNĐ</p>
                                        </div>
                                    )}
                                </div>

                                {withdrawMsg && (
                                    <div className={`p-4 rounded-2xl text-[11px] font-bold tracking-tight border ${withdrawMsg.type === 'success'
                                        ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                        : 'bg-red-50 border-red-100 text-red-600'
                                        }`}>
                                        {withdrawMsg.text}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={withdrawLoading || !withdrawAmount}
                                    className="w-full h-20 bg-[#0046EA] text-white text-[11px] font-black uppercase tracking-[0.4em] rounded-full hover:bg-[#171716] transition-all duration-700 disabled:opacity-20 flex items-center justify-center gap-4 shadow-2xl shadow-blue-500/20"
                                >
                                    {withdrawLoading ? 'Đang khởi tạo...' : 'Xác nhận giải ngân'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {/* Withdrawal History */}
                <div className="bg-white border border-black/5 rounded-[48px] p-12 shadow-sm">
                    <div className="flex items-center justify-between border-b border-black/5 pb-10 mb-10">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-garamond italic font-bold text-[#171716]">Lịch sử giao dịch</h2>
                            <p className="text-[10px] font-black text-black/20 uppercase tracking-widest">Sao kê các lệnh giải ngân gần nhất</p>
                        </div>
                        <div className="h-10 px-4 bg-[#F5F8FF] border border-black/5 rounded-xl flex items-center gap-3">
                            <Clock size={14} className="text-[#0046EA]" />
                            <span className="text-[9px] font-black text-[#0046EA] uppercase tracking-widest">Thời gian thực</span>
                        </div>
                    </div>

                    {historyLoading ? (
                        <div className="space-y-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-24 bg-black/5 rounded-3xl animate-pulse" />
                            ))}
                        </div>
                    ) : history.length === 0 ? (
                        <div className="py-32 flex flex-col items-center justify-center text-center gap-6">
                            <div className="w-20 h-20 rounded-full bg-[#F5F8FF] flex items-center justify-center text-black/10">
                                <Clock size={40} strokeWidth={1} />
                            </div>
                            <p className="text-[10px] font-black text-black/20 uppercase tracking-[0.4em]">Chưa có giao dịch nào được ghi nhận</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {history.map(txn => (
                                <div key={txn.id} className="group grid grid-cols-1 md:grid-cols-12 items-center gap-8 p-8 bg-[#00A4FD] border-[6px] border-[#00A4FD] rounded-none hover:bg-[#D20048] hover:border-[#D20048] shadow-sm hover:shadow-2xl transition-all duration-500 text-white">
                                    <div className="md:col-span-4 flex items-center gap-6">
                                        <div className="w-14 h-14 rounded-none bg-white/20 border border-white/20 flex items-center justify-center text-white font-garamond italic font-bold text-2xl group-hover:bg-white group-hover:text-[#D20048] transition-all duration-500">
                                            $
                                        </div>
                                        <div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-3xl font-garamond italic font-bold text-white">{fmt(txn.amount)}</span>
                                                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Credits</span>
                                            </div>
                                            <p className="text-[10px] text-white/60 font-medium italic mt-1">
                                                {new Date(txn.created_at).toLocaleDateString('vi-VN')}
                                            </p>
                                        </div>
                                    </div>
                                    <StatusBadge status={txn.status} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
