'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore, ToastType } from '@/store/useToastStore';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 className="w-5 h-5 text-neon-green" />,
    error: <AlertCircle className="w-5 h-5 text-neon-magenta" />,
    info: <Info className="w-5 h-5 text-neon-cyan" />,
    warning: <AlertTriangle className="w-5 h-5 text-neon-amber" />,
};

const borderColors: Record<ToastType, string> = {
    success: 'border-neon-green/30',
    error: 'border-neon-magenta/30',
    info: 'border-neon-cyan/30',
    warning: 'border-neon-amber/30',
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
              bg-void-90/90 backdrop-blur-md border ${borderColors[toast.type]}
              rounded-lg shadow-2xl overflow-hidden relative
            `}
                    >
                        <div className="flex-shrink-0">{icons[toast.type]}</div>
                        <p className="text-sm font-light text-text-primary flex-grow">
                            {toast.message}
                        </p>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="flex-shrink-0 text-text-dim hover:text-text-primary transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <motion.div
                            initial={{ scaleX: 1 }}
                            animate={{ scaleX: 0 }}
                            transition={{ duration: (toast.duration || 4000) / 1000, ease: 'linear' }}
                            className={`absolute bottom-0 left-0 right-0 h-[2px] origin-left bg-current opacity-30`}
                            style={{ color: `var(--neon-${toast.type === 'info' ? 'cyan' : toast.type})` }}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};
