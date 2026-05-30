'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { 
    ArrowLeft, 
    User, 
    FileText, 
    Brain, 
    History,
    Calendar,
    ChevronRight,
    MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function StudentProfilePage({ params }: { params: Promise<{ studentId: string }> }) {
    const { studentId } = React.use(params);
    const router = useRouter();
    const [profileData, setProfileData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedHistory, setSelectedHistory] = useState<any>(null);

    useEffect(() => {
        const fetchStudentProfile = async () => {
            try {
                const { data } = await api.get(`/experts/students/${studentId}/profile`);
                setProfileData(data);
                if (data.roadmap_histories && data.roadmap_histories.length > 0) {
                    setSelectedHistory(data.roadmap_histories[0]);
                }
            } catch (err: any) {
                console.error("Failed to fetch student profile", err);
                setError(err.response?.data?.detail || "Không thể tải hồ sơ học viên. Có thể bạn không có quyền truy cập.");
            } finally {
                setLoading(false);
            }
        };

        if (studentId) {
            fetchStudentProfile();
        }
    }, [studentId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-8">
                    <div className="w-12 h-12 border-2 border-[#0046EA]/10 border-t-[#00A4FD] rounded-full animate-spin" />
                    <p className="text-[10px] text-[#0046EA]/40 font-black tracking-[0.5em] uppercase">Đang truy xuất hồ sơ...</p>
                </div>
            </div>
        );
    }

    if (error || !profileData) {
        return (
            <div className="p-12 md:px-20 text-center">
                <div className="mb-6 w-20 h-20 mx-auto bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                    <User size={32} />
                </div>
                <h2 className="text-2xl font-serif italic text-red-600 mb-4">Lỗi Truy Xuất</h2>
                <p className="text-gray-600 mb-8">{error}</p>
                <button 
                    onClick={() => router.back()}
                    className="px-6 py-3 bg-[#0046EA] text-white text-[10px] uppercase tracking-widest hover:bg-[#00A4FD] transition-colors"
                >
                    Quay lại
                </button>
            </div>
        );
    }

    const { student, booking_note, mbti, roadmap_histories } = profileData;

    return (
        <div className="min-h-screen bg-[#F8F9FA] font-sans selection:bg-[#00A4FD]/20 pb-20">
            {/* Header */}
            <header className="p-12 md:px-20 bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="flex items-center gap-12 max-w-7xl mx-auto">
                    <button 
                        onClick={() => router.back()}
                        className="w-14 h-14 bg-[#0046EA] text-white flex items-center justify-center hover:bg-[#00A4FD] transition-all duration-500 shadow-lg group"
                    >
                        <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    
                    <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-8 h-[1px] bg-[#00A4FD]" />
                            <span className="text-[10px] text-[#00A4FD] tracking-[0.5em] font-black uppercase">Student Profile</span>
                        </div>
                        <h1 className="text-4xl font-serif italic font-bold text-[#0046EA] tracking-tight">
                            Hồ sơ: {student.full_name}
                        </h1>
                        <p className="text-sm text-gray-500 mt-2">{student.email}</p>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-12 md:px-20 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
                
                {/* Left Column: Info & MBTI */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Booking Note */}
                    <div className="bg-white p-8 border-t-4 border-[#00A4FD] shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <MessageSquare size={20} className="text-[#00A4FD]" />
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-800">Ghi chú nhu cầu tư vấn</h3>
                        </div>
                        <p className="text-gray-700 italic font-serif text-lg leading-relaxed border-l-2 border-gray-100 pl-4">
                            "{booking_note || "Học viên không để lại ghi chú cụ thể. Vui lòng hỏi trực tiếp trong buổi tư vấn."}"
                        </p>
                    </div>

                    {/* MBTI Info */}
                    {mbti ? (
                        <div className="bg-[#0046EA] text-white p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <Brain size={20} className="text-[#00A4FD]" />
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-white/80">Phân tích MBTI</h3>
                                </div>
                                <div className="px-3 py-1 bg-[#00A4FD] text-[#0046EA] font-bold text-lg font-serif">
                                    {mbti.mbti_code}
                                </div>
                            </div>
                            
                            <h4 className="text-2xl font-serif italic text-[#00A4FD] mb-4">{mbti.vietnamese_title}</h4>
                            <p className="text-white/70 text-sm leading-relaxed mb-8">
                                {mbti.description}
                            </p>

                            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
                                {Object.entries(mbti.scores || {}).map(([dim, val]: [string, any]) => (
                                    <div key={dim} className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-black text-white/40 uppercase tracking-widest">
                                            <span>{dim}</span>
                                            <span>{val}</span>
                                        </div>
                                        <div className="h-1 bg-white/10 overflow-hidden rounded-full">
                                            <div className="h-full bg-[#00A4FD]" style={{ width: `${(val / 20) * 100}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white p-8 border border-gray-200 text-center text-gray-500 shadow-sm">
                            <Brain size={32} className="mx-auto mb-4 opacity-50" />
                            <p className="text-sm">Học viên chưa làm bài Test MBTI</p>
                        </div>
                    )}
                </div>

                {/* Right Column: Roadmap History */}
                <div className="lg:col-span-8 bg-white border border-gray-200 shadow-sm flex flex-col h-[800px]">
                    <div className="p-8 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                        <History size={20} className="text-[#0046EA]" />
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-800">Lịch sử Hành trình (Roadmap)</h3>
                    </div>

                    <div className="flex-1 flex overflow-hidden">
                        {/* History List */}
                        <div className="w-1/3 border-r border-gray-100 overflow-y-auto bg-gray-50/30">
                            {roadmap_histories.length === 0 ? (
                                <div className="p-8 text-center text-gray-400">
                                    <p className="text-xs uppercase tracking-widest">Không có dữ liệu</p>
                                </div>
                            ) : (
                                roadmap_histories.map((h: any) => (
                                    <button
                                        key={h.id}
                                        onClick={() => setSelectedHistory(h)}
                                        className={`w-full text-left p-6 border-b border-gray-100 transition-colors ${
                                            selectedHistory?.id === h.id 
                                                ? 'bg-blue-50/50 border-l-4 border-l-[#0046EA]' 
                                                : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold tracking-wider mb-2">
                                            <Calendar size={12} />
                                            {new Date(h.created_at).toLocaleDateString('vi-VN')}
                                        </div>
                                        <div className={`text-lg font-serif italic ${selectedHistory?.id === h.id ? 'text-[#0046EA]' : 'text-gray-700'}`}>
                                            Bản ghi #{h.id}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>

                        {/* History Details */}
                        <div className="flex-1 overflow-y-auto p-8">
                            {selectedHistory ? (
                                <div className="space-y-8">
                                    <div className="flex items-center justify-between pb-6 border-b border-gray-100">
                                        <h4 className="text-2xl font-serif italic text-[#0046EA]">Chi tiết bản ghi</h4>
                                        <span className="px-3 py-1 bg-gray-100 text-gray-600 text-[10px] uppercase font-bold tracking-wider rounded-sm">
                                            {new Date(selectedHistory.created_at).toLocaleString('vi-VN')}
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-8">
                                        {/* Hiển thị kết quả MBTI nếu bản ghi này là dạng MBTI_REPORT */}
                                        {(selectedHistory.snapshot_data?.type === "MBTI_REPORT" || selectedHistory.snapshot_data?.mbti) && (
                                            <div className="p-8 bg-[#0046EA]/5 border-2 border-[#0046EA] space-y-6 relative overflow-hidden">
                                                <div className="flex flex-col md:flex-row gap-6">
                                                    <div className="w-20 h-20 bg-[#0046EA] text-white flex items-center justify-center font-serif italic font-bold text-2xl shadow-lg shrink-0">
                                                        {selectedHistory.snapshot_data.type === "MBTI_REPORT" 
                                                            ? selectedHistory.snapshot_data.mbti_code 
                                                            : selectedHistory.snapshot_data.mbti.mbti_code}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-2xl font-serif italic font-bold text-[#0046EA] mb-2">
                                                            {selectedHistory.snapshot_data.type === "MBTI_REPORT" 
                                                                ? selectedHistory.snapshot_data.vietnamese_title 
                                                                : selectedHistory.snapshot_data.mbti.vietnamese_title}
                                                        </h3>
                                                        <p className="text-gray-700 font-serif italic leading-relaxed">
                                                            {selectedHistory.snapshot_data.type === "MBTI_REPORT" 
                                                                ? selectedHistory.snapshot_data.description 
                                                                : selectedHistory.snapshot_data.mbti.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Hiển thị danh sách các bài làm Roadmap */}
                                        {(selectedHistory.snapshot_data?.type !== "MBTI_REPORT") && Object.entries(selectedHistory.snapshot_data?.days || selectedHistory.snapshot_data || {})
                                            .filter(([key]) => key !== "type" && key !== "mbti")
                                            .sort(([a], [b]) => parseInt(a) - parseInt(b))
                                            .map(([day, data]: [string, any]) => (
                                            <div key={day} className="bg-gray-50/50 p-6 rounded-sm border border-gray-100">
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="w-10 h-10 bg-[#0046EA] text-white flex items-center justify-center font-serif italic font-bold text-xl rounded-sm shadow-sm">
                                                        {day.padStart(2, '0')}
                                                    </div>
                                                    <h5 className="text-lg font-serif font-bold text-gray-800">{data.topic}</h5>
                                                </div>
                                                <div className="pl-14">
                                                    <div className="bg-white p-4 border border-gray-200 text-gray-700 text-sm leading-relaxed rounded-sm">
                                                        {typeof data.content === 'object' ? (data.content.text || JSON.stringify(data.content)) : data.content}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                                    <FileText size={48} className="opacity-20" />
                                    <p className="text-xs uppercase tracking-widest">Chọn một bản ghi để xem chi tiết</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}
