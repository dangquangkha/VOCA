'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

export default function KYCFormPage() {
    const { user, login } = useAuthStore();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isBioExpanded, setIsBioExpanded] = useState(false);
    const [formData, setFormData] = useState({
        bio: '',
        linkedin_url: '',
        experience_years: 0,
        hourly_rate: 50,
        kyc_documents: '',
        tags: ''
    });

    useEffect(() => {
        // Pre-fill if exists
        if (user?.expert_profile) {
            setFormData({
                bio: user.expert_profile.bio || '',
                linkedin_url: user.expert_profile.linkedin_url || '',
                experience_years: user.expert_profile.experience_years || 0,
                hourly_rate: user.expert_profile.hourly_rate || 50,
                kyc_documents: user.expert_profile.kyc_documents || '',
                tags: user.expert_profile.tags || ''
            });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'experience_years' || name === 'hourly_rate' ? Number(value) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // Call PUT /experts/me/kyc
            await api.put('experts/me/kyc', formData);

            // Refresh user to get updated status (PENDING)
            // Or just force redirect
            // Ideally re-fetch /users/me to update store
            const userRes = await api.get('users/me');
            const token = localStorage.getItem('token');
            if (token) {
                login(token, userRes.data);
            }

            router.push('/expert/kyc'); // Redirect to Status Page
        } catch (error) {
            console.error('Failed to submit KYC', error);
            alert('Submission failed. Please check inputs.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Expert Profile Verification</h1>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 shadow rounded-lg">
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-gray-700">Bio / Introduction</label>
                        <button
                            type="button"
                            onClick={() => setIsBioExpanded(!isBioExpanded)}
                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                            {isBioExpanded ? (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                    Thu nhỏ
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                    </svg>
                                    Phóng to
                                </>
                            )}
                        </button>
                    </div>
                    <textarea
                        name="bio"
                        rows={isBioExpanded ? 12 : 4}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 transition-all duration-200"
                        placeholder="Tell us about yourself..."
                        value={formData.bio}
                        onChange={handleChange}
                        required
                    />
                </div>

                <Input
                    label="LinkedIn URL"
                    name="linkedin_url"
                    type="url"
                    placeholder="https://linkedin.com/in/..."
                    value={formData.linkedin_url}
                    onChange={handleChange}
                    required
                />

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Years of Experience"
                        name="experience_years"
                        type="number"
                        min="0"
                        value={formData.experience_years}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        label="Hourly Rate (Credits)"
                        name="hourly_rate"
                        type="number"
                        min="10"
                        step="10"
                        value={formData.hourly_rate}
                        onChange={handleChange}
                        required
                    />
                </div>

                <Input
                    label="Skills / Tags (Comma separated)"
                    name="tags"
                    type="text"
                    placeholder="IT, Marketing, Design"
                    value={formData.tags}
                    onChange={handleChange}
                />

                <div>
                    <label className="block text-sm font-medium text-gray-700">KYC Documents (Link to CV/Certificates)</label>
                    <p className="text-xs text-gray-500 mb-2">Please upload your CV and Certificates to Google Drive/Dropbox and paste the shareable link here.</p>
                    <input
                        name="kyc_documents"
                        type="text"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        placeholder="https://drive.google.com/file/d/..."
                        value={formData.kyc_documents}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="pt-4">
                    <Button type="submit" className="w-full" isLoading={isLoading}>
                        Submit Application
                    </Button>
                </div>
            </form>
        </div>
    );
}
