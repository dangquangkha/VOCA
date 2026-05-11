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
            <div className="bg-[var(--color-navy-mid)] rounded-sm p-8 border border-[var(--color-ivory-10)] h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[var(--color-ivory-10)] animate-spin" />
            </div>
        );
    }

    const isKYCVerified = profile?.kyc_status === 'APPROVED';

    return (
        <div className="bg-[var(--color-navy-mid)] rounded-sm p-8 border border-[var(--color-ivory-10)] h-full flex flex-col hover:border-[var(--color-gold-line)] transition-all group shadow-2xl font-sans">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-[11px] font-medium text-[var(--color-ivory-45)] uppercase tracking-[0.3em]">Rút tiền & KYC</h3>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-medium uppercase tracking-widest ${isKYCVerified ? 'border-[var(--color-gold-dim)] text-[var(--color-gold)] bg-transparent' : 'border-[var(--color-amber-dim)] text-[var(--color-ivory-45)] bg-transparent'}`}>
                    <ShieldCheck size={12} className={isKYCVerified ? 'text-[var(--color-gold)]' : 'text-[var(--color-ivory-45)]'} />
                    {profile?.kyc_status || 'NOT SUBMITTED'}
                </div>
            </div>

            <div className="space-y-8 flex-1">
                {/* Bank Info */}
                <div className="p-5 rounded-sm bg-[var(--color-navy)] border border-[var(--color-ivory-10)] flex items-center gap-5 transition-all group-hover:border-[var(--color-gold-line)]">
                    <div className="w-10 h-10 rounded-sm bg-[var(--color-navy-mid)] border border-[var(--color-ivory-10)] flex items-center justify-center text-[var(--color-ivory-45)] group-hover:text-[var(--color-gold)] transition-colors">
                        <Landmark size={20} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-[9px] text-[var(--color-ivory-20)] font-medium uppercase tracking-[0.2em] mb-1">Tài khoản ngân hàng</p>
                        <p className="text-sm font-medium text-[var(--color-ivory-70)] truncate">
                            {profile?.bank_name ? `${profile.bank_name} - ${profile.bank_account}` : 'Chưa cập nhật'}
                        </p>
                    </div>
                    <button className="text-[9px] font-medium text-[var(--color-gold-dim)] uppercase tracking-widest hover:text-[var(--color-gold)] transition-colors">Thay đổi</button>
                </div>

                {/* Withdrawal Form */}
                <form onSubmit={handleWithdraw} className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-ivory-45)] font-medium ml-1">Số Credits muốn rút</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="Tối thiểu 5"
                                className="w-full bg-transparent border-b border-[var(--color-ivory-20)] focus:border-[var(--color-gold)] rounded-none px-0 py-3 text-2xl font-serif italic text-[var(--color-ivory)] placeholder:text-[var(--color-ivory-20)] transition-all outline-none"
                            />
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] font-medium text-[var(--color-ivory-20)] tracking-widest uppercase">CR</div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] uppercase tracking-widest text-[var(--color-ivory-20)] font-light">Ước tính nhận được:</span>
                        <span className="text-base font-serif italic text-[var(--color-ivory-70)]">
                            {amount ? (parseInt(amount) * exchangeRate).toLocaleString('vi-VN') : '0'} <span className="text-[10px] text-[var(--color-ivory-20)] uppercase tracking-widest font-sans not-italic ml-1">VNĐ</span>
                        </span>
                    </div>

                    <button
                        disabled={!amount || parseInt(amount) < 5 || !profile?.bank_account}
                        className="w-full py-3.5 bg-transparent border border-[var(--color-gold-line)] text-[var(--color-ivory)] rounded-sm text-[10px] uppercase tracking-[0.4em] font-medium hover:bg-[var(--color-gold-faint)] hover:text-[var(--color-gold)] transition-all duration-300 flex items-center justify-center gap-3 disabled:border-[var(--color-ivory-10)] disabled:text-[var(--color-ivory-20)] disabled:cursor-not-allowed group-hover:scale-[1.01] active:scale-95"
                    >
                        Tạo lệnh rút tiền (Payout)
                        <ArrowRight size={14} className="opacity-70" />
                    </button>
                </form>

                {/* Alert Boxes */}
                <div className="space-y-4">
                    {!profile?.bank_account && (
                        <div className="p-4 rounded-sm bg-[var(--color-navy)] border border-[var(--color-amber-dim)] flex gap-3 shadow-inner">
                            <AlertCircle className="text-[var(--color-amber)] flex-shrink-0" size={16} />
                            <p className="text-[10px] text-[var(--color-ivory-70)] font-light leading-relaxed tracking-wide">
                                Bạn chưa cập nhật <span className="text-[var(--color-ivory)] font-medium">thông tin ngân hàng</span>. Vui lòng cập nhật trong phần hồ sơ trước khi thực hiện quy trình rút tiền.
                            </p>
                        </div>
                    )}
                    <div className="p-4 rounded-sm bg-[var(--color-navy)] border border-[var(--color-gold-dim)] flex gap-3 shadow-inner">
                        <AlertCircle className="text-[var(--color-gold-dim)] flex-shrink-0" size={16} />
                        <p className="text-[10px] text-[var(--color-ivory-70)] font-light leading-relaxed tracking-wide">
                            Hạn mức rút tối thiểu là <span className="text-[var(--color-gold)] font-medium">5 Credits</span>. Lệnh rút tiền sẽ được bộ phận Strategic Command xử lý trong vòng 24-48h.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
