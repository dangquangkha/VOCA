'use client';

import React, { useEffect, useState } from 'react';
import { Video, Calendar, Clock, ExternalLink, MessageSquare, AlertCircle, Sparkles, X, ChevronRight, Heart, Award } from 'lucide-react';
import api from '@/lib/api';
import { GroupSession, GroupSessionStatus } from '@/types/group_session';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';
import { getAvatarUrl } from '@/utils/url-utils';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

const EASING: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function StudentGroupSessionsPage() {
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<GroupSession[]>([]);
  const [exploreSessions, setExploreSessions] = useState<GroupSession[]>([]);
  const [activeTab, setActiveTab] = useState<'my-sessions' | 'explore'>('my-sessions');
  const [isLoading, setIsLoading] = useState(true);
  const [isExploreLoading, setIsExploreLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState<GroupSession | null>(null);
  const [joinNote, setJoinNote] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    fetchMyRegistrations();
    fetchExploreSessions();
  }, []);

  const fetchMyRegistrations = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('group-sessions/my-registrations');
      setSessions(data);
    } catch (err) {
      console.error('Failed to fetch my registrations', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExploreSessions = async () => {
    setIsExploreLoading(true);
    try {
      const { data } = await api.get('group-sessions', {
        params: { status: 'OPEN' }
      });
      setExploreSessions(data);
    } catch (err) {
      console.error('Failed to fetch explore sessions', err);
    } finally {
      setIsExploreLoading(false);
    }
  };

  const handleJoinSession = async () => {
    if (!selectedSession) return;
    if (user && user.credits < selectedSession.price_per_participant) {
      alert('Tài khoản của bạn không đủ credits để đăng ký lớp học này.');
      return;
    }
    setIsJoining(true);
    try {
      await api.post(`group-sessions/${selectedSession.id}/join`, {
        student_note: joinNote
      });
      
      // Deduct locally to reflect change instantly
      const authStore = useAuthStore.getState();
      if (authStore.user) {
        const updatedCredits = authStore.user.credits - selectedSession.price_per_participant;
        useAuthStore.setState({ user: { ...authStore.user, credits: updatedCredits } });
      }
      
      alert('Đăng ký lớp học chuyên đề thành công!');
      setSelectedSession(null);
      setJoinNote('');
      
      // Refresh both lists
      await Promise.all([fetchMyRegistrations(), fetchExploreSessions()]);
      setActiveTab('my-sessions');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Đăng ký không thành công. Vui lòng thử lại.';
      alert(msg);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-12 max-w-5xl mx-auto py-8">
      {/* Header */}
      <div className="space-y-4 border-b border-black/5 pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-garamond italic font-bold text-black flex items-center gap-3">
              <Video className="w-8 h-8 text-[#00A4FD]" /> Lớp Chuyên Đề & Workshop
            </h1>
            <p className="text-black/40 text-xs font-black uppercase tracking-widest">
              LỊCH TRÌNH VÀ PHÒNG HỌP TRỰC TUYẾN CÁC WORKSHOP BẠN ĐÃ ĐĂNG KÝ
            </p>
          </div>
          {user && (
            <div className="bg-[#F5F8FF] border border-black/5 px-6 py-3 rounded-2xl flex items-center gap-3 w-fit">
              <span className="text-[10px] font-black text-black/40 uppercase tracking-widest">Số dư tài khoản:</span>
              <span className="text-sm font-black text-[#0046EA]">{user.credits} CR</span>
            </div>
          )}
        </div>

        {/* Instructions Alert */}
        <div className="bg-[#F5F8FF] border border-[#00A4FD]/20 p-5 rounded-[24px] flex gap-4 text-xs leading-relaxed text-black/60 font-dm-sans">
          <AlertCircle className="w-5 h-5 text-[#00A4FD] shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-black mb-1">💡 Hướng dẫn tham gia Lớp học chuyên đề:</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Qua tab <span className="font-bold text-[#0046EA]">Khám phá lớp chuyên đề</span> bên dưới để lựa chọn các lớp học bạn quan tâm.</li>
              <li>Nhấp vào nút <span className="font-bold text-[#0046EA]">ĐĂNG KÝ</span> và dùng số dư Credits để xác nhận giữ chỗ.</li>
              <li>Sau khi đăng ký, lớp học sẽ chuyển qua tab <span className="font-bold text-[#0046EA]">Lớp của tôi</span>. Bạn có thể vào phòng học trực tuyến (Google Meet/Zoom) bằng nút <span className="font-bold text-[#0046EA]">VÀO PHÒNG HỌC</span> trước giờ diễn ra lớp học.</li>
            </ol>
          </div>
        </div>

        {/* Tab selection */}
        <div className="flex gap-4 pt-4">
          <button
            onClick={() => setActiveTab('my-sessions')}
            className={`pb-4 px-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all duration-300 ${
              activeTab === 'my-sessions' ? 'border-[#0046EA] text-[#0046EA]' : 'border-transparent text-black/40 hover:text-black'
            }`}
          >
            Lớp của tôi ({sessions.length})
          </button>
          <button
            onClick={() => setActiveTab('explore')}
            className={`pb-4 px-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all duration-300 ${
              activeTab === 'explore' ? 'border-[#0046EA] text-[#0046EA]' : 'border-transparent text-black/40 hover:text-black'
            }`}
          >
            Khám phá lớp chuyên đề ({exploreSessions.length})
          </button>
        </div>
      </div>

      {activeTab === 'my-sessions' ? (
        isLoading ? (
          <div className="py-24 text-center">
            <div className="w-12 h-12 border-2 border-black/5 border-t-[#0046EA] rounded-full animate-spin mx-auto mb-6" />
            <p className="text-[10px] font-black text-black/20 uppercase tracking-[0.4em]">ĐANG TẢI DỮ LIỆU LỚP HỌC...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-24 bg-[#F5F8FF] border border-black/5 rounded-[64px] p-12 max-w-3xl mx-auto">
            <Sparkles className="w-16 h-16 text-[#0046EA]/10 mx-auto mb-6 animate-pulse" />
            <h3 className="text-xl font-bold text-black uppercase tracking-wider mb-3">Chưa tham gia lớp nào</h3>
            <p className="text-xs text-black/40 uppercase tracking-widest mb-10 leading-relaxed">
              Bạn chưa đăng ký lớp học chuyên đề nào. Hãy sang tab Khám phá lớp chuyên đề để tham gia các buổi học cực kỳ bổ ích từ các chuyên gia.
            </p>
            <button
              onClick={() => setActiveTab('explore')}
              className="bg-[#0046EA] hover:bg-black text-[#FFE900] font-black uppercase tracking-wider text-[10px] px-8 py-5 rounded-full transition-all duration-300 shadow-xl"
            >
              KHÁM PHÁ CÁC LỚP CHUYÊN ĐỀ
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {sessions.map((s) => {
              const isCancelled = s.status === GroupSessionStatus.CANCELLED;
              const expertName = s.expert?.user?.full_name || 'Chuyên gia';
              const avatarSrc = getAvatarUrl(s.expert?.user?.avatar_url, expertName);

              return (
                <div
                  key={s.id}
                  className="p-8 bg-white border border-black/5 rounded-[48px] hover:shadow-2xl transition-all duration-500 flex flex-col justify-between gap-6 hover:border-[#0046EA]/20"
                >
                  <div className="space-y-6">
                    {/* Status & Title */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1 text-[8px] font-black uppercase tracking-wider rounded-full ${
                            isCancelled
                              ? 'bg-red-50 text-red-500 border border-red-200'
                              : s.status === GroupSessionStatus.COMPLETED
                              ? 'bg-black/5 text-black/40 border border-black/10'
                              : 'bg-green-50 text-green-600 border border-green-200'
                          }`}
                        >
                          {isCancelled ? 'ĐÃ HỦY' : s.status === GroupSessionStatus.COMPLETED ? 'ĐÃ HOÀN THÀNH' : 'SẮP DIỄN RA'}
                        </span>
                        {isCancelled && (
                          <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider flex items-center gap-1">
                            <AlertCircle size={10} /> ĐÃ HOÀN CREDITS
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-black text-[#171716] uppercase tracking-wide leading-snug">
                        {s.title}
                      </h3>
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-black/5 text-[10px] font-black uppercase tracking-widest text-black/40">
                      <div className="space-y-1">
                        <span className="block text-[8px] opacity-60">Ngày diễn ra</span>
                        <span className="block text-black font-bold text-xs">{s.session_date}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="block text-[8px] opacity-60">Thời gian</span>
                        <span className="block text-[#0046EA] font-bold text-xs">
                          {s.start_time} - {s.end_time}
                        </span>
                      </div>
                    </div>

                    {/* Expert Details */}
                    <div className="flex items-center gap-3 bg-[#F5F8FF] p-4 rounded-[28px] border border-black/5">
                      <div className="w-8 h-8 rounded-full border border-black/5 overflow-hidden">
                        <img src={avatarSrc} alt={expertName} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block text-[8px] font-black text-black/30 uppercase tracking-widest">Giảng viên / Chuyên gia</span>
                        <span className="block text-xs font-black text-black uppercase tracking-wider truncate">
                          {expertName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 flex items-center justify-between gap-4">
                    {isCancelled ? (
                      <p className="text-[10px] font-black text-red-400 uppercase tracking-wider">
                        BUỔI HỌC ĐÃ BỊ HỦY BỞI CHUYÊN GIA
                      </p>
                    ) : s.meeting_url ? (
                      <a
                        href={s.meeting_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1"
                      >
                        <button className="w-full py-4 bg-[#0046EA] hover:bg-black text-[#FFE900] font-black uppercase tracking-wider text-[10px] rounded-full transition-all duration-300 flex items-center justify-center gap-2 shadow-lg">
                          <Video size={14} /> VÀO PHÒNG HỌC <ExternalLink size={12} />
                        </button>
                      </a>
                    ) : (
                      <div className="flex-1 bg-black/5 py-4 px-6 rounded-full text-center border border-black/5 text-[9px] font-black text-black/40 uppercase tracking-wider flex items-center justify-center gap-2">
                        <AlertCircle size={14} /> LINK PHÒNG HỌC CHƯA CÓ
                      </div>
                    )}

                    <Link href={`/dashboard/chat?with=${s.expert?.user_id}`}>
                      <button className="p-4 border border-black/10 hover:border-black rounded-full text-black/40 hover:text-black transition-all" title="Liên hệ chuyên gia">
                        <MessageSquare size={16} />
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        isExploreLoading ? (
          <div className="py-24 text-center">
            <div className="w-12 h-12 border-2 border-black/5 border-t-[#0046EA] rounded-full animate-spin mx-auto mb-6" />
            <p className="text-[10px] font-black text-black/20 uppercase tracking-[0.4em]">ĐANG TẢI DỮ LIỆU WORKSHOP...</p>
          </div>
        ) : exploreSessions.length === 0 ? (
          <div className="text-center py-24 bg-[#F5F8FF] border border-black/5 rounded-[64px] p-12 max-w-3xl mx-auto">
            <Sparkles className="w-16 h-16 text-[#0046EA]/10 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-black uppercase tracking-wider mb-2">Chưa có lớp học chuyên đề nào được mở</h3>
            <p className="text-xs text-black/40 uppercase tracking-widest mb-4">
              Vui lòng quay lại sau khi các chuyên gia tạo lịch lớp học mới.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {exploreSessions.map((s) => {
              const expertName = s.expert?.user?.full_name || 'Chuyên gia';
              const avatarSrc = getAvatarUrl(s.expert?.user?.avatar_url, expertName);
              const isRegistered = s.participants?.some(p => p.student_id === user?.id && p.status !== 'CANCELLED');
              const isFull = s.available_slots <= 0;

              return (
                <div
                  key={s.id}
                  className="p-8 bg-white border border-black/5 rounded-[48px] hover:shadow-2xl transition-all duration-500 flex flex-col justify-between gap-6 hover:border-[#0046EA]/20"
                >
                  <div className="space-y-6">
                    {/* Title & Description */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="bg-[#0046EA]/10 text-[#0046EA] border border-[#0046EA]/20 px-3 py-1 text-[8px] font-black uppercase tracking-wider rounded-full">
                          WORKSHOP
                        </span>
                        {isRegistered && (
                          <span className="bg-green-50 text-green-600 border border-green-200 px-3 py-1 text-[8px] font-black uppercase tracking-wider rounded-full">
                            ĐÃ ĐĂNG KÝ
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-black text-[#171716] uppercase tracking-wide leading-snug">
                        {s.title}
                      </h3>
                      {s.description && (
                        <p className="text-xs text-black/50 line-clamp-3 leading-relaxed font-dm-sans">
                          {s.description}
                        </p>
                      )}
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-black/5 text-[10px] font-black uppercase tracking-widest text-black/40">
                      <div className="space-y-1">
                        <span className="block text-[8px] opacity-60">Ngày diễn ra</span>
                        <span className="block text-black font-bold text-xs">{s.session_date}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="block text-[8px] opacity-60">Thời gian</span>
                        <span className="block text-[#0046EA] font-bold text-xs">
                          {s.start_time} - {s.end_time}
                        </span>
                      </div>
                    </div>

                    {/* Expert Details */}
                    <div className="flex items-center gap-3 bg-[#F5F8FF] p-4 rounded-[28px] border border-black/5">
                      <div className="w-8 h-8 rounded-full border border-black/5 overflow-hidden">
                        <img src={avatarSrc} alt={expertName} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block text-[8px] font-black text-black/30 uppercase tracking-widest">Giảng viên / Chuyên gia</span>
                        <span className="block text-xs font-black text-black uppercase tracking-wider truncate">
                          {expertName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing and Action */}
                  <div className="pt-4 flex items-center justify-between border-t border-black/5">
                    <div className="space-y-1">
                      <span className="block text-[8px] uppercase font-black tracking-widest text-black/40">Học phí</span>
                      <span className="text-lg font-garamond italic font-black text-[#0046EA]">{s.price_per_participant} CR</span>
                    </div>

                    {isRegistered ? (
                      <button
                        disabled
                        className="px-6 py-3 bg-black/5 text-black/30 font-bold text-[9px] uppercase tracking-widest rounded-full cursor-not-allowed border border-black/5"
                      >
                        ĐÃ ĐĂNG KÝ
                      </button>
                    ) : isFull ? (
                      <button
                        disabled
                        className="px-6 py-3 bg-red-50 text-red-400 font-bold text-[9px] uppercase tracking-widest rounded-full cursor-not-allowed border border-red-100"
                      >
                        HẾT CHỖ
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedSession(s)}
                        className="px-6 py-3 bg-[#0046EA] hover:bg-black text-[#FFE900] font-black text-[9px] uppercase tracking-widest rounded-full transition-all duration-300 shadow-md"
                      >
                        ĐĂNG KÝ ({s.available_slots} chỗ)
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {selectedSession && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSession(null)}
              className="absolute inset-0 bg-[#0046EA]/20 backdrop-blur-3xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease: EASING }}
              className="relative w-full max-w-lg bg-white border border-black/5 rounded-[64px] shadow-2xl p-12 overflow-hidden z-10"
            >
              <div className="flex items-center justify-between border-b border-black/5 pb-6 mb-8">
                <h2 className="text-2xl font-garamond italic font-bold text-black flex items-center gap-3">
                  <Sparkles size={20} className="text-[#00A4FD]" /> Xác nhận đăng ký học
                </h2>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="p-2 hover:bg-black/5 rounded-full text-black/40 hover:text-black transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-[#F5F8FF] p-6 rounded-[32px] border border-black/5 space-y-4">
                  <div>
                    <span className="block text-[8px] font-black text-black/30 uppercase tracking-widest">Tên lớp học chuyên đề</span>
                    <span className="block text-sm font-black text-black uppercase tracking-wider">{selectedSession.title}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs font-black uppercase text-black/40 tracking-widest pt-4 border-t border-black/5">
                    <div>
                      <span className="block text-[8px] opacity-60 mb-1">Ngày diễn ra</span>
                      <span className="block text-black">{selectedSession.session_date}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] opacity-60 mb-1">Thời gian</span>
                      <span className="block text-black">{selectedSession.start_time} - {selectedSession.end_time}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center px-4 py-2 border-b border-black/5">
                  <span className="text-[10px] font-black text-black/40 uppercase tracking-widest">Học phí:</span>
                  <span className="text-xl font-garamond italic font-black text-[#0046EA]">{selectedSession.price_per_participant} CR</span>
                </div>
                {user && (
                  <div className="flex justify-between items-center px-4 py-2 border-b border-black/5">
                    <span className="text-[10px] font-black text-black/40 uppercase tracking-widest">Số dư sau khi đăng ký:</span>
                    <span className={`text-sm font-bold ${user.credits < selectedSession.price_per_participant ? 'text-red-500' : 'text-green-600'}`}>
                      {user.credits - selectedSession.price_per_participant} CR
                    </span>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-black/40 uppercase tracking-[0.3em]">Lời nhắn cho chuyên gia (Nếu có)</label>
                  <textarea
                    value={joinNote}
                    onChange={(e) => setJoinNote(e.target.value)}
                    placeholder="Mô tả mong muốn của bạn khi tham gia buổi chuyên đề này..."
                    rows={3}
                    className="w-full bg-[#F5F8FF] border border-black/5 rounded-[24px] p-4 focus:outline-none focus:border-[#0046EA] transition-all text-sm text-black resize-none"
                  />
                </div>

                <div className="flex gap-6 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSession(null);
                      setJoinNote('');
                    }}
                    className="flex-1 py-5 border border-black/10 text-black/40 font-black uppercase tracking-[0.3em] text-[10px] rounded-full hover:bg-black/5 hover:text-black transition-all"
                  >
                    HỦY BỎ
                  </button>
                  <button
                    onClick={handleJoinSession}
                    disabled={isJoining || (user !== null && user.credits < selectedSession.price_per_participant)}
                    className="flex-1 py-5 bg-[#0046EA] text-[#FFE900] font-black uppercase tracking-[0.3em] text-[10px] rounded-full hover:bg-black hover:text-white transition-all shadow-xl disabled:opacity-50"
                  >
                    {isJoining ? 'ĐANG ĐĂNG KÝ...' : 'XÁC NHẬN'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
