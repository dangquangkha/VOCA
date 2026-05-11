'use client';

import React, { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';

interface RefundRequest {
    id: number;
    user_id: number;
    amount: number;
    status: string;
    description: string;
    admin_note: string | null;
    created_at: string;
    updated_at: string;
}

const statusBadge: Record<string, { label: string; className: string }> = {
    PENDING: { label: 'Chờ xử lý', className: 'bg-amber-100 text-[#0046EA]-700' },
    REFUNDED: { label: 'Đã hoàn tiền', className: 'bg-emerald-100 text-emerald-700' },
    FAILED: { label: 'Đã từ chối', className: 'bg-red-100 text-red-700' },
};

function StatusBadge({ status }: { status: string }) {
    const s = statusBadge[status] ?? { label: status, className: 'bg-white text-[#0F0C17]/50 opacity-50' };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${s.className}`}>
            {s.label}
        </span>
    );
}

function parseDescription(desc: string) {
    // Format: "Bank refund request: X credits → HolderName | BankName | AccountNumber"
    const match = desc?.match(/→\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+)$/);
    if (match) {
        return { holder: match[1], bank: match[2], account: match[3] };
    }
    return null;
}

const fmt = (n: number) => n.toLocaleString('vi-VN');

export default function AdminRefundsPage() {
    const [requests, setRequests] = useState<RefundRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<number | null>(null);
    const [noteInputs, setNoteInputs] = useState<Record<number, string>>({});
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.get('payments/refund-requests');
            setRequests(data);
        } catch (err: any) {
            console.error('Refund list load error:', err);
            const msg = err?.response?.data?.detail || err?.message || 'Không thể tải danh sách yêu cầu hoàn tiền.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleAction = async (id: number, action: 'approve' | 'reject') => {
        setProcessing(id);
        try {
            await api.patch(`payments/refund-requests/${id}`, null, {
                params: {
                    action,
                    admin_note: noteInputs[id] || undefined
                },
            });
            await load();
        } catch (err: any) {
            console.error('Refund action error:', err);
            alert(err?.response?.data?.detail ?? 'Lỗi khi xử lý yêu cầu.');
        } finally {
            setProcessing(null);
        }
    };

    const pendingRequests = requests.filter(r => r.status === 'PENDING');
    const doneRequests = requests.filter(r => r.status !== 'PENDING');

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="flex items-center gap-3 mb-6">
                <h1 className="text-2xl font-extrabold text-gray-900">🏦 Yêu cầu Hoàn tiền</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                    UC-36
                </span>
            </div>
            <p className="text-gray-500 text-sm mb-8">
                Danh sách yêu cầu hoàn tiền (Credits → Ngân hàng) từ học viên. Sau khi chuyển khoản thủ công, bấm{' '}
                <strong>✅ Đồng ý</strong>. Nếu từ chối, Credits sẽ được hoàn lại cho học viên.
            </p>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                    {error}
                </div>
            )}

            {/* === Pending === */}
            <section className="mb-10">
                <h2 className="text-base font-bold text-[#0F0C17]/70 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                    Chờ xử lý ({pendingRequests.length})
                </h2>

                {loading ? (
                    <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-28 bg-white rounded-xl animate-pulse" />)}</div>
                ) : requests.length === 0 ? (
                    <div className="text-[#0F0C17]/50 text-sm py-10 text-center bg-white rounded-xl border border-[#0F0C17]/10">
                        Không có yêu cầu nào.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {requests.filter(r => r.status === 'PENDING' || r.status === 'PROCESSING').map(r => (
                            <div key={r.id} className="bg-white rounded-xl border border-[#0046EA]/10 shadow-2xl p-5 hover:border-[#0046EA]/30 transition-all">
                                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                                    <div>
                                        {/* Amount */}
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-[#0F0C17] text-lg">
                                                {fmt(r.amount)} Credits
                                            </span>
                                            <span className="text-[#0F0C17]/50 text-sm">
                                                ≈ {fmt(r.amount * 1000)}₫
                                            </span>
                                        </div>
                                        {/* Bank info */}
                                        {parseDescription(r.description) ? (
                                            <p className="text-sm text-[#0F0C17]/70">
                                                🏦 <strong>{parseDescription(r.description)?.holder}</strong> · {parseDescription(r.description)?.bank} ·{' '}
                                                <span className="font-mono">{parseDescription(r.description)?.account}</span>
                                            </p>
                                        ) : (
                                            <p className="text-sm text-[#0F0C17]/50 italic">{r.description}</p>
                                        )}
                                        <p className="text-xs text-[#0F0C17]/30 mt-1">
                                            {new Date(r.created_at).toLocaleString('vi-VN')} · User ID: {r.user_id}
                                        </p>
                                    </div>
                                    <StatusBadge status={r.status} />
                                </div>

                                {/* Action row */}
                                <div className="flex flex-wrap items-center gap-3">
                                    <input
                                        type="text"
                                        placeholder="Ghi chú (tuỳ chọn)..."
                                        value={noteInputs[r.id] ?? ''}
                                        onChange={e =>
                                            setNoteInputs(p => ({ ...p, [r.id]: e.target.value }))
                                        }
                                        className="flex-1 min-w-0 bg-white border border-[#0F0C17]/10 rounded-lg px-3 py-2 text-sm text-[#0F0C17] focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                    <button
                                        onClick={() => handleAction(r.id, 'approve')}
                                        disabled={processing === r.id}
                                        className="px-5 py-2 rounded-lg text-sm font-semibold text-[#0F0C17] bg-emerald-600 hover:bg-emerald-700 transition disabled:opacity-50"
                                    >
                                        {processing === r.id ? '...' : '✅ Đồng ý'}
                                    </button>
                                    <button
                                        onClick={() => handleAction(r.id, 'reject')}
                                        disabled={processing === r.id}
                                        className="px-5 py-2 rounded-lg text-sm font-semibold text-[#0F0C17] bg-red-600 hover:bg-red-700 transition disabled:opacity-50"
                                    >
                                        {processing === r.id ? '...' : '❌ Từ chối'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {requests.filter(r => r.status !== 'PENDING' && r.status !== 'PROCESSING').length > 0 && (
                <div className="mt-20">
                    <h3 className="text-sm font-bold text-[#0F0C17]/70 uppercase tracking-widest mb-8 flex items-center gap-4">
                        <span className="w-2 h-2 rounded-full bg-[#0F0C17]/20 inline-block" />
                        Đã xử lý
                    </h3>
                    <div className="space-y-4">
                        {requests.filter(r => r.status !== 'PENDING' && r.status !== 'PROCESSING').map(r => (
                            <div key={r.id}
                                className="bg-white rounded-xl border border-[#0F0C17]/10 p-4 flex items-center justify-between gap-4"
                            >
                                <div>
                                    <span className="font-semibold text-[#0F0C17]">
                                        {fmt(r.amount)} Credits
                                    </span>
                                    {parseDescription(r.description) && (
                                        <span className="text-sm text-[#0F0C17]/50 ml-2">
                                            {parseDescription(r.description)?.holder} · {parseDescription(r.description)?.bank} · {parseDescription(r.description)?.account}
                                        </span>
                                    )}
                                    {r.admin_note && (
                                        <p className="text-xs text-gray-400 mt-0.5 italic">
                                            Ghi chú: {r.admin_note}
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {new Date(r.updated_at).toLocaleString('vi-VN')}
                                    </p>
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
