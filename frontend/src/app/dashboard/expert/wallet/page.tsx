'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { PaymentTransaction, TransactionStatus, TransactionType, WithdrawalCreate } from '@/types/payment';

// ─── Constants ─────────────────────────────────────────────────────────────────
const MIN_WITHDRAWAL = 200; // BR-19.1

// ─── Locale-safe number formatter (fixes SSR/client hydration mismatch) ────────
const fmt = (n: number) => n.toLocaleString('vi-VN');

// ─── Helpers ───────────────────────────────────────────────────────────────────
const statusBadge: Record<string, { label: string; className: string }> = {
    PENDING_PAYOUT: { label: 'Đang chờ giải ngân', className: 'bg-amber-100 text-amber-700' },
    COMPLETED: { label: 'Đã giải ngân', className: 'bg-emerald-100 text-emerald-700' },
    REJECTED_PAYOUT: { label: 'Bị từ chối', className: 'bg-red-100 text-red-700' },
    PENDING: { label: 'Đang xử lý', className: 'bg-blue-100 text-blue-700' },
    FAILED: { label: 'Thất bại', className: 'bg-gray-100 text-gray-600' },
};

function StatusBadge({ status }: { status: string }) {
    const s = statusBadge[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.className}`}>
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
            const { data } = await api.get('/experts/me');
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
            setWithdrawMsg({ type: 'success', text: `✅ Lệnh rút ${fmt(amount)} Credits đã được tạo. Admin sẽ xử lý trong 24-48 giờ.` });
            setWithdrawAmount('');
            await syncUser();
            await loadHistory();
        } catch (err: any) {
            setWithdrawMsg({ type: 'error', text: err?.response?.data?.detail ?? 'Lỗi khi tạo lệnh rút tiền.' });
        } finally {
            setWithdrawLoading(false);
        }
    };

    // ─── Render ────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-10">

                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <Link href="/dashboard/expert" className="text-gray-400 hover:text-gray-600 transition-colors">
                        ← Dashboard
                    </Link>
                    <span className="text-gray-300">/</span>
                    <h1 className="text-2xl font-extrabold text-gray-900">💰 Ví Chuyên gia</h1>
                </div>

                {/* Balance Card */}
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-7 text-white shadow-lg mb-7">
                    <p className="text-emerald-100 text-sm font-medium mb-1">Số dư khả dụng</p>
                    <div className="text-4xl font-extrabold">{fmt(balance)} Credits</div>
                    <p className="text-emerald-200 text-sm mt-1">≈ {fmt(balance * 1000)}₫ · 1 Credit = 1.000 VNĐ</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-7 mb-7">

                    {/* Bank Info Form */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-1">🏦 Tài khoản Ngân hàng</h2>
                        <p className="text-sm text-gray-400 mb-5">Thông tin này được dùng khi rút tiền. Cập nhật mỗi khi đổi tài khoản.</p>

                        <form onSubmit={handleSaveBank} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Tên ngân hàng *</label>
                                <input
                                    type="text"
                                    placeholder="VD: MB Bank, Vietcombank, Techcombank..."
                                    value={bankForm.bank_name}
                                    onChange={e => setBankForm(p => ({ ...p, bank_name: e.target.value }))}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Số tài khoản *</label>
                                <input
                                    type="text"
                                    placeholder="VD: 0123456789"
                                    value={bankForm.bank_account}
                                    onChange={e => setBankForm(p => ({ ...p, bank_account: e.target.value }))}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Tên chủ tài khoản *</label>
                                <input
                                    type="text"
                                    placeholder="VD: NGUYEN VAN A"
                                    value={bankForm.bank_holder_name}
                                    onChange={e => setBankForm(p => ({ ...p, bank_holder_name: e.target.value }))}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                />
                            </div>
                            {bankMsg && (
                                <div className={`p-3 rounded-xl text-sm font-medium ${bankMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                                    {bankMsg.text}
                                </div>
                            )}
                            <button
                                type="submit"
                                disabled={bankSaving}
                                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 transition disabled:opacity-50"
                            >
                                {bankSaving ? 'Đang lưu...' : 'Lưu thông tin ngân hàng'}
                            </button>
                        </form>
                    </div>

                    {/* Withdrawal Form */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-1">💸 Rút tiền</h2>
                        <p className="text-sm text-gray-400 mb-5">
                            Tối thiểu <span className="font-semibold text-gray-700">{MIN_WITHDRAWAL} Credits</span> (≈ {fmt(MIN_WITHDRAWAL * 1000)}₫). Admin sẽ xử lý trong 24-48 giờ.
                        </p>

                        {!hasBankInfo ? (
                            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-700">
                                ⚠️ Vui lòng <strong>cập nhật thông tin ngân hàng</strong> bên trái trước khi rút tiền.
                            </div>
                        ) : (
                            <>
                                {/* Bank preview */}
                                <div className="mb-5 p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm">
                                    <p className="text-gray-500 text-xs mb-1">Tiền sẽ chuyển đến</p>
                                    <p className="font-semibold text-gray-900">{bankForm.bank_holder_name}</p>
                                    <p className="text-gray-600">{bankForm.bank_name} · {bankForm.bank_account}</p>
                                </div>

                                <form onSubmit={handleWithdraw} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Số Credits muốn rút</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                min={MIN_WITHDRAWAL}
                                                max={balance}
                                                placeholder={`Tối thiểu ${MIN_WITHDRAWAL}`}
                                                value={withdrawAmount}
                                                onChange={e => setWithdrawAmount(e.target.value)}
                                                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleWithdrawAll}
                                                className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-blue-200 text-blue-600 hover:bg-blue-50 transition"
                                            >
                                                Rút tất
                                            </button>
                                        </div>
                                        {withdrawAmount && !isNaN(parseInt(withdrawAmount)) && (
                                            <p className="text-xs text-gray-400 mt-1">
                                                ≈ {fmt(parseInt(withdrawAmount) * 1000)}₫ sẽ được chuyển khoản
                                            </p>
                                        )}
                                    </div>

                                    {withdrawMsg && (
                                        <div className={`p-3 rounded-xl text-sm font-medium ${withdrawMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                                            {withdrawMsg.text}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={withdrawLoading || !withdrawAmount}
                                        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 transition disabled:opacity-50"
                                    >
                                        {withdrawLoading ? 'Đang xử lý...' : 'Xác nhận Rút tiền →'}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>

                {/* Withdrawal History */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-5">📋 Lịch sử rút tiền</h2>
                    {historyLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : history.length === 0 ? (
                        <p className="text-center text-gray-400 py-8">Chưa có lệnh rút tiền nào.</p>
                    ) : (
                        <div className="space-y-3">
                            {history.map(txn => (
                                <div key={txn.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <div>
                                        <p className="font-semibold text-gray-900">{fmt(txn.amount)} Credits</p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {txn.bank_name} · {txn.bank_account} · {new Date(txn.created_at).toLocaleDateString('vi-VN')}
                                        </p>
                                        {txn.admin_note && (
                                            <p className="text-xs text-gray-400 mt-0.5 italic">Admin: {txn.admin_note}</p>
                                        )}
                                    </div>
                                    <StatusBadge status={txn.status} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
