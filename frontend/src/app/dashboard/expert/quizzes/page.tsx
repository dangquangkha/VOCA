'use client';

import React, { useState, useEffect } from 'react';
import ExpertDashboardLayout from '@/components/dashboard/ExpertDashboardLayout';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { Plus, Trash2, Save, MessageSquare, AlertCircle, GripVertical, ChevronDown, ChevronUp, Copy, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface ScaleLabels {
    min: string;
    max: string;
}

interface Question {
    id: string;
    type: string;
    label: string;
    options?: string[];
    required: boolean;
    scale_labels?: ScaleLabels;
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
    const [expandedQId, setExpandedQId] = useState<string | null>(null);
    const [previewMode, setPreviewMode] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    const { token } = useAuthStore();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!token) return;
        fetchQuizzes();
    }, [token]);

    const fetchQuizzes = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('experts/quizzes/me');
            setQuizzes(data);
        } catch (err: any) {
            if (err.response?.status !== 401) {
                console.error("Failed to fetch quizzes", err);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNew = () => {
        const newId = `q1_${Date.now()}`;
        setEditingQuiz({
            title: "Khảo sát mới",
            description: "Vui lòng trả lời các câu hỏi sau để tôi chuẩn bị tốt hơn cho buổi hẹn.",
            questions: [
                { id: newId, type: "text", label: "Mục tiêu lớn nhất của bạn trong buổi tư vấn này là gì?", required: true }
            ],
            is_public: false,
            is_required_for_booking: false,
            is_active: true,
            total_attempts: 0
        });
        setExpandedQId(newId);
    };

    const addQuestion = () => {
        if (!editingQuiz) return;
        const newId = `q${editingQuiz.questions.length + 1}_${Date.now()}`;
        const newQuestion: Question = {
            id: newId,
            type: "text",
            label: "",
            required: true
        };
        setEditingQuiz({
            ...editingQuiz,
            questions: [...editingQuiz.questions, newQuestion]
        });
        setExpandedQId(newId);
    };

    const duplicateQuestion = (q: Question, index: number) => {
        if (!editingQuiz) return;
        const newId = `q_dup_${Date.now()}`;
        const newQuestion = { ...q, id: newId, label: q.label + " (Bản sao)" };
        const newQuestions = [...editingQuiz.questions];
        newQuestions.splice(index + 1, 0, newQuestion);
        setEditingQuiz({ ...editingQuiz, questions: newQuestions });
        setExpandedQId(newId);
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

    const updateScaleLabel = (id: string, field: 'min' | 'max', value: string) => {
        if (!editingQuiz) return;
        setEditingQuiz({
            ...editingQuiz,
            questions: editingQuiz.questions.map(q => {
                if (q.id === id) {
                    return { ...q, scale_labels: { ...(q.scale_labels || {min: 'Kém', max: 'Tốt'}), [field]: value } };
                }
                return q;
            })
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

    const removeOption = (qId: string, optIdx: number) => {
        if (!editingQuiz) return;
        setEditingQuiz({
            ...editingQuiz,
            questions: editingQuiz.questions.map(q => {
                if (q.id === qId) {
                    const newOpts = [...(q.options || [])];
                    newOpts.splice(optIdx, 1);
                    return { ...q, options: newOpts };
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

    const onDragEnd = (result: DropResult) => {
        if (!result.destination || !editingQuiz) return;
        const items = Array.from(editingQuiz.questions);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        setEditingQuiz({ ...editingQuiz, questions: items });
    };

    const validateQuiz = (): boolean => {
        if (!editingQuiz) return false;
        if (!editingQuiz.title.trim()) {
            alert("Vui lòng nhập tiêu đề khảo sát.");
            return false;
        }
        if (editingQuiz.questions.length === 0) {
            alert("Khảo sát phải có ít nhất 1 câu hỏi.");
            return false;
        }
        for (const q of editingQuiz.questions) {
            if (!q.label.trim()) {
                alert(`Câu hỏi không được để trống tiêu đề.`);
                setExpandedQId(q.id);
                return false;
            }
            if (q.type === 'radio' || q.type === 'checkbox') {
                if (!q.options || q.options.length < 2) {
                    alert(`Câu hỏi "${q.label}" cần ít nhất 2 lựa chọn.`);
                    setExpandedQId(q.id);
                    return false;
                }
                if (q.options.some(opt => !opt.trim())) {
                    alert(`Câu hỏi "${q.label}" có lựa chọn bị bỏ trống.`);
                    setExpandedQId(q.id);
                    return false;
                }
            }
        }
        return true;
    };

    const handleSave = async () => {
        if (!validateQuiz()) return;
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

    const handleDelete = async (quizId: number) => {
        if (!confirm("Bạn có chắc chắn muốn xóa khảo sát này? Hệ thống sẽ ẩn khảo sát để giữ dữ liệu cũ của học viên.")) return;
        try {
            await api.delete(`experts/quizzes/${quizId}`);
            fetchQuizzes();
        } catch (err) {
            alert("Không thể xóa khảo sát.");
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
                        <h1 className="text-3xl font-serif italic text-black">Quản lý Khảo sát</h1>
                        <p className="text-sm text-black/60 mt-2">Tạo các câu hỏi để học viên trả lời trước buổi hẹn hoặc công khai trên Lộ trình.</p>
                    </div>
                    {!editingQuiz && (
                        <Button onClick={handleCreateNew} className="gap-2 bg-[var(--sky)] hover:bg-[var(--sky-dark)] text-white border-none rounded-[2px]">
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
                            className="space-y-8 bg-white border border-black/10 p-8 rounded-[2px] shadow-2xl relative"
                        >
                            <div className="flex justify-between items-center pb-4 border-b border-black/10">
                                <h2 className="text-xl text-[var(--sky-dark)] font-serif italic font-bold">Chỉnh sửa Khảo sát</h2>
                                <Button variant="outline" size="sm" onClick={() => setPreviewMode(true)} className="border-black/20 text-black hover:bg-black/5 rounded-[2px]">
                                    <Eye size={16} className="mr-2" /> Xem trước
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] uppercase tracking-widest text-[var(--sky-dark)] font-bold">Tiêu đề khảo sát</label>
                                    <input type="text"
                                        value={editingQuiz.title}
                                        onChange={(e) => setEditingQuiz({...editingQuiz, title: e.target.value})}
                                        placeholder="VD: Khảo sát chuẩn bị Portfolio"
                                        className="bg-white border border-black/20 text-black text-xl font-serif italic focus:outline-none focus:border-[var(--sky)] focus:ring-1 focus:ring-[var(--sky-dim)] w-full px-4 py-3 rounded-[2px]"
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
                                            <div className={`w-10 h-5 rounded-full transition-colors ${editingQuiz.is_public ? 'bg-[var(--sky)]' : 'bg-black/20'}`} />
                                            <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${editingQuiz.is_public ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase tracking-widest text-black font-bold">Công khai</span>
                                            <span className="text-[8px] text-black/60 uppercase">Hiện trên trang Lộ trình</span>
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
                                            <div className={`w-10 h-5 rounded-full transition-colors ${editingQuiz.is_required_for_booking ? 'bg-emerald-500' : 'bg-black/20'}`} />
                                            <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${editingQuiz.is_required_for_booking ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase tracking-widest text-black font-bold">Bắt buộc</span>
                                            <span className="text-[8px] text-black/60 uppercase">Làm xong mới được đặt lịch</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] uppercase tracking-widest text-[var(--sky-dark)] font-bold">Mô tả</label>
                                <textarea 
                                    value={editingQuiz.description}
                                    onChange={(e) => setEditingQuiz({...editingQuiz, description: e.target.value})}
                                    className="w-full bg-white border border-black/20 p-4 text-sm text-black focus:outline-none focus:border-[var(--sky)] focus:ring-1 focus:ring-[var(--sky)] transition-all min-h-[100px] rounded-[2px]"
                                    placeholder="Hướng dẫn hoặc mô tả thêm về khảo sát..."
                                />
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between border-b border-black/10 pb-4">
                                    <h3 className="text-sm uppercase tracking-widest text-black font-bold">Danh sách câu hỏi</h3>
                                    <Button variant="outline" size="sm" onClick={addQuestion} className="h-8 px-4 border-black/20 text-black hover:bg-black/5 rounded-[2px]">
                                        <Plus size={14} className="mr-1" /> Thêm câu hỏi
                                    </Button>
                                </div>

                                {isMounted && (
                                    <DragDropContext onDragEnd={onDragEnd}>
                                        <Droppable droppableId="questions-list">
                                            {(provided) => (
                                                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                                                    {editingQuiz.questions.map((q, index) => {
                                                        const isExpanded = expandedQId === q.id;
                                                        return (
                                                            <Draggable key={q.id} draggableId={q.id} index={index}>
                                                                {(provided, snapshot) => (
                                                                    <div 
                                                                        ref={provided.innerRef}
                                                                        {...provided.draggableProps}
                                                                        className={`bg-white border ${snapshot.isDragging ? 'border-[var(--sky)] shadow-lg z-50' : 'border-black/20'} rounded-[2px] overflow-hidden transition-all`}
                                                                    >
                                                                        {/* Accordion Header */}
                                                                        <div className="flex items-center p-4 bg-black/5 hover:bg-black/10 transition-colors">
                                                                            <div {...provided.dragHandleProps} className="text-black/40 hover:text-[var(--sky)] cursor-grab mr-3">
                                                                                <GripVertical size={18} />
                                                                            </div>
                                                                            <div className="text-[var(--sky-dark)] font-mono text-xs mr-3 font-bold">0{index + 1}.</div>
                                                                            <div 
                                                                                className="flex-1 text-sm text-black truncate cursor-pointer font-medium"
                                                                                onClick={() => setExpandedQId(isExpanded ? null : q.id)}
                                                                            >
                                                                                {q.label || "Câu hỏi trống..."}
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <button 
                                                                                    onClick={() => duplicateQuestion(q, index)}
                                                                                    className="p-2 text-black/40 hover:text-black"
                                                                                    title="Nhân bản"
                                                                                >
                                                                                    <Copy size={16} />
                                                                                </button>
                                                                                <button 
                                                                                    onClick={() => removeQuestion(q.id)}
                                                                                    className="p-2 text-black/40 hover:text-red-500"
                                                                                    title="Xóa"
                                                                                >
                                                                                    <Trash2 size={16} />
                                                                                </button>
                                                                                <button 
                                                                                    onClick={() => setExpandedQId(isExpanded ? null : q.id)}
                                                                                    className="p-2 text-[var(--sky)]"
                                                                                >
                                                                                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                                                </button>
                                                                            </div>
                                                                        </div>

                                                                        {/* Accordion Body */}
                                                                        <AnimatePresence>
                                                                            {isExpanded && (
                                                                                <motion.div 
                                                                                    initial={{ height: 0, opacity: 0 }}
                                                                                    animate={{ height: 'auto', opacity: 1 }}
                                                                                    exit={{ height: 0, opacity: 0 }}
                                                                                    className="overflow-hidden"
                                                                                >
                                                                                    <div className="p-6 border-t border-black/10 space-y-4">
                                                                                        <input type="text"
                                                                                            value={q.label}
                                                                                            onChange={(e) => updateQuestion(q.id, 'label', e.target.value)}
                                                                                            placeholder="Nhập nội dung câu hỏi..."
                                                                                            className="bg-transparent border-b border-black/20 rounded-none px-0 py-2 text-black focus:outline-none focus:border-[var(--sky)] focus:ring-0 shadow-none border-t-0 border-l-0 border-r-0 w-full"
                                                                                        />
                                                                                        <div className="flex items-center gap-6">
                                                                                            <select 
                                                                                                value={q.type}
                                                                                                onChange={(e) => updateQuestion(q.id, 'type', e.target.value)}
                                                                                                className="bg-white border border-black/20 text-[10px] uppercase tracking-widest text-[var(--sky-dark)] font-bold focus:outline-none focus:border-[var(--sky)] p-2 rounded-[2px]"
                                                                                            >
                                                                                                <option value="text">Văn bản (Text)</option>
                                                                                                <option value="radio">Trắc nghiệm (1 Đáp án)</option>
                                                                                                <option value="checkbox">Nhiều lựa chọn (Multi)</option>
                                                                                                <option value="scale">Thang Likert (1-5)</option>
                                                                                            </select>
                                                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                                                <input 
                                                                                                    type="checkbox"
                                                                                                    checked={q.required}
                                                                                                    onChange={(e) => updateQuestion(q.id, 'required', e.target.checked)}
                                                                                                    className="accent-[var(--sky)]"
                                                                                                />
                                                                                                <span className="text-[10px] uppercase tracking-widest text-black/60 font-bold">Bắt buộc trả lời</span>
                                                                                            </label>
                                                                                        </div>

                                                                                        {(q.type === 'radio' || q.type === 'checkbox') && (
                                                                                            <div className="pl-4 border-l-2 border-black/10 space-y-3 mt-4">
                                                                                                <p className="text-[10px] uppercase tracking-widest text-black/60 font-bold">Các lựa chọn:</p>
                                                                                                {q.options?.map((opt, optIdx) => (
                                                                                                    <div key={optIdx} className="flex items-center gap-2 group">
                                                                                                        <div className={`w-3 h-3 border border-[var(--sky)] ${q.type === 'radio' ? 'rounded-full' : 'rounded-[2px]'}`} />
                                                                                                        <input type="text"
                                                                                                            value={opt}
                                                                                                            onChange={(e) => updateOption(q.id, optIdx, e.target.value)}
                                                                                                            className="bg-transparent border-none text-sm text-black focus:outline-none focus:text-black h-8 shadow-none p-0 px-2 hover:bg-black/5 rounded-[2px] w-full flex-1"
                                                                                                            placeholder={`Lựa chọn ${optIdx + 1}`}
                                                                                                        />
                                                                                                        <button 
                                                                                                            onClick={() => removeOption(q.id, optIdx)}
                                                                                                            className="opacity-0 group-hover:opacity-100 p-1 text-black/40 hover:text-red-500 transition-opacity"
                                                                                                        >
                                                                                                            <Trash2 size={14} />
                                                                                                        </button>
                                                                                                    </div>
                                                                                                ))}
                                                                                                <button 
                                                                                                    onClick={() => addOption(q.id)}
                                                                                                    className="text-[10px] uppercase tracking-widest text-[var(--sky-dark)] font-bold hover:underline flex items-center mt-2"
                                                                                                >
                                                                                                    <Plus size={12} className="mr-1"/> Thêm lựa chọn
                                                                                                </button>
                                                                                            </div>
                                                                                        )}

                                                                                        {q.type === 'scale' && (
                                                                                            <div className="flex items-center gap-4 mt-4 bg-[var(--sky-pale)] p-4 rounded-[2px] border border-[var(--sky-dim)]">
                                                                                                <div className="flex-1 space-y-2">
                                                                                                    <label className="text-[10px] uppercase text-black/60 font-bold">Nhãn mức 1 (Tối thiểu)</label>
                                                                                                    <input type="text"
                                                                                                        value={q.scale_labels?.min || "Rất không hài lòng"}
                                                                                                        onChange={(e) => updateScaleLabel(q.id, 'min', e.target.value)}
                                                                                                        className="text-sm bg-white text-black border border-black/20 focus:outline-none focus:border-[var(--sky)] w-full px-3 py-2 rounded-[2px]"
                                                                                                    />
                                                                                                </div>
                                                                                                <div className="flex-1 space-y-2">
                                                                                                    <label className="text-[10px] uppercase text-black/60 font-bold">Nhãn mức 5 (Tối đa)</label>
                                                                                                    <input type="text"
                                                                                                        value={q.scale_labels?.max || "Rất hài lòng"}
                                                                                                        onChange={(e) => updateScaleLabel(q.id, 'max', e.target.value)}
                                                                                                        className="text-sm bg-white text-black border border-black/20 focus:outline-none focus:border-[var(--sky)] w-full px-3 py-2 rounded-[2px]"
                                                                                                    />
                                                                                                </div>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </motion.div>
                                                                            )}
                                                                        </AnimatePresence>
                                                                    </div>
                                                                )}
                                                            </Draggable>
                                                        )
                                                    })}
                                                    {provided.placeholder}
                                                </div>
                                            )}
                                        </Droppable>
                                    </DragDropContext>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-4 pt-8">
                                <Button variant="outline" className="border-black/20 text-black hover:bg-black/5 rounded-[2px]" onClick={() => {
                                    if(confirm("Hủy bỏ các thay đổi?")) setEditingQuiz(null);
                                }}>Hủy bỏ</Button>
                                <Button onClick={handleSave} isLoading={isSaving} className="gap-2 bg-[var(--sky)] hover:bg-[var(--sky-dark)] text-white border-none rounded-[2px]">
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
                                <div className="h-64 flex items-center justify-center border border-black/10 border-dashed rounded-[2px]">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[var(--sky)]" />
                                </div>
                            ) : quizzes.length > 0 ? (
                                quizzes.map(quiz => (
                                    <div key={quiz.id} className={`p-8 bg-white border rounded-[2px] flex items-center justify-between group transition-all shadow-sm hover:shadow-md ${quiz.is_active ? 'border-black/20' : 'border-black/10 opacity-70'}`}>
                                        <div className="flex items-center gap-6">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${quiz.is_required_for_booking ? 'bg-emerald-50 text-emerald-500' : 'bg-[var(--sky-pale)] text-[var(--sky)]'}`}>
                                                <MessageSquare size={24} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-xl font-serif italic text-black font-bold">{quiz.title}</h3>
                                                    {quiz.is_required_for_booking && (
                                                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-[8px] font-bold uppercase tracking-widest">Bắt buộc</span>
                                                    )}
                                                    {quiz.is_public && (
                                                        <span className="px-2 py-0.5 rounded-full bg-[var(--sky-pale)] border border-[var(--sky-dim)] text-[var(--sky-dark)] text-[8px] font-bold uppercase tracking-widest">Công khai</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-black/60 uppercase tracking-widest mt-1">
                                                    {quiz.questions.length} câu hỏi • {quiz.total_attempts} lượt làm • {quiz.is_active ? 'Đang hoạt động' : 'Đã tắt'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Button variant="outline" size="sm" onClick={() => toggleActive(quiz)} className={`rounded-[2px] ${quiz.is_active ? 'text-black/60 border-black/20' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'}`}>
                                                {quiz.is_active ? 'Tắt' : 'Bật'}
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => setEditingQuiz(quiz)} className="border-black/20 text-black rounded-[2px] hover:bg-black/5">Chỉnh sửa</Button>
                                            <Button variant="outline" size="sm" onClick={() => quiz.id && handleDelete(quiz.id)} className="text-red-500 border-red-200 hover:bg-red-50 rounded-[2px]">
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-64 flex flex-col items-center justify-center border border-black/20 border-dashed rounded-[2px]">
                                    <AlertCircle size={48} className="text-black/20 mb-4" />
                                    <p className="text-black/60 font-bold tracking-widest uppercase text-xs">Chưa có khảo sát nào</p>
                                    <Button variant="ghost" onClick={handleCreateNew} className="mt-4 text-[var(--sky)] underline hover:bg-transparent">Tạo ngay</Button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Preview Modal */}
                <AnimatePresence>
                    {previewMode && editingQuiz && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
                        >
                            <div className="bg-white max-w-3xl w-full p-8 rounded-[2px] border border-black/10 relative mt-20 mb-20 shadow-2xl">
                                <button onClick={() => setPreviewMode(false)} className="absolute top-4 right-4 text-black/40 hover:text-black">
                                    ✕ Đóng
                                </button>
                                <div className="mb-8 text-center">
                                    <h2 className="text-2xl font-serif italic text-[var(--sky-dark)] font-bold">{editingQuiz.title}</h2>
                                    <p className="text-sm text-black/80 mt-4 max-w-xl mx-auto">{editingQuiz.description}</p>
                                </div>
                                
                                <div className="space-y-8 pointer-events-none">
                                    {editingQuiz.questions.map((q, idx) => (
                                        <div key={idx} className="space-y-3 p-6 bg-[var(--sky-pale)] rounded-[2px]">
                                            <h3 className="text-lg text-black font-medium">
                                                <span className="text-[var(--sky)] mr-2 font-bold">{idx + 1}.</span> 
                                                {q.label || "Câu hỏi trống"}
                                                {q.required && <span className="text-red-500 ml-1">*</span>}
                                            </h3>
                                            
                                            {q.type === 'text' && (
                                                <textarea className="w-full bg-white border border-black/20 p-3 text-black rounded-[2px] min-h-[100px]" placeholder="Câu trả lời của bạn..." />
                                            )}
                                            
                                            {q.type === 'radio' && q.options && (
                                                <div className="space-y-2">
                                                    {q.options.map((opt, i) => (
                                                        <label key={i} className="flex items-center gap-3 text-black">
                                                            <input type="radio" name={`preview_${q.id}`} className="accent-[var(--sky)] w-4 h-4" />
                                                            {opt || "Lựa chọn trống"}
                                                        </label>
                                                    ))}
                                                </div>
                                            )}

                                            {q.type === 'checkbox' && q.options && (
                                                <div className="space-y-2">
                                                    {q.options.map((opt, i) => (
                                                        <label key={i} className="flex items-center gap-3 text-black">
                                                            <input type="checkbox" className="accent-[var(--sky)] w-4 h-4 rounded-sm" />
                                                            {opt || "Lựa chọn trống"}
                                                        </label>
                                                    ))}
                                                </div>
                                            )}

                                            {q.type === 'scale' && (
                                                <div className="py-4">
                                                    <div className="flex justify-between text-xs text-black/60 mb-2 px-2 font-bold">
                                                        <span>{q.scale_labels?.min || "Rất không hài lòng"}</span>
                                                        <span>{q.scale_labels?.max || "Rất hài lòng"}</span>
                                                    </div>
                                                    <div className="flex justify-between gap-2">
                                                        {[1,2,3,4,5].map(v => (
                                                            <button key={v} className="flex-1 py-3 bg-white border border-black/20 rounded-[2px] text-black font-bold">
                                                                {v}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-8 flex justify-end">
                                    <Button onClick={() => setPreviewMode(false)} className="w-full md:w-auto bg-[var(--sky)] hover:bg-[var(--sky-dark)] text-white border-none rounded-[2px]">Quay lại chỉnh sửa</Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </ExpertDashboardLayout>
    );
}
