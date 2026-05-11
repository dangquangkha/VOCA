'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { RoadmapHistory } from '@/types/roadmap';
import { 
    History, 
    ChevronRight, 
    ChevronLeft,
    Calendar, 
    FileText, 
    ArrowLeft,
    Sparkles,
    Trophy,
    Search,
    Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ShinkaiBackground from '@/components/special/ShinkaiBackground';

const EASING = [0.22, 1, 0.36, 1] as any;

export default function RoadmapHistoryPage() {
    const router = useRouter();
    const [histories, setHistories] = useState<RoadmapHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedHistory, setSelectedHistory] = useState<RoadmapHistory | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const { data } = await api.get<RoadmapHistory[]>('roadmap/history');
            setHistories(data);
        } catch (error) {
            console.error("Failed to fetch history", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredHistories = histories.filter(h => 
        new Date(h.created_at).toLocaleDateString('vi-VN').includes(searchQuery)
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] font-dm-sans">
                <div className="flex flex-col items-center gap-8">
                    <div className="w-12 h-12 border-2 border-black/5 border-t-[#0046EA] rounded-full animate-spin" />
                    <p className="text-[10px] text-black/30 font-black tracking-[0.5em] uppercase">ĐANG TRUY XUẤT DI SẢN...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen">
            <ShinkaiBackground imagePath="/roadmap-bg.svg" showFish={true} overlayColor="rgba(255, 255, 255, 0.1)" />
            
            <div className="relative z-10">
                {/* Cinematic Header */}
                <header className="pt-20 pb-32 px-12 relative overflow-hidden">
                    <div className="max-w-7xl mx-auto">
                        <button 
                            onClick={() => router.push('/dashboard/roadmap')}
                            className="flex items-center gap-4 text-[#0046EA]/40 hover:text-[#0046EA] transition-all text-[10px] font-black uppercase tracking-[0.5em] mb-16 group"
                        >
                            <ArrowLeft size={16} className="group-hover:-translate-x-2 transition-transform duration-500" />
                            BACK TO HORIZON
                        </button>
                        
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-12">
                            <div className="space-y-6">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-[1px] bg-[#00A4FD]" />
                                    <span className="text-[10px] text-[#00A4FD] tracking-[0.5em] font-black uppercase">CHRONICLES</span>
                                </div>
                                <h1 className="text-7xl font-garamond italic font-bold text-[#0046EA] tracking-tight leading-none">
                                    Lịch sử di sản
                                </h1>
                            </div>
                            
                            <div className="relative w-full md:w-96 group">
                                <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-[#0046EA]/30 group-focus-within:text-[#00A4FD] transition-colors" size={20} />
                                <input 
                                    type="text"
                                    placeholder="SEARCH ARCHIVES..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white/40 backdrop-blur-md border border-white/60 rounded-full py-6 pl-20 pr-10 text-[#0046EA] text-[11px] font-black tracking-widest focus:outline-none focus:border-[#00A4FD]/40 focus:bg-white/60 transition-all placeholder:text-[#0046EA]/20 uppercase shadow-lg"
                                />
                            </div>
                        </div>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto px-12 -mt-20 pb-32 relative z-20">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                        {/* List of Reports */}
                        <div className="lg:col-span-5 space-y-8">
                            {filteredHistories.length === 0 ? (
                                <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[56px] p-24 text-center space-y-8 shadow-2xl">
                                    <History size={64} className="mx-auto text-[#0046EA]/10" strokeWidth={0.5} />
                                    <p className="text-[11px] font-black text-[#0046EA]/30 uppercase tracking-[0.4em]">ARCHIVE IS EMPTY</p>
                                </div>
                            ) : (
                                filteredHistories.map((h) => (
                                    <motion.div
                                        key={h.id}
                                        initial={{ opacity: 0, x: -30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        onClick={() => setSelectedHistory(h)}
                                        className={`group cursor-pointer bg-white/40 backdrop-blur-xl border p-12 rounded-[48px] transition-all duration-1000 relative overflow-hidden ${
                                            selectedHistory?.id === h.id 
                                                ? 'border-[#00A4FD] shadow-[0_24px_48px_rgba(0,164,253,0.15)] ring-1 ring-[#00A4FD]' 
                                                : 'border-white/60 shadow-xl hover:shadow-2xl hover:border-[#00A4FD]/30'
                                        }`}
                                    >
                                        {selectedHistory?.id === h.id && (
                                            <div className="absolute top-0 right-0 w-48 h-48 bg-white/60 blur-3xl rounded-full -mr-24 -mt-24" />
                                        )}
                                        
                                        <div className="flex items-center justify-between relative z-10">
                                            <div className="flex items-center gap-8">
                                                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-1000 ${
                                                    selectedHistory?.id === h.id ? 'bg-[#0046EA] text-white shadow-lg' : 'bg-white/60 text-[#0046EA]'
                                                }`}>
                                                    <FileText size={28} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-[#0046EA]/30 uppercase tracking-[0.4em] mb-2 font-mono">STATION #{h.id.toString().padStart(3, '0')}</p>
                                                    <h3 className="text-2xl font-garamond italic font-bold text-[#0046EA]">
                                                        {new Date(h.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                    </h3>
                                                </div>
                                            </div>
                                            <ChevronRight 
                                                size={24} 
                                                className={`transition-all duration-1000 ${
                                                    selectedHistory?.id === h.id ? 'text-[#00A4FD] translate-x-3' : 'text-[#0046EA]/10 group-hover:text-[#00A4FD] group-hover:translate-x-2'
                                                }`} 
                                            />
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Detailed Snapshot View */}
                        <div className="lg:col-span-7">
                            <AnimatePresence mode="wait">
                                {selectedHistory ? (
                                    <motion.div
                                        key={selectedHistory.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.8, ease: EASING }}
                                        className="bg-white/50 backdrop-blur-3xl border border-white/70 rounded-[72px] shadow-[0_48px_96px_rgba(0,0,0,0.05)] p-16 md:p-24 space-y-20 min-h-[900px] relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/60 blur-[150px] rounded-full -mr-400 -mt-400 pointer-events-none opacity-50" />
                                        
                                        <header className="flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-4 px-6 py-2 rounded-full bg-[#0046EA]/10 text-[#0046EA] text-[10px] font-black uppercase tracking-[0.2em] w-fit shadow-inner">
                                                    <Trophy size={14} strokeWidth={3} />
                                                    COMPLETED HORIZON
                                                </div>
                                                <h2 className="text-5xl font-garamond italic font-bold text-[#0046EA] tracking-tight">
                                                    Tổng kết Ikigai
                                                </h2>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-[1px] bg-[#00A4FD]" />
                                                    <p className="text-[10px] text-[#0046EA]/40 uppercase tracking-[0.5em] font-black italic">Archived {new Date(selectedHistory.created_at).toLocaleDateString('vi-VN')}</p>
                                                </div>
                                            </div>
                                            
                                            <button className="h-16 px-12 bg-[#0046EA] text-white font-black uppercase tracking-[0.5em] text-[11px] rounded-full shadow-2xl hover:bg-[#00A4FD] hover:scale-105 transition-all duration-500 flex items-center gap-6 group">
                                                EXCELSIOR PDF <Download size={20} className="group-hover:translate-y-1 transition-transform" />
                                            </button>
                                        </header>

                                        <div className="space-y-10 relative z-10">
                                            {Object.entries(selectedHistory.snapshot_data)
                                                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                                                .map(([day, data]: [string, any]) => (
                                                <div key={day} className="group p-12 bg-white/40 border border-white/60 rounded-[48px] hover:border-[#00A4FD]/30 hover:bg-white/60 transition-all duration-1000 shadow-sm">
                                                    <div className="flex items-start gap-12">
                                                        <div className="w-16 h-16 rounded-3xl bg-white text-[#0046EA] shadow-xl flex items-center justify-center font-garamond italic font-bold text-2xl group-hover:scale-110 transition-transform duration-700">
                                                            {day}
                                                        </div>
                                                        <div className="flex-1 space-y-6">
                                                            <div className="flex items-center justify-between border-b border-[#0046EA]/5 pb-6">
                                                                <h4 className="text-2xl font-garamond italic font-bold text-[#0046EA]">
                                                                    {data.topic}
                                                                </h4>
                                                                <span className="text-[9px] font-black text-[#0046EA]/20 uppercase tracking-widest font-mono">RECORDED {new Date(data.completed_at).toLocaleDateString('vi-VN')}</span>
                                                            </div>
                                                            <p className="text-[#0046EA]/60 text-xl font-garamond italic leading-relaxed">
                                                                "{typeof data.content === 'object' ? data.content.text : data.content}"
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <footer className="pt-24 border-t border-[#0046EA]/5 text-center">
                                            <div className="inline-flex items-center gap-8 text-[11px] font-black text-[#0046EA]/20 uppercase tracking-[0.6em]">
                                                <Sparkles size={18} className="text-[#00A4FD] animate-pulse" />
                                                END OF ARCHIVE
                                                <Sparkles size={18} className="text-[#00A4FD] animate-pulse" />
                                            </div>
                                        </footer>
                                    </motion.div>
                                ) : (
                                    <div className="h-full min-h-[700px] flex flex-col items-center justify-center text-center p-24 bg-white/20 backdrop-blur-xl rounded-[80px] border-2 border-dashed border-white/60 opacity-60">
                                        <div className="w-28 h-28 bg-white/60 rounded-[40px] flex items-center justify-center text-[#0046EA] mb-12 shadow-2xl">
                                            <History size={48} strokeWidth={1} />
                                        </div>
                                        <h3 className="text-3xl font-garamond italic font-bold text-[#0046EA] mb-6">Khai phá dòng thời gian</h3>
                                        <p className="text-[11px] font-black text-[#0046EA]/30 uppercase tracking-[0.5em] max-w-sm leading-loose">CHỌN MỘT BẢN LƯU DI SẢN ĐỂ TIẾP TỤC HÀNH TRÌNH TƯ DUY</p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </main>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(0, 70, 234, 0.1);
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
}
