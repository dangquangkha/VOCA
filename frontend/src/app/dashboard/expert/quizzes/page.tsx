'use client';

import React, { useState, useEffect } from 'react';
import ExpertDashboardLayout from '@/components/dashboard/ExpertDashboardLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import { Plus, Trash2, Save, MessageSquare, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Question {
    id: string;
    type: string;
    label: string;
    options?: string[];
    required: boolean;
}

interface Quiz {
    id?: number;
    title: string;
    description: string;
    questions: Question[];
    is_public: boolean;
    is_required_for_booking: boolean;
    is_active: boolean;
    total_attempts: number;
}

export default function ExpertQuizzesPage() {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const fetchQuizzes = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('experts/quizzes/me');
            setQuizzes(data);
        } catch (err) {
            console.error("Failed to fetch quizzes", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNew = () => {
        setEditingQuiz({
            title: "Khảo sát mới",
            description: "Vui lòng trả lời các câu hỏi sau để tôi chuẩn bị tốt hơn cho buổi hẹn.",
            questions: [
                { id: "q1", type: "text", label: "Mục tiêu lớn nhất của bạn trong buổi tư vấn này là gì?", required: true }
            ],
            is_public: false,
            is_required_for_booking: false,
            is_active: true,
            total_attempts: 0
        });
    };

    const addQuestion = () => {
        if (!editingQuiz) return;
        const newQuestion: Question = {
            id: `q${editingQuiz.questions.length + 1}_${Date.now()}`,
            type: "text",
            label: "",
            required: true
        };
        setEditingQuiz({
            ...editingQuiz,
            questions: [...editingQuiz.questions, newQuestion]
        });
    };

    const removeQuestion = (id: string) => {
        if (!editingQuiz) return;
        setEditingQuiz({
            ...editingQuiz,
            questions: editingQuiz.questions.filter(q => q.id !== id)
        });
    };

    const updateQuestion = (id: string, field: keyof Question, value: any) => {
        if (!editingQuiz) return;
        setEditingQuiz({
            ...editingQuiz,
            questions: editingQuiz.questions.map(q => q.id === id ? { ...q, [field]: value } : q)
        });
    };

    const addOption = (qId: string) => {
        if (!editingQuiz) return;
        setEditingQuiz({
            ...editingQuiz,
            questions: editingQuiz.questions.map(q => {
                if (q.id === qId) {
                    return { ...q, options: [...(q.options || []), "Lựa chọn mới"] };
                }
                return q;
            })
        });
    };

    const updateOption = (qId: string, optIdx: number, value: string) => {
        if (!editingQuiz) return;
        setEditingQuiz({
            ...editingQuiz,
            questions: editingQuiz.questions.map(q => {
                if (q.id === qId) {
                    const newOpts = [...(q.options || [])];
                    newOpts[optIdx] = value;
                    return { ...q, options: newOpts };
                }
                return q;
            })
        });
    };

    const handleSave = async () => {
        if (!editingQuiz || isSaving) return;
        setIsSaving(true);
        try {
            if (editingQuiz.id) {
                await api.put(`experts/quizzes/${editingQuiz.id}`, editingQuiz);
            } else {
                await api.post('experts/quizzes/', editingQuiz);
            }
            alert("Lưu khảo sát thành công!");
            setEditingQuiz(null);
            fetchQuizzes();
        } catch (err: any) {
            alert(err.response?.data?.detail || "Lưu khảo sát thất bại.");
        } finally {
            setIsSaving(false);
        }
    };

    const toggleActive = async (quiz: Quiz) => {
        try {
            await api.put(`experts/quizzes/${quiz.id}`, { is_active: !quiz.is_active });
            fetchQuizzes();
        } catch (err) {
            alert("Không thể cập nhật trạng thái.");
        }
    };

    return (
        <ExpertDashboardLayout>
            <div className="max-w-4xl mx-auto py-12 px-6">
                <header className="flex items-center justify-between mb-12">
                    <div>
                        <h1 className="text-3xl font-serif italic text-white">Quản lý Khảo sát</h1>
                        <p className="text-sm text-ivory-45 mt-2">Tạo các câu hỏi để học viên trả lời trước buổi hẹn hoặc công khai trên Lộ trình.</p>
                    </div>
                    {!editingQuiz && (
                        <Button onClick={handleCreateNew} className="gap-2">
                            <Plus size={16} /> Tạo khảo sát mới
                        </Button>
                    )}
                </header>

                <AnimatePresence mode="wait">
                    {editingQuiz ? (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-8 bg-navy-mid border border-ivory-10 p-8 rounded-sm shadow-2xl"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] uppercase tracking-widest text-gold font-bold">Tiêu đề khảo sát</label>
                                    <Input 
                                        value={editingQuiz.title}
                                        onChange={(e) => setEditingQuiz({...editingQuiz, title: e.target.value})}
                                        placeholder="VD: Khảo sát chuẩn bị Portfolio"
                                        className="bg-navy border-ivory-10 text-white text-xl font-serif italic"
                                    />
                                </div>
                                <div className="flex items-center gap-8 pt-6">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative">
                                            <input 
                                                type="checkbox"
                                                checked={editingQuiz.is_public}
                                                onChange={(e) => setEditingQuiz({...editingQuiz, is_public: e.target.checked})}
                                                className="sr-only"
                                            />
                                            <div className={`w-10 h-5 rounded-full transition-colors ${editingQuiz.is_public ? 'bg-gold' : 'bg-ivory-10'}`} />
                                            <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${editingQuiz.is_public ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase tracking-widest text-white font-bold">Công khai</span>
                                            <span className="text-[8px] text-ivory-45 uppercase">Hiện trên trang Lộ trình</span>
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative">
                                            <input 
                                                type="checkbox"
                                                checked={editingQuiz.is_required_for_booking}
                                                onChange={(e) => setEditingQuiz({...editingQuiz, is_required_for_booking: e.target.checked})}
                                                className="sr-only"
                                            />
                                            <div className={`w-10 h-5 rounded-full transition-colors ${editingQuiz.is_required_for_booking ? 'bg-emerald-500' : 'bg-ivory-10'}`} />
                                            <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${editingQuiz.is_required_for_booking ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase tracking-widest text-white font-bold">Bắt buộc</span>
                                            <span className="text-[8px] text-ivory-45 uppercase">Làm xong mới được đặt lịch</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] uppercase tracking-widest text-gold font-bold">Mô tả</label>
                                <textarea 
                                    value={editingQuiz.description}
                                    onChange={(e) => setEditingQuiz({...editingQuiz, description: e.target.value})}
                                    className="w-full bg-navy border border-ivory-10 p-4 text-sm text-ivory-70 focus:outline-none focus:border-gold transition-all min-h-[100px]"
                                />
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between border-b border-ivory-10 pb-4">
                                    <h3 className="text-sm uppercase tracking-widest text-ivory">Danh sách câu hỏi</h3>
                                    <Button variant="outline" size="sm" onClick={addQuestion} className="h-8 px-4">
                                        <Plus size={14} className="mr-1" /> Thêm câu hỏi
                                    </Button>
                                </div>

                                {editingQuiz.questions.map((q, idx) => (
                                    <div key={q.id} className="p-6 bg-navy rounded-sm border border-ivory-10 relative group">
                                        <div className="flex gap-4">
                                            <div className="text-gold font-mono text-xs mt-3">0{idx + 1}.</div>
                                            <div className="flex-1 space-y-4">
                                                <Input 
                                                    value={q.label}
                                                    onChange={(e) => updateQuestion(q.id, 'label', e.target.value)}
                                                    placeholder="Nhập nội dung câu hỏi..."
                                                    className="bg-transparent border-b border-ivory-10 rounded-none px-0"
                                                />
                                                <div className="flex items-center gap-6">
                                                    <select 
                                                        value={q.type}
                                                        onChange={(e) => updateQuestion(q.id, 'type', e.target.value)}
                                                        className="bg-transparent text-[10px] uppercase tracking-widest text-gold font-bold focus:outline-none border-none"
                                                    >
                                                        <option value="text" className="bg-navy">Văn bản (Text)</option>
                                                        <option value="radio" className="bg-navy">Trắc nghiệm (Single)</option>
                                                        <option value="checkbox" className="bg-navy">Nhiều lựa chọn (Multi)</option>
                                                        <option value="scale" className="bg-navy">Thang Likert (1-5)</option>
                                                    </select>
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input 
                                                            type="checkbox"
                                                            checked={q.required}
                                                            onChange={(e) => updateQuestion(q.id, 'required', e.target.checked)}
                                                            className="accent-gold"
                                                        />
                                                        <span className="text-[10px] uppercase tracking-widest text-ivory-45">Bắt buộc</span>
                                                    </label>
                                                </div>

                                                {(q.type === 'radio' || q.type === 'checkbox') && (
                                                    <div className="pl-6 space-y-2 pt-2">
                                                        <p className="text-[8px] uppercase tracking-widest text-ivory-45 mb-2">Các lựa chọn:</p>
                                                        {q.options?.map((opt, optIdx) => (
                                                            <div key={optIdx} className="flex items-center gap-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-gold/50" />
                                                                <input 
                                                                    value={opt}
                                                                    onChange={(e) => updateOption(q.id, optIdx, e.target.value)}
                                                                    className="bg-transparent border-none text-xs text-ivory-70 focus:outline-none focus:text-white transition-colors"
                                                                />
                                                            </div>
                                                        ))}
                                                        <button 
                                                            onClick={() => addOption(q.id)}
                                                            className="text-[8px] uppercase tracking-widest text-gold font-bold hover:underline"
                                                        >
                                                            + Thêm lựa chọn
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <button 
                                                onClick={() => removeQuestion(q.id)}
                                                className="p-2 text-ivory-20 hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center justify-end gap-4 pt-8">
                                <Button variant="outline" onClick={() => setEditingQuiz(null)}>Hủy bỏ</Button>
                                <Button onClick={handleSave} isLoading={isSaving} className="gap-2">
                                    <Save size={16} /> Lưu khảo sát
                                </Button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="grid grid-cols-1 gap-6"
                        >
                            {loading ? (
                                <div className="h-64 flex items-center justify-center border border-ivory-10 border-dashed">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold" />
                                </div>
                            ) : quizzes.length > 0 ? (
                                quizzes.map(quiz => (
                                    <div key={quiz.id} className={`p-8 bg-navy-mid border rounded-sm flex items-center justify-between group transition-all shadow-xl ${quiz.is_active ? 'border-ivory-10' : 'border-red-500/20 opacity-70'}`}>
                                        <div className="flex items-center gap-6">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${quiz.is_required_for_booking ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gold/10 text-gold'}`}>
                                                <MessageSquare size={24} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-xl font-serif italic text-white">{quiz.title}</h3>
                                                    {quiz.is_required_for_booking && (
                                                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-bold uppercase tracking-widest">Bắt buộc</span>
                                                    )}
                                                    {quiz.is_public && (
                                                        <span className="px-2 py-0.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-[8px] font-bold uppercase tracking-widest">Công khai</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-ivory-45 uppercase tracking-widest mt-1">
                                                    {quiz.questions.length} câu hỏi • {quiz.total_attempts} lượt làm • {quiz.is_active ? 'Đang hoạt động' : 'Đã tắt'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Button variant="outline" size="sm" onClick={() => toggleActive(quiz)} className={quiz.is_active ? 'text-ivory-45' : 'text-emerald-500'}>
                                                {quiz.is_active ? 'Tắt' : 'Bật'}
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => setEditingQuiz(quiz)}>Chỉnh sửa</Button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-64 flex flex-col items-center justify-center border border-ivory-10 border-dashed rounded-sm">
                                    <AlertCircle size={48} className="text-ivory-10 mb-4" />
                                    <p className="text-ivory-45 font-medium tracking-widest uppercase text-xs">Chưa có khảo sát nào</p>
                                    <Button variant="ghost" onClick={handleCreateNew} className="mt-4 text-gold underline">Tạo ngay</Button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </ExpertDashboardLayout>
    );
}
