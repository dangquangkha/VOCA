'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Facebook, Send, ChevronDown, MessageSquare, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';

// --- Component 1: Floating Contact Menu (FAB Widget) ---
export const FloatingContactMenu = () => {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const { user } = useAuthStore();

    const handleChatWithAdmin = async () => {
        let adminId = 2; // Default fallback
        try {
            const { data } = await api.get('support/admin-profile');
            if (data?.id) adminId = data.id;
        } catch (err) {
            console.warn('Could not fetch admin ID, using fallback:', err);
        }

        if (!user) {
            router.push(`/login?redirect=/dashboard/chat?with=${adminId}`);
        } else {
            router.push(`/dashboard/chat?with=${adminId}`);
        }
        setIsOpen(false);
    };

    return (
        <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-4">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.8 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className="flex flex-col gap-3 mb-2"
                    >
                        {/* Messenger Button */}
                        <motion.a
                            href="https://www.facebook.com/quang.khai.295873ew"
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            aria-label="Chat qua Facebook Messenger"
                            className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
                        >
                            <Facebook size={24} aria-hidden="true" />
                        </motion.a>

                        {/* Zalo Button */}
                        <motion.a
                            href="https://zalo.me/0379262302"
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            aria-label="Chat qua Zalo"
                            className="w-12 h-12 rounded-full bg-[#0068FF] text-white flex items-center justify-center shadow-lg hover:bg-[#005AE0] transition-colors"
                        >
                            <span className="font-black text-[10px]" aria-hidden="true">Zalo</span>
                        </motion.a>

                        {/* Admin Chat Button */}
                        <motion.button
                            onClick={handleChatWithAdmin}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            aria-label="Chat với Admin"
                            className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center shadow-lg hover:bg-slate-900 transition-colors border-2 border-white/20"
                        >
                            <ShieldCheck size={24} aria-hidden="true" />
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Toggle Button */}
            <motion.button
                suppressHydrationWarning={true}
                onClick={() => setIsOpen(!isOpen)}
                animate={{ 
                    boxShadow: ["0 0 0px rgba(255,233,0,0)", "0 0 30px rgba(255,233,0,0.6)", "0 0 0px rgba(255,233,0,0)"]
                }}
                transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label={isOpen ? "Đóng menu liên hệ" : "Mở menu liên hệ"}
                className="w-16 h-16 rounded-full bg-[#FFE900] text-[#0046EA] flex items-center justify-center shadow-2xl transition-all relative group z-10"
            >
                <motion.div
                    animate={{ rotate: isOpen ? 90 : 0 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                >
                    {isOpen ? <ChevronDown size={28} strokeWidth={3} /> : <MessageSquare size={28} strokeWidth={3} />}
                </motion.div>
                {!isOpen && (
                    <motion.span 
                        animate={{ 
                            opacity: [1, 0.5, 1],
                            x: [0, -5, 0]
                        }}
                        transition={{ 
                            duration: 1.5, 
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="absolute right-full mr-4 bg-[#FFE900] text-[#0046EA] px-4 py-2 rounded-xl text-[11px] font-black shadow-2xl border border-[#FFE900]/50 backdrop-blur-xl whitespace-nowrap pointer-events-none uppercase tracking-wider"
                    >
                        <span className="relative z-10">Liên hệ tư vấn ngay!</span>
                        <div className="absolute inset-0 bg-white/20 animate-pulse rounded-xl" />
                    </motion.span>
                )}
            </motion.button>
        </div>
    );
};

// --- Component 2: CTA Consultation Button ---
export const CTAConsultationButton = () => {
    const router = useRouter();

    return (
        <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(var(--color-magenta-rgb), 0.2)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/login')}
            className="px-10 py-5 bg-gradient-to-r from-[var(--color-magenta)] to-[#f43f5e] text-white rounded-full font-black text-xl shadow-xl hover:brightness-110 transition-all uppercase tracking-tight"
        >
            ĐĂNG KÝ TƯ VẤN NGAY
        </motion.button>
    );
};

// --- Component 3: Lead Generation Contact Form ---
export const LeadGenerationForm = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        role: 'Students',
        need: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Basic validation
        if (!formData.fullName || !formData.email || !formData.phone) {
            alert("Vui lòng nhập đủ thông tin bắt buộc");
            setIsSubmitting(false);
            return;
        }

        // Simulating API call
        setTimeout(() => {
            alert("Thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.");
            setFormData({
                fullName: '',
                email: '',
                phone: '',
                role: 'Students',
                need: ''
            });
            setIsSubmitting(false);
        }, 1000);
    };

    return (
        <section id="contact-form" className="py-24 bg-[var(--color-navy)] relative overflow-hidden font-dm-sans">
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-cyan)]/5 rounded-full blur-[100px] -mr-48 -mt-48 opacity-40" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-[var(--color-magenta)]/5 rounded-full blur-[100px] -ml-48 -mb-48 opacity-40" />

            <div className="max-w-xl mx-auto px-4 relative z-10">
                <div className="text-center space-y-4 mb-12">
                    <h2 className="text-3xl md:text-4xl font-black text-[var(--color-ivory)] tracking-tight text-balance">
                        Chưa biết dịch vụ nào phù hợp?
                    </h2>
                    <p className="text-[var(--color-ivory-40)] font-bold">
                        Để lại thông tin để CareerPath liên hệ tư vấn dịch vụ phù hợp
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 bg-[var(--color-obsidian)] p-8 md:p-10 rounded-[2.5rem] shadow-2xl shadow-black/40 border border-[var(--color-ivory-10)]">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label htmlFor="lead-fullName" className="text-xs font-black text-[var(--color-ivory-40)] uppercase tracking-widest ml-2">Họ & tên</label>
                            <input
                                id="lead-fullName"
                                type="text"
                                name="fullName"
                                required
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                className="w-full bg-[var(--color-navy-dark)] border-none rounded-2xl px-5 py-4 text-sm font-bold text-[var(--color-ivory)] focus:bg-[var(--color-navy-mid)] focus:ring-2 focus:ring-[var(--color-cyan)] transition-all outline-none"
                                placeholder="Nguyễn Văn A"
                            />
                        </div>

                        <div className="space-y-1">
                            <label htmlFor="lead-email" className="text-xs font-black text-[var(--color-ivory-40)] uppercase tracking-widest ml-2">Email</label>
                            <input
                                id="lead-email"
                                type="email"
                                name="email"
                                spellCheck={false}
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-[var(--color-navy-dark)] border-none rounded-2xl px-5 py-4 text-sm font-bold text-[var(--color-ivory)] focus:bg-[var(--color-navy-mid)] focus:ring-2 focus:ring-[var(--color-cyan)] transition-all outline-none"
                                placeholder="dangquangkhai261104@gmail.com"
                            />
                        </div>

                        <div className="space-y-1">
                            <label htmlFor="lead-phone" className="text-xs font-black text-[var(--color-ivory-40)] uppercase tracking-widest ml-2">Số điện thoại</label>
                            <input
                                id="lead-phone"
                                type="tel"
                                name="phone"
                                required
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full bg-[var(--color-navy-dark)] border-none rounded-2xl px-5 py-4 text-sm font-bold text-[var(--color-ivory)] focus:bg-[var(--color-navy-mid)] focus:ring-2 focus:ring-[var(--color-cyan)] transition-all outline-none"
                                placeholder="09xx xxx xxx"
                            />
                        </div>

                        <div className="space-y-1">
                            <label htmlFor="lead-role" className="text-xs font-black text-[var(--color-ivory-40)] uppercase tracking-widest ml-2">Bạn đang là…</label>
                            <div className="relative">
                                <select
                                    id="lead-role"
                                    name="role"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full bg-[var(--color-navy-dark)] border-none rounded-2xl px-5 py-4 text-sm font-bold text-[var(--color-ivory)] focus:bg-[var(--color-navy-mid)] focus:ring-2 focus:ring-[var(--color-cyan)] transition-all outline-none appearance-none"
                                >
                                    <option value="Học sinh THPT">Học sinh THPT</option>
                                    <option value="Sinh viên">Sinh viên</option>
                                    <option value="Người đi làm">Người đi làm</option>
                                </select>
                                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-[var(--color-ivory)] pointer-events-none" size={20} aria-hidden="true" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label htmlFor="lead-need" className="text-xs font-black text-[var(--color-ivory-40)] uppercase tracking-widest ml-2">Nhu cầu tư vấn</label>
                            <textarea
                                id="lead-need"
                                name="need"
                                value={formData.need}
                                onChange={(e) => setFormData({ ...formData, need: e.target.value })}
                                rows={4}
                                className="w-full bg-[var(--color-navy-dark)] border-none rounded-2xl px-5 py-4 text-sm font-bold text-[var(--color-ivory)] focus:bg-[var(--color-navy-mid)] focus:ring-2 focus:ring-[var(--color-cyan)] transition-all outline-none resize-none"
                                placeholder="Chia sẻ nhu cầu của bạn…"
                            />
                        </div>
                    </div>

                    <motion.button
                        type="submit"
                        disabled={isSubmitting}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-gradient-to-r from-[var(--color-teal-mid)] to-[var(--color-cyan)] text-obsidian py-4 rounded-2xl font-black text-lg shadow-xl shadow-[var(--color-cyan)]/20 hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? "ĐANG GỬI…" : "GỬI THÔNG TIN"}
                        {!isSubmitting && <Send size={20} aria-hidden="true" />}
                    </motion.button>
                </form>
            </div>
        </section>
    );
};
