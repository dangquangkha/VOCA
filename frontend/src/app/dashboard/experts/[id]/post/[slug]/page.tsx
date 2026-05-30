'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { 
    ArrowLeft, 
    Calendar, 
    Eye, 
    Download, 
    FileText,
    Image as ImageIcon
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function PublicPostPage() {
    const params = useParams();
    const router = useRouter();
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPost = async () => {
            if (!params.slug) return;
            try {
                const { data } = await api.get(`/experts/posts/slug/${params.slug}`);
                setPost(data);
            } catch (error) {
                console.error("Failed to fetch post", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [params.slug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-12 h-12 border-2 border-black/5 border-t-[#0046EA] rounded-full animate-spin" />
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center text-center p-8">
                <div>
                    <h2 className="text-3xl font-serif italic text-gray-800 mb-4">Bài viết không tồn tại</h2>
                    <p className="text-gray-500 mb-8">Có thể bài viết đã bị xóa hoặc đang ở trạng thái bản nháp.</p>
                    <button 
                        onClick={() => router.back()}
                        className="px-8 py-4 bg-[#0046EA] text-white text-[10px] uppercase font-bold tracking-widest rounded-full hover:bg-[#00A4FD] transition-colors"
                    >
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F9FA] font-sans selection:bg-[#0046EA]/20 pb-32">
            {/* Header / Breadcrumb */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-8 py-6 flex items-center gap-6">
                    <button 
                        onClick={() => router.back()}
                        className="w-12 h-12 flex items-center justify-center bg-gray-50 hover:bg-[#0046EA] hover:text-white text-gray-400 rounded-full transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            HỒ SƠ NĂNG LỰC
                        </p>
                    </div>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-8 py-16">
                <div className="bg-white p-12 md:p-20 shadow-xl rounded-[48px] border border-gray-100">
                    <header className="mb-16 text-center border-b border-gray-100 pb-16">
                        <span className="inline-block px-4 py-2 bg-[#0046EA]/5 text-[#0046EA] text-[10px] font-black uppercase tracking-widest rounded-full mb-8">
                            {post.type.replace('_', ' ')}
                        </span>
                        <h1 className="text-4xl md:text-5xl font-serif italic font-bold text-[#171716] leading-tight mb-8">
                            {post.title}
                        </h1>
                        <div className="flex items-center justify-center gap-8 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                            <div className="flex items-center gap-2">
                                <Calendar size={14} />
                                {new Date(post.created_at).toLocaleDateString('vi-VN')}
                            </div>
                            <div className="flex items-center gap-2">
                                <Eye size={14} />
                                {post.views_count} LƯỢT XEM
                            </div>
                        </div>
                    </header>

                    {/* Content (Markdown) */}
                    <article className="prose prose-lg prose-blue max-w-none text-gray-700 leading-relaxed font-sans mb-16">
                        <ReactMarkdown>
                            {post.content || ''}
                        </ReactMarkdown>
                    </article>

                    {/* Attachments Section */}
                    {post.attachments && post.attachments.length > 0 && (
                        <div className="pt-12 border-t border-gray-100">
                            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.5em] mb-8">Tài liệu đính kèm</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {post.attachments.map((att: any) => (
                                    <a 
                                        key={att.id} 
                                        href={api.defaults.baseURL?.replace('/api/v1', '') + att.file_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-6 bg-[#F5F8FF] border border-blue-100 rounded-2xl hover:border-[#0046EA] hover:shadow-md transition-all group"
                                    >
                                        <div className="flex items-center gap-4 overflow-hidden">
                                            <div className="w-12 h-12 bg-white text-[#0046EA] flex items-center justify-center rounded-xl shadow-sm shrink-0">
                                                {att.file_type?.includes('image') ? <ImageIcon size={20} /> : <FileText size={20} />}
                                            </div>
                                            <p className="text-sm font-bold text-[#171716] group-hover:text-[#0046EA] truncate">{att.file_name}</p>
                                        </div>
                                        <Download size={18} className="text-[#0046EA] opacity-50 group-hover:opacity-100 shrink-0" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
