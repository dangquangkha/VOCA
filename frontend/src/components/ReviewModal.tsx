'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, AlertCircle, X } from 'lucide-react';
import { AxiosError } from 'axios';
import api from '@/lib/api';

interface ReviewModalProps {
    bookingId: number;
    expertName: string;
    onClose: () => void;
    onSuccess: () => void;
}

/**
 * ReviewModal — VOCA Design System
 * 
 * Redesigned for high contrast, editorial look, and square corners.
 * Uses Sky Blue (#00A4FD) for actions and White/Ink for high readability.
 */
export const ReviewModal: React.FC<ReviewModalProps> = ({ bookingId, expertName, onClose, onSuccess }) => {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            setError('Vui lòng chọn mức độ hài lòng của bạn.');
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
            const msg = axiosError.response?.data?.detail || 'Không thể gửi đánh giá. Vui lòng thử lại.';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const currentDisplayRating = hoveredRating || rating;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-white/40 backdrop-blur-xl">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="bg-white border-6 border-sky-400/40 w-full max-w-xl shadow-[0_32px_80px_rgba(0,164,253,0.15)] relative"
                style={{ borderRadius: 0 }}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-8 text-black/40 hover:text-sky-500 transition-colors z-10 p-2"
                >
                    <X size={24} strokeWidth={1.5} />
                </button>

                <div className="p-10 md:p-14 space-y-10">
                    {/* Header */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-[1px] w-8 bg-sky-500" />
                            <span className="text-[10px] font-semibold tracking-[0.4em] text-sky-500 uppercase">
                                Feedback Entry
                            </span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-serif italic text-black leading-tight">
                            Thẩm định phiên tư vấn
                        </h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-10">
                        {/* Question */}
                        <p className="text-lg text-black/60 font-sans font-light leading-relaxed max-w-md">
                            Trải nghiệm cùng chuyên gia <span className="text-black font-medium">{expertName}</span> đã mang lại giá trị như thế nào cho bạn?
                        </p>

                        {/* Stars Selection */}
                        <div className="flex flex-col items-center gap-6 py-4 bg-sky-50 border-sky-100 border-[1px]">
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onMouseEnter={() => setHoveredRating(star)}
                                        onMouseLeave={() => setHoveredRating(0)}
                                        onClick={() => setRating(star)}
                                        className="relative p-2 transition-transform duration-300 active:scale-90 outline-none"
                                    >
                                        <Star
                                            size={40}
                                            className={`transition-all duration-300 ${
                                                currentDisplayRating >= star
                                                    ? 'text-sky-500 fill-sky-500'
                                                    : 'text-black/10'
                                            }`}
                                            strokeWidth={1}
                                        />
                                        {rating === star && (
                                            <motion.div
                                                layoutId="active-star-dot"
                                                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-sky-500"
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>
                            <span className="text-[10px] font-bold tracking-widest text-sky-600/60 uppercase">
                                {currentDisplayRating === 1 && 'Cần cải thiện'}
                                {currentDisplayRating === 2 && 'Bình thường'}
                                {currentDisplayRating === 3 && 'Tốt'}
                                {currentDisplayRating === 4 && 'Rất tốt'}
                                {currentDisplayRating === 5 && 'Xuất sắc'}
                                {currentDisplayRating === 0 && 'Chọn mức độ đánh giá'}
                            </span>
                        </div>

                        {/* Comment Area */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-bold tracking-[0.2em] text-black/40 uppercase block">
                                Nhận xét chi tiết (Không bắt buộc)
                            </label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Kiến thức, thái độ, hoặc định hướng bạn tâm đắc nhất..."
                                className="w-full bg-white border-2 border-black/08 p-6 text-sm text-black font-sans font-light focus:border-sky-500 transition-all outline-none resize-none h-40 placeholder:text-black/20"
                                style={{ borderRadius: 0 }}
                            />
                        </div>

                        {/* Error Handling */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex items-center gap-3 text-red-500 overflow-hidden"
                                >
                                    <AlertCircle size={16} />
                                    <span className="text-[11px] font-medium tracking-wide">{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Footer Actions */}
                        <div className="grid grid-cols-2 gap-6 pt-6 border-t border-black/08">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isLoading}
                                className="py-5 text-[11px] font-bold tracking-[0.3em] text-black/40 uppercase hover:text-black transition-colors disabled:opacity-30"
                            >
                                Bỏ qua
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading || rating === 0}
                                className="py-5 bg-sky-500 text-yellow-300 text-[11px] font-bold tracking-[0.3em] uppercase hover:bg-sky-600 transition-all shadow-[0_10px_25px_-5px_rgba(0,164,253,0.4)] disabled:opacity-30 disabled:bg-black/10 disabled:text-black/20 disabled:shadow-none"
                            >
                                {isLoading ? 'Đang gửi...' : 'Gửi đánh giá'}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};
