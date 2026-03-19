'use client';

import React from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export default function ExpertKYCPage() {
    const { user, logout } = useAuthStore();
    const router = useRouter();

    if (!user) {
        return <div className="p-8 text-center">Loading...</div>;
    }

    const { expert_profile } = user;
    const status = expert_profile?.kyc_status;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Expert Verification
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
                    {status === 'PENDING' && (
                        <>
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Account Pending Approval</h3>
                            <p className="mt-2 text-sm text-gray-500">
                                Thank you for registering as a Career Expert. Your profile is currently under review by our administrators.
                                You will be able to access the dashboard once your KYC requires are approved.
                            </p>
                            <div className="mt-6">
                                <p className="text-xs text-gray-400">Response time: Usually within 24 hours.</p>
                                <div className="mt-4">
                                    <Button variant="outline" size="sm" onClick={() => router.push('/expert/kyc/form')}>
                                        Edit Application
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}

                    {status === 'REJECTED' && (
                        <>
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Application Rejected</h3>
                            <p className="mt-2 text-sm text-gray-500">
                                Unfortunately, your application to become an Expert has been rejected.
                                Please contact support for more details.
                            </p>
                            <div className="mt-6">
                                <Button onClick={() => router.push('/expert/kyc/form')}>
                                    Re-submit Application
                                </Button>
                            </div>
                        </>
                    )}

                    {status === 'APPROVED' && (
                        <>
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Account Approved!</h3>
                            <p className="mt-2 text-sm text-gray-500">
                                Congratulations! You are now a verified Career Expert.
                            </p>
                            <div className="mt-6">
                                <Button onClick={() => router.push('/dashboard/expert')}>
                                    Go to Dashboard
                                </Button>
                            </div>
                        </>
                    )}

                    {!expert_profile && user.role === 'EXPERT' && (
                        <div className="mt-4">
                            <p className="text-red-500 mb-4">Expert Profile not found. Please submit your details.</p>
                            <Button onClick={() => router.push('/expert/kyc/form')}>
                                Start Application
                            </Button>
                        </div>
                    )}

                    <div className="mt-6 border-t pt-4">
                        <Button variant="outline" onClick={logout} className="w-full">
                            Sign Out
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
