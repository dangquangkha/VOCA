'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Video, Calendar, Clock, Users, Trash2, ArrowLeft, X, Sparkles, ChevronRight } from 'lucide-react';
import api from '@/lib/api';
import { GroupSession, GroupSessionStatus } from '@/types/group_session';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import ExpertDashboardLayout from '@/components/dashboard/ExpertDashboardLayout';

export default function ExpertGroupSessionsPage() {
  const [sessions, setSessions] = useState<GroupSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<GroupSession | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(5);
  const [pricePerParticipant, setPricePerParticipant] = useState(100);
  const [meetingUrl, setMeetingUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('group-sessions/my-sessions');
      setSessions(data);
    } catch (err) {
      console.error('Failed to fetch group sessions', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !sessionDate || !startTime || !endTime) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('group-sessions', {
        title,
        description,
        session_date: sessionDate,
        start_time: startTime,
        end_time: endTime,
        max_participants: Number(maxParticipants),
        price_per_participant: Number(pricePerParticipant),
        meeting_url: meetingUrl.trim() || null
      });
      alert('Tạo lớp chuyên đề thành công!');
      setShowCreateModal(false);
      resetForm();
      fetchSessions();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Không thể tạo lớp học. Vui lòng kiểm tra lại.';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelSession = async (sessionId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy lớp học này? Hệ thống sẽ hoàn lại toàn bộ credits cho các học viên đã đăng ký.')) {
      return;
    }
    try {
      await api.post(`group-sessions/${sessionId}/cancel`);
      alert('Lớp học đã được hủy thành công và hoàn tiền cho học viên.');
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null);
      }
      fetchSessions();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Lỗi khi hủy lớp học.');
    }
  };

  const handleUpdateMeetingUrl = async (session: GroupSession) => {
    const url = window.prompt('Nhập link phòng họp trực tuyến (Google Meet, Zoom, Teams...):', session.meeting_url || '');
    if (url === null) return; // Hủy nhập
    try {
      const { data } = await api.put(`group-sessions/${session.id}`, {
        meeting_url: url.trim() || null
      });
      alert('Cập nhật phòng học trực tuyến thành công!');
      setSelectedSession(data);
      fetchSessions();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Không thể cập nhật link phòng học.');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSessionDate('');
    setStartTime('');
    setEndTime('');
    setMaxParticipants(5);
    setPricePerParticipant(100);
    setMeetingUrl('');
  };

  return (
    <ExpertDashboardLayout>
      <div className="space-y-12 max-w-6xl mx-auto py-8">
        {/* Back link / Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-black text-black/40 uppercase tracking-[0.2em] mb-4">
          <Link href="/dashboard/expert" className="hover:text-[#00A4FD] transition-colors flex items-center gap-1.5">
            <ArrowLeft size={12} strokeWidth={2.5} /> Bảng điều khiển
          </Link>
          <span>/</span>
          <span className="text-[#00A4FD]">Lớp chuyên đề</span>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-black/5 pb-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-garamond italic font-bold text-black flex items-center gap-3">
              <Video className="w-8 h-8 text-[#00A4FD]" /> Quản lý Lớp chuyên đề
            </h1>
            <p className="text-black/40 text-xs font-black uppercase tracking-widest">THIẾT LẬP WORKSHOP & LỚP HỌC ĐẶC BIỆT CỦA BẠN</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-3 bg-[#0046EA] hover:bg-black text-[#FFE900] font-black uppercase tracking-widest text-[11px] px-8 py-5 transition-all duration-300 border border-[#0046EA] shadow-lg shadow-[#0046EA]/10 hover:shadow-xl cursor-pointer"
          >
            <Plus size={16} /> Mở Lớp Chuyên Đề Mới
          </button>
        </div>

        {isLoading ? (
          <div className="py-24 text-center">
            <div className="w-12 h-12 border-2 border-black/5 border-t-[#0046EA] rounded-full animate-spin mx-auto mb-6" />
            <p className="text-[10px] font-black text-black/20 uppercase tracking-[0.4em]">ĐANG TẢI DỮ LIỆU...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* List area */}
            <div className="lg:col-span-2 space-y-6">
              {sessions.length === 0 ? (
                <div className="text-center py-20 bg-[#F5F8FF] border-[6px] border-[#00A4FD]/20 p-12">
                  <Sparkles className="w-16 h-16 text-black/10 mx-auto mb-6 animate-pulse" />
                  <h3 className="text-lg font-bold text-black uppercase tracking-widest mb-2">Chưa có lớp học nào</h3>
                  <p className="text-xs text-black/40 uppercase tracking-[0.2em] leading-relaxed">BẤM NÚT PHÍA TRÊN ĐỂ BẤT ĐẦU MỞ LỚP CHUYÊN ĐỀ ĐẦU TIÊN CỦA BẠN</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {sessions.map((s) => {
                    const isActive = selectedSession?.id === s.id;
                    const isCancelled = s.status === GroupSessionStatus.CANCELLED;
                    return (
                      <div
                        key={s.id}
                        onClick={() => setSelectedSession(s)}
                        className={`p-8 bg-white border-[6px] transition-all duration-500 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-xl hover:-translate-y-1 ${
                          isActive 
                            ? 'border-[#0046EA] shadow-lg shadow-[#0046EA]/10' 
                            : 'border-[#00A4FD]/20 hover:border-[#00A4FD]'
                        }`}
                      >
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-4">
                            <span
                              className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider border ${
                                isCancelled
                                  ? 'bg-red-50/50 text-red-600 border-red-200'
                                  : s.status === GroupSessionStatus.FULL
                                  ? 'bg-yellow-50/50 text-yellow-600 border-yellow-200'
                                  : 'bg-green-50/50 text-green-600 border-green-200'
                              }`}
                            >
                              {isCancelled ? 'ĐÃ HỦY' : s.status === GroupSessionStatus.FULL ? 'ĐẦY CHỖ' : 'ĐANG MỞ'}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-black/40 tabular-nums">
                              {s.price_per_participant} Credits / người
                            </span>
                          </div>
                          <h3 className="text-lg font-black text-black uppercase tracking-wide leading-tight">{s.title}</h3>
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] font-bold text-black/50">
                            <span className="flex items-center gap-2">
                              <Calendar size={14} className="text-[#00A4FD]" /> {s.session_date}
                            </span>
                            <span className="flex items-center gap-2">
                              <Clock size={14} className="text-[#00A4FD]" /> {s.start_time} - {s.end_time}
                            </span>
                            <span className="flex items-center gap-2">
                              <Users size={14} className="text-[#00A4FD]" /> {s.current_participants} / {s.max_participants} học viên
                            </span>
                          </div>
                        </div>

                        {!isCancelled && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelSession(s.id);
                            }}
                            className="self-start md:self-auto p-4 text-black/20 hover:text-red-500 hover:bg-red-50 transition-all duration-300 cursor-pointer"
                            title="Hủy lớp chuyên đề"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Details area */}
            <div className="lg:col-span-1">
              {selectedSession ? (
                <div className="p-8 bg-[#F5F8FF] border-[6px] border-[#00A4FD]/20 space-y-8 sticky top-24">
                  <div className="space-y-4">
                    <h3 className="text-[11px] font-black text-[#00A4FD] uppercase tracking-[0.4em]">CHI TIẾT LỚP HỌC</h3>
                    <h2 className="text-xl font-black text-black uppercase tracking-wide leading-tight">{selectedSession.title}</h2>
                    {selectedSession.description && (
                      <p className="text-xs text-black/60 leading-relaxed bg-white border border-[#00A4FD]/15 p-5">
                        {selectedSession.description}
                      </p>
                    )}
                  </div>

                  {/* Meeting Link Section */}
                  <div className="border-t border-black/10 pt-6 space-y-4">
                    <h4 className="text-[10px] font-black text-black/40 uppercase tracking-[0.3em]">PHÒNG HỌC TRỰC TUYẾN</h4>
                    {selectedSession.status !== GroupSessionStatus.CANCELLED ? (
                      <div className="p-5 bg-white border border-[#00A4FD]/15 space-y-4 shadow-sm">
                        {selectedSession.meeting_url ? (
                          <div className="space-y-3">
                            <a
                              href={selectedSession.meeting_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-xs font-black text-[#0046EA] hover:text-black uppercase tracking-wider break-all leading-normal"
                            >
                              <Video size={14} className="shrink-0" /> Link phòng: {selectedSession.meeting_url}
                            </a>
                            <button
                              onClick={() => handleUpdateMeetingUrl(selectedSession)}
                              className="w-full py-3 bg-[#F5F8FF] hover:bg-black hover:text-white text-[#0046EA] font-bold text-[9px] uppercase tracking-widest transition-all duration-300 border border-transparent hover:border-black cursor-pointer"
                            >
                              Cập nhật Link Phòng
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3 text-center py-2">
                            <p className="text-[10px] text-black/40 uppercase tracking-wider">Chưa cấu hình link meeting</p>
                            <button
                              onClick={() => handleUpdateMeetingUrl(selectedSession)}
                              className="w-full py-3 bg-[#0046EA] hover:bg-black text-[#FFE900] font-black text-[9px] uppercase tracking-widest transition-all duration-300 cursor-pointer"
                            >
                              Thiết lập Phòng học
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">LỚP HỌC ĐÃ HỦY</p>
                    )}
                  </div>

                  <div className="border-t border-black/10 pt-6 space-y-4">
                    <h4 className="text-[10px] font-black text-black uppercase tracking-[0.3em]">HỌC VIÊN ĐĂNG KÝ ({selectedSession.participants?.length || 0})</h4>
                    
                    {selectedSession.participants && selectedSession.participants.length > 0 ? (
                      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {selectedSession.participants.map((p) => (
                          <div key={p.id} className="p-4 bg-white border border-[#00A4FD]/15 space-y-3 hover:border-[#0046EA] transition-all">
                            <Link href={`/dashboard/expert/student/${p.student_id}`} className="flex items-center justify-between gap-3 group">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="w-8 h-8 bg-[#0046EA]/10 overflow-hidden flex items-center justify-center font-bold text-xs text-[#0046EA] group-hover:bg-[#0046EA] group-hover:text-white transition-all shrink-0">
                                  {p.student?.full_name?.charAt(0) || p.student?.email?.charAt(0) || 'S'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="block text-xs font-black text-black truncate uppercase tracking-wider group-hover:text-[#0046EA] transition-all">
                                    {p.student?.full_name || 'Học viên'}
                                  </span>
                                  <span className="block text-[9px] text-black/40 truncate">
                                    {p.student?.email}
                                  </span>
                                </div>
                              </div>
                              <ChevronRight size={14} className="text-black/20 group-hover:text-[#0046EA] group-hover:translate-x-1 transition-all shrink-0" />
                            </Link>
                            {p.student_note && (
                              <div className="text-[10px] text-black/60 italic bg-black/5 px-4 py-2">
                                "{p.student_note}"
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] font-black text-black/20 uppercase tracking-widest text-center py-6">CHƯA CÓ HỌC VIÊN ĐĂNG KÝ</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 border border-dashed border-black/20 text-center py-24 text-black/20 animate-pulse">
                  <Users size={32} className="mx-auto mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed">CHỌN MỘT LỚP HỌC ĐỂ XEM CHI TIẾT HỌC VIÊN</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Creation Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowCreateModal(false)}
                className="absolute inset-0 bg-[#0046EA]/20 backdrop-blur-3xl"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-2xl bg-white border-[6px] border-[#00A4FD]/45 shadow-2xl p-12 overflow-hidden z-10"
              >
                <div className="flex items-center justify-between border-b border-black/5 pb-6 mb-8">
                  <h2 className="text-2xl font-garamond italic font-bold text-black flex items-center gap-3">
                    <Sparkles size={20} className="text-[#00A4FD]" /> Mở lớp chuyên đề mới
                  </h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 hover:bg-black/5 text-black/40 hover:text-black transition-all"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleCreateSession} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="space-y-2">
                    <label className="block text-[9px] font-black text-black/40 uppercase tracking-[0.3em]">Tiêu đề buổi chuyên đề *</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ví dụ: Bí Quyết Đột Phá Lương Ngành IT..."
                      className="w-full bg-[#F5F8FF] border-[2px] border-[#00A4FD]/20 px-6 py-4 focus:outline-none focus:border-[#0046EA] transition-all text-sm text-black"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[9px] font-black text-black/40 uppercase tracking-[0.3em]">Mô tả nội dung</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Mô tả tóm tắt nội dung chính và mục tiêu của buổi chia sẻ..."
                      rows={3}
                      className="w-full bg-[#F5F8FF] border-[2px] border-[#00A4FD]/20 p-6 focus:outline-none focus:border-[#0046EA] transition-all text-sm text-black resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="block text-[9px] font-black text-black/40 uppercase tracking-[0.3em]">Ngày diễn ra *</label>
                      <input
                        type="date"
                        required
                        value={sessionDate}
                        onChange={(e) => setSessionDate(e.target.value)}
                        className="w-full bg-[#F5F8FF] border-[2px] border-[#00A4FD]/20 px-6 py-4 focus:outline-none focus:border-[#0046EA] transition-all text-sm text-black"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[9px] font-black text-black/40 uppercase tracking-[0.3em]">Giờ bắt đầu *</label>
                      <input
                        type="time"
                        required
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full bg-[#F5F8FF] border-[2px] border-[#00A4FD]/20 px-6 py-4 focus:outline-none focus:border-[#0046EA] transition-all text-sm text-black"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[9px] font-black text-black/40 uppercase tracking-[0.3em]">Giờ kết thúc *</label>
                      <input
                        type="time"
                        required
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full bg-[#F5F8FF] border-[2px] border-[#00A4FD]/20 px-6 py-4 focus:outline-none focus:border-[#0046EA] transition-all text-sm text-black"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-[9px] font-black text-black/40 uppercase tracking-[0.3em]">Số học viên tối đa</label>
                      <input
                        type="number"
                        min={2}
                        max={50}
                        value={maxParticipants}
                        onChange={(e) => setMaxParticipants(parseInt(e.target.value) || 5)}
                        className="w-full bg-[#F5F8FF] border-[2px] border-[#00A4FD]/20 px-6 py-4 focus:outline-none focus:border-[#0046EA] transition-all text-sm text-black text-center font-bold"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[9px] font-black text-black/40 uppercase tracking-[0.3em]">Học phí (Credits)</label>
                      <input
                        type="number"
                        min={0}
                        value={pricePerParticipant}
                        onChange={(e) => setPricePerParticipant(parseInt(e.target.value) || 0)}
                        className="w-full bg-[#F5F8FF] border-[2px] border-[#00A4FD]/20 px-6 py-4 focus:outline-none focus:border-[#0046EA] transition-all text-sm text-black text-center font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[9px] font-black text-black/40 uppercase tracking-[0.3em]">Link phòng họp trực tuyến (Meet, Zoom...)</label>
                    <input
                      type="url"
                      value={meetingUrl}
                      onChange={(e) => setMeetingUrl(e.target.value)}
                      placeholder="https://meet.google.com/abc-defg-hij (Không bắt buộc)"
                      className="w-full bg-[#F5F8FF] border-[2px] border-[#00A4FD]/20 px-6 py-4 focus:outline-none focus:border-[#0046EA] transition-all text-sm text-black"
                    />
                  </div>

                  <div className="flex gap-6 pt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        resetForm();
                      }}
                      className="flex-1 py-5 border border-black/10 text-black/40 font-black uppercase tracking-[0.3em] text-[10px] hover:bg-black/5 hover:text-black transition-all cursor-pointer"
                    >
                      HỦY BỎ
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-5 bg-[#0046EA] text-[#FFE900] font-black uppercase tracking-[0.3em] text-[10px] hover:bg-black hover:text-white transition-all shadow-xl disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmitting ? 'ĐANG TẠO...' : 'MỞ LỚP NGAY'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </ExpertDashboardLayout>
  );
}
