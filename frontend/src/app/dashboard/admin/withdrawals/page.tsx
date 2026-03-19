'use client';

import React, { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { WithdrawalRequest, TransactionStatus } from '@/types/payment';

const statusBadge: Record<string, { label: string; className: string }> = {
    PENDING_PAYOUT: { label: 'Chờ giải ngân', className: 'bg-amber-100 text-amber-700' },
    COMPLETED: { label: 'Đã giải ngân', className: 'bg-emerald-100 text-emerald-700' },
    REJECTED_PAYOUT: { label: 'Đã từ chối', className: 'bg-red-100 text-red-700' },
};

function StatusBadge({ status }: { status: string }) {
    const s = statusBadge[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' };
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${s.className}`}>{s.label}</span>;
}

export default function AdminWithdrawalsPage() {
    const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<number | null>(null);
    const [noteInputs, setNoteInputs] = useState<Record<number, string>>({});

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
        setProcessing(id);
        try {
            await api.patch(`payments/withdrawal-requests/${id}`, {
                action,
                admin_note: noteInputs[id] ?? null,
            });
            await load();
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
                    <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
                ) : pendingRequests.length === 0 ? (
                    <div className="text-gray-400 text-sm py-8 text-center bg-white rounded-xl border border-gray-100">Không có lệnh nào đang chờ.</div>
                ) : (
                    <div className="space-y-4">
                        {pendingRequests.map(r => (
                            <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-gray-900 text-lg">{r.amount.toLocaleString('vi-VN')} Credits</span>
                                            <span className="text-gray-400 text-sm">≈ {(r.amount * 1000).toLocaleString('vi-VN')}₫</span>
                                        </div>
                                        <p className="text-sm text-gray-600">🏦 {r.bank_holder_name} · {r.bank_name} · <strong>{r.bank_account}</strong></p>
                                        <p className="text-xs text-gray-400 mt-1">{new Date(r.created_at).toLocaleString('vi-VN')} · Expert ID: {r.user_id}</p>
                                    </div>
                                    <StatusBadge status={r.status} />
                                </div>
                                <div className="mt-4 flex flex-wrap items-center gap-3">
                                    <input
                                        type="text"
                                        placeholder="Ghi chú (tuỳ chọn)..."
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
                        ))}
                    </div>
                )}
            </section>

            {/* Processed */}
            {doneRequests.length > 0 && (
                <section>
                    <h2 className="text-base font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" /> Đã xử lý ({doneRequests.length})
                    </h2>
                    <div className="space-y-3">
                        {doneRequests.map(r => (
                            <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
                                <div>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {r.amount.toLocaleString('vi-VN')} Credits
                                    </td>
                                    <span className="text-sm text-gray-500 ml-2">{r.bank_holder_name} · {r.bank_name} · {r.bank_account}</span>
                                    {r.admin_note && <p className="text-xs text-gray-400 mt-0.5">Admin: {r.admin_note}</p>}
                                </div>
                                <StatusBadge status={r.status} />
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
