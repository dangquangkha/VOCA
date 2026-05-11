'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, AlertCircle } from 'lucide-react';
import { AxiosError } from 'axios';
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
        } catch (err: unknown) {
            const axiosError = err as AxiosError<{ detail?: string }>;
            const msg = axiosError.response?.data?.detail || 'Failed to submit review';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-[var(--color-navy-mid)] border-[0.5px] border-[var(--color-gold-line)] rounded-sm w-full max-w-lg overflow-hidden shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]"
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-[var(--color-ivory-10)] flex justify-between items-center">
                    <h3 className="text-2xl font-serif italic text-[var(--color-ivory)] font-light tracking-tight">Thẩm định phiên tư vấn</h3>
                    <button
                        onClick={onClose}
                        className="text-[var(--color-ivory-45)] hover:text-[var(--color-gold)] transition-colors duration-300"
                        title="Đóng"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    {/* Main Question */}
                    <p className="text-sm text-[var(--color-ivory-70)] font-sans font-light leading-relaxed">
                        Phiên tư vấn cùng <span className="text-[var(--color-gold)] italic font-serif text-lg">{expertName}</span> mang lại giá trị như thế nào cho lộ trình của bạn?
                    </p>

                    {/* Star Rating */}
                    <div className="flex justify-center gap-4 py-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                className="group relative p-2 transition-transform duration-300 hover:scale-110 active:scale-95 outline-none focus:ring-0"
                            >
                                <Star
                                    className={`w-10 h-10 transition-all duration-300 ${rating >= star
                                        ? 'text-[var(--color-gold)] fill-[var(--color-gold)] drop-shadow-[0_0_8px_var(--color-gold-dim)]'
                                        : 'text-[var(--color-ivory-20)] hover:text-[var(--color-gold-faint)]'
                                        }`}
                                    strokeWidth={rating >= star ? 0 : 1}
                                />
                                {rating === star && (
                                    <motion.div
                                        layoutId="star-glow"
                                        className="absolute inset-0 bg-[var(--color-gold-faint)] blur-2xl -z-10"
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Feedback Textarea */}
                    <div className="space-y-3">
                        <label className="block text-[10px] uppercase tracking-[0.15em] font-sans text-[var(--color-ivory-45)]">
                            PHẢN HỒI CHI TIẾT
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Chia sẻ trải nghiệm về kiến thức và định hướng bạn nhận được..."
                            className="w-full bg-transparent border-[0.5px] border-[var(--color-ivory-20)] p-4 text-sm text-[var(--color-ivory)] font-sans font-light focus:border-[var(--color-gold)] transition-colors outline-none resize-none placeholder-[var(--color-ivory-45)] h-32"
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-3 bg-red-500/5 border border-red-500/10 text-red-400 text-[10px] uppercase tracking-widest font-sans flex items-center"
                        >
                            <AlertCircle className="w-4 h-4 mr-3" strokeWidth={1} />
                            {error}
                        </motion.div>
                    )}

                    {/* Footer Buttons */}
                    <div className="flex gap-4 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 py-3 border border-[var(--color-ivory-10)] text-[var(--color-ivory-45)] text-[10px] uppercase tracking-widest font-sans hover:border-[var(--color-gold-dim)] hover:text-[var(--color-gold)] transition-all duration-300 disabled:opacity-30"
                        >
                            BỎ QUA
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || rating === 0}
                            className="flex-1 py-3 bg-transparent border border-[var(--color-gold)] text-[var(--color-gold)] text-[10px] uppercase tracking-widest font-sans hover:bg-[var(--color-gold-faint)] hover:text-[var(--color-ivory)] transition-all duration-300 disabled:opacity-30"
                        >
                            {isLoading ? 'Đang gửi...' : 'GỬI THẨM ĐỊNH'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};
