'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

export default function KYCFormPage() {
    const { user, login } = useAuthStore();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isBioExpanded, setIsBioExpanded] = useState(false);
    const [formData, setFormData] = useState({
        bio: '',
        linkedin_url: '',
        experience_years: 0,
        hourly_rate: 50,
        kyc_documents: '',
        tags: ''
    });

    useEffect(() => {
        // Pre-fill if exists
        if (user?.expert_profile) {
            setFormData({
                bio: user.expert_profile.bio || '',
                linkedin_url: user.expert_profile.linkedin_url || '',
                experience_years: user.expert_profile.experience_years || 0,
                hourly_rate: user.expert_profile.hourly_rate || 50,
                kyc_documents: user.expert_profile.kyc_documents || '',
                tags: user.expert_profile.tags || ''
            });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'experience_years' || name === 'hourly_rate' ? Number(value) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // Call PUT /experts/me/kyc
            await api.put('experts/me/kyc', formData);

            // Refresh user to get updated status (PENDING)
            const userRes = await api.get('users/me');
            const token = localStorage.getItem('token');
            if (token) {
                login(token, userRes.data);
            }

            router.push('/expert/kyc'); // Redirect to Status Page
        } catch (error) {
            console.error('Failed to submit KYC', error);
            alert('Submission failed. Please check inputs.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white selection:bg-[#0046EA]/10 text-[#171716] font-dm-sans pb-44">
            {/* ── Header Section (The Sky) ── */}
            <div className="bg-[#0046EA] pt-24 pb-48 px-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(0,164,253,0.3)_0%,transparent_70%)]" />
                <div className="max-w-[1000px] mx-auto relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-[2px] bg-[#FFE900]" />
                        <span className="text-[10px] text-[#FFE900] tracking-[0.5em] font-black uppercase">Onboarding Protocol</span>
                    </div>
                    <h1 className="text-[clamp(40px,5vw,68px)] font-garamond italic font-bold text-white tracking-tight leading-none mb-6">
                        Expert Verification
                    </h1>
                    <p className="max-w-2xl text-white/60 font-dm-sans text-sm font-light leading-relaxed">
                        Hoàn thiện hồ sơ chiến lược để gia nhập mạng lưới tinh hoa CareerPath. Quy trình xác thực giúp đảm bảo tiêu chuẩn chuyên môn cao nhất cho nền tảng.
                    </p>
                </div>
            </div>

            <main className="max-w-[1000px] mx-auto px-8 -mt-24 relative z-20">
                <form onSubmit={handleSubmit} className="bg-white border border-black/5 rounded-[48px] p-12 md:p-16 shadow-2xl space-y-12">
                    
                    {/* Bio Section */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <label className="text-[9px] font-black text-black/30 uppercase tracking-[0.4em] ml-2" htmlFor="bio">
                                Hồ sơ năng lực (Bio)
                            </label>
                            <button
                                type="button"
                                onClick={() => setIsBioExpanded(!isBioExpanded)}
                                className="text-[9px] text-[#0046EA] font-black uppercase tracking-widest hover:underline"
                            >
                                {isBioExpanded ? 'Thu nhỏ' : 'Mở rộng'}
                            </button>
                        </div>
                        <textarea
                            id="bio"
                            name="bio"
                            rows={isBioExpanded ? 12 : 5}
                            className="w-full bg-[#F5F8FF] border border-black/5 rounded-[32px] p-8 text-base font-garamond italic leading-relaxed text-[#171716] placeholder-black/20 focus:outline-none focus:border-[#0046EA] transition-all"
                            placeholder="Giới thiệu về bản thân, kinh nghiệm chuyên môn và những giá trị bạn có thể mang lại..."
                            value={formData.bio}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* LinkedIn Section */}
                    <div className="space-y-4">
                        <label className="text-[9px] font-black text-black/30 uppercase tracking-[0.4em] ml-2" htmlFor="linkedin">
                            LinkedIn Professional Profile
                        </label>
                        <input
                            id="linkedin"
                            name="linkedin_url"
                            type="url"
                            className="w-full bg-[#F5F8FF] border border-black/5 rounded-2xl px-6 py-4 text-sm font-bold text-[#171716] placeholder-black/20 focus:outline-none focus:border-[#0046EA] transition-all"
                            placeholder="https://linkedin.com/in/yourprofile"
                            value={formData.linkedin_url}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* Two Column Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                            <label className="text-[9px] font-black text-black/30 uppercase tracking-[0.4em] ml-2">
                                Số năm kinh nghiệm
                            </label>
                            <input
                                name="experience_years"
                                type="number"
                                min="0"
                                className="w-full bg-[#F5F8FF] border border-black/5 rounded-2xl px-6 py-4 text-sm font-bold text-[#171716] focus:outline-none focus:border-[#0046EA] transition-all"
                                value={formData.experience_years}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="space-y-4">
                            <label className="text-[9px] font-black text-black/30 uppercase tracking-[0.4em] ml-2">
                                Phí tư vấn (Credits/Giờ)
                            </label>
                            <input
                                name="hourly_rate"
                                type="number"
                                min="10"
                                step="10"
                                className="w-full bg-[#F5F8FF] border border-black/5 rounded-2xl px-6 py-4 text-sm font-bold text-[#171716] focus:outline-none focus:border-[#0046EA] transition-all"
                                value={formData.hourly_rate}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    {/* Skills/Tags Section */}
                    <div className="space-y-4">
                        <label className="text-[9px] font-black text-black/30 uppercase tracking-[0.4em] ml-2">
                            Lĩnh vực chuyên môn (Phân cách bằng dấu phẩy)
                        </label>
                        <input
                            name="tags"
                            type="text"
                            className="w-full bg-[#F5F8FF] border border-black/5 rounded-2xl px-6 py-4 text-sm font-bold text-[#171716] placeholder-black/20 focus:outline-none focus:border-[#0046EA] transition-all"
                            placeholder="VD: IT, Marketing, Design, Quản trị chiến lược..."
                            value={formData.tags}
                            onChange={handleChange}
                        />
                    </div>

                    {/* KYC Documents Section */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-black/30 uppercase tracking-[0.4em] ml-2">
                                Tài liệu chứng minh (Link CV/Bằng cấp)
                            </label>
                            <p className="text-[10px] text-black/40 italic ml-2">
                                Vui lòng tải CV và các bằng cấp liên quan lên Google Drive/Dropbox và dán link chia sẻ tại đây.
                            </p>
                        </div>
                        <input
                            name="kyc_documents"
                            type="text"
                            className="w-full bg-[#F5F8FF] border border-black/5 rounded-2xl px-6 py-4 text-sm font-bold text-[#171716] placeholder-black/20 focus:outline-none focus:border-[#0046EA] transition-all"
                            placeholder="https://drive.google.com/file/d/your-link"
                            value={formData.kyc_documents}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* Submit Section */}
                    <div className="pt-12 border-t border-black/5">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-20 bg-[#171716] text-white text-[11px] font-black uppercase tracking-[0.4em] rounded-full hover:bg-[#0046EA] transition-all duration-700 shadow-2xl disabled:opacity-20 flex items-center justify-center gap-4"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    <span>Đang xử lý hồ sơ...</span>
                                </>
                            ) : (
                                <span>Gửi hồ sơ xác thực</span>
                            )}
                        </button>
                        <p className="mt-8 text-center text-[10px] text-black/30 font-black uppercase tracking-[0.2em]">
                            Hội đồng chuyên gia sẽ phê duyệt hồ sơ trong vòng 48-72 giờ làm việc.
                        </p>
                    </div>
                </form>
            </main>
        </div>
    );
}
