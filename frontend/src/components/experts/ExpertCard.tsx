'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShieldCheck, Star, ChevronRight, ArrowUpRight } from 'lucide-react';
import { Expert } from '@/types/expert';
import { getAvatarUrl } from '@/utils/url-utils';

interface ExpertCardProps {
    expert: Expert;
    viewMode?: 'grid' | 'list';
}

export const ExpertCard: React.FC<ExpertCardProps> = ({ expert, viewMode = 'grid' }) => {
    const tagList = expert.tags
        ? expert.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
        : [];

    const avatarUrl = getAvatarUrl(expert.user?.avatar_url, expert.user?.full_name || 'Expert');

    if (viewMode === 'list') {
        return (
            <motion.div
                layout
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                className="card"
                style={{ padding: '28px 32px', display: 'flex', flexDirection: 'row', gap: 32, alignItems: 'center' }}
                whileHover={{ y: -4 }}
            >
                {/* Avatar */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div className="shinkai-avatar-glow" style={{ width: 88, height: 88 }}>
                        <img
                            src={avatarUrl}
                            alt={expert.user?.full_name || 'Chuyên gia'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.user?.full_name || 'Expert')}&background=00A4FD&color=ffffff&size=128`;
                            }}
                        />
                    </div>
                    {expert.kyc_status === 'APPROVED' && (
                        <div style={{
                            position: 'absolute',
                            bottom: -4,
                            right: -4,
                            width: 22,
                            height: 22,
                            background: '#00A4FD',
                            border: '2px solid #FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <ShieldCheck size={12} color="#FFFFFF" strokeWidth={2.5} />
                        </div>
                    )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 8 }}>
                        <div>
                            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#000000', letterSpacing: '0.03em', margin: 0, lineHeight: 1.3 }}>
                                {expert.user?.full_name || 'Chuyên gia'}
                            </h3>
                            <p style={{ fontSize: 9, fontWeight: 800, color: '#00A4FD', letterSpacing: '0.35em', textTransform: 'uppercase', marginTop: 5, margin: '5px 0 0' }}>
                                {expert.experience_years} năm · {expert.user?.role === 'MENTOR' ? 'Mentor' : 'Expert'}
                            </p>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <span style={{ fontSize: 24, fontWeight: 800, color: '#000000', letterSpacing: '-0.02em', display: 'block' }}>
                                {expert.hourly_rate}
                            </span>
                            <span style={{ fontSize: 8, fontWeight: 700, color: '#000000', letterSpacing: '0.3em', textTransform: 'uppercase' }}>
                                Credits / giờ
                            </span>
                        </div>
                    </div>

                    <p style={{ fontSize: 13, fontWeight: 600, color: '#000000', lineHeight: 1.7, margin: '12px 0', letterSpacing: '0.02em' }}>
                        {expert.bio || `${expert.experience_years} năm kinh nghiệm chuyên sâu trong lĩnh vực tư vấn chiến lược.`}
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                        {tagList.slice(0, 4).map((tag) => (
                            <span key={tag} className="tag">{tag}</span>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 16 }}>
                    {/* Rating */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Star size={13} fill="#FFE900" color="#FFE900" />
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#171716' }}>{expert.rating.toFixed(1)}</span>
                        <span style={{ fontSize: 9, fontWeight: 400, color: 'rgba(23,23,22,0.3)', letterSpacing: '0.15em' }}>({expert.total_reviews})</span>
                    </div>

                    <Link href={`/dashboard/experts/${expert.id}`} style={{ textDecoration: 'none' }}>
                        <button
                            className="btn-sky btn-pulse"
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', whiteSpace: 'nowrap' }}
                        >
                            Xem chi tiết
                            <ArrowUpRight size={12} />
                        </button>
                    </Link>
                </div>
            </motion.div>
        );
    }

    // Grid view
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
            style={{ padding: '28px', display: 'flex', flexDirection: 'column', height: '100%' }}
            whileHover={{ y: -4 }}
        >
            {/* Top row: avatar + price */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ position: 'relative' }}>
                    <div className="shinkai-avatar-glow" style={{ width: 72, height: 72 }}>
                        <img
                            src={avatarUrl}
                            alt={expert.user?.full_name || 'Chuyên gia'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.user?.full_name || 'Expert')}&background=00A4FD&color=ffffff&size=128`;
                            }}
                        />
                    </div>
                    {expert.kyc_status === 'APPROVED' && (
                        <div style={{
                            position: 'absolute',
                            bottom: -3,
                            right: -3,
                            width: 18,
                            height: 18,
                            background: '#00A4FD',
                            border: '2px solid #FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <ShieldCheck size={10} color="#FFFFFF" strokeWidth={2.5} />
                        </div>
                    )}
                </div>

                <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 26, fontWeight: 800, color: '#000000', letterSpacing: '-0.02em', display: 'block', lineHeight: 1 }}>
                        {expert.hourly_rate}
                    </span>
                    <span style={{ fontSize: 8, fontWeight: 700, color: '#000000', letterSpacing: '0.3em', textTransform: 'uppercase' }}>
                        Cr / giờ
                    </span>
                </div>
            </div>

            {/* Name + role */}
            <div style={{ marginBottom: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#000000', letterSpacing: '0.02em', margin: 0, lineHeight: 1.4 }}>
                    {expert.user?.full_name || 'Chuyên gia'}
                </h3>
                <p style={{ fontSize: 8, fontWeight: 800, color: '#00A4FD', letterSpacing: '0.35em', textTransform: 'uppercase', marginTop: 5 }}>
                    {expert.experience_years} năm · {expert.user?.role === 'MENTOR' ? 'Mentor' : 'Expert'}
                </p>
            </div>

            {/* Bio */}
            <p style={{
                fontSize: 12,
                fontWeight: 500,
                color: '#000000',
                lineHeight: 1.7,
                flex: 1,
                letterSpacing: '0.02em',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical' as any,
                overflow: 'hidden',
                margin: '0 0 16px',
            }}>
                {expert.bio || `${expert.experience_years} năm kinh nghiệm chuyên sâu trong lĩnh vực tư vấn chiến lược.`}
            </p>

            {/* Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 20 }}>
                {tagList.slice(0, 3).map((tag: string) => (
                    <span key={tag} className="tag">{tag}</span>
                ))}
            </div>

            {/* Bottom: rating + CTA */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 16,
                borderTop: '1px solid rgba(23,23,22,0.08)',
                marginTop: 'auto',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Star size={12} fill="#FFE900" color="#FFE900" />
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#171716' }}>{expert.rating.toFixed(1)}</span>
                    <span style={{ fontSize: 9, color: 'rgba(23,23,22,0.25)', letterSpacing: '0.1em' }}>({expert.total_reviews})</span>
                </div>

                <Link href={`/dashboard/experts/${expert.id}`} style={{ textDecoration: 'none' }}>
                    <button style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        background: 'transparent',
                        border: 'none',
                        color: '#00A4FD',
                        fontSize: 9,
                        fontWeight: 600,
                        letterSpacing: '0.3em',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        padding: 0,
                        transition: 'color 0.25s',
                    }}
                    onMouseOver={e => (e.currentTarget.style.color = '#171716')}
                    onMouseOut={e => (e.currentTarget.style.color = '#00A4FD')}
                    >
                        Hồ sơ <ChevronRight size={12} />
                    </button>
                </Link>
            </div>
        </motion.div>
    );
};
