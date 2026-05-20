'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { RoadmapHistory } from '@/types/roadmap';
import { 
    History, 
    ChevronRight, 
    Calendar, 
    FileText, 
    ArrowLeft,
    Sparkles,
    Trophy,
    Search,
    Download,
    Clock,
    Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ShinkaiBackground from '@/components/special/ShinkaiBackground';
import { useToastStore } from '@/store/useToastStore';

const EASING = [0.22, 1, 0.36, 1] as any;

export default function RoadmapHistoryPage() {
    const router = useRouter();
    const { addToast } = useToastStore();
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
            if (data.length > 0) {
                setSelectedHistory(data[0]);
            }
        } catch (error) {
            console.error("Failed to fetch history", error);
            addToast("Không thể tải lịch sử di sản. Vui lòng thử lại.", "error");
        } finally {
            setLoading(false);
        }
    };

    const filteredHistories = histories.filter(h => {
        const dateStr = new Date(h.created_at).toLocaleDateString('vi-VN');
        return dateStr.includes(searchQuery);
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-8">
                    <div className="w-12 h-12 border-2 border-black/5 border-t-[#0046EA] rounded-full animate-spin" />
                    <p className="text-[10px] text-[#0046EA]/40 font-black tracking-[0.5em] uppercase">ĐANG TRUY XUẤT DI SẢN...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-white font-dm-sans selection:bg-[#0046EA]/10">
            {/* Ambient Background - Adjusted for Light Mode */}
            <ShinkaiBackground 
                imagePath="/roadmap-bg.svg" 
                showFish={true} 
                overlayColor="rgba(255, 255, 255, 0.92)" 
            />
            
            <div className="relative z-10 flex flex-col h-screen overflow-hidden">
                {/* Fixed Top Header */}
                <header className="p-12 md:px-20 flex items-center justify-between border-b border-[#0046EA]/5 bg-white/40 backdrop-blur-3xl">
                    <div className="flex items-center gap-12">
                        <button 
                            onClick={() => router.push('/dashboard/roadmap')}
                            className="w-14 h-14 bg-[#0046EA] text-white flex items-center justify-center hover:bg-[#00A4FD] transition-all duration-500 shadow-xl"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        
                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-8 h-[1px] bg-[#00A4FD]" />
                                <span className="text-[10px] text-[#00A4FD] tracking-[0.5em] font-black uppercase">Archive</span>
                            </div>
                            <h1 className="text-4xl font-garamond italic font-bold text-[#0046EA] tracking-tight">
                                Biên niên sử hành trình
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="relative w-80 group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#0046EA]/20 group-focus-within:text-[#00A4FD] transition-colors" size={16} />
                            <input 
                                type="text"
                                placeholder="TÌM THEO NGÀY..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/60 border border-[#0046EA]/10 py-4 pl-14 pr-8 text-[#0046EA] text-[10px] font-black tracking-widest focus:outline-none focus:border-[#00A4FD]/40 transition-all placeholder:text-[#0046EA]/10 uppercase"
                            />
                        </div>
                    </div>
                </header>

                {/* Main Split Layout */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Sidebar: List of entries */}
                    <aside className="w-1/3 border-r border-[#0046EA]/5 flex flex-col bg-white/20 backdrop-blur-xl overflow-hidden">
                        <div className="p-8 border-b border-[#0046EA]/5 flex items-center justify-between">
                            <span className="text-[9px] font-black text-[#0046EA]/30 uppercase tracking-[0.3em]">
                                {filteredHistories.length} ENTRIES FOUND
                            </span>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                            {filteredHistories.length === 0 ? (
                                <div className="p-12 text-center space-y-4 opacity-40">
                                    <History size={48} className="mx-auto mb-4" strokeWidth={1} />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Không có bản lưu nào</p>
                                </div>
                            ) : (
                                filteredHistories.map((h) => (
                                    <button
                                        key={h.id}
                                        onClick={() => setSelectedHistory(h)}
                                        className={`w-full text-left p-8 border transition-all duration-700 relative overflow-hidden group ${
                                            selectedHistory?.id === h.id 
                                                ? 'bg-[#0046EA] border-[#0046EA] shadow-2xl' 
                                                : 'bg-white/40 border-transparent hover:bg-white/80'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between relative z-10">
                                            <div className="flex items-center gap-6">
                                                <div className={`w-12 h-12 flex items-center justify-center transition-colors duration-700 ${
                                                    selectedHistory?.id === h.id ? 'text-white/40' : 'text-[#0046EA]/20'
                                                }`}>
                                                    <FileText size={24} />
                                                </div>
                                                <div>
                                                    <p className={`text-[8px] font-black tracking-[0.3em] uppercase mb-1 transition-colors ${
                                                        selectedHistory?.id === h.id ? 'text-white/40' : 'text-[#0046EA]/20'
                                                    }`}>
                                                        {h.snapshot_data.type === "MBTI_REPORT" ? "MBTI Analysis" : "Roadmap Legacy"}
                                                    </p>
                                                    <h3 className={`text-xl font-garamond italic font-bold transition-colors ${
                                                        selectedHistory?.id === h.id ? 'text-white' : 'text-[#0046EA]'
                                                    }`}>
                                                        {new Date(h.created_at).toLocaleDateString('vi-VN', { 
                                                            day: '2-digit', 
                                                            month: 'long', 
                                                            year: 'numeric'
                                                        })}
                                                    </h3>
                                                </div>
                                            </div>
                                            <ChevronRight 
                                                size={16} 
                                                className={`transition-all duration-700 ${
                                                    selectedHistory?.id === h.id ? 'text-white translate-x-2' : 'text-[#0046EA]/10 group-hover:translate-x-1'
                                                }`} 
                                            />
                                        </div>
                                        
                                        {/* Background Decor */}
                                        {selectedHistory?.id === h.id && (
                                            <motion.div 
                                                layoutId="active-bg"
                                                className="absolute inset-0 bg-gradient-to-r from-transparent to-white/5"
                                            />
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    </aside>

                    {/* Right Content Area: Detailed Snapshot */}
                    <main className="flex-1 bg-white/10 backdrop-blur-sm overflow-y-auto custom-scrollbar p-12 md:p-20">
                        <AnimatePresence mode="wait">
                            {selectedHistory ? (
                                <motion.div
                                    key={selectedHistory.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.8, ease: EASING }}
                                    className="max-w-4xl mx-auto space-y-24"
                                >
                                    {/* Report Header */}
                                    <div className="space-y-12 pb-16 border-b border-[#0046EA]/5">
                                        <div className="flex items-center gap-6">
                                            <div className="px-6 py-2 bg-[#0046EA] text-white text-[9px] font-black uppercase tracking-[0.4em]">
                                                {selectedHistory.snapshot_data.type === "MBTI_REPORT" ? "MBTI Analysis" : "Roadmap Legacy"}
                                            </div>
                                            <div className="flex items-center gap-3 text-[#0046EA]/40 text-[9px] font-black uppercase tracking-widest">
                                                <Clock size={12} />
                                                Lưu lúc: {new Date(selectedHistory.created_at).toLocaleTimeString('vi-VN')}
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-6">
                                            <h2 className="text-7xl font-garamond italic font-bold text-[#0046EA] leading-none tracking-tight">
                                                {selectedHistory.snapshot_data.type === "MBTI_REPORT" 
                                                    ? "Kết quả Trắc nghiệm MBTI" 
                                                    : "Tổng kết Hành trình Ikigai"}
                                            </h2>
                                            <p className="text-xl font-garamond italic text-[#0046EA]/60 max-w-2xl leading-relaxed">
                                                {selectedHistory.snapshot_data.type === "MBTI_REPORT"
                                                    ? "Bản ghi chi tiết về đặc điểm tâm lý và xu hướng tính cách của học sinh."
                                                    : "Dòng lịch sử này ghi lại từng bước chân của bạn trong quá trình khám phá vùng thiên tài."}
                                            </p>
                                        </div>
                                    </div>

                                    {/* MBTI Section (Standalone or Integrated) */}
                                    {(selectedHistory.snapshot_data.type === "MBTI_REPORT" || selectedHistory.snapshot_data.mbti) && (
                                        <div className="p-12 bg-[#0046EA]/5 border-2 border-[#0046EA] space-y-12 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#00A4FD]/10 blur-3xl -mr-32 -mt-32 rounded-full" />
                                            
                                            <div className="flex flex-col md:flex-row gap-12 relative z-10">
                                                <div className="md:w-1/3 space-y-6">
                                                    <div className="w-24 h-24 bg-[#0046EA] text-white flex items-center justify-center font-garamond italic font-bold text-4xl shadow-2xl">
                                                        {selectedHistory.snapshot_data.type === "MBTI_REPORT" 
                                                            ? selectedHistory.snapshot_data.mbti_code 
                                                            : selectedHistory.snapshot_data.mbti.mbti_code}
                                                    </div>
                                                    <h3 className="text-3xl font-garamond italic font-bold text-[#0046EA]">
                                                        {selectedHistory.snapshot_data.type === "MBTI_REPORT" 
                                                            ? selectedHistory.snapshot_data.vietnamese_title 
                                                            : selectedHistory.snapshot_data.mbti.vietnamese_title}
                                                    </h3>
                                                </div>
                                                <div className="md:w-2/3">
                                                    <p className="text-xl font-garamond italic text-[#0046EA]/70 leading-relaxed">
                                                        {selectedHistory.snapshot_data.type === "MBTI_REPORT" 
                                                            ? selectedHistory.snapshot_data.description 
                                                            : selectedHistory.snapshot_data.mbti.description}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* MBTI Scores visualization */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-[#0046EA]/10 relative z-10">
                                                {Object.entries((selectedHistory.snapshot_data.type === "MBTI_REPORT" 
                                                    ? selectedHistory.snapshot_data.scores 
                                                    : selectedHistory.snapshot_data.mbti.scores) || {}).map(([dim, val]: [string, any]) => (
                                                    <div key={dim} className="space-y-2">
                                                        <div className="flex justify-between text-[10px] font-black text-[#0046EA]/40 uppercase tracking-widest">
                                                            <span>{dim}</span>
                                                            <span>{val}</span>
                                                        </div>
                                                        <div className="h-1 bg-[#0046EA]/10 overflow-hidden">
                                                            <div className="h-full bg-[#00A4FD]" style={{ width: `${(val / 20) * 100}%` }} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Daily Snapshots (If Roadmap) */}
                                    {(selectedHistory.snapshot_data.type !== "MBTI_REPORT") && (
                                        <div className="space-y-16">
                                            {Object.entries(selectedHistory.snapshot_data.days || selectedHistory.snapshot_data)
                                                .filter(([key]) => key !== "type" && key !== "mbti")
                                                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                                                .map(([day, data]: [string, any]) => (
                                                <div key={day} className="grid grid-cols-1 md:grid-cols-12 gap-12 group">
                                                    <div className="md:col-span-2">
                                                        <div className="w-16 h-16 bg-[#0046EA]/5 border border-[#0046EA]/10 flex items-center justify-center text-[#0046EA] font-garamond italic font-bold text-3xl group-hover:bg-[#0046EA] group-hover:text-white transition-all duration-700">
                                                            {day.padStart(2, '0')}
                                                        </div>
                                                    </div>
                                                    <div className="md:col-span-10 space-y-6">
                                                        <div className="flex items-center justify-between">
                                                            <h4 className="text-2xl font-garamond italic font-bold text-[#0046EA]">
                                                                {data.topic}
                                                            </h4>
                                                            <span className="text-[8px] font-black text-[#0046EA]/10 uppercase tracking-[0.4em] font-mono">
                                                                {data.completed_at ? new Date(data.completed_at).toLocaleDateString('vi-VN') : ''}
                                                            </span>
                                                        </div>
                                                        <div className="relative p-10 bg-white/40 border-l-4 border-[#00A4FD] italic font-garamond text-2xl text-[#0046EA]/70 leading-relaxed shadow-sm group-hover:bg-white/80 transition-all duration-700">
                                                            "{typeof data.content === 'object' ? (data.content.text || JSON.stringify(data.content)) : data.content}"
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <footer className="py-24 text-center">
                                        <div className="inline-flex items-center gap-12 text-[10px] font-black text-[#0046EA]/10 uppercase tracking-[1em]">
                                            <Sparkles size={20} className="text-[#00A4FD]/30" />
                                            End of Chronicle
                                            <Sparkles size={20} className="text-[#00A4FD]/30" />
                                        </div>
                                    </footer>
                                </motion.div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-10 opacity-30">
                                    <div className="w-32 h-32 border-2 border-dashed border-[#0046EA] rounded-full flex items-center justify-center">
                                        <Layout size={48} strokeWidth={1} />
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="text-3xl font-garamond italic font-bold text-[#0046EA]">Khai phá di sản</h3>
                                        <p className="text-[10px] font-black uppercase tracking-[0.5em]">CHỌN MỘT BẢN GHI ĐỂ XEM CHI TIẾT</p>
                                    </div>
                                </div>
                            )}
                        </AnimatePresence>
                    </main>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(0, 70, 234, 0.05);
                    border-radius: 0;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(0, 70, 234, 0.2);
                }
            `}</style>
        </div>
    );
}
