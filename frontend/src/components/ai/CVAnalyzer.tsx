'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload,
    FileText,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Download,
    Search,
    RefreshCcw,
    Zap,
    Target
} from 'lucide-react';

// --- Mock Data ---
const MOCK_RESULTS = {
    score: 85,
    strengths: [
        "Kỹ năng React & Next.js vững chắc (3+ năm kinh nghiệm).",
        "Có kinh nghiệm thực chiến với các dự án Fintech quy mô lớn.",
        "Chứng chỉ AWS Certified Solutions Architect là điểm cộng lớn."
    ],
    weaknesses: [
        "Thiếu các từ khóa liên quan đến 'Unit Testing' (Jest/Cypress).",
        "Mô tả dự án còn hơi chung chung, cần bổ sung số liệu cụ thể (Metrics).",
        "Phần kinh nghiệm về Backend (Node.js) chưa được làm nổi bật."
    ],
    suggestions: [
        "Cập nhật thêm các công nghệ Testing vào mục Skills.",
        "Sử dụng công thức 'Action Verb + Task + Result' cho mỗi bullet point.",
        "Bổ sung liên kết đến portfolio hoặc GitHub để tăng độ tin cậy."
    ]
};

type AnalyzerState = 'IDLE' | 'ANALYZING' | 'RESULT' | 'ERROR';

export default function CVAnalyzer() {
    const [state, setState] = useState<AnalyzerState>('IDLE');
    const [file, setFile] = useState<File | null>(null);
    const [jd, setJd] = useState('');
    const [scansRemaining, setScansRemaining] = useState(2);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.size > 5 * 1024 * 1024) {
                alert("File quá lớn. Vui lòng chọn file dưới 5MB.");
                return;
            }
            setFile(selectedFile);
        }
    };

    const startAnalysis = () => {
        if (!file || !jd.trim()) {
            alert("Vui lòng tải CV và nhập JD của công việc.");
            return;
        }
        setState('ANALYZING');
        // Simulate AI processing
        setTimeout(() => {
            setState('RESULT');
            setScansRemaining(prev => Math.max(0, prev - 1));
        }, 4000);
    };

    return (
        <div className="w-full max-w-[1400px] mx-auto py-12 px-4 selection:bg-[#C9A84C]/30">
            <AnimatePresence mode="wait">
                {state === 'IDLE' && (
                    <motion.div
                        key="idle"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                        className="space-y-16"
                    >
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                            <div className="space-y-4">
                                <h1 className="text-[clamp(32px,4vw,48px)] font-serif italic text-[#F5F0E8] font-light tracking-tight">Phân tích CV cùng AI</h1>
                                <p className="text-[#F5F0E8]/40 font-sans font-light text-sm tracking-wide">Tối ưu hóa hồ sơ của bạn theo yêu cầu công việc cụ thể.</p>
                            </div>
                            <div className="bg-white/[0.03] px-6 py-3 border border-[#C9A84C]/10 flex items-center gap-3">
                                <Zap className="w-3 h-3 text-[#C9A84C]" strokeWidth={1} />
                                <span className="text-[10px] font-sans font-normal text-[#C9A84C] uppercase tracking-[0.3em]">{scansRemaining}/3 lượt miễn phí còn lại</span>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-10">
                            {/* Upload Zone */}
                            <div className="space-y-6">
                                <label className="block text-[10px] font-normal text-[#F5F0E8]/40 uppercase tracking-[0.4em] font-sans">Hồ sơ của bạn (PDF/DOCX)</label>
                                <div
                                    className={`border border-dashed transition-all duration-700 flex flex-col items-center justify-center text-center group cursor-pointer min-h-[280px]
                    ${file ? 'border-[#C9A84C]/40 bg-[#C9A84C]/5' : 'border-[#F5F0E8]/10 bg-white/[0.02] hover:border-[#C9A84C]/30 hover:bg-white/[0.04]'}`}
                                >
                                    <input
                                        type="file"
                                        id="cv-upload"
                                        className="hidden"
                                        accept=".pdf,.docx"
                                        onChange={handleUpload}
                                    />
                                    <label htmlFor="cv-upload" className="cursor-pointer w-full p-10">
                                        <div className={`w-16 h-16 border mx-auto flex items-center justify-center mb-8 transition-all duration-700
                                          ${file ? 'bg-[#C9A84C] text-[#090C12] border-[#C9A84C]' : 'border-[#C9A84C]/20 text-[#C9A84C] group-hover:border-[#C9A84C] group-hover:scale-105'}`}>
                                            {file ? <CheckCircle2 className="w-6 h-6" strokeWidth={1} /> : <Upload className="w-6 h-6" strokeWidth={1} />}
                                        </div>
                                        {file ? (
                                            <div className="space-y-2">
                                                <p className="text-lg font-serif italic text-[#F5F0E8] truncate max-w-[240px] mx-auto">{file.name}</p>
                                                <p className="text-[10px] text-[#F5F0E8]/40 font-sans tracking-widest">{(file.size / 1024).toFixed(1)} KB</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <p className="text-xl font-serif italic text-[#F5F0E8]/80 font-light">Kéo thả file vào đây</p>
                                                <p className="text-[10px] text-[#F5F0E8]/30 font-sans uppercase tracking-[0.2em]">Hoặc nhấn để chọn file (Max 5MB)</p>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            {/* JD Input */}
                            <div className="space-y-6">
                                <label className="block text-[10px] font-normal text-[#F5F0E8]/40 uppercase tracking-[0.4em] font-sans">Mô tả công việc (Job Description)</label>
                                <textarea
                                    className="w-full h-[280px] bg-white/[0.02] border border-[#F5F0E8]/10 p-8 focus:border-[#C9A84C]/40 focus:bg-white/[0.04] transition-all duration-700 font-sans font-light text-[#F5F0E8]/70 text-sm leading-relaxed resize-none outline-none placeholder:text-[#F5F0E8]/10"
                                    placeholder="Dán yêu cầu công việc tại đây để AI so sánh với CV của bạn..."
                                    value={jd}
                                    onChange={(e) => setJd(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex justify-center pt-8">
                            <button
                                onClick={startAnalysis}
                                className="px-16 py-6 bg-[#C9A84C] text-[#090C12] text-[11px] tracking-[0.5em] uppercase font-normal transition-all duration-900 hover:bg-[#F5F0E8] shadow-2xl shadow-black/40 flex items-center gap-4 group/btn"
                            >
                                Phân tích ngay
                                <ArrowRight className="w-4 h-4 transition-transform duration-700 group-hover/btn:translate-x-2" strokeWidth={1} />
                            </button>
                        </div>
                    </motion.div>
                )}

                {state === 'ANALYZING' && (
                    <motion.div
                        key="analyzing"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.02 }}
                        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                        className="flex flex-col items-center justify-center min-h-[500px] text-center"
                    >
                        <div className="relative mb-16">
                            <motion.div
                                animate={{
                                    scale: [1, 1.05, 1],
                                    rotate: [0, 2, -2, 0]
                                }}
                                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                className="w-32 h-32 border border-[#C9A84C]/20 flex items-center justify-center text-[#C9A84C]"
                            >
                                <Zap className="w-12 h-12" strokeWidth={0.5} />
                            </motion.div>
                            <motion.div
                                animate={{
                                    scale: [1, 1.4, 1],
                                    opacity: [0.1, 0.3, 0.1]
                                }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="absolute inset-0 border border-[#C9A84C]/40 blur-sm"
                            />
                        </div>

                        <div className="space-y-6 max-w-sm">
                            <h2 className="text-2xl font-serif italic text-[#F5F0E8] font-light">Đang thấu cảm dữ liệu...</h2>
                            <div className="flex flex-col gap-3 min-h-[40px]">
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: [0, 1, 1, 0], y: [5, 0, 0, -5] }}
                                    transition={{ duration: 3, times: [0, 0.2, 0.8, 1], repeat: Infinity }}
                                    className="text-[10px] text-[#C9A84C]/60 uppercase tracking-[0.3em] font-sans"
                                >
                                    Trích xuất tri thức chuyên môn...
                                </motion.p>
                            </div>
                        </div>

                        {/* Loading Bar */}
                        <div className="w-64 h-[1px] bg-[#C9A84C]/10 mt-16 overflow-hidden relative">
                            <motion.div
                                initial={{ left: "-100%" }}
                                animate={{ left: "100%" }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-[#C9A84C] to-transparent"
                            />
                        </div>
                    </motion.div>
                )}

                {state === 'RESULT' && (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                        className="space-y-16 pb-20"
                    >
                        {/* Header Section */}
                        <div className="flex flex-col md:flex-row items-center gap-10 justify-between">
                            <div className="flex items-center gap-10">
                                <div className="relative w-32 h-32 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle
                                            cx="64" cy="64" r="60"
                                            stroke="currentColor" strokeWidth="2" fill="transparent"
                                            className="text-white/5"
                                        />
                                        <motion.circle
                                            cx="64" cy="64" r="60"
                                            stroke="currentColor" strokeWidth="2" fill="transparent"
                                            strokeDasharray={2 * Math.PI * 60}
                                            initial={{ strokeDashoffset: 2 * Math.PI * 60 }}
                                            animate={{ strokeDashoffset: (2 * Math.PI * 60) * (1 - MOCK_RESULTS.score / 100) }}
                                            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                                            className="text-[#C9A84C]"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-4xl font-serif italic text-[#F5F0E8] font-light">{MOCK_RESULTS.score}</span>
                                        <span className="text-[8px] font-sans font-normal text-[#C9A84C] uppercase tracking-[0.3em] mt-1">CV Score</span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h2 className="text-3xl font-serif italic text-[#F5F0E8] font-light">Tuyệt vời, {file?.name}!</h2>
                                    <p className="text-[#F5F0E8]/40 font-sans font-light text-sm max-w-md">Hồ sơ của bạn thể hiện sự chuyên nghiệp và tương đồng cao với yêu cầu vị trí.</p>
                                    <div className="flex gap-4 pt-2">
                                        <button className="text-[10px] uppercase tracking-[0.3em] px-6 py-3 bg-[#C9A84C] text-[#090C12] hover:bg-[#F5F0E8] transition-all duration-700 flex items-center gap-2">
                                            <Download className="w-3 h-3" strokeWidth={1} />
                                            Tải báo cáo
                                        </button>
                                        <button
                                            onClick={() => setState('IDLE')}
                                            className="text-[10px] uppercase tracking-[0.3em] px-6 py-3 border border-[#F5F0E8]/10 text-[#F5F0E8]/40 hover:border-[#C9A84C] hover:text-[#C9A84C] transition-all duration-700 flex items-center gap-2"
                                        >
                                            <RefreshCcw className="w-3 h-3" strokeWidth={1} />
                                            Làm mới
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bento Grid Results */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {/* Strengths */}
                            <div className="bg-white/[0.02] border border-[#C9A84C]/10 p-10 flex flex-col group hover:border-[#C9A84C]/30 transition-all duration-700">
                                <div className="w-12 h-12 border border-[#C9A84C]/10 flex items-center justify-center text-[#C9A84C] mb-8 group-hover:bg-[#C9A84C]/5 transition-all duration-700">
                                    <CheckCircle2 className="w-5 h-5" strokeWidth={0.5} />
                                </div>
                                <h3 className="text-xl font-serif italic text-[#F5F0E8] font-light mb-8">Điểm mạnh</h3>
                                <ul className="space-y-6 flex-grow">
                                    {MOCK_RESULTS.strengths.map((item, i) => (
                                        <li key={i} className="flex gap-4 text-xs font-sans font-light text-[#F5F0E8]/60 leading-loose">
                                            <div className="w-1 h-1 rounded-full bg-[#C9A84C] mt-2 shrink-0 opacity-40" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Weaknesses */}
                            <div className="bg-white/[0.02] border border-white/5 p-10 flex flex-col group hover:border-white/10 transition-all duration-700">
                                <div className="w-12 h-12 border border-white/10 flex items-center justify-center text-[#F5F0E8]/40 mb-8 group-hover:bg-white/5 transition-all duration-700">
                                    <AlertCircle className="w-5 h-5" strokeWidth={0.5} />
                                </div>
                                <h3 className="text-xl font-serif italic text-[#F5F0E8] font-light mb-8">Cần cải thiện</h3>
                                <ul className="space-y-6 flex-grow">
                                    {MOCK_RESULTS.weaknesses.map((item, i) => (
                                        <li key={i} className="flex gap-4 text-xs font-sans font-light text-[#F5F0E8]/40 leading-loose">
                                            <div className="w-1 h-1 rounded-full bg-[#F5F0E8]/20 mt-2 shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Suggestions */}
                            <div className="bg-[#C9A84C]/5 border border-[#C9A84C]/20 p-10 flex flex-col md:col-span-2 lg:col-span-1 group hover:bg-[#C9A84C]/10 transition-all duration-700">
                                <div className="w-12 h-12 bg-[#C9A84C] flex items-center justify-center text-[#090C12] mb-8">
                                    <Target className="w-5 h-5" strokeWidth={1} />
                                </div>
                                <h3 className="text-xl font-serif italic text-[#F5F0E8] font-light mb-8">Hành động gợi ý</h3>
                                <ul className="space-y-6 flex-grow">
                                    {MOCK_RESULTS.suggestions.map((item, i) => (
                                        <li key={i} className="flex gap-4 text-xs font-sans font-light text-[#F5F0E8]/80 leading-loose">
                                            <span className="font-serif italic text-[#C9A84C] text-sm shrink-0">0{i + 1}</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
