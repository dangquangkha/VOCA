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
    Image as ImageIcon,
    Heart,
    Bookmark,
    MessageSquare,
    Send,
    Trash2,
    CornerDownRight
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAuthStore } from '@/store/useAuthStore';
import { getAvatarUrl } from '@/utils/url-utils';

export default function PublicPostPage() {
    const { user } = useAuthStore();
    const params = useParams();
    const router = useRouter();
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Social Interactions
    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [bookmarked, setBookmarked] = useState(false);

    // Comments Tree
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [replyToId, setReplyToId] = useState<number | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [submittingReply, setSubmittingReply] = useState(false);

    const fetchComments = async (postId: number) => {
        try {
            const { data } = await api.get(`/experts/posts/${postId}/comments`);
            setComments(data);
        } catch (error) {
            console.error("Failed to fetch comments", error);
        }
    };

    useEffect(() => {
        const fetchPost = async () => {
            if (!params.slug) return;
            try {
                const { data } = await api.get(`/experts/posts/slug/${params.slug}`);
                setPost(data);
                setLiked(data.is_liked);
                setLikesCount(data.likes_count);
                setBookmarked(data.is_bookmarked);
                fetchComments(data.id);
            } catch (error) {
                console.error("Failed to fetch post", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [params.slug]);

    const handleLike = async () => {
        if (!user) {
            alert("Vui lòng đăng nhập để thích bài viết.");
            return;
        }
        if (!post) return;

        // Optimistic UI Update
        const prevLiked = liked;
        const prevCount = likesCount;
        setLiked(!liked);
        setLikesCount(liked ? likesCount - 1 : likesCount + 1);

        try {
            const { data } = await api.post(`/experts/posts/${post.id}/like`);
            setLiked(data.liked);
            setLikesCount(data.likes_count);
        } catch (error) {
            console.error("Failed to like post", error);
            setLiked(prevLiked);
            setLikesCount(prevCount);
        }
    };

    const handleBookmark = async () => {
        if (!user) {
            alert("Vui lòng đăng nhập để lưu bài viết.");
            return;
        }
        if (!post) return;

        // Optimistic UI Update
        const prevBookmarked = bookmarked;
        setBookmarked(!bookmarked);

        try {
            const { data } = await api.post(`/experts/posts/${post.id}/bookmark`);
            setBookmarked(data.bookmarked);
        } catch (error) {
            console.error("Failed to bookmark post", error);
            setBookmarked(prevBookmarked);
        }
    };

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            alert("Vui lòng đăng nhập để bình luận.");
            return;
        }
        if (!newComment.trim() || !post) return;

        setSubmittingComment(true);
        try {
            const { data } = await api.post(`/experts/posts/${post.id}/comments`, {
                content: newComment
            });
            setComments(prev => [data, ...prev]);
            setNewComment('');
        } catch (error: any) {
            alert(error.response?.data?.detail || "Gửi bình luận thất bại.");
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleSubmitReply = async (parentId: number) => {
        if (!user) {
            alert("Vui lòng đăng nhập để trả lời.");
            return;
        }
        if (!replyContent.trim() || !post) return;

        setSubmittingReply(true);
        try {
            const { data } = await api.post(`/experts/posts/${post.id}/comments`, {
                content: replyContent,
                parent_id: parentId
            });
            setComments(prev => prev.map(c => {
                if (c.id === parentId) {
                    return {
                        ...c,
                        replies: [...(c.replies || []), data]
                    };
                }
                return c;
            }));
            setReplyContent('');
            setReplyToId(null);
        } catch (error: any) {
            alert(error.response?.data?.detail || "Gửi câu trả lời thất bại.");
        } finally {
            setSubmittingReply(false);
        }
    };

    const handleDeleteComment = async (commentId: number, parentId?: number) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa bình luận này không?")) return;

        try {
            await api.delete(`/experts/comments/${commentId}`);
            if (parentId) {
                setComments(prev => prev.map(c => {
                    if (c.id === parentId) {
                        return {
                            ...c,
                            replies: c.replies.filter((r: any) => r.id !== commentId)
                        };
                    }
                    return c;
                }));
            } else {
                setComments(prev => prev.filter(c => c.id !== commentId));
            }
        } catch (error: any) {
            alert(error.response?.data?.detail || "Xóa bình luận thất bại.");
        }
    };

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
            <div className="bg-white border-b border-gray-200 sticky top-0 z-50 animate-fade-in">
                <div className="max-w-4xl mx-auto px-8 py-6 flex items-center gap-6">
                    <button 
                        onClick={() => router.back()}
                        className="w-12 h-12 flex items-center justify-center bg-gray-50 hover:bg-[#0046EA] hover:text-white text-gray-400 rounded-full transition-colors shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans">
                            HỒ SƠ NĂNG LỰC
                        </p>
                    </div>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-8 py-16">
                <div className="bg-white p-12 md:p-20 shadow-xl rounded-[48px] border border-gray-100 relative overflow-hidden">
                    <header className="mb-16 text-center border-b border-gray-100 pb-16 relative">
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
                            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.5em] mb-8 font-sans">Tài liệu đính kèm</h3>
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

                    {/* Social Interaction Bar */}
                    <div className="flex items-center justify-between py-8 my-12 border-t border-b border-gray-100">
                        <div className="flex items-center gap-8">
                            {/* Like Button */}
                            <button 
                                onClick={handleLike}
                                className={`flex items-center gap-3 px-6 py-3 rounded-full border transition-all duration-300 font-bold text-xs uppercase tracking-wider
                                    ${liked 
                                        ? 'bg-rose-50 border-rose-200 text-rose-500 hover:bg-rose-100 shadow-md shadow-rose-500/5' 
                                        : 'bg-white border-gray-200 text-gray-400 hover:text-rose-500 hover:border-rose-200'
                                    }`}
                            >
                                <Heart size={16} fill={liked ? "currentColor" : "none"} className={liked ? "animate-pulse" : ""} />
                                <span>{likesCount} Yêu thích</span>
                            </button>

                            {/* Bookmark Button */}
                            <button 
                                onClick={handleBookmark}
                                className={`flex items-center gap-3 px-6 py-3 rounded-full border transition-all duration-300 font-bold text-xs uppercase tracking-wider
                                    ${bookmarked 
                                        ? 'bg-blue-50 border-blue-200 text-[#0046EA] hover:bg-blue-100' 
                                        : 'bg-white border-gray-200 text-gray-400 hover:text-[#0046EA] hover:border-blue-200'
                                    }`}
                            >
                                <Bookmark size={16} fill={bookmarked ? "currentColor" : "none"} />
                                <span>{bookmarked ? "Đã lưu" : "Lưu bài viết"}</span>
                            </button>
                        </div>

                        {/* Comments count */}
                        <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest font-sans">
                            <MessageSquare size={16} />
                            <span>{comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)} BÌNH LUẬN</span>
                        </div>
                    </div>

                    {/* Comments Section */}
                    <div className="pt-16 border-t border-gray-100 mt-16" id="comments">
                        <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.5em] mb-12 font-sans">Cuộc hội thoại tri thức</h3>

                        {/* Write Comment Form */}
                        {user ? (
                            <form onSubmit={handleSubmitComment} className="flex gap-6 items-start mb-16">
                                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-gray-200 shadow-lg">
                                    <img 
                                        src={getAvatarUrl(user.avatar_url, user.full_name)} 
                                        alt={user.full_name || ''} 
                                        className="w-full h-full object-cover" 
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = getAvatarUrl(null, user.full_name);
                                        }}
                                    />
                                </div>
                                <div className="flex-1 relative">
                                    <textarea
                                        value={newComment}
                                        onChange={e => setNewComment(e.target.value)}
                                        placeholder="Chia sẻ góc nhìn sâu sắc của bạn về bài viết này..."
                                        rows={3}
                                        className="w-full bg-gray-50 border border-gray-100 focus:border-[#0046EA]/20 focus:bg-white p-6 rounded-3xl text-sm placeholder:text-gray-300 focus:outline-none transition-all resize-none leading-relaxed font-sans"
                                    />
                                    <button 
                                        type="submit"
                                        disabled={submittingComment || !newComment.trim()}
                                        className="absolute bottom-4 right-4 w-10 h-10 bg-[#0046EA] hover:bg-[#00A4FD] text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-30"
                                    >
                                        <Send size={16} />
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="p-8 bg-[#F5F8FF] border border-blue-50/50 text-center rounded-[32px] mb-16">
                                <p className="text-sm text-gray-500 font-medium mb-4 font-sans">Bạn chưa đăng nhập để tham gia bình luận.</p>
                                <button 
                                    onClick={() => router.push('/login')}
                                    className="px-6 py-3 bg-[#0046EA] text-white text-[9px] font-black uppercase tracking-widest rounded-full hover:bg-[#00A4FD] font-sans"
                                >
                                    Đăng nhập ngay
                                </button>
                            </div>
                        )}

                        {/* Comments List */}
                        <div className="space-y-12">
                            {comments.length === 0 ? (
                                <p className="text-sm text-gray-300 italic text-center py-8 font-sans">Chưa có bình luận nào. Hãy trở thành người đầu tiên thảo luận!</p>
                            ) : (
                                comments.map(comment => {
                                    const canDelete = user && (
                                        comment.user_id === user.id || 
                                        (post && post.expert_id === user.expert_profile?.id) ||
                                        user.role === 'ADMIN'
                                    );

                                    return (
                                        <div key={comment.id} className="space-y-6">
                                            {/* Top-level Comment */}
                                            <div className="flex gap-6 items-start group">
                                                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-gray-200 shadow-inner">
                                                    <img 
                                                        src={getAvatarUrl(comment.user?.avatar_url, comment.user?.full_name)} 
                                                        alt={comment.user?.full_name || ''} 
                                                        className="w-full h-full object-cover" 
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = getAvatarUrl(null, comment.user?.full_name);
                                                        }}
                                                    />
                                                </div>
                                                <div className="flex-1 bg-gray-50 p-6 rounded-[28px] border border-gray-100 relative">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <div>
                                                            <span className="text-sm font-black text-[#171716] font-sans">{comment.user?.full_name}</span>
                                                            <span className="text-[10px] text-gray-300 font-mono ml-4">
                                                                {new Date(comment.created_at).toLocaleDateString('vi-VN')} lúc {new Date(comment.created_at).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            {user && (
                                                                <button 
                                                                    onClick={() => setReplyToId(replyToId === comment.id ? null : comment.id)}
                                                                    className="text-[10px] font-black text-[#0046EA] uppercase tracking-wider hover:underline font-sans"
                                                                >
                                                                    Trả lời
                                                                </button>
                                                            )}
                                                            {canDelete && (
                                                                <button 
                                                                    onClick={() => handleDeleteComment(comment.id)}
                                                                    className="text-gray-300 hover:text-red-500 transition-colors"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-gray-600 leading-relaxed font-sans">{comment.content}</p>
                                                </div>
                                            </div>

                                            {/* Nested Replies (Level 2) */}
                                            {comment.replies && comment.replies.length > 0 && (
                                                <div className="ml-16 space-y-6 border-l-2 border-gray-100 pl-8">
                                                    {comment.replies.map((reply: any) => {
                                                        const canDeleteReply = user && (
                                                            reply.user_id === user.id || 
                                                            (post && post.expert_id === user.expert_profile?.id) ||
                                                            user.role === 'ADMIN'
                                                        );

                                                        return (
                                                            <div key={reply.id} className="flex gap-4 items-start group">
                                                                <CornerDownRight size={16} className="text-gray-200 mt-3 shrink-0" />
                                                                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-gray-200 shadow-inner">
                                                                    <img 
                                                                        src={getAvatarUrl(reply.user?.avatar_url, reply.user?.full_name)} 
                                                                        alt={reply.user?.full_name || ''} 
                                                                        className="w-full h-full object-cover" 
                                                                        onError={(e) => {
                                                                            (e.target as HTMLImageElement).src = getAvatarUrl(null, reply.user?.full_name);
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div className="flex-1 bg-white p-5 rounded-[24px] border border-gray-100">
                                                                    <div className="flex justify-between items-center mb-2">
                                                                        <div>
                                                                            <span className="text-xs font-black text-[#171716] font-sans">{reply.user?.full_name}</span>
                                                                            <span className="text-[9px] text-gray-300 font-mono ml-3">
                                                                                {new Date(reply.created_at).toLocaleDateString('vi-VN')} lúc {new Date(reply.created_at).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}
                                                                            </span>
                                                                        </div>
                                                                        {canDeleteReply && (
                                                                            <button 
                                                                                onClick={() => handleDeleteComment(reply.id, comment.id)}
                                                                                className="text-gray-300 hover:text-red-500 transition-colors"
                                                                            >
                                                                                <Trash2 size={12} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-xs text-gray-600 leading-relaxed font-sans">{reply.content}</p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* Write Reply Form */}
                                            {replyToId === comment.id && (
                                                <div className="ml-16 pl-8 flex gap-4 items-start">
                                                    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-gray-200 shadow-md">
                                                        <img 
                                                            src={getAvatarUrl(user?.avatar_url, user?.full_name)} 
                                                            alt={user?.full_name || ''} 
                                                            className="w-full h-full object-cover" 
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = getAvatarUrl(null, user?.full_name);
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="flex-1 relative">
                                                        <textarea
                                                            value={replyContent}
                                                            onChange={e => setReplyContent(e.target.value)}
                                                            placeholder={`Trả lời ${comment.user?.full_name}...`}
                                                            rows={2}
                                                            className="w-full bg-white border border-gray-200 focus:border-[#0046EA]/20 p-5 rounded-2xl text-xs placeholder:text-gray-300 focus:outline-none transition-all resize-none leading-relaxed font-sans"
                                                        />
                                                        <div className="absolute bottom-3 right-3 flex items-center gap-3">
                                                            <button 
                                                                onClick={() => { setReplyToId(null); setReplyContent(''); }}
                                                                className="px-4 py-2 border border-gray-200 text-gray-400 hover:bg-gray-50 text-[10px] uppercase font-bold tracking-wider rounded-full transition-colors font-sans"
                                                            >
                                                                Hủy
                                                            </button>
                                                            <button 
                                                                onClick={() => handleSubmitReply(comment.id)}
                                                                disabled={submittingReply || !replyContent.trim()}
                                                                className="w-8 h-8 bg-[#0046EA] hover:bg-[#00A4FD] text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-30"
                                                            >
                                                                <Send size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
