"use client";

import { useEffect, useState, useCallback } from 'react';
import { adminService } from '@/services/adminService';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/hooks/useToast';
import { 
    Search, 
    Filter, 
    ShieldCheck, 
    ShieldAlert, 
    UserPlus, 
    MoreHorizontal, 
    Mail, 
    Linkedin, 
    Star, 
    Calendar,
    DollarSign,
    Briefcase,
    ExternalLink,
    X,
    CheckCircle2,
    AlertCircle,
    ChevronRight,
    Loader2
} from 'lucide-react';
import Image from 'next/image';
import { getAvatarUrl } from '@/utils/url-utils';
import Pagination from '@/components/admin/users/Pagination';
import ToastContainer from '@/components/ui/Toast';

export default function AdminExpertsPage() {
    const { token } = useAuthStore();
    const toast = useToast();
    
    // Data state
    const [experts, setExperts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    
    // Filter & Pagination state
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    
    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedExpert, setSelectedExpert] = useState<any>(null);
    const [expertFullData, setExpertFullData] = useState<any>(null);
    const [fetchingDetail, setFetchingDetail] = useState(false);
    
    // Form state
    const [createFormData, setCreateFormData] = useState({ full_name: '', email: '', password: '' });
    const [editFormData, setEditFormData] = useState<any>({});
    const [saving, setSaving] = useState(false);

    const fetchExperts = useCallback(async () => {
        if (!token) return;
        try {
            setLoading(true);
            const response = await adminService.getExperts({
                status: statusFilter,
                search: search,
                skip: (page - 1) * pageSize,
                limit: pageSize
            });
            setExperts(response.items);
            setTotal(response.total);
        } catch (error: any) {
            toast.error("Không thể tải danh sách chuyên gia");
        } finally {
            setLoading(false);
        }
    }, [token, statusFilter, search, page, pageSize]);

    useEffect(() => {
        fetchExperts();
    }, [fetchExperts]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchExperts();
    };

    const handleCreateExpert = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await adminService.createExpert(createFormData);
            setShowCreateModal(false);
            setCreateFormData({ full_name: '', email: '', password: '' });
            fetchExperts();
            toast.success("Tạo chuyên gia thành công!");
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Tạo chuyên gia thất bại");
        } finally {
            setSaving(false);
        }
    };

    const handleOpenEdit = async (expert: any) => {
        setSelectedExpert(expert);
        setEditFormData({
            bio: expert.bio || '',
            linkedin_url: expert.linkedin_url || '',
            experience_years: expert.experience_years || 0,
            hourly_rate: expert.hourly_rate || 50,
            tags: expert.tags || '',
            kyc_status: expert.kyc_status
        });
        setShowEditModal(true);
    };

    const handleUpdateExpert = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedExpert) return;
        setSaving(true);
        try {
            await adminService.updateExpert(selectedExpert.id, editFormData);
            setShowEditModal(false);
            fetchExperts();
            toast.success("Cập nhật thông tin thành công!");
        } catch (error: any) {
            toast.error("Cập nhật thất bại");
        } finally {
            setSaving(false);
        }
    };

    const handleViewDetail = async (expert: any) => {
        setSelectedExpert(expert);
        setShowDetailModal(true);
        setFetchingDetail(true);
        try {
            const data = await adminService.getExpertFull(expert.id);
            setExpertFullData(data);
        } catch (error) {
            toast.error("Không thể tải chi tiết chuyên gia");
        } finally {
            setFetchingDetail(false);
        }
    };

    const handleKYCUpdate = async (id: number, status: 'APPROVED' | 'REJECTED') => {
        try {
            await adminService.updateKYC(id, status);
            fetchExperts();
            toast.success(status === 'APPROVED' ? "Đã duyệt hồ sơ" : "Đã từ chối hồ sơ");
            if (showDetailModal) {
                const data = await adminService.getExpertFull(id);
                setExpertFullData(data);
            }
        } catch (error) {
            toast.error("Thao tác thất bại");
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen bg-[#F8FAFC]">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                <div>
                    <h1 className="text-4xl font-serif italic text-[#0F0C17] tracking-tight">Quản Lý Chuyên Gia</h1>
                    <p className="mt-2 text-[#0F0C17]/50 font-sans text-sm tracking-wide font-light">Kiểm duyệt hồ sơ, điều chỉnh thông tin và theo dõi hiệu suất</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gradient-to-r from-[#0046EA] to-[#00A4FD] text-white font-bold uppercase tracking-[0.15em] text-xs px-8 py-3 rounded-full hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 flex items-center gap-2 w-fit"
                >
                    <UserPlus size={16} />
                    Thêm Chuyên Gia
                </button>
            </div>

            {/* Filters & Search */}
            <div className="bg-white border border-[#0F0C17]/5 rounded-2xl p-6 mb-8 shadow-sm transition-all hover:shadow-md">
                <div className="flex flex-col lg:flex-row gap-6">
                    <form onSubmit={handleSearch} className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên hoặc email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-[#F1F5F9] border-none rounded-xl px-12 py-3.5 text-sm focus:ring-2 focus:ring-[#0046EA]/20 outline-none transition-all"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0F0C17]/30" size={18} />
                    </form>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                                className="appearance-none bg-white border border-[#F1F5F9] rounded-xl px-6 py-3.5 pr-12 text-sm font-medium text-[#0F0C17] focus:ring-2 focus:ring-[#0046EA]/20 outline-none cursor-pointer"
                            >
                                <option value="ALL">Tất cả trạng thái</option>
                                <option value="PENDING">Chờ duyệt</option>
                                <option value="APPROVED">Đã duyệt</option>
                                <option value="REJECTED">Từ chối</option>
                            </select>
                            <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0F0C17]/30 pointer-events-none" size={16} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Expert Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <Loader2 className="animate-spin text-[#0046EA]" size={40} />
                    <p className="text-sm text-[#0F0C17]/40 font-medium uppercase tracking-widest">Đang tải dữ liệu...</p>
                </div>
            ) : experts.length === 0 ? (
                <div className="bg-white rounded-3xl p-24 text-center border border-dashed border-[#0F0C17]/10">
                    <AlertCircle className="mx-auto text-[#0F0C17]/20 mb-4" size={48} />
                    <h3 className="text-xl font-medium text-[#0F0C17]">Không tìm thấy chuyên gia</h3>
                    <p className="text-[#0F0C17]/40 mt-2">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                    {experts.map((exp) => (
                        <div key={exp.id} className="group bg-white border border-[#0F0C17]/5 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-inner">
                                        <Image
                                            src={getAvatarUrl(exp.user?.avatar_url, exp.user?.full_name)}
                                            alt={exp.user?.full_name || ''}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[#0F0C17] text-lg leading-none mb-1 group-hover:text-[#0046EA] transition-colors">
                                            {exp.user?.full_name}
                                        </h3>
                                        <p className="text-xs text-[#0F0C17]/40 font-medium tracking-tight truncate max-w-[150px]">
                                            {exp.user?.email}
                                        </p>
                                    </div>
                                </div>
                                <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                    exp.kyc_status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                    exp.kyc_status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                    'bg-amber-50 text-amber-600 border border-amber-100'
                                }`}>
                                    {exp.kyc_status === 'APPROVED' ? 'Đã Duyệt' : exp.kyc_status === 'REJECTED' ? 'Từ Chối' : 'Chờ Duyệt'}
                                </div>
                            </div>

                            <div className="space-y-3 mb-8">
                                <div className="flex items-center gap-3 text-sm text-[#0F0C17]/60 font-light italic">
                                    <Briefcase size={14} />
                                    <span>{exp.experience_years} năm kinh nghiệm</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-[#0F0C17]/60 font-light italic">
                                    <DollarSign size={14} />
                                    <span>{exp.hourly_rate} Credits / giờ</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-[#0F0C17]/60 font-light italic">
                                    <Star size={14} className="text-amber-400 fill-amber-400" />
                                    <span>{exp.rating.toFixed(1)} ({exp.total_reviews} đánh giá)</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => handleViewDetail(exp)}
                                    className="flex-1 bg-[#F1F5F9] text-[#0F0C17] font-bold uppercase tracking-widest text-[10px] py-3 rounded-2xl hover:bg-[#E2E8F0] transition-colors"
                                >
                                    Chi tiết
                                </button>
                                <button
                                    onClick={() => handleOpenEdit(exp)}
                                    className="flex-1 bg-[#0F0C17] text-white font-bold uppercase tracking-widest text-[10px] py-3 rounded-2xl hover:bg-blue-600 transition-all"
                                >
                                    Chỉnh sửa
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {!loading && total > 0 && (
                <Pagination
                    currentPage={page}
                    totalPages={Math.ceil(total / pageSize)}
                    pageSize={pageSize}
                    totalItems={total}
                    onPageChange={setPage}
                    onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
                />
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/60 backdrop-blur-md p-4">
                    <div className="bg-white border border-[#0F0C17]/10 rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="bg-[#0046EA] p-10 text-white text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                            <h2 className="text-3xl font-serif italic mb-2 relative z-10">Gia Nhập Đội Ngũ</h2>
                            <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/70 relative z-10">Tạo tài khoản chuyên gia mới</p>
                        </div>
                        <form onSubmit={handleCreateExpert} className="p-10 space-y-6 bg-white">
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase tracking-widest text-[#0F0C17]/40 font-bold ml-1">Họ và Tên</label>
                                <input
                                    type="text"
                                    required
                                    value={createFormData.full_name}
                                    onChange={(e) => setCreateFormData({ ...createFormData, full_name: e.target.value })}
                                    className="w-full bg-[#F1F5F9] border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-[#0046EA]/20 outline-none transition-all"
                                    placeholder="Họ tên đầy đủ..."
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase tracking-widest text-[#0F0C17]/40 font-bold ml-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={createFormData.email}
                                    onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                                    className="w-full bg-[#F1F5F9] border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-[#0046EA]/20 outline-none transition-all"
                                    placeholder="email@example.com"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase tracking-widest text-[#0F0C17]/40 font-bold ml-1">Mật khẩu ban đầu</label>
                                <input
                                    type="text"
                                    required
                                    value={createFormData.password}
                                    onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                                    className="w-full bg-[#F1F5F9] border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-[#0046EA]/20 outline-none transition-all"
                                    placeholder="Nhập mật khẩu..."
                                />
                            </div>
                            <div className="flex gap-4 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-4 text-[10px] font-bold uppercase tracking-widest text-[#0F0C17]/40 hover:text-[#0F0C17] transition-colors"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 bg-gradient-to-r from-[#0046EA] to-[#00A4FD] text-white font-bold uppercase tracking-widest text-[10px] py-4 rounded-2xl hover:shadow-xl transition-all disabled:opacity-50"
                                >
                                    {saving ? 'Đang xử lý...' : 'Tạo tài khoản'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/60 backdrop-blur-md p-4">
                    <div className="bg-white border border-[#0F0C17]/10 rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="bg-[#0F0C17] p-10 text-white flex justify-between items-center">
                            <div>
                                <h2 className="text-3xl font-serif italic mb-1">Chỉnh sửa Hồ sơ</h2>
                                <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/50">Cập nhật thông tin chuyên gia</p>
                            </div>
                            <button onClick={() => setShowEditModal(false)} className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateExpert} className="p-10 space-y-6 bg-white max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase tracking-widest text-[#0F0C17]/40 font-bold ml-1">Kinh nghiệm (năm)</label>
                                    <input
                                        type="number"
                                        value={editFormData.experience_years}
                                        onChange={(e) => setEditFormData({ ...editFormData, experience_years: Number(e.target.value) })}
                                        className="w-full bg-[#F1F5F9] border-none rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase tracking-widest text-[#0F0C17]/40 font-bold ml-1">Giá mỗi giờ (Credits)</label>
                                    <input
                                        type="number"
                                        value={editFormData.hourly_rate}
                                        onChange={(e) => setEditFormData({ ...editFormData, hourly_rate: Number(e.target.value) })}
                                        className="w-full bg-[#F1F5F9] border-none rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase tracking-widest text-[#0F0C17]/40 font-bold ml-1">LinkedIn URL</label>
                                <input
                                    type="url"
                                    value={editFormData.linkedin_url}
                                    onChange={(e) => setEditFormData({ ...editFormData, linkedin_url: e.target.value })}
                                    className="w-full bg-[#F1F5F9] border-none rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                                    placeholder="https://linkedin.com/in/..."
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase tracking-widest text-[#0F0C17]/40 font-bold ml-1">Lĩnh vực (Tags - Cách nhau bằng dấu phẩy)</label>
                                <input
                                    type="text"
                                    value={editFormData.tags}
                                    onChange={(e) => setEditFormData({ ...editFormData, tags: e.target.value })}
                                    className="w-full bg-[#F1F5F9] border-none rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                                    placeholder="IT, Marketing, Design..."
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase tracking-widest text-[#0F0C17]/40 font-bold ml-1">Giới thiệu bản thân (Bio)</label>
                                <textarea
                                    rows={4}
                                    value={editFormData.bio}
                                    onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
                                    className="w-full bg-[#F1F5F9] border-none rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full bg-[#0F0C17] text-white font-bold uppercase tracking-widest text-[10px] py-5 rounded-2xl hover:shadow-2xl transition-all disabled:opacity-50"
                                >
                                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/60 backdrop-blur-md p-4">
                    <div className="bg-white border border-[#0F0C17]/10 rounded-[40px] shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500">
                        <div className="relative h-40 bg-gradient-to-r from-blue-600 to-sky-400 overflow-hidden">
                            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                            <button onClick={() => setShowDetailModal(false)} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/10 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/20 transition-all z-20">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="px-10 pb-10">
                            <div className="relative flex items-end gap-8 -mt-16 mb-10 z-10">
                                <div className="w-32 h-32 rounded-[32px] border-8 border-white overflow-hidden shadow-2xl bg-white">
                                    <Image
                                        src={getAvatarUrl(selectedExpert?.user?.avatar_url, selectedExpert?.user?.full_name)}
                                        alt={selectedExpert?.user?.full_name || ''}
                                        width={128}
                                        height={128}
                                        className="object-cover"
                                    />
                                </div>
                                <div className="pb-4 flex-1">
                                    <div className="flex items-center gap-4 mb-2">
                                        <h2 className="text-3xl font-serif italic text-[#0F0C17]">{selectedExpert?.user?.full_name}</h2>
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                            selectedExpert?.kyc_status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                            selectedExpert?.kyc_status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                            'bg-amber-50 text-amber-600 border border-amber-100'
                                        }`}>
                                            {selectedExpert?.kyc_status === 'APPROVED' ? 'Đã duyệt' : selectedExpert?.kyc_status === 'REJECTED' ? 'Từ chối' : 'Chờ duyệt'}
                                        </span>
                                    </div>
                                    <p className="text-[#0F0C17]/40 font-medium tracking-widest uppercase text-[10px]">{selectedExpert?.user?.email}</p>
                                </div>
                                <div className="pb-4 flex gap-3">
                                    {selectedExpert?.kyc_status === 'PENDING' && (
                                        <>
                                            <button 
                                                onClick={() => handleKYCUpdate(selectedExpert.id, 'APPROVED')}
                                                className="px-6 py-3 bg-emerald-500 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all"
                                            >
                                                Phê Duyệt
                                            </button>
                                            <button 
                                                onClick={() => handleKYCUpdate(selectedExpert.id, 'REJECTED')}
                                                className="px-6 py-3 bg-rose-500 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-rose-600 transition-all"
                                            >
                                                Từ Chối
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                <div className="lg:col-span-2 space-y-8">
                                    <div>
                                        <h4 className="text-[10px] uppercase tracking-[0.4em] text-[#0F0C17]/30 font-black mb-4">Giới thiệu</h4>
                                        <p className="text-sm leading-relaxed text-[#0F0C17]/70 font-light whitespace-pre-wrap">
                                            {selectedExpert?.bio || "Chưa có thông tin giới thiệu."}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedExpert?.tags?.split(',').map((tag: string) => (
                                            <span key={tag} className="px-4 py-2 bg-[#F1F5F9] text-[#0F0C17]/60 text-[10px] font-bold uppercase tracking-widest rounded-xl">
                                                {tag.trim()}
                                            </span>
                                        ))}
                                    </div>
                                    {selectedExpert?.linkedin_url && (
                                        <a href={selectedExpert.linkedin_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-blue-600 text-sm font-medium hover:underline">
                                            <Linkedin size={16} />
                                            Xem hồ sơ LinkedIn
                                            <ExternalLink size={12} />
                                        </a>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-[#F8FAFC] border border-[#0F0C17]/5 rounded-3xl p-6">
                                        <h4 className="text-[10px] uppercase tracking-[0.3em] text-[#0F0C17]/30 font-black mb-6 text-center">Thống kê hoạt động</h4>
                                        <div className="space-y-6">
                                            <div className="flex justify-between items-end border-b border-[#0F0C17]/5 pb-4">
                                                <span className="text-[10px] uppercase tracking-widest text-[#0F0C17]/40 font-bold">Tổng Booking</span>
                                                <span className="text-2xl font-serif italic text-[#0F0C17]">
                                                    {fetchingDetail ? "---" : (expertFullData?.stats?.total_bookings ?? 0)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-end border-b border-[#0F0C17]/5 pb-4">
                                                <span className="text-[10px] uppercase tracking-widest text-[#0F0C17]/40 font-bold">Hoàn thành</span>
                                                <span className="text-2xl font-serif italic text-emerald-600">
                                                    {fetchingDetail ? "---" : (expertFullData?.stats?.completed_bookings ?? 0)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-end border-b border-[#0F0C17]/5 pb-4">
                                                <span className="text-[10px] uppercase tracking-widest text-[#0F0C17]/40 font-bold">Doanh thu</span>
                                                <span className="text-2xl font-serif italic text-blue-600">
                                                    {fetchingDetail ? "---" : (expertFullData?.stats?.total_revenue ?? 0).toLocaleString()} 
                                                    <small className="text-[10px] font-sans not-italic text-[#0F0C17]/30 ml-1">CR</small>
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <span className="text-[10px] uppercase tracking-widest text-[#0F0C17]/40 font-bold">Đánh giá TB</span>
                                                <div className="flex items-center gap-2">
                                                    <Star size={16} className="text-amber-400 fill-amber-400" />
                                                    <span className="text-2xl font-serif italic text-amber-600">
                                                        {fetchingDetail ? "---" : (expertFullData?.stats?.average_rating?.toFixed(1) ?? "0.0")}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notifications */}
            <ToastContainer toasts={toast.toasts} onDismiss={toast.dismissToast} />
        </div>
    );
}
