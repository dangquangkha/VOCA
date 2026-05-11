'use client';

import React, { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { WithdrawalRequest, TransactionStatus } from '@/types/payment';

const statusBadge: Record<string, { label: string; className: string }> = {
    PENDING_PAYOUT: { label: 'Chờ giải ngân', className: 'bg-amber-100 text-[#0046EA]-700' },
    COMPLETED: { label: 'Đã giải ngân', className: 'bg-emerald-100 text-emerald-700' },
    REJECTED_PAYOUT: { label: 'Đã từ chối', className: 'bg-red-100 text-red-700' },
};

function StatusBadge({ status }: { status: string }) {
    const s = statusBadge[status] ?? { label: status, className: 'bg-white text-[#0F0C17]/50 opacity-50' };
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${s.className}`}>{s.label}</span>;
}

export default function AdminWithdrawalsPage() {
    const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<number | null>(null);
    const [noteInputs, setNoteInputs] = useState<Record<number, string>>({});
    const [payoutInputs, setPayoutInputs] = useState<Record<number, string>>({});

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('payments/withdrawal-requests');
            setRequests(data);
        } catch (err) {
            console.error('Failed to load withdrawal requests', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleAction = async (id: number, action: 'approve' | 'reject') => {
        const payout_ref = payoutInputs[id] || '';
        if (action === 'approve' && !payout_ref.trim()) {
            alert('Vui lòng nhập Mã giao dịch chuyển khoản (Payout Reference) để xác nhận đã thanh toán.');
            return;
        }

        setProcessing(id);
        try {
            await api.patch(`payments/withdrawal-requests/${id}`, {
                action,
                admin_note: noteInputs[id] ?? null,
                payout_reference: payout_ref.trim() || null,
            });
            await load();
            setPayoutInputs(p => {
                const n = { ...p };
                delete n[id];
                return n;
            });
        } catch (err: any) {
            alert(err?.response?.data?.detail ?? 'Lỗi khi xử lý');
        } finally {
            setProcessing(null);
        }
    };

    const pendingRequests = requests.filter(r => r.status === TransactionStatus.PENDING_PAYOUT);
    const doneRequests = requests.filter(r => r.status !== TransactionStatus.PENDING_PAYOUT);

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-extrabold text-gray-900 mb-2">💸 Withdrawal Requests</h1>
            <p className="text-gray-500 text-sm mb-8">Danh sách lệnh rút tiền từ các Chuyên gia. Sau khi chuyển khoản thủ công, bấm Approve.</p>

            {/* Pending */}
            <section className="mb-10">
                <h2 className="text-base font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Chờ xử lý ({pendingRequests.length})
                </h2>
                {loading ? (
                    <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />)}</div>
                ) : pendingRequests.length === 0 ? (
                    <div className="text-[#0F0C17]/50 text-sm py-8 text-center bg-white rounded-xl border border-[#0F0C17]/10">Không có lệnh nào đang chờ.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {pendingRequests.map(r => (
                            <div key={r.id} className="bg-white rounded-xl border border-[#0F0C17]/10 shadow-2xl p-5">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-gray-900 text-lg">{r.amount.toLocaleString('vi-VN')} Credits</span>
                                            <span className="text-gray-400 text-sm">≈ {(r.amount * 1000).toLocaleString('vi-VN')}₫</span>
                                        </div>
                                        <p className="text-sm text-gray-600">🏦 {r.bank_holder_name} · {r.bank_name} · <strong>{r.bank_account}</strong></p>
                                        <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1 font-bold">Expert Intelligence</p>
                                            <div className="flex flex-col gap-1">
                                                <p className="text-xs text-gray-700">👤 <span className="font-semibold">{r.user?.full_name || 'N/A'}</span></p>
                                                <p className="text-xs text-gray-500">📧 {r.user?.email}</p>
                                                <p className="text-xs text-gray-500">💰 Số dư hiện tại: <span className="text-emerald-600 font-bold">{r.user?.credits?.toLocaleString('vi-VN')} Credits</span></p>
                                                <div className="mt-1 flex items-center gap-2">
                                                    <span className="text-[9px] uppercase tracking-wider text-gray-400">KYC Status:</span>
                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold border ${
                                                        r.user?.expert_profile?.kyc_status === 'APPROVED' 
                                                        ? 'border-emerald-200 text-emerald-600 bg-emerald-50' 
                                                        : 'border-amber-200 text-[#0046EA]-600 bg-amber-50'
                                                    }`}>
                                                        {r.user?.expert_profile?.kyc_status || 'PENDING'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-2">{new Date(r.created_at).toLocaleString('vi-VN')} · Expert ID: {r.user_id}</p>
                                    </div>
                                    <StatusBadge status={r.status} />
                                </div>
                                <div className="mt-4 space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Mã giao dịch chuyển khoản (Bắt buộc nếu Duyệt)..."
                                        value={payoutInputs[r.id] ?? ''}
                                        onChange={e => setPayoutInputs(p => ({ ...p, [r.id]: e.target.value }))}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 font-mono"
                                    />
                                    <div className="flex flex-wrap items-center gap-3">
                                        <input
                                            type="text"
                                            placeholder="Ghi chú Admin (tuỳ chọn)..."
                                            value={noteInputs[r.id] ?? ''}
                                            onChange={e => setNoteInputs(p => ({ ...p, [r.id]: e.target.value }))}
                                            className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                        />
                                        <button
                                            onClick={() => handleAction(r.id, 'approve')}
                                            disabled={processing === r.id}
                                            className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition disabled:opacity-50"
                                        >
                                            {processing === r.id ? '...' : '✅ Approve'}
                                        </button>
                                        <button
                                            onClick={() => handleAction(r.id, 'reject')}
                                            disabled={processing === r.id}
                                            className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition disabled:opacity-50"
                                        >
                                            {processing === r.id ? '...' : '❌ Reject'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Processed */}
            {doneRequests.length > 0 && (
                <div className="mt-20">
                    <h3 className="text-sm font-bold text-[#0F0C17]/70 uppercase tracking-widest mb-8 flex items-center gap-4">
                        <span className="w-2 h-2 rounded-full bg-[#0F0C17]/20 inline-block" /> Đã xử lý ({doneRequests.length})
                    </h3>
                    <div className="space-y-4">
                        {doneRequests.map(r => (
                            <div key={r.id} className="bg-white rounded-xl border border-[#0F0C17]/10 p-4 flex items-center justify-between">
                                <div>
                                    <span className="font-semibold text-[#0F0C17]">
                                        {r.amount.toLocaleString('vi-VN')} Credits
                                    </span>
                                    <span className="text-sm text-gray-500 ml-2">{r.bank_holder_name} · {r.bank_name} · {r.bank_account}</span>
                                    {r.admin_note && <p className="text-xs text-gray-400 mt-0.5">Admin: {r.admin_note}</p>}
                                </div>
                                <StatusBadge status={r.status} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
