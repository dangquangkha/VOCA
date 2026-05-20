'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore, ToastType } from '@/store/useToastStore';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 className="w-5 h-5 text-white" strokeWidth={2.5} />,
    error: <AlertCircle className="w-5 h-5 text-white" strokeWidth={2.5} />,
    info: <Info className="w-5 h-5 text-white" strokeWidth={2.5} />,
    warning: <AlertTriangle className="w-5 h-5 text-white" strokeWidth={2.5} />,
};

const toastStyles: Record<ToastType, string> = {
    success: 'bg-[#00A4FD] border-[#00A4FD]/20 text-white shadow-[0_8px_32px_rgba(0,164,253,0.35)]',
    error: 'bg-red-600 border-red-500/20 text-white shadow-[0_8px_32px_rgba(220,38,38,0.35)]',
    info: 'bg-[#0046EA] border-[#0046EA]/20 text-white shadow-[0_8px_32px_rgba(0,70,234,0.35)]',
    warning: 'bg-amber-500 border-amber-400/20 text-white shadow-[0_8px_32px_rgba(245,158,11,0.35)]',
};

export const ToastContainer = () => {
    const { toasts, removeToast } = useToastStore();

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.95 }}
                        className={`
                            pointer-events-auto
                            flex items-center gap-4 px-5 py-4 min-w-[300px] max-w-[420px]
                            border backdrop-blur-md relative overflow-hidden
                            ${toastStyles[toast.type]}
                        `}
                    >
                        <div className="flex-shrink-0">{icons[toast.type]}</div>
                        <p className="text-sm font-semibold flex-grow tracking-wide leading-relaxed">
                            {toast.message}
                        </p>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="flex-shrink-0 text-white/70 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <motion.div
                            initial={{ scaleX: 1 }}
                            animate={{ scaleX: 0 }}
                            transition={{ duration: (toast.duration || 4000) / 1000, ease: 'linear' }}
                            className="absolute bottom-0 left-0 right-0 h-[3px] origin-left bg-white/40"
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};
