"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

export default function BannedAccountPage() {
    const router = useRouter();
    const { user, logout } = useAuthStore();

    useEffect(() => {
        // Auto logout banned users
        if (user && user.account_status === "BANNED") {
            logout();
        }
    }, [user, logout]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                        <svg
                            className="w-8 h-8 text-red-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                            />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Account Permanently Banned
                    </h1>
                    <p className="text-gray-600 mb-4">
                        Your account has been permanently disabled due to violation of Community Standards.
                    </p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                    <h2 className="font-semibold text-red-800 mb-2">Account Status:</h2>
                    <ul className="text-sm text-red-700 space-y-1">
                        <li>• Access to the platform is permanently revoked</li>
                        <li>• All pending appointments have been cancelled</li>
                        <li>• You cannot create a new account with this email</li>
                    </ul>
                </div>

                <div className="text-left mb-6">
                    <p className="text-sm text-gray-600">
                        If you believe this is an error, please contact support at{" "}
                        <a href="mailto:support@careerpath.com" className="text-blue-600 hover:underline">
                            support@careerpath.com
                        </a>
                    </p>
                </div>

                <button
                    onClick={() => router.push("/login")}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded transition"
                >
                    Return to Login
                </button>
            </div>
        </div>
    );
}
