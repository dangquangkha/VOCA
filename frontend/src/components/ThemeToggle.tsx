'use client'

import { useState, useEffect } from 'react'

export default function ThemeToggle() {
    const [theme, setTheme] = useState<string>('')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const savedTheme = localStorage.getItem('theme') || ''
        if (savedTheme) {
            setTheme(savedTheme)
        }
    }, [])

    useEffect(() => {
        if (mounted) {
            document.documentElement.setAttribute('data-theme', theme)
            localStorage.setItem('theme', theme)
        }
    }, [theme, mounted])

    const toggleTheme = () => {
        setTheme(prev => prev === '' ? 'cyber' : '')
    }

    if (!mounted) return null

    return (
        <div className="fixed bottom-8 left-8 z-[100]">
            <button
                onClick={toggleTheme}
                className={`
          group relative flex items-center justify-center
          w-16 h-16 rounded-full
          transition-all duration-500 ease-out
          hover:scale-110 active:scale-95
          cursor-pointer overflow-hidden shadow-2xl
          ${theme === 'cyber'
                        ? 'bg-gradient-to-r from-[#D20048] to-[#00A4FD] shadow-[0_0_30px_rgba(0,164,253,0.5)]'
                        : 'bg-[#0A0E1A] border border-[rgba(0,164,253,0.22)] shadow-[0_0_15px_rgba(0,164,253,0.15)]'
                    }
        `}
                aria-label="Toggle Theme"
            >
                {/* Continuous Pulse Glow */}
                <div className={`
          absolute inset-0 rounded-full opacity-50
          animate-pulse blur-xl
          ${theme === 'cyber' ? 'bg-gradient-to-r from-[#D20048] to-[#00A4FD]' : 'bg-[#00A4FD]/20'}
        `} />

                {/* Icons */}
                <div className="relative z-10 flex items-center justify-center w-full h-full">
                    {/* Luxury Icon */}
                    <svg
                        className={`
              absolute w-7 h-7 transition-all duration-500
              ${theme === 'cyber' ? 'opacity-0 scale-50 rotate-90' : 'opacity-100 scale-100 rotate-0'}
            `}
                        viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                    >
                        <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
                            fill="currentColor" className="text-gold" />
                    </svg>

                    {/* Cyber Icon */}
                    <svg
                        className={`
              absolute w-7 h-7 transition-all duration-500
              ${theme === '' ? 'opacity-0 scale-50 -rotate-90' : 'opacity-100 scale-100 rotate-0'}
            `}
                        viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                    >
                        <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
                            fill="white"
                            style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.8))' }}
                        />
                    </svg>
                </div>

                {/* Dynamic Label */}
                <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-[0.2em] uppercase bg-black/90 border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap backdrop-blur-md">
                    {theme === 'cyber' ? 'Luxury Protocol' : 'Dopamine Override'}
                </span>
            </button>
        </div>
    )
}
