'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Expert {
    id: number;
    user: {
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

    useEffect(() => {
        async function fetchResult() {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    router.push('/login');
                    return;
                }

                const res = await fetch(`http://localhost:8000/api/v1/assessments/results/${id}`, {
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

    if (loading) return <div className="p-8">Loading results...</div>;
    if (!result) return <div className="p-8">Result not found.</div>;

    return (
        <div className="max-w-4xl mx-auto p-8">
            {/* Result Section */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-blue-50 mb-10 text-center">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">Your Personality Type</h1>
                <div className="text-6xl font-extrabold text-blue-600 mb-6 bg-blue-50 inline-block px-8 py-4 rounded-xl">
                    {result.result_code}
                </div>
                <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
                    Based on your answers, you have strong tendencies towards these attributes.
                    Detailed analysis charts would appear here.
                </p>

                {/* Simple Score Table */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-lg mx-auto mb-8">
                    {Object.entries(result.scores).map(([key, value]) => (
                        <div key={key} className="bg-gray-50 p-4 rounded-lg">
                            <div className="text-2xl font-bold text-gray-800">{key}</div>
                            <div className="text-sm text-gray-500">Score: {value}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Upsell Section */}
            <div className="mt-12">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Experts Recommended for You</h2>
                    <Link href="/dashboard/experts" className="text-blue-600 hover:underline">
                        View All Experts
                    </Link>
                </div>

                {result.suggested_experts.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 rounded-xl">
                        <p className="text-gray-500">No specific experts matched right now.</p>
                        <Link href="/dashboard/experts" className="text-blue-600 mt-2 block">Browse Marketplace</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {result.suggested_experts.map(expert => (
                            <div key={expert.id} className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition">
                                <div className="flex items-center space-x-4 mb-4">
                                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-xl overflow-hidden">
                                        {expert.user.avatar_url ? (
                                            <img src={expert.user.avatar_url} alt={expert.user.full_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span>{expert.user.full_name.charAt(0)}</span>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 line-clamp-1">{expert.user.full_name}</h3>
                                        <div className="flex items-center text-yellow-500 text-sm">
                                            ★ {expert.rating.toFixed(2)}
                                        </div>
                                    </div>
                                </div>

                                <p className="text-sm text-gray-600 line-clamp-3 mb-4 h-15">
                                    {expert.bio || "No bio available."}
                                </p>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    {expert.tags && expert.tags.split(',').slice(0, 2).map((tag, i) => (
                                        <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                                            {tag.trim()}
                                        </span>
                                    ))}
                                </div>

                                <div className="flex justify-between items-center pt-4 border-t">
                                    <span className="font-bold text-gray-900">{expert.hourly_rate} Credits/hr</span>
                                    <Link
                                        href={`/dashboard/experts/${expert.id}`}
                                        className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700"
                                    >
                                        Book Now
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
