'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

interface Question {
    id: number;
    content: string;
    question_type: string;
    order: number;
}

interface AssessmentDetail {
    id: number;
    title: string;
    description: string;
    questions: Question[];
}

export default function TakeAssessmentPage() {
    const params = useParams();
    const id = params.id;
    const router = useRouter();

    const [assessment, setAssessment] = useState<AssessmentDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        async function fetchAssessment() {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    router.push('/login');
                    return;
                }

                const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001/api/v1';
                const res = await fetch(`${apiBase}/assessments/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    setAssessment(data);
                } else {
                    // Handle error
                    console.error('Failed load assessment');
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        if (id) fetchAssessment();
    }, [id, router]);

    const handleAnswerChange = (questionId: number, value: number) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    const handleSubmit = async () => {
        if (!assessment) return;

        // Validate all questions answered
        const unanswered = assessment.questions.some(q => !answers[q.id]);
        if (unanswered) {
            alert("Please answer all questions before submitting.");
            return;
        }

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001/api/v1';
            const res = await fetch(`${apiBase}/assessments/${id}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    assessment_id: Number(id),
                    answers: answers
                })
            });

            if (res.ok) {
                const resultData = await res.json();
                router.push(`/dashboard/result/${resultData.id}`);
            } else {
                alert("Submission failed. Please try again.");
            }
        } catch (error) {
            console.error(error);
            alert("Error submitting assessment.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[var(--color-navy)] flex items-center justify-center">
            <div className="w-12 h-12 border-2 border-[var(--color-cyan)]/20 border-t-[var(--color-cyan)] rounded-full animate-spin" />
        </div>
    );
    if (!assessment) return (
        <div className="min-h-screen bg-[var(--color-navy)] flex items-center justify-center text-[var(--color-ivory-40)]">
            Assessment not found.
        </div>
    );

    return (
        <div className="min-h-screen bg-[var(--color-navy)] font-dm-sans">
            <div className="max-w-3xl mx-auto p-8 pt-20">
                <h1 className="text-4xl font-serif italic text-[var(--color-ivory)] mb-4">{assessment.title}</h1>
                <p className="text-[var(--color-ivory-40)] font-sans font-light leading-relaxed mb-12">{assessment.description}</p>

                <div className="space-y-8">
                    {assessment.questions.map((q, index) => (
                        <div key={q.id} className="bg-[var(--color-obsidian)] p-8 border border-[var(--color-ivory-10)] shadow-2xl">
                            <h3 className="text-xl font-serif italic text-[var(--color-ivory)] mb-8">
                                <span className="text-[var(--color-cyan)] mr-4 font-sans font-bold text-sm">0{index + 1}.</span>
                                {q.content}
                            </h3>

                            {q.question_type === 'LIKERT' && (
                                <div className="flex flex-col md:flex-row justify-between items-center gap-8 mt-10 p-6 bg-black/20 border border-[var(--color-ivory-10)]/5">
                                    <span className="text-[9px] text-[var(--color-ivory-40)] uppercase tracking-[0.2em] font-bold">Rất không đồng ý</span>
                                    <div className="flex gap-6">
                                        {[1, 2, 3, 4, 5].map((val) => (
                                            <label key={val} className="flex flex-col items-center cursor-pointer group">
                                                <input
                                                    type="radio"
                                                    name={`q-${q.id}`}
                                                    value={val}
                                                    checked={answers[q.id] === val}
                                                    onChange={() => handleAnswerChange(q.id, val)}
                                                    className="w-6 h-6 border-none ring-1 ring-[var(--color-cyan)]/20 checked:bg-[var(--color-cyan)] checked:ring-[var(--color-cyan)] focus:ring-[var(--color-cyan)] transition-all cursor-pointer mb-2"
                                                />
                                                <span className={`text-[10px] font-bold transition-colors ${answers[q.id] === val ? 'text-[var(--color-cyan)]' : 'text-[var(--color-ivory-20)]'}`}>{val}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <span className="text-[9px] text-[var(--color-cyan)] uppercase tracking-[0.2em] font-bold">Rất đồng ý</span>
                                </div>
                            )}

                            {/* Add MBTI Choice type handling if needed */}
                        </div>
                    ))}
                </div>

                <div className="mt-16 flex justify-end pb-32">
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="bg-gradient-to-r from-[var(--color-teal-mid)] to-[var(--color-cyan)] text-obsidian font-black py-4 px-12 text-[11px] tracking-[0.5em] uppercase shadow-2xl shadow-[var(--color-cyan)]/20 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed group flex items-center gap-4"
                    >
                        {submitting ? 'ĐANG GỬI...' : 'HOÀN TẤT & XEM KẾT QUẢ'}
                    </button>
                </div>
            </div>
        </div>
    );
}
