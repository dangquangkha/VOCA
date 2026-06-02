'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { 
    Plus, 
    FileText, 
    Trash2, 
    Edit, 
    Eye,
    BookOpen,
    Upload,
    ArrowLeft
} from 'lucide-react';

interface Post {
    id: number;
    title: string;
    slug: string;
    type: "ARTICLE" | "RESEARCH_PAPER" | "DOCUMENT";
    status: "DRAFT" | "PUBLISHED";
    views_count: number;
    created_at: string;
}

export default function ExpertPortfolioPage() {
    const router = useRouter();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/experts/me/posts');
            if (data && data.items) {
                setPosts(data.items);
            }
        } catch (error) {
            console.error("Failed to fetch posts", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleDelete = async (postId: number) => {
        if (!confirm("Bạn có chắc chắn muốn xóa bài viết này không?")) return;
        try {
            await api.delete(`/experts/me/posts/${postId}`);
            setPosts(posts.filter(p => p.id !== postId));
        } catch (error) {
            console.error("Failed to delete post", error);
            alert("Không thể xóa bài viết.");
        }
    };

    const handleCreate = () => {
        router.push('/dashboard/expert/portfolio/create');
    };

    return (
        <div className="p-8 max-w-7xl mx-auto font-sans bg-white min-h-screen">
            {/* Back to Dashboard Link */}
            <div className="mb-8">
                <Link 
                    href="/dashboard/expert" 
                    className="inline-flex items-center gap-2 text-[10px] font-black text-black/30 hover:text-[#0046EA] transition-all uppercase tracking-[0.2em] group"
                >
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" strokeWidth={2.5} />
                    <span>Trở về Bàn làm việc</span>
                </Link>
            </div>

            <div className="flex items-center justify-between mb-12">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-[1px] bg-[#00A4FD]" />
                        <span className="text-[10px] text-[#00A4FD] tracking-[0.5em] font-black uppercase">Content Management</span>
                    </div>
                    <h1 className="text-4xl font-serif italic font-bold text-[#0046EA]">Bài viết & Tài liệu</h1>
                    <p className="text-gray-500 mt-2">Quản lý hồ sơ năng lực và các bài viết được xuất bản của bạn.</p>
                </div>
                
                <button 
                    onClick={handleCreate}
                    className="flex items-center gap-2 bg-[#0046EA] text-white px-6 py-3 hover:bg-[#00A4FD] transition-all shadow-md group"
                >
                    <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                    <span className="text-[10px] font-bold tracking-widest uppercase">Thêm bài viết mới</span>
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-10 h-10 border-2 border-[#0046EA]/20 border-t-[#00A4FD] rounded-full animate-spin" />
                </div>
            ) : posts.length === 0 ? (
                <div className="text-center py-24 bg-gray-50/50 border border-dashed border-gray-200">
                    <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-serif italic text-gray-600 mb-2">Chưa có bài viết nào</h3>
                    <p className="text-gray-400 text-sm mb-6">Hãy xuất bản bài viết hoặc nghiên cứu đầu tiên của bạn để thu hút học viên.</p>
                    <button 
                        onClick={handleCreate}
                        className="text-[10px] font-bold text-[#00A4FD] uppercase tracking-widest hover:text-[#0046EA] transition-colors"
                    >
                        + Tạo bài viết ngay
                    </button>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 shadow-sm">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-200">
                                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tiêu đề</th>
                                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Loại</th>
                                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Trạng thái</th>
                                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Lượt xem</th>
                                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {posts.map((post) => (
                                <tr key={post.id} className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-sm ${post.type === 'ARTICLE' ? 'bg-blue-50 text-[#0046EA]' : 'bg-purple-50 text-purple-600'}`}>
                                                {post.type === 'DOCUMENT' ? <Upload size={16} /> : <FileText size={16} />}
                                            </div>
                                            <div>
                                                <p className="font-serif font-bold text-[#0046EA] text-lg">{post.title}</p>
                                                <p className="text-xs text-gray-400 mt-1">{new Date(post.created_at).toLocaleDateString('vi-VN')}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-[10px] font-bold tracking-widest uppercase text-gray-600 bg-gray-100 px-2 py-1 rounded-sm">
                                            {post.type.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded-sm ${
                                            post.status === 'PUBLISHED' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'
                                        }`}>
                                            {post.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-500 font-mono text-sm">
                                        {post.views_count}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => handleDelete(post.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors rounded-sm"
                                                title="Xóa bài viết"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
