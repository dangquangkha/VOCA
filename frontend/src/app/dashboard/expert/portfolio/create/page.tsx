'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { 
    ArrowLeft, 
    Save, 
    Send,
    UploadCloud,
    X,
    FileText,
    Image as ImageIcon
} from 'lucide-react';

export default function CreatePortfolioPostPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    
    const [title, setTitle] = useState('');
    const [type, setType] = useState<'ARTICLE' | 'RESEARCH_PAPER' | 'DOCUMENT'>('ARTICLE');
    const [content, setContent] = useState('');
    const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('PUBLISHED');
    
    // Attachments handling
    const [attachments, setAttachments] = useState<{file_url: string, file_name: string, file_type: string}[]>([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const { data } = await api.post('/experts/me/upload-file', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            setAttachments([...attachments, {
                file_url: data.url,
                file_name: data.name,
                file_type: data.type || 'DOCUMENT'
            }]);
        } catch (error) {
            console.error("Upload failed", error);
            alert("Tải file thất bại. Vui lòng thử lại.");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    const handleSave = async (saveAs: 'DRAFT' | 'PUBLISHED') => {
        if (!title.trim()) {
            alert("Vui lòng nhập tiêu đề bài viết.");
            return;
        }

        setLoading(true);
        try {
            await api.post('/experts/me/posts', {
                title,
                type,
                content,
                status: saveAs,
                attachments
            });
            router.push('/dashboard/expert/portfolio');
        } catch (error) {
            console.error("Failed to save post", error);
            alert("Đã xảy ra lỗi khi lưu bài viết.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto font-sans bg-white min-h-screen">
            <header className="flex items-center justify-between mb-12 pb-6 border-b border-gray-100">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => router.back()}
                        className="w-12 h-12 flex items-center justify-center bg-gray-50 text-gray-500 hover:bg-[#0046EA] hover:text-white transition-all shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-serif italic font-bold text-[#0046EA]">Soạn thảo bài viết</h1>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">EXPERT PORTFOLIO EDITOR</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button 
                        disabled={loading}
                        onClick={() => handleSave('DRAFT')}
                        className="flex items-center gap-2 px-6 py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        <Save size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Lưu nháp</span>
                    </button>
                    <button 
                        disabled={loading}
                        onClick={() => handleSave('PUBLISHED')}
                        className="flex items-center gap-2 px-6 py-3 bg-[#0046EA] text-white hover:bg-[#00A4FD] shadow-md transition-colors disabled:opacity-50"
                    >
                        <Send size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Xuất bản</span>
                    </button>
                </div>
            </header>

            <main className="space-y-8">
                {/* Title */}
                <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tiêu đề</label>
                    <input 
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Nhập tiêu đề bài viết..."
                        className="w-full text-4xl font-serif font-bold text-gray-800 placeholder:text-gray-200 border-none outline-none bg-transparent focus:ring-0 px-0"
                    />
                </div>

                {/* Type Selection */}
                <div className="flex gap-6 pt-4">
                    {[
                        { id: 'ARTICLE', label: 'Bài viết Blog' },
                        { id: 'RESEARCH_PAPER', label: 'Nghiên cứu khoa học' },
                        { id: 'DOCUMENT', label: 'Tài liệu chia sẻ' }
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setType(t.id as any)}
                            className={`px-4 py-2 border text-xs font-bold uppercase tracking-widest transition-all ${
                                type === t.id 
                                    ? 'border-[#0046EA] bg-[#0046EA]/5 text-[#0046EA]' 
                                    : 'border-gray-200 text-gray-400 hover:border-gray-300'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Editor Area */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                        <label className="block text-[10px] font-bold text-[#00A4FD] uppercase tracking-widest">Nội dung văn bản (Markdown hỗ trợ)</label>
                    </div>
                    <textarea 
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Bắt đầu viết nội dung tại đây..."
                        className="w-full min-h-[400px] text-lg text-gray-700 leading-relaxed border-none outline-none resize-y focus:ring-0 p-4 bg-gray-50/50"
                    />
                </div>

                {/* Attachments */}
                <div className="pt-8 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tài liệu đính kèm (PDF, DOCX, Hình ảnh)</label>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileUpload} 
                            className="hidden" 
                            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                        />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="flex items-center gap-2 text-[#00A4FD] hover:text-[#0046EA] transition-colors disabled:opacity-50"
                        >
                            <UploadCloud size={18} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">
                                {uploading ? 'Đang tải lên...' : 'Tải file lên'}
                            </span>
                        </button>
                    </div>

                    {attachments.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {attachments.map((att, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 border border-gray-200 bg-white group">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="text-gray-400 shrink-0">
                                            {att.file_type.includes('image') ? <ImageIcon size={20} /> : <FileText size={20} />}
                                        </div>
                                        <p className="text-sm text-gray-600 truncate font-medium">{att.file_name}</p>
                                    </div>
                                    <button 
                                        onClick={() => removeAttachment(idx)}
                                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
