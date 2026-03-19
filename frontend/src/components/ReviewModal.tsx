'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';
import api from '@/lib/api';

interface ReviewModalProps {
    bookingId: number;
    expertName: string;
    onClose: () => void;
    onSuccess: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ bookingId, expertName, onClose, onSuccess }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            setError('Please select a rating');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await api.post('reviews/', {
                booking_id: bookingId,
                rating,
                comment: comment.trim() || undefined
            });
            onSuccess();
        } catch (err: any) {
            const msg = err.response?.data?.detail || 'Failed to submit review';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#090C12]/90 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-[#090C12] border border-[#C9A84C]/20 w-full max-w-lg overflow-hidden"
            >
                <div className="px-10 py-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <h3 className="text-2xl font-serif italic text-[#F5F0E8] font-light tracking-tight">Thẩm định phiên tư vấn</h3>
                    <button onClick={onClose} className="text-[#F5F0E8]/20 hover:text-[#C9A84C] transition-colors duration-700">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-10">
                    <p className="text-sm text-[#F5F0E8]/40 font-sans font-light leading-relaxed">
                        Phiên tư vấn cùng <span className="text-[#C9A84C] italic font-serif text-lg">{expertName}</span> mang lại giá trị như thế nào cho lộ trình của bạn?
                    </p>

                    {/* Star Rating */}
                    <div className="flex justify-center gap-4 py-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                className={`group relative p-2 transition-all duration-700 ${rating >= star ? 'scale-110' : 'hover:scale-105 opacity-20 hover:opacity-100'}`}
                            >
                                <Star
                                    className={`w-10 h-10 ${rating >= star ? 'text-[#C9A84C] fill-[#C9A84C]' : 'text-[#F5F0E8]/20'}`}
                                    strokeWidth={0.5}
                                />
                                {rating === star && (
                                    <motion.div
                                        layoutId="star-glow"
                                        className="absolute inset-0 bg-[#C9A84C]/20 blur-xl -z-10"
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-4">
                        <label className="block text-[10px] uppercase tracking-[0.3em] font-sans text-[#F5F0E8]/20">
                            Phản hồi chi tiết (Tùy chọn)
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Chia sẻ trải nghiệm về kiến thức và định hướng bạn nhận được..."
                            className="w-full bg-white/[0.02] border border-white/5 p-6 text-sm text-[#F5F0E8] font-sans font-light focus:border-[#C9A84C]/40 transition-all outline-none resize-none placeholder:text-[#F5F0E8]/10"
                            rows={4}
                        />
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-4 bg-red-500/5 border border-red-500/10 text-red-400 text-[10px] uppercase tracking-widest font-sans flex items-center"
                        >
                            <AlertCircle className="w-4 h-4 mr-3" strokeWidth={1} />
                            {error}
                        </motion.div>
                    )}

                    <div className="flex gap-6 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 py-4 border border-white/5 text-[#F5F0E8]/40 text-[10px] uppercase tracking-[0.3em] font-sans hover:bg-white/5 transition-all duration-700"
                        >
                            Bỏ qua
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || rating === 0}
                            className="flex-1 py-4 bg-[#C9A84C] text-[#090C12] text-[10px] uppercase tracking-[0.3em] font-sans hover:bg-[#F5F0E8] transition-all duration-700 shadow-xl shadow-black/40 disabled:opacity-30"
                        >
                            Gửi thẩm định
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};
