"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

export default function SuspendedAccountPage() {
    const router = useRouter();
    const { user, logout } = useAuthStore();

    useEffect(() => {
        // If not suspended, redirect away
        if (!user || user.account_status !== "SUSPENDED") {
            router.push("/dashboard");
        }
    }, [user, router]);

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    if (!user || user.account_status !== "SUSPENDED") {
        return null;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
                        <svg
                            className="w-8 h-8 text-yellow-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Account Temporarily Suspended
                    </h1>
                    <p className="text-gray-600 mb-4">
                        Your account has been temporarily suspended due to a violation of our terms of service.
                    </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
                    <h2 className="font-semibold text-yellow-800 mb-2">What this means:</h2>
                    <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• Your profile is hidden from search results</li>
                        <li>• You cannot receive new bookings</li>
                        <li>• Your wallet is temporarily frozen</li>
                        <li>• All pending appointments have been cancelled</li>
                    </ul>
                </div>

                <div className="text-left mb-6">
                    <h3 className="font-semibold text-gray-800 mb-2">Next Steps:</h3>
                    <p className="text-sm text-gray-600">
                        If you believe this is a mistake or would like to appeal, please contact us at{" "}
                        <a href="mailto:admin@careerpath.com" className="text-blue-600 hover:underline">
                            admin@careerpath.com
                        </a>
                    </p>
                </div>

                <button
                    onClick={handleLogout}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded transition"
                >
                    Log Out
                </button>
            </div>
        </div>
    );
}
