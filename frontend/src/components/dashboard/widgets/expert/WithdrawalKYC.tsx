'use client';

import React, { useState } from 'react';
import { ShieldCheck, Landmark, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { expertService } from '@/services/expertService';
import { Expert } from '@/types/expert';
import axios from 'axios';

export default function WithdrawalKYC() {
    const [amount, setAmount] = useState('');
    const [profile, setProfile] = React.useState<Expert | null>(null);
    const [loading, setLoading] = useState(true);
    const exchangeRate = 1000; // 1 Credit = 1000 VND

    React.useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await expertService.getProfile();
                setProfile(data);
            } catch (error) {
                console.error("Failed to fetch expert profile", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount) return;

        try {
            await expertService.createWithdrawal(parseInt(amount));
            alert(`Lệnh rút ${amount} Credits đã được tạo thành công!`);
            setAmount('');
        } catch (error) {
            if (axios.isAxiosError(error)) {
                alert(error.response?.data?.detail || "Gửi yêu cầu rút tiền thất bại");
            } else {
                alert("Đã có lỗi xảy ra");
            }
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-slate-200 animate-spin" />
            </div>
        );
    }

    const isKYCVerified = profile?.kyc_status === 'APPROVED';

    return (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm h-full flex flex-col hover:border-blue-200 transition-all group">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-800">Rút tiền & KYC</h3>
                <div className={`flex items-center gap-1.5 px-2 py-1 ${isKYCVerified ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'} rounded-lg border text-[10px] font-black uppercase tracking-wider shadow-sm`}>
                    <ShieldCheck size={12} />
                    {profile?.kyc_status || 'NOT SUBMITTED'}
                </div>
            </div>

            <div className="space-y-6 flex-1">
                {/* Bank Info */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-50 flex items-center gap-4 group-hover:bg-blue-50/30 group-hover:border-blue-50 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-600">
                        <Landmark size={20} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-tight">Tài khoản ngân hàng</p>
                        <p className="text-sm font-bold text-slate-900 mt-0.5 truncate">
                            {profile?.bank_name ? `${profile.bank_name} - ${profile.bank_account}` : 'Chưa cập nhật'}
                        </p>
                    </div>
                    <button className="text-[10px] font-bold text-blue-600 hover:underline">Thay đổi</button>
                </div>

                {/* Withdrawal Form */}
                <form onSubmit={handleWithdraw} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 ml-1">Số Credits muốn rút</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="Tối thiểu 200"
                                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-lg font-black text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-blue-500/20 transition-all"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">CR</div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-2">
                        <span className="text-xs font-medium text-slate-400">Ước tính nhận được:</span>
                        <span className="text-sm font-black text-slate-900">
                            {amount ? (parseInt(amount) * exchangeRate).toLocaleString('vi-VN') : '0'} <span className="text-[10px] text-slate-400 font-normal">VNĐ</span>
                        </span>
                    </div>

                    <button
                        disabled={!amount || parseInt(amount) < 200 || !profile?.bank_account}
                        className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2 group-hover:scale-[1.01] active:scale-95 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                        Tạo lệnh rút tiền (Payout)
                        <ArrowRight size={16} />
                    </button>
                </form>

                {/* Alert Box */}
                {!profile?.bank_account && (
                    <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex gap-3">
                        <AlertCircle className="text-red-500 flex-shrink-0" size={18} />
                        <p className="text-[10px] text-red-700 font-medium leading-relaxed">
                            Bạn chưa cập nhật thông tin ngân hàng. Vui lòng cập nhật trong phần hồ sơ trước khi rút tiền.
                        </p>
                    </div>
                )}
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex gap-3">
                    <AlertCircle className="text-amber-500 flex-shrink-0" size={18} />
                    <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                        Hạn mức rút tối thiểu là **200 Credits**. Lệnh rút tiền sẽ được Admin xử lý trong vòng **24-48h**.
                    </p>
                </div>
            </div>
        </div>
    );
}
