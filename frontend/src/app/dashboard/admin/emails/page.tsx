"use client";

import { useEffect, useState, Fragment } from 'react';
import { adminService, EmailLog } from '@/services/adminService';
import { useAuthStore } from '@/store/useAuthStore';

export default function EmailLogsPage() {
    const { token } = useAuthStore();
    const [emails, setEmails] = useState<EmailLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<number | null>(null);

    useEffect(() => {
        if (!token) return;
        const fetchEmails = async () => {
            try {
                const data = await adminService.getEmailLogs();
                setEmails(data);
            } catch (error) {
                console.error("Failed to fetch email logs", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEmails();
    }, [token]);

    const toggleExpand = (id: number) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <div className="max-w-[1400px] mx-auto px-8 py-12">
            <div className="bg-white rounded-xl shadow-2xl border border-[#0F0C17]/10 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-white text-[#0F0C17]/50 border-b border-[#0F0C17]/10">
                        <tr>
                            <th className="px-6 py-3 font-semibold">Sent At</th>
                            <th className="px-6 py-3 font-semibold">To</th>
                            <th className="px-6 py-3 font-semibold">Subject</th>
                            <th className="px-6 py-3 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={4} className="px-6 py-8 text-center">Loading...</td></tr>
                        ) : emails.length === 0 ? (
                            <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No emails sent yet.</td></tr>
                        ) : (
                            emails.map((email) => (
                                <Fragment key={email.id}>
                                    <tr
                                        className="border-b border-[#0F0C17]/10 hover:bg-white transition-colors cursor-pointer group"
                                        onClick={() => toggleExpand(email.id)}
                                    >
                                        <td className="px-6 py-3 text-gray-600">
                                            {new Date(email.sent_at).toLocaleString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-3 font-medium text-gray-800">{email.to_email}</td>
                                        <td className="px-6 py-3 text-gray-800">{email.subject}</td>
                                        <td className="px-6 py-3 text-right">
                                            <button className="text-blue-600 hover:underline text-xs">
                                                {expandedId === email.id ? 'Collapse' : 'View Body'}
                                            </button>
                                        </td>
                                    </tr>
                                    {expandedId === email.id && (
                                        <tr className="bg-[#0046EA]/5/30">
                                            <td colSpan={4} className="px-6 py-6 transition-all duration-700">
                                                <div className="bg-white p-6 border border-[#0F0C17]/10 rounded-sm font-mono text-xs whitespace-pre-wrap text-[#0F0C17]/60 shadow-inner">
                                                    {email.body}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
