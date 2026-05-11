'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import Link from 'next/link';

import { getAvatarUrl } from '@/utils/url-utils';

interface Expert {
    id: number;
    user: {
        id?: number;
        full_name: string;
        avatar_url: string | null;
    };
    bio: string;
    experience_years: number;
    hourly_rate: number;
    rating: number;
    tags: string;
}

interface ResultData {
    id: number;
    result_code: string;
    scores: Record<string, number>;
    suggested_experts: Expert[];
    assessment_id: number;
}

export default function ResultPage() {
    const params = useParams();
    const id = params.id;
    const router = useRouter();

    const [result, setResult] = useState<ResultData | null>(null);
    const [loading, setLoading] = useState(true);
    const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});

    useEffect(() => {
        async function fetchResult() {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    router.push('/login');
                    return;
                }

                const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001/api/v1';
                const res = await fetch(`${apiBase}/assessments/results/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    setResult(data);
                } else {
                    console.error('Failed to load result');
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        if (id) fetchResult();
    }, [id, router]);

    if (loading) return (
        <div className="min-h-screen bg-[var(--color-navy)] flex items-center justify-center">
            <div className="w-12 h-12 border-2 border-[var(--color-cyan)]/20 border-t-[var(--color-cyan)] rounded-full animate-spin" />
        </div>
    );
    if (!result) return (
        <div className="min-h-screen bg-[var(--color-navy)] flex items-center justify-center text-[var(--color-ivory-40)]">
            Result not found.
        </div>
    );

    return (
        <div className="min-h-screen bg-[var(--color-navy)] font-dm-sans">
            <div className="max-w-4xl mx-auto p-8 pt-20">
                {/* Result Section */}
                <div className="bg-[var(--color-obsidian)] p-12 border border-[var(--color-ivory-10)] shadow-2xl mb-16 text-center overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-cyan)]/5 blur-[100px] rounded-full -mr-32 -mt-32" />

                    <h1 className="text-4xl font-serif italic text-[var(--color-ivory)] mb-8">Kết quả phân tích</h1>
                    <div className="text-7xl font-sans font-black text-[var(--color-cyan)] mb-10 bg-black/40 inline-block px-12 py-6 border border-[var(--color-cyan)]/20 shadow-[0_0_30px_rgba(var(--color-cyan-rgb),0.1)]">
                        {result.result_code}
                    </div>
                    <p className="text-[var(--color-ivory-40)] text-lg font-sans font-light mb-12 max-w-2xl mx-auto leading-relaxed">
                        Dựa trên các phản hồi của bạn, hệ thống AI đã xác định các đặc điểm nổi bật và bộ chỉ số tương ứng.
                        Thông tin này sẽ là kim chỉ nam cho lộ trình phát triển của bạn.
                    </p>

                    {/* Simple Score Table */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-2xl mx-auto mb-10 relative z-10">
                        {Object.entries(result.scores).map(([key, value]) => (
                            <div key={key} className="bg-black/20 p-6 border border-[var(--color-ivory-10)]/5 hover:border-[var(--color-cyan)]/20 transition-all duration-700">
                                <div className="text-2xl font-serif italic text-[var(--color-ivory)] mb-2">{key}</div>
                                <div className="text-[10px] font-bold text-[var(--color-teal-mid)] uppercase tracking-widest">Score: {value}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Upsell Section */}
                <div className="mt-20">
                    <div className="flex justify-between items-end mb-10 border-b border-[var(--color-ivory-10)] pb-6">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-serif italic text-[var(--color-ivory)]">Chuyên gia đề xuất</h2>
                            <p className="text-[10px] text-[var(--color-ivory-40)] uppercase tracking-[0.3em]">Phù hợp với chỉ số của bạn</p>
                        </div>
                        <Link href="/dashboard/experts" className="text-[10px] font-bold text-[var(--color-cyan)] hover:text-[var(--color-ivory)] transition-all uppercase tracking-[0.2em] mb-1">
                            Xem tất cả chuyên gia →
                        </Link>
                    </div>

                    {result.suggested_experts.length === 0 ? (
                        <div className="text-center py-20 bg-[var(--color-obsidian)] border border-[var(--color-ivory-10)]">
                            <p className="text-[var(--color-ivory-40)] font-sans font-light italic">Chưa có chuyên gia phù hợp tức thì.</p>
                            <Link href="/dashboard/experts" className="text-[11px] font-bold text-[var(--color-cyan)] mt-6 block uppercase tracking-widest">Khám phá thị trường</Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-40">
                            {result.suggested_experts.map(expert => (
                                <div key={expert.id} className="bg-[var(--color-obsidian)] border border-[var(--color-ivory-10)] p-8 transition-all duration-700 hover:border-[var(--color-cyan)]/20 group">
                                    <div className="flex items-center space-x-6 mb-8">
                                        <div className="w-16 h-16 border border-[var(--color-ivory-10)] flex items-center justify-center text-2xl overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700">
                                            {expert.user.avatar_url && !imgErrors[expert.id] ? (
                                                <img 
                                                    src={getAvatarUrl(expert.user.avatar_url, expert.user.full_name)} 
                                                    alt={expert.user.full_name} 
                                                    className="w-full h-full object-cover" 
                                                    onError={() => setImgErrors(prev => ({ ...prev, [expert.id]: true }))}
                                                />
                                            ) : (
                                                <span className="text-[var(--color-ivory-40)] font-serif italic">{expert.user.full_name.charAt(0)}</span>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-serif italic text-xl text-[var(--color-ivory)] line-clamp-1">{expert.user.full_name}</h3>
                                            <div className="flex items-center text-[var(--color-gold)] text-[10px] font-bold tracking-widest mt-1">
                                                ★ {expert.rating.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-sm text-[var(--color-ivory-40)] font-sans font-light line-clamp-3 mb-8 h-[60px] leading-relaxed italic">
                                        {expert.bio || "No bio available."}
                                    </p>

                                    <div className="flex flex-wrap gap-3 mb-8">
                                        {expert.tags && expert.tags.split(',').slice(0, 2).map((tag, i) => (
                                            <span key={i} className="text-[9px] font-bold bg-black/40 border border-[var(--color-ivory-10)]/10 px-3 py-1 text-[var(--color-ivory-60)] uppercase tracking-wider">
                                                {tag.trim()}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="flex justify-between items-center pt-8 border-t border-[var(--color-ivory-10)]">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-[var(--color-ivory-40)] uppercase tracking-widest mb-1">Fee/hour</span>
                                            <span className="font-serif italic text-[var(--color-ivory)] text-lg">{expert.hourly_rate} <span className="text-[10px] font-sans font-bold text-[var(--color-gold)]">CR</span></span>
                                        </div>
                                        <Link
                                            href={`/dashboard/experts/${expert.id}`}
                                            className="bg-ivory text-[var(--color-navy)] font-bold text-[9px] px-8 py-3 tracking-[0.3em] uppercase transition-all duration-700 hover:bg-[var(--color-cyan)] hover:text-obsidian"
                                        >
                                            Kết nối ngay
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
