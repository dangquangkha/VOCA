"use client";

import { useEffect, useState, use } from 'react';
import { bookingService } from '@/services/bookingService';
import { Booking } from '@/types/booking';
import { useAuthStore } from '@/store/useAuthStore';
import { 
    Calendar, 
    Clock, 
    User, 
    Shield, 
    MapPin, 
    CreditCard, 
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    XCircle,
    MessageSquare,
    Info
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function AdminBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { token } = useAuthStore();
    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBooking = async () => {
            if (!token) return;
            try {
                // We'll reuse getBookings and filter for now, 
                // but usually we'd have a specific getBookingById for admin
                const all = await bookingService.getBookings();
                const found = all.find(b => b.id === parseInt(id));
                if (found) {
                    setBooking(found);
                } else {
                    setError("Booking not found or not accessible.");
                }
            } catch (err) {
                console.error("Failed to fetch booking detail", err);
                setError("Error loading booking details.");
            } finally {
                setLoading(false);
            }
        };

        fetchBooking();
    }, [id, token]);

    if (loading) return (
        <div className="min-h-screen bg-[#0046EA]/5 flex items-center justify-center">
            <div className="w-8 h-8 border-t-2 border-[#0046EA] rounded-full animate-spin" />
        </div>
    );

    if (error || !booking) return (
        <div className="min-h-screen bg-[#0046EA]/5 p-8 flex flex-col items-center justify-center text-center">
            <AlertCircle className="w-16 h-16 text-rose-500 mb-6 opacity-20" />
            <h1 className="text-2xl font-serif italic text-[#0F0C17] mb-4">{error || "Strategic Record Unavailable"}</h1>
            <Link href="/dashboard/admin/disputes" className="text-[#0046EA] uppercase text-[10px] tracking-widest hover:underline">
                Return to Resolution Center
            </Link>
        </div>
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5';
            case 'CANCELLED': 
            case 'REJECTED': return 'text-rose-400 border-rose-400/20 bg-rose-400/5';
            case 'CONFIRMED': return 'text-sky-400 border-sky-400/20 bg-sky-400/5';
            case 'DISPUTED': return 'text-[#0046EA]-400 border-amber-400/20 bg-amber-400/5';
            default: return 'text-slate-400 border-slate-400/20 bg-slate-400/5';
        }
    };

    return (
        <div className="min-h-screen bg-[#0046EA]/5 p-8 font-sans">
            <header className="mb-12">
                <Link 
                    href="/dashboard/admin/disputes" 
                    className="flex items-center gap-2 text-[#0F0C17]/50 hover:text-[#0046EA] transition-colors mb-6 text-[10px] uppercase tracking-widest"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Disputes
                </Link>
                <div className="flex justify-between items-end">
                    <div className="space-y-4">
                        <h1 className="text-3xl font-serif italic text-[#0F0C17]">Booking Protocol #{booking.id}</h1>
                        <div className="flex items-center gap-4">
                            <span className="w-12 h-[0.5px] bg-[#0F0C17]/10" />
                            <p className="text-[10px] font-sans uppercase tracking-[0.4em] text-[#0046EA]/80">System Internal Audit • High Priority Access</p>
                        </div>
                    </div>
                    <div className={`px-6 py-2 border rounded-full text-[10px] uppercase tracking-[0.2em] font-bold ${getStatusColor(booking.status)}`}>
                        {booking.status}
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-12 gap-8">
                {/* Core Data */}
                <div className="col-span-12 lg:col-span-8 space-y-8">
                    {/* Session Timeline */}
                    <section className="bg-white border border-[#0F0C17]/10 p-8 rounded-sm">
                        <h3 className="text-[11px] font-sans uppercase tracking-[0.3em] text-[#0F0C17]/50 mb-8 flex items-center gap-2">
                            <Clock className="w-4 h-4" /> Temporal Intelligence
                        </h3>
                        <div className="grid grid-cols-2 gap-12">
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-[#0F0C17]/30 mb-2">Start Time</p>
                                <p className="text-xl font-serif text-[#0F0C17]">
                                    {format(new Date(booking.start_time), 'HH:mm, EEEE dd/MM', { locale: vi })}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-[#0F0C17]/30 mb-2">End Time</p>
                                <p className="text-xl font-serif text-[#0F0C17]">
                                    {format(new Date(booking.end_time), 'HH:mm, EEEE dd/MM', { locale: vi })}
                                </p>
                            </div>
                        </div>
                        
                        <div className="mt-12 pt-12 border-t border-[#0F0C17]/10 grid grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <p className="text-[10px] uppercase tracking-widest text-[#0F0C17]/30">Student Check-in</p>
                                {booking.student_checked_in_at ? (
                                    <div className="flex items-center gap-2 text-emerald-400 text-sm">
                                        <CheckCircle2 className="w-4 h-4" /> {format(new Date(booking.student_checked_in_at), 'HH:mm:ss')}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-[#0F0C17]/30 text-sm italic">
                                        <Info className="w-4 h-4" /> No record
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] uppercase tracking-widest text-[#0F0C17]/30">Expert Check-in</p>
                                {booking.expert_checked_in_at ? (
                                    <div className="flex items-center gap-2 text-emerald-400 text-sm">
                                        <CheckCircle2 className="w-4 h-4" /> {format(new Date(booking.expert_checked_in_at), 'HH:mm:ss')}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-[#0F0C17]/30 text-sm italic">
                                        <Info className="w-4 h-4" /> No record
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Communication & Notes */}
                    <section className="bg-white border border-[#0F0C17]/10 p-8 rounded-sm">
                        <h3 className="text-[11px] font-sans uppercase tracking-[0.3em] text-[#0F0C17]/50 mb-8 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" /> Field Communications
                        </h3>
                        <div className="space-y-8">
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-[#0046EA]/80 mb-3">Student Note</p>
                                <div className="p-4 bg-[#0046EA]/5 border border-[#0F0C17]/10 rounded-sm text-sm text-[#0F0C17]/70 font-light leading-relaxed">
                                    {booking.student_note || "No specific instructions provided by the student."}
                                </div>
                            </div>
                            {booking.expert_note && (
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-[#0046EA]/80 mb-3">Expert Response/Note</p>
                                    <div className="p-4 bg-[#0046EA]/5 border border-[#0F0C17]/10 rounded-sm text-sm text-[#0F0C17]/70 font-light leading-relaxed">
                                        {booking.expert_note}
                                    </div>
                                </div>
                            )}
                            {booking.meeting_url && (
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-[#0046EA]/80 mb-3">Meeting Infrastructure</p>
                                    <a 
                                        href={booking.meeting_url} 
                                        target="_blank" 
                                        className="inline-flex items-center gap-3 px-6 py-3 bg-[#0046EA]/5 border border-[#0F0C17]/10 text-[#0046EA] text-xs rounded-sm hover:bg-[#0046EA]/80 hover:text-white transition-all"
                                    >
                                        <MapPin className="w-4 h-4" /> Join Strategic Session
                                    </a>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* Participants & Financials */}
                <div className="col-span-12 lg:col-span-4 space-y-8">
                    {/* Involved Parties */}
                    <section className="bg-white border border-[#0F0C17]/10 p-8 rounded-sm">
                        <h3 className="text-[11px] font-sans uppercase tracking-[0.3em] text-[#0F0C17]/50 mb-8">Asset Profile</h3>
                        
                        <div className="space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#0046EA] border border-[#0F0C17]/10">
                                    <User className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[9px] uppercase tracking-[0.2em] text-[#0F0C17]/30 mb-1">Student / Client</p>
                                    <p className="text-sm text-[#0F0C17]">{booking.student?.full_name || "Unknown Student"}</p>
                                    <p className="text-[10px] text-[#0F0C17]/50">{booking.student?.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-[#0046EA]/5 flex items-center justify-center text-[#0046EA] border border-[#0F0C17]/10">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[9px] uppercase tracking-[0.2em] text-[#0F0C17]/30 mb-1">Expert / Specialist</p>
                                    <p className="text-sm text-[#0F0C17]">{booking.expert?.user?.full_name || "Unknown Expert"}</p>
                                    <p className="text-[10px] text-[#0F0C17]/50">{booking.expert?.user?.email}</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Financial Audit */}
                    <section className="bg-white border border-[#0F0C17]/10 p-8 rounded-sm">
                        <h3 className="text-[11px] font-sans uppercase tracking-[0.3em] text-[#0F0C17]/50 mb-8">Financial Ledger</h3>
                        
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-3 border-b border-white/5">
                                <span className="text-xs text-[#0F0C17]/50">Base Valuation</span>
                                <span className="text-sm text-[#0F0C17] font-serif italic">{booking.total_amount.toLocaleString()} Credits</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-white/5">
                                <span className="text-xs text-[#0F0C17]/50">Platform Protocol</span>
                                <span className="text-sm text-[#0F0C17]/50 italic">20% Logic</span>
                            </div>
                            <div className="flex justify-between items-center pt-4">
                                <span className="text-[10px] uppercase tracking-[0.2em] text-[#0046EA]">Total Secured</span>
                                <span className="text-2xl font-serif text-[#0046EA]">{booking.total_amount.toLocaleString()} <span className="text-[10px] uppercase tracking-widest font-sans ml-1">Voca</span></span>
                            </div>
                        </div>
                        
                        <div className="mt-8 p-4 bg-[#0046EA]/5 rounded-sm border border-[#0F0C17]/10 flex items-start gap-3">
                            <CreditCard className="w-4 h-4 text-[#0046EA]/80 mt-1" />
                            <p className="text-[10px] text-[#0F0C17]/50 leading-relaxed italic">
                                Credits are currently held in system escrow. Final release occurs upon administrative resolution or session completion.
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
