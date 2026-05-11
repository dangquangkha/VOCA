'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, QrCode, Copy, CreditCard, X, CheckCircle2, Info } from 'lucide-react';
import { Expert } from '@/types/expert';
import { Booking } from '@/types/booking';
import api from '@/lib/api';
import { toast } from '@/store/useToastStore';

interface MentorSupportModalProps {
    booking: Booking;
    mentor: Expert;
    onClose: () => void;
    onSuccess: () => void;
}

export const MentorSupportModal: React.FC<MentorSupportModalProps> = ({
    booking,
    mentor,
    onClose,
    onSuccess,
}) => {
    const [activeTab, setActiveTab] = useState<'credit' | 'bank'>('credit');
    const [amount, setAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const mentorName = mentor.user?.full_name || 'Cố vấn';
    const presets = [10, 20, 50, 100, 200, 500];
    const hasBankInfo = mentor.bank_name && mentor.bank_account;

    const handleCopyAccount = () => {
        if (mentor.bank_account) {
            navigator.clipboard.writeText(mentor.bank_account);
            toast.success('Đã sao chép số tài khoản!');
        }
    };

    const handleCreditSupport = async () => {
        const creditAmount = parseInt(amount) || 0;
        setIsSubmitting(true);
        try {
            await api.post(`payments/bookings/${booking.id}/support-mentor?amount=${creditAmount}`);
            setSuccess(true);
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 2500);
        } catch (err: any) {
            const msg = err.response?.data?.detail || 'Gửi ủng hộ thất bại. Vui lòng thử lại.';
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSkip = async () => {
        setIsSubmitting(true);
        try {
            await api.post(`payments/bookings/${booking.id}/support-mentor?amount=0`);
            onSuccess();
            onClose();
        } catch {
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-md"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="relative w-full max-w-lg bg-[#050505] border border-[#00F0FF]/20 rounded-2xl shadow-[0_0_80px_rgba(0,240,255,0.08)] overflow-hidden"
                >
                    {/* Top accent */}
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#FFB800]/60 to-transparent" />

                    {success ? (
                        <div className="p-12 text-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', delay: 0.1 }}
                                className="w-20 h-20 rounded-full bg-[#FFB800]/10 border border-[#FFB800]/30 flex items-center justify-center mx-auto mb-6"
                            >
                                <Heart className="w-10 h-10 text-[#FFB800] fill-[#FFB800]/30" />
                            </motion.div>
                            <h3 className="text-2xl font-serif italic text-white mb-2">Cảm ơn bạn!</h3>
                            <p className="text-white/50 text-sm font-sans">
                                Sự ủng hộ của bạn đã được gửi đến {mentorName}.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Header */}
                            <div className="p-8 border-b border-white/5 relative">
                                <button
                                    onClick={onClose}
                                    className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white/50 hover:text-white"
                                >
                                    <X size={14} />
                                </button>
                                <div className="flex items-center gap-3 mb-2">
                                    <Heart className="w-5 h-5 text-[#FFB800]" />
                                    <span className="text-[10px] font-bold text-[#FFB800] uppercase tracking-[0.3em]">Ủng hộ Cố vấn</span>
                                </div>
                                <h2 className="text-2xl font-serif italic text-white">
                                    Gửi lời cảm ơn đến {mentorName}
                                </h2>
                                <p className="text-white/40 text-sm font-sans mt-2 leading-relaxed">
                                    Buổi tư vấn đã kết thúc. Bạn có thể ủng hộ Cố vấn bằng credits hoặc chuyển khoản ngân hàng trực tiếp.
                                </p>
                            </div>

                            {/* Tabs */}
                            {hasBankInfo && (
                                <div className="flex border-b border-white/5">
                                    <button
                                        onClick={() => setActiveTab('credit')}
                                        className={`flex-1 py-4 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'credit' ? 'text-[#00F0FF] border-b-2 border-[#00F0FF]' : 'text-white/30 hover:text-white/60'}`}
                                    >
                                        <CreditCard size={12} /> Credits
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('bank')}
                                        className={`flex-1 py-4 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'bank' ? 'text-[#FFB800] border-b-2 border-[#FFB800]' : 'text-white/30 hover:text-white/60'}`}
                                    >
                                        <QrCode size={12} /> Ngân hàng
                                    </button>
                                </div>
                            )}

                            {/* Credit Tab */}
                            {activeTab === 'credit' && (
                                <div className="p-8 space-y-6">
                                    {/* Info */}
                                    <div className="flex items-start gap-3 p-4 rounded-xl bg-[#00F0FF]/5 border border-[#00F0FF]/10">
                                        <Info size={14} className="text-[#00F0FF] mt-0.5 shrink-0" />
                                        <p className="text-white/60 text-xs font-sans leading-relaxed">
                                            100% số credits bạn gửi sẽ được chuyển thẳng cho {mentorName}. Nền tảng không thu phí.
                                        </p>
                                    </div>

                                    {/* Preset amounts */}
                                    <div>
                                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Chọn nhanh</p>
                                        <div className="grid grid-cols-3 gap-2">
                                            {presets.map(p => (
                                                <button
                                                    key={p}
                                                    onClick={() => setAmount(String(p))}
                                                    className={`py-3 text-sm font-bold rounded-lg border transition-all ${amount === String(p) ? 'bg-[#FFB800]/10 border-[#FFB800]/50 text-[#FFB800]' : 'border-white/10 text-white/50 hover:border-white/20 hover:text-white/80'}`}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Custom amount */}
                                    <div>
                                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Hoặc nhập số khác</p>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                placeholder="0"
                                                value={amount}
                                                onChange={e => setAmount(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white text-xl font-serif italic focus:outline-none focus:border-[#FFB800]/50 transition-all"
                                            />
                                            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-white/30 text-[10px] font-bold uppercase tracking-widest">Credits</span>
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleCreditSupport}
                                            disabled={isSubmitting}
                                            className="flex-1 py-4 bg-gradient-to-r from-[#FFB800]/80 to-[#FF7B00]/80 text-black font-black text-[11px] uppercase tracking-widest rounded-xl hover:brightness-110 transition-all disabled:opacity-40 disabled:grayscale"
                                        >
                                            {isSubmitting ? (
                                                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin mx-auto" />
                                            ) : (
                                                `Gửi ${amount || 0} Credits`
                                            )}
                                        </button>
                                    </div>

                                    <button
                                        onClick={handleSkip}
                                        disabled={isSubmitting}
                                        className="w-full text-[10px] font-bold text-white/30 uppercase tracking-widest hover:text-white/60 transition-colors py-2"
                                    >
                                        Bỏ qua (không ủng hộ)
                                    </button>
                                </div>
                            )}

                            {/* Bank Tab */}
                            {activeTab === 'bank' && hasBankInfo && (
                                <div className="p-8 space-y-6">
                                    {/* Info */}
                                    <div className="flex items-start gap-3 p-4 rounded-xl bg-[#FFB800]/5 border border-[#FFB800]/10">
                                        <Info size={14} className="text-[#FFB800] mt-0.5 shrink-0" />
                                        <p className="text-white/60 text-xs font-sans leading-relaxed">
                                            Bạn có thể chuyển khoản trực tiếp đến tài khoản ngân hàng của {mentorName}. Số tiền hoàn toàn tùy bạn quyết định.
                                        </p>
                                    </div>

                                    {/* Bank Info */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                                            <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Ngân hàng</span>
                                            <span className="text-white font-bold text-sm">{mentor.bank_name}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                                            <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Chủ TK</span>
                                            <span className="text-white font-bold text-sm">{mentor.bank_holder_name}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5 group">
                                            <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Số TK</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[#FFB800] font-bold text-base font-mono">{mentor.bank_account}</span>
                                                <button onClick={handleCopyAccount} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-[#FFB800]/10 text-white/40 hover:text-[#FFB800] transition-colors">
                                                    <Copy size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* QR Code */}
                                    {mentor.qr_code_url && (
                                        <div className="flex flex-col items-center gap-4 pt-2">
                                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Quét mã QR để chuyển khoản</p>
                                            <div className="p-3 bg-white rounded-xl shadow-2xl">
                                                <img
                                                    src={mentor.qr_code_url}
                                                    alt="QR chuyển khoản"
                                                    className="w-48 h-48 object-contain"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleSkip}
                                        disabled={isSubmitting}
                                        className="w-full text-[10px] font-bold text-white/30 uppercase tracking-widest hover:text-white/60 transition-colors py-2"
                                    >
                                        Tôi đã chuyển khoản xong
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
