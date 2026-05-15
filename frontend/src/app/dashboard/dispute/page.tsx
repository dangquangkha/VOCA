'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ExpertDashboardLayout from '@/components/dashboard/ExpertDashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ShieldAlert, 
    HelpCircle, 
    BookOpen, 
    ChevronRight, 
    AlertCircle, 
    CheckCircle2, 
    MessageSquare,
    ChevronDown,
    Star,
    Wallet,
    Calendar,
    ArrowRight,
    User as UserIcon
} from 'lucide-react';
import { bookingService } from '@/services/bookingService';
import { Booking, BookingStatus } from '@/types/booking';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/store/useToastStore';
import { UserRole } from '@/types/user';

const Tabs = [
    { id: 'dispute', label: 'Khiếu nại', icon: <ShieldAlert size={18} /> },
    { id: 'faq', label: 'Câu hỏi thường gặp', icon: <HelpCircle size={18} /> },
    { id: 'guide', label: 'Hướng dẫn sử dụng', icon: <BookOpen size={18} /> },
];

export default function DisputePage() {
    const [activeTab, setActiveTab] = useState('dispute');
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuthStore();

    const isExpert = user?.role === UserRole.EXPERT || user?.role === UserRole.MENTOR;
    const Layout = isExpert ? ExpertDashboardLayout : DashboardLayout;

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const data = await bookingService.getBookings();
                // Filter bookings that can be disputed: everything except PENDING/REJECTED usually
                const eligible = data.filter(b => 
                    [
                        BookingStatus.CONFIRMED, 
                        BookingStatus.IN_PROGRESS, 
                        BookingStatus.COMPLETED,
                        BookingStatus.RATED,
                        BookingStatus.CANCELLED,
                        BookingStatus.CANCELLED_USER_NO_SHOW,
                        BookingStatus.CANCELLED_EXPERT_NO_SHOW,
                        BookingStatus.CANCELLED_BY_EXPERT
                    ].includes(b.status)
                );
                setBookings(eligible);
            } catch (error) {
                console.error("Failed to fetch bookings", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, []);

    return (
        <Layout>
            <div className="max-w-6xl mx-auto space-y-12 pb-24">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 text-gold/60">
                            <ShieldAlert size={20} strokeWidth={1.5} />
                            <span className="text-[10px] font-bold uppercase tracking-[0.4em]">
                                {isExpert ? 'Trung tâm hỗ trợ Chuyên gia' : 'Trung tâm giải quyết'}
                            </span>
                        </div>
                        <h1 className="font-serif text-5xl text-ivory italic leading-tight">
                            Hỗ trợ & <span className="text-gold not-italic font-normal">Công bằng</span>
                        </h1>
                        <p className="text-ivory-45 text-sm font-light tracking-wide max-w-xl leading-relaxed">
                            {isExpert 
                                ? 'VOCA cam kết bảo vệ quyền lợi và uy tín của bạn. Hãy cho chúng tôi biết nếu bạn gặp bất kỳ vấn đề nào với buổi tư vấn.'
                                : 'VOCA cam kết bảo vệ quyền lợi và trải nghiệm của bạn. Chúng tôi ở đây để lắng nghe và giải quyết mọi vấn đề phát sinh.'}
                        </p>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex bg-navy-mid/50 p-1.5 border border-ivory-10 self-start">
                        {Tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center gap-3 px-6 py-3 text-[11px] font-bold uppercase tracking-widest transition-all duration-500
                                    ${activeTab === tab.id 
                                        ? 'bg-gold text-navy shadow-lg' 
                                        : 'text-ivory-40 hover:text-ivory hover:bg-white/5'}
                                `}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="min-h-[500px]">
                    <AnimatePresence mode="wait">
                        {activeTab === 'dispute' && <DisputeTab key="dispute" bookings={bookings} loading={loading} isExpert={isExpert} />}
                        {activeTab === 'faq' && <FAQTab key="faq" isExpert={isExpert} />}
                        {activeTab === 'guide' && <GuideTab key="guide" isExpert={isExpert} />}
                    </AnimatePresence>
                </div>
            </div>
        </Layout>
    );
}

// --- Dispute Tab Component ---
function DisputeTab({ bookings, loading, isExpert }: { bookings: Booking[], loading: boolean, isExpert: boolean }) {
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [disputeForm, setDisputeForm] = useState({
        reason: '',
        description: '',
        contact_info: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBooking) return;
        if (!disputeForm.reason || !disputeForm.description) {
            toast.error("Vui lòng nhập đầy đủ lý do và mô tả");
            return;
        }

        setIsSubmitting(true);
        try {
            await bookingService.disputeBooking(selectedBooking.id, disputeForm);
            toast.success("Yêu cầu của bạn đã được gửi. Admin sẽ sớm liên hệ giải quyết.");
            setSelectedBooking(null);
            setDisputeForm({ reason: '', description: '', contact_info: '' });
        } catch (error) {
            console.error("Dispute failed", error);
            toast.error("Gửi yêu cầu thất bại. Vui lòng thử lại sau.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="py-20 text-center text-ivory-40 uppercase tracking-[0.3em] text-xs">Đang tải danh sách...</div>;

    const reasons = isExpert ? [
        { value: "STUDENT_NO_SHOW", label: "Học viên không tham gia" },
        { value: "INAPPROPRIATE_BEHAVIOR", label: "Học viên có hành vi không chuẩn mực" },
        { value: "TECHNICAL_DIFFICULTY", label: "Sự cố kỹ thuật từ hệ thống" },
        { value: "UNFAIR_REVIEW", label: "Đánh giá không khách quan/thiếu chính xác" },
        { value: "OTHER", label: "Lý do khác" }
    ] : [
        { value: "EXPERT_NO_SHOW", label: "Chuyên gia không tham gia" },
        { value: "QUALITY_ISSUE", label: "Chất lượng chuyên môn không tốt" },
        { value: "TECHNICAL_DIFFICULTY", label: "Sự cố kỹ thuật từ hệ thống" },
        { value: "INAPPROPRIATE_BEHAVIOR", label: "Hành vi không chuẩn mực" },
        { value: "OTHER", label: "Lý do khác" }
    ];

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-12"
        >
            <div className="lg:col-span-7 space-y-8">
                <h3 className="text-[12px] font-bold text-gold uppercase tracking-[0.3em] mb-8 flex items-center gap-4">
                    <div className="w-8 h-[1px] bg-gold/30"></div>
                    {isExpert ? 'Chọn buổi tư vấn cần báo cáo' : 'Chọn buổi tư vấn cần hỗ trợ'}
                </h3>

                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                    {bookings.length === 0 ? (
                        <div className="p-12 border border-dashed border-ivory-10 text-center text-ivory-40 font-light">
                            Chưa có buổi tư vấn nào khả dụng để gửi yêu cầu.
                        </div>
                    ) : (
                        bookings.map(booking => {
                            const partner = isExpert ? booking.student : booking.expert?.user;
                            return (
                                <div 
                                    key={booking.id}
                                    onClick={() => setSelectedBooking(booking)}
                                    className={`
                                        p-6 border transition-all duration-500 cursor-pointer group
                                        ${selectedBooking?.id === booking.id 
                                            ? 'bg-white/5 border-gold shadow-2xl translate-x-2' 
                                            : 'bg-navy-mid/30 border-ivory-10 hover:border-ivory-20'}
                                    `}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 border border-ivory-10 flex items-center justify-center text-gold/60 group-hover:bg-gold/10 group-hover:text-gold transition-all duration-700 overflow-hidden relative">
                                                {partner?.avatar_url ? (
                                                    <img 
                                                        src={partner.avatar_url} 
                                                        alt="Avatar" 
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(partner?.full_name || 'U')}&background=0A192F&color=C5A039`;
                                                        }}
                                                    />
                                                ) : (
                                                    <UserIcon size={20} />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-[13px] font-bold text-ivory uppercase tracking-widest">
                                                    {partner?.full_name || (isExpert ? 'Học viên' : 'Chuyên gia')}
                                                </p>
                                                <p className="text-[10px] text-ivory-45 font-light mt-1">
                                                    {new Date(booking.start_time).toLocaleString('vi-VN')} • {booking.total_amount} Credits
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`text-[9px] font-bold px-3 py-1 border uppercase tracking-wider ${
                                                [BookingStatus.COMPLETED, BookingStatus.RATED].includes(booking.status) 
                                                    ? 'border-teal-mid/30 text-teal-mid' 
                                                    : [BookingStatus.CANCELLED, BookingStatus.CANCELLED_BY_EXPERT, BookingStatus.CANCELLED_EXPERT_NO_SHOW, BookingStatus.CANCELLED_USER_NO_SHOW].includes(booking.status)
                                                        ? 'border-burgundy/30 text-burgundy'
                                                        : 'border-gold/30 text-gold'
                                            }`}>
                                                {booking.status}
                                            </span>
                                            <ChevronRight size={16} className={`transition-transform duration-500 ${selectedBooking?.id === booking.id ? 'rotate-90 text-gold' : 'text-ivory-20'}`} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <div className="lg:col-span-5">
                <AnimatePresence mode="wait">
                    {selectedBooking ? (
                        <motion.div 
                            key="form"
                            initial={{ opacity: 0, x: 20 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-obsidian border border-gold-line p-10 shadow-2xl sticky top-24"
                        >
                            <div className="flex items-center gap-4 mb-10 text-gold">
                                <ShieldAlert size={24} strokeWidth={1.5} />
                                <h3 className="font-serif text-2xl italic">Chi tiết yêu cầu</h3>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-ivory-40 uppercase tracking-[0.2em]">Lý do chính</label>
                                    <select 
                                        className="w-full bg-navy border border-ivory-10 p-4 text-ivory text-xs focus:border-gold outline-none transition-all appearance-none"
                                        value={disputeForm.reason}
                                        onChange={e => setDisputeForm({...disputeForm, reason: e.target.value})}
                                    >
                                        <option value="">Chọn lý do...</option>
                                        {reasons.map(r => (
                                            <option key={r.value} value={r.value}>{r.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-ivory-40 uppercase tracking-[0.2em]">Mô tả chi tiết</label>
                                    <textarea 
                                        rows={4}
                                        className="w-full bg-navy border border-ivory-10 p-4 text-ivory text-xs focus:border-gold outline-none transition-all resize-none"
                                        placeholder={isExpert ? "Vui lòng mô tả vấn đề bạn gặp phải với học viên..." : "Vui lòng mô tả chi tiết vấn đề bạn gặp phải..."}
                                        value={disputeForm.description}
                                        onChange={e => setDisputeForm({...disputeForm, description: e.target.value})}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-bold text-ivory-40 uppercase tracking-[0.2em]">Thông tin liên hệ</label>
                                        <span className="text-[9px] text-ivory-20 uppercase tracking-widest italic">(Tùy chọn)</span>
                                    </div>
                                    <input 
                                        type="text"
                                        className="w-full bg-navy border border-ivory-10 p-4 text-ivory text-xs focus:border-gold outline-none transition-all"
                                        placeholder="SĐT hoặc Email..."
                                        value={disputeForm.contact_info}
                                        onChange={e => setDisputeForm({...disputeForm, contact_info: e.target.value})}
                                    />
                                </div>

                                <button 
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-5 bg-gold text-navy font-bold text-[10px] uppercase tracking-[0.4em] hover:bg-ivory transition-all duration-700 disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu hỗ trợ'}
                                </button>
                                
                                <button 
                                    type="button"
                                    onClick={() => setSelectedBooking(null)}
                                    className="w-full text-[9px] text-ivory-20 uppercase tracking-[0.3em] hover:text-ivory transition-colors"
                                >
                                    Hủy bỏ
                                </button>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="placeholder"
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            className="h-full flex flex-col items-center justify-center p-12 border border-dashed border-ivory-10 text-center space-y-6"
                        >
                            <ShieldAlert size={48} className="text-ivory-10" strokeWidth={1} />
                            <p className="text-ivory-40 text-sm font-light leading-relaxed">
                                {isExpert 
                                    ? 'Chọn một buổi tư vấn từ danh sách bên trái để báo cáo vấn đề cho Ban quản trị.'
                                    : 'Chọn một buổi tư vấn từ danh sách bên trái để bắt đầu quy trình hỗ trợ giải quyết.'}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

// --- FAQ Tab Component ---
function FAQTab({ isExpert }: { isExpert: boolean }) {
    const studentFaqs = [
        {
            q: "Chính sách hoàn tiền (Credits) hoạt động như thế nào?",
            a: "VOCA sử dụng hệ thống Escrow (Tạm giữ). Khi bạn đặt lịch, Credits sẽ được hệ thống tạm giữ. Nếu chuyên gia không tham gia hoặc buổi tư vấn bị hủy đúng quy định, Credits sẽ được hoàn trả 100% vào ví của bạn ngay lập tức.",
            steps: [
                "Hệ thống kiểm tra trạng thái buổi học sau 10 phút khởi đầu.",
                "Nếu xác định lỗi từ phía chuyên gia, lệnh hoàn tiền được kích hoạt tự động.",
                "Credits xuất hiện lại trong Ví di sản của bạn mà không cần thao tác thêm."
            ]
        },
        {
            q: "Làm sao để khiếu nại một buổi tư vấn không đạt chất lượng?",
            a: "Bạn có quyền gửi khiếu nại trong vòng 24 giờ sau khi buổi tư vấn kết thúc. Sau 24 giờ, nếu không có khiếu nại, hệ thống sẽ tự động chuyển tiền cho chuyên gia và lệnh này không thể đảo ngược.",
            steps: [
                "Truy cập vào trang Hỗ trợ này.",
                "Tại tab Khiếu nại, chọn buổi tư vấn cần phản hồi.",
                "Điền thông tin và nhấn Gửi. Đội ngũ Admin sẽ kiểm tra và phản hồi bạn trong vòng 4-8 giờ làm việc."
            ]
        }
    ];

    const expertFaqs = [
        {
            q: "Khi nào tôi nhận được Credits từ buổi tư vấn?",
            a: "Hệ thống sẽ tạm giữ Credits của học viên (Escrow). Sau khi buổi tư vấn kết thúc và không có khiếu nại nào từ học viên trong vòng 24 giờ, Credits sẽ được cộng vào ví của bạn.",
            steps: [
                "Buổi tư vấn kết thúc ở trạng thái COMPLETED.",
                "Đợi 24 giờ kiểm duyệt tự động.",
                "Credits được chuyển vào Ví doanh thu sau khi trừ phí nền tảng (nếu có)."
            ]
        },
        {
            q: "Làm thế nào nếu học viên không tham gia buổi tư vấn?",
            a: "Nếu bạn đã vào phòng họp và đợi đủ 10 phút nhưng học viên không xuất hiện, bạn có thể báo cáo No-show để được đảm bảo quyền lợi thanh toán.",
            steps: [
                "Chụp ảnh màn hình làm bằng chứng.",
                "Vào trang hỗ trợ này và chọn 'Học viên không tham gia'.",
                "Gửi báo cáo và đợi Admin xác nhận để nhận Credits."
            ]
        }
    ];

    const faqs = isExpert ? expertFaqs : studentFaqs;

    return (
        <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -20 }}
            className="max-w-4xl mx-auto space-y-10"
        >
            {faqs.map((faq, index) => (
                <div key={index} className="bg-navy-mid/30 border border-ivory-10 p-10 hover:border-gold/20 transition-all duration-700">
                    <div className="flex gap-8">
                        <div className="w-12 h-12 border border-gold/30 flex items-center justify-center text-gold shrink-0 font-serif italic text-xl">
                            ?
                        </div>
                        <div className="space-y-6">
                            <h4 className="font-serif text-2xl text-ivory leading-tight">{faq.q}</h4>
                            <p className="text-ivory-60 text-sm font-light leading-relaxed">{faq.a}</p>
                            
                            <div className="pt-6 border-t border-ivory-10">
                                <p className="text-[10px] font-bold text-gold uppercase tracking-[0.3em] mb-6">Thông tin cần lưu ý:</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {faq.steps.map((step, sIdx) => (
                                        <div key={sIdx} className="space-y-3">
                                            <span className="text-[9px] font-bold text-ivory-20 uppercase tracking-widest">Ghi chú 0{sIdx + 1}</span>
                                            <p className="text-[11px] text-ivory-45 leading-relaxed">{step}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </motion.div>
    );
}

// --- Guide Tab Component ---
function GuideTab({ isExpert }: { isExpert: boolean }) {
    const studentGuides = [
        {
            title: "Nạp Credits vào Ví di sản",
            icon: <Wallet size={24} />,
            steps: [
                "Vào trang 'Ví di sản' từ sidebar.",
                "Chọn số lượng Credits cần nạp hoặc nhập số tiền tương ứng.",
                "Quét mã QR SePay để thanh toán tự động."
            ]
        },
        {
            title: "Đặt lịch tư vấn với Chuyên gia",
            icon: <Calendar size={24} />,
            steps: [
                "Tìm chuyên gia phù hợp tại trang 'Chuyên gia'.",
                "Chọn khung giờ trống trên lịch của chuyên gia.",
                "Nhập ghi chú yêu cầu và xác nhận đặt chỗ."
            ]
        }
    ];

    const expertGuides = [
        {
            title: "Thiết lập lịch rảnh",
            icon: <Calendar size={24} />,
            steps: [
                "Vào trang 'Lịch rảnh' từ sidebar.",
                "Kéo thả hoặc nhấn để tạo các khung giờ bạn có thể tư vấn.",
                "Nhấn 'Lưu thay đổi' để học viên có thể nhìn thấy lịch của bạn."
            ]
        },
        {
            title: "Quản lý buổi tư vấn",
            icon: <BookOpen size={24} />,
            steps: [
                "Vào trang 'Lịch hẹn' để xem các yêu cầu mới.",
                "Chấp nhận hoặc từ chối yêu cầu tùy theo lịch trình của bạn.",
                "Vào phòng họp đúng giờ để bắt đầu tư vấn."
            ]
        }
    ];

    const guides = isExpert ? expertGuides : studentGuides;

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
            {guides.map((guide, index) => (
                <div key={index} className="bg-obsidian border border-ivory-10 p-10 flex flex-col justify-between group hover:border-gold-line transition-all duration-700 shadow-xl">
                    <div className="space-y-8">
                        <div className="w-16 h-16 border border-ivory-10 flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-navy transition-all duration-700">
                            {guide.icon}
                        </div>
                        <h4 className="font-serif text-3xl text-ivory italic">{guide.title}</h4>
                        
                        <div className="space-y-6">
                            {guide.steps.map((step, sIdx) => (
                                <div key={sIdx} className="flex gap-5 items-start">
                                    <span className="text-gold font-bold text-xs mt-0.5">0{sIdx + 1}</span>
                                    <p className="text-xs text-ivory-60 font-light leading-relaxed">{step}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ))}

            {/* Support Message */}
            <div className="md:col-span-2 bg-gold/5 border border-gold/20 p-12 text-center space-y-6">
                <h4 className="font-serif text-2xl text-gold italic">Cần hỗ trợ trực tiếp?</h4>
                <p className="text-ivory-45 text-sm font-light max-w-xl mx-auto tracking-wide">
                    Đội ngũ hỗ trợ VOCA luôn sẵn sàng giải đáp mọi thắc mắc của {isExpert ? 'chuyên gia' : 'học viên'} 24/7.
                </p>
                <div className="flex justify-center gap-8">
                    <div className="flex items-center gap-3 text-ivory text-xs font-bold uppercase tracking-widest border-b border-gold/40 pb-2 cursor-pointer hover:text-gold transition-colors">
                        <MessageSquare size={16} /> Liên hệ Admin
                    </div>
                    <div className="flex items-center gap-3 text-ivory text-xs font-bold uppercase tracking-widest border-b border-gold/40 pb-2 cursor-pointer hover:text-gold transition-colors">
                        Hotline: 1900 8888
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
