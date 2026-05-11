import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', label, error, ...props }, ref) => {
        return (
            <div className="w-full space-y-3">
                {label && (
                    <label className="block text-[10px] font-black text-[var(--color-ivory-40)] uppercase tracking-[0.2em] font-sans">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={`
            w-full bg-black/40 border border-[var(--color-ivory-10)] px-6 py-4 text-sm font-bold text-white placeholder-white/20
            transition-all duration-500 rounded-[2px] input-lock-on
            disabled:cursor-not-allowed disabled:opacity-50
            ${error ? 'border-[var(--neon-orange)] focus:ring-[var(--neon-orange-glow)]' : ''}
            ${className}
          `}
                    {...props}
                />
                {error && (
                    <p className="mt-2 text-[10px] font-black text-[var(--neon-orange)] uppercase tracking-widest">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
