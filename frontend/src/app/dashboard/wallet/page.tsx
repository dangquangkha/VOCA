'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import { PaymentTransaction, TransactionType, TransactionStatus, PaymentDepositResponse, PaginatedPaymentResponse, RefundRequestCreate } from '@/types/payment';
import { useAuthStore } from '@/store/useAuthStore';
import { paymentService } from '@/services/paymentService';
import Pagination from '@/components/admin/users/Pagination';

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

    // UC-36: Bank refund state
    const [showRefundForm, setShowRefundForm] = useState(false);
    const [refundLoading, setRefundLoading] = useState(false);
    const [refundForm, setRefundForm] = useState<RefundRequestCreate>({
        amount: 0, bank_name: '', bank_account: '', account_holder: ''
    });
    const [refundSuccess, setRefundSuccess] = useState<string | null>(null);

    // Derive balance directly from Zustand store so it always stays in sync
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
        try {
            const { data } = await api.get('users/me');
            updateUser(data); // Updates Zustand store → balance auto-updates
        } catch (error) {
            console.error("Failed to sync user", error);
        }
    };

    // On mount and when pagination changes
    useEffect(() => {
        setMounted(true);
        fetchHistory();
        fetchUser();

        return () => {
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                if (data.status === TransactionStatus.COMPLETED) {
                    alert("Deposit Successful! Credits added.");
                    setPaymentDetails(null); // Close QR
                    fetchUser();
                    fetchHistory();
                }
            } catch (error) {
                console.error("Polling error", error);
            }
        };

        pollingIntervalRef.current = setInterval(pollStatus, 3000); // Poll every 3s

        return () => {
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        };
    }, [paymentDetails]);

    const handleTopUp = async (e: React.FormEvent) => {
        e.preventDefault();
        // Minimum deposit check (10 credits = 10k VND)
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

    return (
        <div className="max-w-5xl mx-auto px-6 py-12">
            <h1 className="text-4xl md:text-5xl font-garamond italic text-[#0D1B2A] mb-12 tracking-tight">Ví của tôi</h1>

            {/* Balance Card */}
            <div className="bg-[#0D1B2A] rounded-none shadow-2xl p-10 text-[#F5F0E8] mb-12 border border-[#C9A84C]/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#C9A84C]/5 blur-[80px] rounded-full -mr-32 -mt-32" />
                <div className="relative z-10 flex justify-between items-center">
                    <div>
                        <p className="text-[#C9A84C] text-xs font-bold uppercase tracking-[0.4em]">Số dư khả dụng</p>
                        <h2 className="text-6xl md:text-7xl font-garamond italic mt-4">{balance.toLocaleString('vi-VN')} <span className="text-3xl md:text-4xl not-italic font-inter font-bold uppercase tracking-widest text-[#C9A84C]/50 ml-2">Credits</span></h2>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Top Up Section */}
                <div className="md:col-span-1">
                    <div className="bg-white border border-[#C9A84C]/10 shadow-xl p-8">
                        <h3 className="text-xl font-bold text-[#0D1B2A] mb-6 uppercase tracking-widest">Nạp Credits</h3>
                        <form onSubmit={handleTopUp}>
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-[#0D1B2A]/50 uppercase tracking-[0.2em] mb-2">Số lượng (Credits)</label>
                                <Input
                                    type="number"
                                    min="10"
                                    value={amount}
                                    onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                                    className="text-2xl font-bold h-16 border-[#C9A84C]/20 focus:border-[#C9A84C] bg-[#F5F0E8]/30"
                                />
                                <p className="text-sm font-bold text-[#C9A84C] mt-3 tracking-widest uppercase">
                                    {mounted ? (amount * 1000).toLocaleString('vi-VN') : (amount * 1000)} VND
                                </p>
                            </div>
                            <Button className="w-full h-16 bg-[#0D1B2A] text-[#F5F0E8] font-bold text-xs uppercase tracking-[0.2em] hover:bg-[#C9A84C] hover:text-[#0D1B2A] transition-all shadow-xl" size="lg" isLoading={isLoading} disabled={amount <= 0 || !!paymentDetails}>
                                {paymentDetails ? 'Đang xử lý...' : 'Nạp qua QR Code'}
                            </Button>
                        </form>
                    </div>
                </div>

                {/* Message / QR Area */}
                <div className="md:col-span-2">
                    {paymentDetails ? (
                        <div className="bg-white border border-[#C9A84C]/20 shadow-2xl p-10 text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-32 h-32 bg-[#C9A84C]/5 blur-3xl rounded-full -ml-16 -mt-16" />
                            <h3 className="text-2xl font-garamond italic text-[#0D1B2A] mb-8 relative z-10">Quét mã thanh toán</h3>
                            <div className="flex justify-center mb-4">
                                <img
                                    src={paymentDetails.qr_url}
                                    alt="VietQR Code"
                                    className="max-w-[300px] border border-gray-200 rounded-lg"
                                />
                            </div>
                            <div className="text-left max-w-sm mx-auto space-y-2 mb-6">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Amount:</span>
                                    <span className="font-bold">{paymentDetails.amount_vnd.toLocaleString('vi-VN')} VND</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Content:</span>
                                    <span className="font-mono bg-gray-100 px-2 rounded">{paymentDetails.content}</span>
                                </div>
                                <p className="text-xs text-yellow-600 mt-2">
                                    * Please transfer the exact amount and content. System will process automatically.
                                </p>
                            </div>
                            <Button variant="outline" onClick={cancelPayment}>
                                Cancel / Close
                            </Button>
                        </div>
                    ) : (
                        <div className="bg-white border border-[#C9A84C]/10 shadow-xl overflow-hidden min-h-[500px] flex flex-col">
                            <div className="p-8 border-b border-[#C9A84C]/10 bg-[#F5F0E8]/20 text-center md:text-left">
                                <h3 className="text-xl font-bold text-[#0D1B2A] uppercase tracking-widest">Lịch sử giao dịch</h3>
                            </div>
                            {isHistoryLoading ? (
                                <div className="p-8 text-center text-gray-500">Loading history...</div>
                            ) : history.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">No transactions found.</div>
                            ) : (
                                <ul className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                                    {history.map((trx) => (
                                        <li key={trx.id} className="p-6 hover:bg-[#F5F0E8]/30 transition-all border-b border-[#C9A84C]/5 last:border-0">
                                            <div className="flex justify-between items-center gap-6">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-base font-bold text-[#0D1B2A] truncate">
                                                        {trx.description || (trx.type === TransactionType.DEPOSIT ? 'Nạp tiền vào ví' : trx.type)}
                                                    </p>
                                                    <p className="text-xs font-bold text-[#0D1B2A]/40 uppercase tracking-widest mt-1">
                                                        {mounted ? new Date(trx.created_at).toLocaleString('vi-VN') : ''}
                                                    </p>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <span className={`block text-lg font-bold ${trx.type === TransactionType.DEPOSIT || trx.type === TransactionType.BOOKING_REFUND || trx.type === TransactionType.BOOKING_RELEASE
                                                        ? 'text-[#C9A84C]'
                                                        : 'text-[#58181F]'
                                                        }`}>
                                                        {trx.type === TransactionType.DEPOSIT || trx.type === TransactionType.BOOKING_REFUND || trx.type === TransactionType.BOOKING_RELEASE ? '+' : '-'} {trx.amount.toLocaleString('vi-VN')}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-[#0D1B2A]/30 uppercase tracking-tighter mt-1 block">
                                                        {trx.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {totalItems > 0 && (
                                <Pagination
                                    currentPage={page}
                                    totalPages={totalPages}
                                    pageSize={pageSize}
                                    totalItems={totalItems}
                                    onPageChange={setPage}
                                    onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* UC-36: Bank Refund Request Section */}
            <div className="mt-12 bg-white border border-[#C9A84C]/10 shadow-xl p-10">
                <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6 text-center md:text-left">
                    <div>
                        <h3 className="text-2xl font-garamond italic text-[#0D1B2A]">🏦 Yêu cầu Hoàn tiền về Ngân hàng</h3>
                        <p className="text-base font-bold text-[#0D1B2A]/40 uppercase tracking-widest mt-2">Admin sẽ xử lý trong 1-3 ngày làm việc.</p>
                    </div>
                    {!showRefundForm && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setShowRefundForm(true); setRefundSuccess(null); }}
                            disabled={balance <= 0}
                        >
                            Yêu cầu Hoàn tiền
                        </Button>
                    )}
                </div>

                {refundSuccess && (
                    <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4 text-sm mb-4">
                        ✅ {refundSuccess}
                    </div>
                )}

                {showRefundForm && (
                    <form
                        onSubmit={async (e) => {
                            e.preventDefault();
                            if (refundForm.amount <= 0 || refundForm.amount > balance) {
                                alert(`Amount must be between 1 and ${balance} credits`);
                                return;
                            }
                            setRefundLoading(true);
                            try {
                                await api.post('payments/refund-request', refundForm);
                                setRefundSuccess(`Đã tạo yêu cầu hoàn ${refundForm.amount} Credits. Credits đã bị tạm khóa chờ Admin xử lý.`);
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
                        className="space-y-4"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Số Credits muốn rút</label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={balance}
                                    value={refundForm.amount || ''}
                                    onChange={e => setRefundForm(f => ({ ...f, amount: parseInt(e.target.value) || 0 }))}
                                    placeholder={`Tối đa: ${balance} credits`}
                                    required
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    ≈ {((refundForm.amount || 0) * 1000).toLocaleString('vi-VN')} VND
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ngân hàng</label>
                                <Input
                                    type="text"
                                    value={refundForm.bank_name}
                                    onChange={e => setRefundForm(f => ({ ...f, bank_name: e.target.value }))}
                                    placeholder="VD: MB Bank, Vietcombank..."
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Số tài khoản</label>
                                <Input
                                    type="text"
                                    value={refundForm.bank_account}
                                    onChange={e => setRefundForm(f => ({ ...f, bank_account: e.target.value }))}
                                    placeholder="Số tài khoản ngân hàng"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên chủ tài khoản</label>
                                <Input
                                    type="text"
                                    value={refundForm.account_holder}
                                    onChange={e => setRefundForm(f => ({ ...f, account_holder: e.target.value }))}
                                    placeholder="Đúng tên trên thẻ ngân hàng"
                                    required
                                />
                            </div>
                        </div>
                        <p className="text-xs text-yellow-600 bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2">
                            ⚠️ Theo BR-36.1: Chỉ hoàn tiền về đúng tài khoản đã nạp (AML). Admin sẽ đối chiếu thông tin trước khi chuyển khoản.
                        </p>
                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowRefundForm(false)}
                                disabled={refundLoading}
                            >
                                Hủy
                            </Button>
                            <Button type="submit" size="sm" isLoading={refundLoading}>
                                Gửi yêu cầu Hoàn tiền
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
