import { useState, useCallback, useMemo } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

export function useToast() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = "info") => {
        const id = Date.now();
        const newToast: Toast = { id, message, type };

        setToasts((prev) => [...prev, newToast]);

        // Auto-dismiss after 3 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, 3000);
    }, []);

    const dismissToast = useCallback((id: number) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const success = useCallback((message: string) => showToast(message, "success"), [showToast]);
    const error = useCallback((message: string) => showToast(message, "error"), [showToast]);
    const warning = useCallback((message: string) => showToast(message, "warning"), [showToast]);
    const info = useCallback((message: string) => showToast(message, "info"), [showToast]);

    return useMemo(() => ({
        toasts,
        showToast,
        dismissToast,
        success,
        error,
        warning,
        info,
    }), [toasts, showToast, dismissToast, success, error, warning, info]);
}
