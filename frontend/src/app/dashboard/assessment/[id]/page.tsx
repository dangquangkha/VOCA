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

                const res = await fetch(`http://localhost:8000/api/v1/assessments/${id}`, {
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
            const res = await fetch(`http://localhost:8000/api/v1/assessments/${id}/submit`, {
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

    if (loading) return <div className="p-8">Loading assessment...</div>;
    if (!assessment) return <div className="p-8">Assessment not found.</div>;

    return (
        <div className="max-w-3xl mx-auto p-8">
            <h1 className="text-3xl font-bold mb-2">{assessment.title}</h1>
            <p className="text-gray-600 mb-8">{assessment.description}</p>

            <div className="space-y-8">
                {assessment.questions.map((q, index) => (
                    <div key={q.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-medium mb-4">
                            <span className="text-blue-600 mr-2">{index + 1}.</span>
                            {q.content}
                        </h3>

                        {q.question_type === 'LIKERT' && (
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
                                <span className="text-xs text-gray-500 uppercase font-semibold">Strongly Disagree</span>
                                <div className="flex gap-4">
                                    {[1, 2, 3, 4, 5].map((val) => (
                                        <label key={val} className="flex flex-col items-center cursor-pointer">
                                            <input
                                                type="radio"
                                                name={`q-${q.id}`}
                                                value={val}
                                                checked={answers[q.id] === val}
                                                onChange={() => handleAnswerChange(q.id, val)}
                                                className="w-5 h-5 text-blue-600 focus:ring-blue-500 mb-1"
                                            />
                                            <span className="text-sm text-gray-400">{val}</span>
                                        </label>
                                    ))}
                                </div>
                                <span className="text-xs text-gray-500 uppercase font-semibold">Strongly Agree</span>
                            </div>
                        )}

                        {/* Add MBTI Choice type handling if needed */}
                    </div>
                ))}
            </div>

            <div className="mt-10 flex justify-end">
                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {submitting ? 'Submitting...' : 'Finish & View Results'}
                </button>
            </div>
        </div>
    );
}
