import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    className = '',
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled,
    ...props
}) => {
    const baseStyles = 'inline-flex items-center justify-center font-black uppercase tracking-[0.2em] text-[10px] transition-all duration-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';

    const variants = {
        primary: 'bg-transparent border border-[var(--neon-magenta)] text-[var(--neon-magenta)] hover:bg-[var(--neon-magenta)] hover:text-black hover:drop-shadow-[0_0_15px_var(--neon-magenta-glow)]',
        secondary: 'bg-transparent border border-[var(--neon-cyan)] text-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)] hover:text-black hover:drop-shadow-[0_0_15px_var(--neon-cyan-glow)]',
        outline: 'border border-white/20 bg-transparent hover:bg-white hover:text-black text-white hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]',
        danger: 'bg-transparent border border-[var(--neon-orange)] text-[var(--neon-orange)] hover:bg-[var(--neon-orange)] hover:text-black hover:drop-shadow-[0_0_15px_var(--neon-orange-glow)]',
        ghost: 'bg-transparent border-none text-ivory-45 hover:text-white hover:bg-white/5',
    };

    const sizes = {
        sm: 'h-8 px-5',
        md: 'h-[52px] px-10',
        lg: 'h-16 px-16 text-sm',
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : null}
            {children}
        </button>
    );
};
