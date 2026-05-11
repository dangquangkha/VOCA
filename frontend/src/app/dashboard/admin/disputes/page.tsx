"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { bookingService } from '@/services/bookingService';
import { BookingDispute } from '@/types/booking';
import { useAuthStore } from '@/store/useAuthStore';
import { 
    AlertCircle, 
    Clock, 
    CheckCircle2, 
    XCircle, 
    ExternalLink, 
    MessageSquare,
    User as UserIcon,
    Calendar,
    ChevronRight,
    RefreshCw,
    ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function AdminDisputesPage() {
    const { token } = useAuthStore();
    const [disputes, setDisputes] = useState<BookingDispute[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'RESOLVED' | 'REJECTED'>('ALL');
    const [selectedDispute, setSelectedDispute] = useState<BookingDispute | null>(null);
    const [adminNote, setAdminNote] = useState('');
    const [updating, setUpdating] = useState(false);
    const [mounted, setMounted] = useState(false);

    const fetchDisputes = async () => {
        setLoading(true);
        try {
            const data = await bookingService.getAllDisputes();
            setDisputes(data);
        } catch (error) {
            console.error("Failed to fetch disputes", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setMounted(true);
        if (token) fetchDisputes();
    }, [token]);

    const handleUpdateStatus = async (disputeId: number, status: 'RESOLVED' | 'REJECTED') => {
        setUpdating(true);
        try {
            await bookingService.updateDisputeStatus(disputeId, status, adminNote);
            await fetchDisputes();
            setSelectedDispute(null);
            setAdminNote('');
            alert('Cập nhật trạng thái khiếu nại thành công');
        } catch (error) {
            console.error("Failed to update dispute", error);
            alert('Có lỗi xảy ra khi cập nhật');
        } finally {
            setUpdating(false);
        }
    };

    const filteredDisputes = disputes.filter(d => 
        filter === 'ALL' ? true : d.status === filter
    );

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'PENDING': return 'text-[#0046EA]-400 bg-amber-400/10 border-amber-400/20';
            case 'RESOLVED': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
            case 'REJECTED': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
            default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
        }
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-[#0046EA]/5 p-8 font-sans">
            <Link 
                href="/dashboard/admin" 
                className="flex items-center gap-2 text-[#0F0C17]/50 hover:text-[#0046EA] transition-colors mb-6 text-[10px] uppercase tracking-widest"
            >
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>

            <header className="mb-12 flex justify-between items-end">
                <div className="space-y-4">
                    <h1 className="text-3xl font-serif italic text-[#0F0C17]">Resolution Center</h1>
                    <div className="flex items-center gap-4">
                        <span className="w-12 h-[0.5px] bg-[#0F0C17]/10" />
                        <p className="text-[10px] font-sans uppercase tracking-[0.4em] text-[#0046EA]/80">Dispute Protocol • Monitoring Active Complaints</p>
                    </div>
                </div>
                <button 
                    onClick={fetchDisputes}
                    className="p-3 rounded-full border border-[#0F0C17]/10 text-[#0F0C17]/50 hover:text-[#0046EA] transition-colors group"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </header>

            <div className="flex gap-4 mb-8">
                {['ALL', 'PENDING', 'RESOLVED', 'REJECTED'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f as any)}
                        className={`px-6 py-2 text-[10px] uppercase tracking-widest border transition-all duration-300 ${
                            filter === f 
                            ? 'border-[#0046EA] text-[#0046EA] bg-[#0046EA]/5' 
                            : 'border-[#0F0C17]/10 text-[#0F0C17]/50 hover:border-[#0F0C17]/30'
                        }`}
                    >
                        {f === 'ALL' ? 'Tất cả' : f}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* List Column */}
                <div className="col-span-12 lg:col-span-7 space-y-4">
                    {loading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="h-32 bg-white border border-[#0F0C17]/10 animate-pulse rounded-sm" />
                        ))
                    ) : filteredDisputes.length === 0 ? (
                        <div className="p-20 text-center bg-white border border-dashed border-[#0F0C17]/10 rounded-sm">
                            <AlertCircle className="w-12 h-12 text-[#0F0C17]/10 mx-auto mb-4" />
                            <p className="text-[#0F0C17]/50 uppercase tracking-widest text-xs">No disputes found</p>
                        </div>
                    ) : (
                        filteredDisputes.map((dispute) => (
                            <div 
                                key={dispute.id}
                                onClick={() => setSelectedDispute(dispute)}
                                className={`p-6 bg-white border cursor-pointer transition-all duration-300 group ${
                                    selectedDispute?.id === dispute.id 
                                    ? 'border-[#0F0C17]/10 shadow-[0_0_20px_rgba(212,175,55,0.1)]' 
                                    : 'border-[#0F0C17]/10 hover:border-[#0F0C17]/30'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`px-3 py-1 rounded-full text-[9px] uppercase tracking-tighter border font-medium ${getStatusStyle(dispute.status)}`}>
                                            {dispute.status}
                                        </div>
                                        <span className="text-[#0F0C17]/30 text-[10px]">#{dispute.id}</span>
                                    </div>
                                    <span className="text-[10px] text-[#0F0C17]/50">
                                        {format(new Date(dispute.created_at), 'HH:mm, dd MMM yyyy', { locale: vi })}
                                    </span>
                                </div>
                                <h3 className="text-[#0F0C17] font-medium mb-2 group-hover:text-[#0046EA] transition-colors line-clamp-1">
                                    {dispute.reason}
                                </h3>
                                <p className="text-xs text-[#0F0C17]/50 line-clamp-2 font-light leading-relaxed">
                                    {dispute.description}
                                </p>
                            </div>
                        ))
                    )}
                </div>

                {/* Detail Column */}
                <div className="col-span-12 lg:col-span-5">
                    {selectedDispute ? (
                        <div className="sticky top-8 space-y-6">
                            <div className="bg-white border border-[#0F0C17]/10 p-8 rounded-sm">
                                <h2 className="text-xl font-serif italic text-[#0046EA] mb-8">Dispute Intelligence</h2>
                                
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <UserIcon className="w-4 h-4 text-[#0046EA]/80 mt-1" />
                                        <div>
                                            <p className="text-[10px] uppercase tracking-widest text-[#0F0C17]/50 mb-1">Reporter</p>
                                            <p className="text-sm text-[#0F0C17] font-light">{selectedDispute.user?.full_name} ({selectedDispute.user?.email})</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <Calendar className="w-4 h-4 text-[#0046EA]/80 mt-1" />
                                        <div>
                                            <p className="text-[10px] uppercase tracking-widest text-[#0F0C17]/50 mb-1">Related Booking</p>
                                            <p className="text-sm text-[#0F0C17] font-light">#{selectedDispute.booking_id} • Status: {selectedDispute.booking?.status}</p>
                                            <Link 
                                                href={`/dashboard/admin/bookings/${selectedDispute.booking_id}`}
                                                className="text-[10px] text-[#0046EA] flex items-center gap-1 mt-2 hover:underline"
                                            >
                                                View Booking Protocol <ExternalLink className="w-3 h-3" />
                                            </Link>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-[#0F0C17]/10">
                                        <p className="text-[10px] uppercase tracking-widest text-[#0F0C17]/50 mb-4">Official Statement</p>
                                        <div className="p-4 bg-[#0046EA]/5 border border-[#0F0C17]/10 rounded-sm italic text-xs text-[#0F0C17]/70 leading-loose">
                                            "{selectedDispute.description}"
                                        </div>
                                    </div>

                                    {selectedDispute.status === 'PENDING' ? (
                                        <div className="pt-6 border-t border-[#0F0C17]/10 space-y-4">
                                            <p className="text-[10px] uppercase tracking-widest text-[#0F0C17]/50">Administrative Action</p>
                                            <textarea 
                                                value={adminNote}
                                                onChange={(e) => setAdminNote(e.target.value)}
                                                placeholder="Enter resolution notes..."
                                                className="w-full h-32 bg-[#0046EA]/5 border border-[#0F0C17]/10 rounded-sm p-4 text-xs text-[#0F0C17] focus:border-[#0046EA] outline-none transition-all placeholder:text-[#0F0C17]/30"
                                            />
                                            <div className="grid grid-cols-2 gap-4">
                                                <button
                                                    disabled={updating}
                                                    onClick={() => handleUpdateStatus(selectedDispute.id, 'RESOLVED')}
                                                    className="py-3 bg-[#0046EA] text-white text-[10px] uppercase tracking-widest font-bold hover:bg-[#0046EA]/90 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" /> Resolve
                                                </button>
                                                <button
                                                    disabled={updating}
                                                    onClick={() => handleUpdateStatus(selectedDispute.id, 'REJECTED')}
                                                    className="py-3 border border-rose-500/50 text-rose-500 text-[10px] uppercase tracking-widest hover:bg-rose-500/10 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <XCircle className="w-4 h-4" /> Reject
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="pt-6 border-t border-[#0F0C17]/10">
                                            <p className="text-[10px] uppercase tracking-widest text-[#0F0C17]/50 mb-4">Admin Note</p>
                                            <div className="p-4 bg-[#0046EA]/5 border border-[#0F0C17]/10 rounded-sm text-xs text-[#0046EA]">
                                                {selectedDispute.admin_note || 'No notes provided.'}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full border border-dashed border-[#0F0C17]/10 rounded-sm flex flex-col items-center justify-center p-12 text-center">
                            <MessageSquare className="w-12 h-12 text-[#0F0C17]/10 mb-6 opacity-20" />
                            <h3 className="text-[11px] font-sans uppercase tracking-[0.4em] text-[#0F0C17]/30">Select intelligence record to view analysis</h3>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
