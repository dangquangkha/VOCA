'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { getAvatarUrl } from '@/utils/url-utils';
import { compressImage } from '@/utils/image-utils';

interface UserProfile {
    email: string;
    full_name: string;
    phone_number: string;
    role: string;
    avatar_url: string;
    expert_profile?: {
        bio?: string;
        linkedin_url?: string;
        experience_years?: number;
        hourly_rate?: number;
        tags?: string;
    };
}

export default function ProfilePage() {
    const router = useRouter();
    const { updateUser } = useAuthStore();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data } = await api.get('users/me');
            setUser(data);
        } catch (error) {
            console.error('Failed to fetch profile', error);
            router.push('/login');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // NEW: Client-side size validation (5MB max)
        const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
        let fileToUpload = file;

        if (file.size > MAX_FILE_SIZE) {
            setUploadingAvatar(true);
            setMessage({
                type: 'success',
                text: `Tối ưu hóa hình ảnh (${(file.size / 1024 / 1024).toFixed(2)}MB)...`
            });

            try {
                fileToUpload = await compressImage(file, {
                    maxSizeMB: 4.5, // Target slightly below limit
                    maxWidthOrHeight: 1200,
                    quality: 0.7
                });
                console.log('Resized file size:', (fileToUpload.size / 1024 / 1024).toFixed(2), 'MB');
            } catch (err) {
                console.error('Resizing failed:', err);
                setMessage({
                    type: 'error',
                    text: 'Không thể tối ưu hóa hình ảnh. Vui lòng chọn file nhỏ hơn 5MB.'
                });
                setUploadingAvatar(false);
                return;
            }
        } else {
            setUploadingAvatar(true);
            setMessage(null);
        }

        const formData = new FormData();
        formData.append('file', fileToUpload);

        try {
            const { data } = await api.post('users/upload-avatar', formData);
            const updatedProfile = user ? { ...user, avatar_url: data.avatar_url } : null;
            if (updatedProfile) {
                setUser(updatedProfile);
                updateUser(updatedProfile as any); // Sync with Global Store
            }
            setMessage({ type: 'success', text: 'Avatar uploaded successfully!' });
        } catch (error: any) {
            console.error('Full Upload Error Object:', error);
            console.error('Upload Error Response:', error.response?.data);

            const errorDetail = error.response?.data?.detail;
            const errorMessage = typeof errorDetail === 'string'
                ? errorDetail
                : (JSON.stringify(errorDetail) || error.message || 'Failed to upload avatar.');

            setMessage({
                type: 'error',
                text: errorMessage
            });
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        if (!user) return;
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);

        const formData = new FormData(e.target as HTMLFormElement);
        const phone = formData.get('phone_number') as string;

        // Basic phone validation (10-11 digits)
        const phoneRegex = /^[0-9]{10,11}$/;
        if (phone && !phoneRegex.test(phone)) {
            setMessage({ type: 'error', text: 'Phone number must be 10-11 digits.' });
            setIsSaving(false);
            return;
        }

        const updateData = {
            full_name: formData.get('full_name'),
            phone_number: phone,
            avatar_url: user.avatar_url, // Use the state value which might be newly uploaded
        };

        try {
            // Update User Info
            await api.put('users/me', updateData);

            // Update Expert Info if applicable
            if (user.role === 'EXPERT' || user.role === 'MENTOR') {
                const expertData = {
                    bio: formData.get('bio'),
                    linkedin_url: formData.get('linkedin_url'),
                    experience_years: parseInt(formData.get('experience_years') as string) || 0,
                    hourly_rate: parseInt(formData.get('hourly_rate') as string) || 0,
                    tags: formData.get('tags'),
                };
                await api.put('experts/me', expertData);
            }

            // Re-fetch to get combined data
            const { data } = await api.get('users/me');
            setUser(data);
            updateUser(data); // Sync with Global Store
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.response?.data?.detail || 'Failed to update profile.'
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-8 h-8 border border-[#0F0C17]/10 border-t-[var(--color-gold)] rounded-full animate-spin" />
        </div>
    );

    if (!user) return null;

    const inputClasses = "w-full bg-white border-2 border-[#00A4FD] rounded-0 px-4 py-3 text-sm font-bold text-black focus:outline-none focus:border-[#0046EA] transition-all duration-500 placeholder-black/20";
    const labelClasses = "block text-[10px] uppercase font-black tracking-[.15em] text-black mb-2 ml-1";
    const readonlyInputClasses = "w-full bg-[#F5F8FF] border-2 border-[#00A4FD]/30 rounded-0 px-4 py-2.5 text-sm font-bold text-black/70 cursor-not-allowed opacity-80 shadow-inner";

    return (
        <div className="max-w-[1060px] mx-auto py-12 px-6">
            <div className="mb-4">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-[9px] uppercase tracking-[.3em] text-[#0F0C17]/50 hover:text-[#0046EA] transition-colors duration-500 group"
                >
                    <span className="group-hover:-translate-x-1 transition-transform duration-500">←</span>
                    <span>Back to Journey</span>
                </button>
            </div>

            <div className="mb-12">
                <div className="flex items-center gap-3 mb-4 section-eyebrow">
                    <span className="section-eyebrow-line bg-[var(--color-gold-line)]" />
                    <span className="text-[10px] uppercase tracking-[.3em] text-[#0046EA]/80">Account Settings</span>
                </div>
                <h1 className="text-[48px] font-serif italic font-bold text-black leading-tight mb-2">User Profile</h1>
                <div className="h-[0.5px] w-full bg-gradient-to-r from-[var(--color-gold-line)] to-transparent" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-12 bg-white p-10 border-2 border-[#00A4FD] relative overflow-hidden group/form shadow-2xl transition-all duration-700">
                {/* Decorative glow */}
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-[var(--color-gold-faint)] rounded-full blur-[100px] pointer-events-none opacity-20" />

                {message && (
                    <div className={`p-5 border text-[11px] uppercase tracking-wider transition-all duration-500 ${message.type === 'success'
                        ? 'bg-[var(--color-gold-faint)] border-[#0F0C17]/10 text-[#0046EA]'
                        : 'bg-red-900/10 border-red-900/30 text-red-400'
                        }`}>
                        {message.text}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                    {/* Left side: Avatar and Role */}
                    <div className="md:col-span-4 flex flex-col items-center gap-8">
                        <div className="relative group cursor-pointer w-full max-w-[200px]" onClick={handleAvatarClick}>
                            <div className="aspect-square w-full rounded-0 border-2 border-[#D20048] overflow-hidden bg-white relative transition-all duration-700 group-hover:border-[#00A4FD] shadow-xl">
                                <img
                                    src={getAvatarUrl(user.avatar_url, user.full_name)}
                                    alt={user.full_name}
                                    className="w-full h-full object-cover opacity-100 group-hover:scale-105 transition-transform duration-700"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = getAvatarUrl(null, user.full_name);
                                    }}
                                />

                                {uploadingAvatar && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 text-[#0046EA]">
                                        <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}

                                <div className="absolute inset-0 bg-black/0 group-hover:bg-[#00A4FD]/80 transition-all duration-500 flex items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-[2px]">
                                    <span className="text-[10px] uppercase tracking-[.2em] text-white font-bold border-b border-white pb-1">Change Image</span>
                                </div>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>

                        <div className="w-full space-y-2">
                            <span className={labelClasses}>Current Role</span>
                            <div className={readonlyInputClasses}>
                                <span className="uppercase tracking-[.1em] font-medium">{user.role}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right side: User Basic Info */}
                    <div className="md:col-span-8 space-y-8">
                        <div className="grid grid-cols-1 gap-8">
                            <div className="space-y-2">
                                <label className={labelClasses}>Email Address</label>
                                <div className={readonlyInputClasses}>{user.email}</div>
                                <p className="text-[9px] uppercase tracking-widest text-[#0F0C17]/50 mt-2 italic flex items-center gap-2">
                                    <span className="w-1 h-1 rounded-full bg-[var(--color-gold-dim)]" />
                                    Account identity managed by system.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="full_name" className={labelClasses}>Full Name</label>
                                <input
                                    id="full_name"
                                    name="full_name"
                                    className={inputClasses}
                                    defaultValue={user.full_name || ''}
                                    placeholder="Nguyễn Văn A"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="phone_number" className={labelClasses}>Phone Number</label>
                                <input
                                    id="phone_number"
                                    name="phone_number"
                                    className={inputClasses}
                                    defaultValue={user.phone_number || ''}
                                    placeholder="+84 000 000 000"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {(user.role === 'EXPERT' || user.role === 'MENTOR') && (
                    <div className="pt-12 border-t border-[#0F0C17]/10 space-y-12">
                        <div className="flex items-center gap-3">
                            <span className="section-eyebrow-line bg-[var(--color-gold-line)]" />
                            <h2 className="text-[32px] font-serif italic font-bold text-black">
                                {user.role === 'MENTOR' ? 'Mentor Information' : 'Expert Information'}
                            </h2>
                        </div>

                        <div className="space-y-10">
                            <div className="space-y-2">
                                <label htmlFor="bio" className={labelClasses}>Bio / Professional Overview</label>
                                <textarea
                                    id="bio"
                                    name="bio"
                                    defaultValue={user.expert_profile?.bio || ''}
                                    rows={6}
                                    className={`${inputClasses} resize-none min-h-[140px] leading-relaxed`}
                                    placeholder="Describe your expertise and professional journey in detail..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="linkedin_url" className={labelClasses}>LinkedIn Presence</label>
                                <input
                                    id="linkedin_url"
                                    name="linkedin_url"
                                    className={inputClasses}
                                    defaultValue={user.expert_profile?.linkedin_url || ''}
                                    placeholder="https://linkedin.com/in/your-elite-profile"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-2">
                                    <label htmlFor="experience_years" className={labelClasses}>Experience (Years)</label>
                                    <input
                                        id="experience_years"
                                        name="experience_years"
                                        type="number"
                                        className={inputClasses}
                                        defaultValue={user.expert_profile?.experience_years || 0}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="hourly_rate" className={labelClasses}>Hourly Rate (Credits)</label>
                                    <div className="relative">
                                        <input
                                            id="hourly_rate"
                                            name="hourly_rate"
                                            type="number"
                                            className={inputClasses}
                                            defaultValue={user.expert_profile?.hourly_rate || 50}
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] uppercase tracking-widest text-[#0046EA]/80">VND / hr</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="tags" className={labelClasses}>Expertise Tags (Comma separated)</label>
                                <input
                                    id="tags"
                                    name="tags"
                                    className={inputClasses}
                                    defaultValue={user.expert_profile?.tags || ''}
                                    placeholder="Strategic Leadership, Full-Stack Mastery, AI Transformation"
                                />
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {(user.expert_profile?.tags || "").split(',').filter(t => t.trim()).map((tag, i) => (
                                        <span key={i} className="px-3 py-1 bg-[var(--color-gold-faint)] border border-[#0F0C17]/10 text-[#0046EA]/80 text-[9px] uppercase tracking-wider rounded-full">
                                            {tag.trim()}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="pt-12 flex justify-end">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="group relative h-14 px-16 border-2 border-[#00A4FD] rounded-0 bg-transparent text-[#00A4FD] text-[11px] font-black uppercase tracking-[0.5em] transition-all duration-700 hover:bg-[#00A4FD] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--color-gold-faint)] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                        {isSaving ? (
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                                <span>Persisting Data...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4 relative z-10">
                                <span>Save Profile Changes</span>
                                <span className="opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-500">→</span>
                            </div>
                        )}
                    </button>
                </div>

                {/* Corner details */}
                <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none opacity-20">
                    <div className="absolute top-4 right-4 w-[0.5px] h-8 bg-[var(--color-gold-line)]" />
                    <div className="absolute top-4 right-4 w-8 h-[0.5px] bg-[var(--color-gold-line)]" />
                </div>
            </form>

            <p className="mt-8 text-center text-[9px] uppercase tracking-[0.3em] text-[#0F0C17]/30 font-light italic">
                Secure Data Encryption Active • Last verified session: {new Date().toLocaleDateString()}
            </p>
        </div>
    );
}
