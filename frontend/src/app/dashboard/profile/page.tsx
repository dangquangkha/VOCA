'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';

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
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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

    const handleSubmit = async (e: React.FormEvent) => {
        if (!user) return;
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);

        const formData = new FormData(e.target as HTMLFormElement);
        const phone = formData.get('phone_number') as string;

        // Basic phone validation (10-11 digits)
        const phoneRegex = /^[0-9]{10,11}$/;
        if (!phoneRegex.test(phone)) {
            setMessage({ type: 'error', text: 'Phone number must be 10-11 digits.' });
            setIsSaving(false);
            return;
        }

        const updateData = {
            full_name: formData.get('full_name'),
            phone_number: phone,
            avatar_url: formData.get('avatar_url'),
        };

        try {
            // Update User Info
            const { data } = await api.put('users/me', updateData);

            // Update Expert Info if applicable
            if (user.role === 'EXPERT') {
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
            await fetchProfile();
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

    if (isLoading) return <div className="text-center py-10">Loading profile...</div>;
    if (!user) return null;

    return (
        <div className="max-w-2xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold mb-6">User Profile</h1>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 shadow rounded-lg">
                {message && (
                    <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className="p-2 bg-gray-100 rounded-md text-gray-600">
                        {user.email}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed directly.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <div className="p-2 bg-gray-100 rounded-md text-gray-600 uppercase text-sm font-bold">
                        {user.role}
                    </div>
                </div>

                <Input
                    label="Full Name"
                    name="full_name"
                    defaultValue={user.full_name || ''}
                    placeholder="Enter your full name"
                />

                <Input
                    label="Phone Number"
                    name="phone_number"
                    defaultValue={user.phone_number || ''}
                    placeholder="Enter your phone number (10-11 digits)"
                    required
                />

                {user.role === 'EXPERT' && (
                    <div className="space-y-6 pt-4 border-t border-gray-100">
                        <h2 className="text-lg font-bold text-blue-600">Expert Information</h2>

                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700">Bio / Giới thiệu</label>
                            <textarea
                                name="bio"
                                defaultValue={user.expert_profile?.bio || ''}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                                placeholder="Tell students about your expertise..."
                            />
                        </div>

                        <Input
                            label="LinkedIn URL"
                            name="linkedin_url"
                            defaultValue={user.expert_profile?.linkedin_url || ''}
                            placeholder="https://linkedin.com/in/yourprofile"
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Exp Years"
                                name="experience_years"
                                type="number"
                                defaultValue={user.expert_profile?.experience_years || 0}
                            />
                            <Input
                                label="Hourly Rate (VNĐ)"
                                name="hourly_rate"
                                type="number"
                                defaultValue={user.expert_profile?.hourly_rate || 0}
                            />
                        </div>

                        <Input
                            label="Tags (Comma separated)"
                            name="tags"
                            defaultValue={user.expert_profile?.tags || ''}
                            placeholder="Frontend, Career Coaching, Finance"
                        />
                    </div>
                )}

                <Input
                    label="Avatar URL"
                    name="avatar_url"
                    defaultValue={user.avatar_url || ''}
                    placeholder="https://example.com/avatar.jpg"
                />

                <div className="pt-4">
                    <Button type="submit" isLoading={isSaving}>
                        Save Changes
                    </Button>
                </div>
            </form>
        </div>
    );
}
