'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { FloatingContactMenu } from "@/components/support/ContactSupport";

// ── Design Tokens ──────────────────────────────────
const EASING = [0.22, 1, 0.36, 1] as any; // VOCA Signature Easing

// ── Components ─────────────────────────────────────

const GoldProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] bg-[#C9A84C] z-[100] origin-left"
      style={{ scaleX }}
    />
  );
};

const Hero = () => {
  const containerRef = useRef(null);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, 280]);

  return (
    <section ref={containerRef} className="hero">
      <div className="hero-bg">
        <motion.div style={{ y }} className="hero-canvas">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover opacity-60 scale-110"
          >
            <source src="/hero.mp4" type="video/mp4" />
          </video>
        </motion.div>
        <div className="hero-overlay" />
      </div>

      <div className="hero-margin">
        <div className="hero-margin-line" />
        <span className="hero-margin-label">VOCA AUTHORITY</span>
      </div>

      <div className="hero-content">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 1.05 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.6, ease: EASING, delay: 0.4 }}
          className="flex flex-col items-center"
        >
          <div className="hero-eyebrow">
            <span className="hero-eyebrow-line" />
            CHƯƠNG 01 — KHỞI NGUYÊN BẢN SẮC
          </div>

          <h1 className="hero-headline">
            Bạn không cô đơn <br />
            <span className="italic">Trong sự vô định.</span>
          </h1>

          <div className="hero-divider">
            <span />
            <div className="hero-divider-dot" />
            <span />
          </div>

          <p className="hero-subline">
            VOCA — Nơi khoa học trắc nghiệm và trí tuệ nhân tạo hội tụ <br />
            để thắp sáng bản sắc riêng biệt của bạn.
          </p>

          <div className="pt-12">
            <Link href="/pricing" className="px-16 py-6 bg-[#C9A84C] text-[#0A1018] font-dm-sans text-[11px] font-bold tracking-[0.5em] uppercase hover:bg-[#F5F0E8] transition-all duration-700 shadow-xl">
              Khám phá Giải pháp —
            </Link>
          </div>
        </motion.div>
      </div>

      <div className="scroll-ind">
        <div className="scroll-track">
          <div className="scroll-dot" />
        </div>
      </div>

      <div className="hero-bottom-fade" />
    </section>
  );
};

const Problem = () => (
  <section className="problem group section-enter">
    <div className="problem-inner">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: EASING }}
        className="section-eyebrow"
      >
        <span className="section-eyebrow-line" />
        BỐI CẢNH — THE VOID
      </motion.div>

      <motion.h2
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        initial={{ opacity: 0, y: 30, scale: 1.02 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: EASING }}
        className="problem-headline"
      >
        Khi tương lai là một <br />
        <span className="italic font-light opacity-60">Vùng trời mờ mịt.</span>
      </motion.h2>

      <motion.p
        whileInView={{ opacity: 1 }}
        initial={{ opacity: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5, delay: 0.3 }}
        className="problem-body"
      >
        Bạn đang đứng trước ngưỡng cửa quan trọng nhất, nhưng lại thấy mình loay hoay, vô định.
        Có phải vì bạn đang thiếu đi một chiếc la bàn định danh chính xác?
      </motion.p>

      <div className="pain-grid">
        {[
          { label: "Áp lực gia đình", value: "70.7%", desc: "Học sinh lớp 12 chịu kỳ vọng nặng nề từ người thân." },
          { label: "Nỗi sợ sai lầm", value: "77.6%", desc: "Tâm lý lo lắng cực độ khi đứng trước việc chọn sai ngành." },
          { label: "Mất kết nối", value: "81%", desc: "Học sinh thừa nhận không hiểu rõ điểm mạnh bản thân." }
        ].map((item, i) => (
          <motion.div
            key={i}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            initial={{ opacity: 0, y: 40, scale: 1.05 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: i * 0.15, ease: EASING }}
            className="pain-card p-12 bg-white/5 backdrop-blur-sm border border-white/5 hover:bg-white/10 transition-all duration-700 group hover:scale-[1.02]"
          >
            <span className="text-4xl font-garamond italic text-[#C9A84C] block mb-4 group-hover:scale-110 transition-transform duration-700">{item.value}</span>
            <p className="font-dm-sans text-[11px] text-[#F5F0E8] font-bold uppercase tracking-[0.2em] mb-4">{item.label}</p>
            <p className="font-dm-sans text-xs text-[#F5F0E8]/40 leading-relaxed font-light">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const Story = () => (
  <section className="py-40 lg:py-64 bg-[#1A0F10] relative px-8 overflow-hidden">
    <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B4A2E]/10 blur-[120px] -mr-48 -mt-48" />
    <div className="max-w-[1400px] mx-auto grid lg:grid-cols-2 gap-24 items-center">
      <motion.div
        whileInView={{ opacity: 1, x: 0, scale: 1 }}
        initial={{ opacity: 0, x: -40, scale: 1.02 }}
        viewport={{ once: true }}
        transition={{ duration: 1.4, ease: EASING }}
      >
        <div className="section-eyebrow text-[#C97B3A]">
          <span className="section-eyebrow-line bg-[#C97B3A]/40" />
          TRIẾT LÝ — THE MIRROR
        </div>
        <h2 className="font-garamond text-5xl md:text-7xl text-[#F5F0E8] leading-tight font-light mb-12">
          Gương soi <br />
          <span className="italic text-[#C97B3A]">Bản sắc thực thụ.</span>
        </h2>
        <div className="space-y-8 font-dm-sans text-lg text-[#F5F0E8]/60 font-light leading-relaxed">
          <p>
            VOCA không chỉ là một công cụ. Chúng tôi là tấm gương phản chiếu phiên bản rực rỡ nhất mà bạn khát khao trở thành.
          </p>
          <p>
            Khi bạn nhìn vào VOCA, bạn không thấy một hệ thống máy móc. Bạn thấy sự thấu hiểu, tôn trọng và một lộ trình vinh quang được may đo riêng cho chính tâm hồn bạn.
          </p>
        </div>
      </motion.div>

      <motion.div
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        viewport={{ once: true }}
        transition={{ duration: 1.4, ease: EASING }}
        className="relative aspect-square border border-[#C97B3A]/20 p-8"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#58181F]/20 to-transparent" />
        <div className="relative h-full border border-[#C97B3A]/10 flex flex-col justify-center p-12 space-y-8">
          <div className="w-12 h-12 border border-[#C97B3A]/40 flex items-center justify-center text-[#C97B3A]">
            <span className="font-garamond text-2xl italic">V</span>
          </div>
          <p className="font-garamond text-3xl italic text-[#F5F0E8]/80 leading-relaxed">
            "Thương hiệu tốt nhất không nói về họ — họ làm gương cho người dùng. Chúng tôi ở đây để bạn thấy được tầm vóc thực sự của chính mình."
          </p>
          <div className="pt-8 border-t border-[#C97B3A]/10">
            <span className="font-dm-sans text-[10px] text-[#C97B3A] tracking-[0.4em] uppercase">VOCA Manifesto</span>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

const Services = () => (
  <section className="py-40 lg:py-64 bg-[#F5F0E8] px-8">
    <div className="max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-baseline mb-32 gap-12 border-b border-[#0A1018]/5 pb-16">
        <div className="space-y-6">
          <div className="section-eyebrow text-[#4A7C7E]">
            <span className="section-eyebrow-line bg-[#4A7C7E]/40" />
            GIẢI PHÁP — THE COMPASS
          </div>
          <motion.h2
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            initial={{ opacity: 0, y: 30, scale: 1.02 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: EASING }}
            className="font-garamond text-5xl md:text-7xl text-[#0A1018] tracking-tight font-light"
          >
            Định Nghĩa Lại <br /> <span className="italic text-[#4A7C7E]">Sự Chuẩn Mực.</span>
          </motion.h2>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-px bg-[#0A1018]/5 border border-[#0A1018]/5">
        {[
          {
            id: '01',
            title: 'Khám phá Tiềm năng',
            eyebrow: 'LỚP 12 — CHỌN NGÀNH',
            desc: 'Hệ thống trắc nghiệm Holland (RIASEC) tích hợp AI phân tích sâu, giúp bạn thoát khỏi sự mông lung để chạm tới ngành học định mệnh.',
            link: '/dashboard/assessment',
            dark: false
          },
          {
            id: '02',
            title: 'Chinh phục Tuyển dụng',
            eyebrow: 'SINH VIÊN — SỬA CV',
            desc: 'AI CV Editor tối ưu hóa hồ sơ theo chuẩn ATS quốc tế. Biến CV từ "bị loại không rõ lý do" thành "lựa chọn hàng đầu" của nhà tuyển dụng.',
            link: '/ai-tools',
            dark: true
          }
        ].map((service, i) => (
          <motion.div
            key={i}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            initial={{ opacity: 0, y: 40, scale: 1.05 }}
            viewport={{ once: true }}
            whileHover={{ backgroundColor: service.dark ? '#0F1825' : '#FFFFFF', scale: 1.01 }}
            transition={{ duration: 0.7, ease: EASING, delay: i * 0.2 }}
            className={`p-16 h-[650px] flex flex-col justify-between group transition-all duration-700 ${service.dark ? 'bg-[#0A1018] text-[#F5F0E8]' : 'bg-[#FAF7F2] text-[#0A1018]'
              }`}
          >
            <div className="space-y-12">
              <span className={`font-garamond text-4xl italic ${service.dark ? 'text-white/5' : 'text-[#4A7C7E]/20'}`}>
                {service.id}
              </span>
              <div className="space-y-4">
                <span className={`font-dm-sans text-[10px] tracking-[0.4em] uppercase ${service.dark ? 'text-[#4A7C7E]' : 'text-[#4A7C7E]'}`}>
                  {service.eyebrow}
                </span>
                <h3 className="font-garamond text-5xl font-light tracking-wide">{service.title}</h3>
              </div>
              <p className={`font-dm-sans text-base leading-[2.2] font-light tracking-wide ${service.dark ? 'text-white/50' : 'text-[#0A1018]/60'
                }`}>
                {service.desc}
              </p>
            </div>
            <Link href={service.link} className={`inline-flex items-center gap-6 text-[10px] font-bold tracking-[0.5em] uppercase group/link ${service.dark ? 'text-[#C9A84C]' : 'text-[#0A1018]'
              }`}>
              BẮT ĐẦU NGAY <div className="h-[0.5px] bg-[#C9A84C] w-16 group-hover/link:w-28 transition-all duration-700" />
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const Proof = () => {
  const [count, setCount] = React.useState(0);
  const target = 15000;

  React.useEffect(() => {
    let start = 0;
    const duration = 2500;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }, []);

  return (
    <section className="py-40 bg-[#0A1018] px-8 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-[#C9A84C] to-transparent" />
        <div className="absolute top-0 left-2/4 w-px h-full bg-gradient-to-b from-transparent via-[#C9A84C] to-transparent" />
        <div className="absolute top-0 left-3/4 w-px h-full bg-gradient-to-b from-transparent via-[#C9A84C] to-transparent" />
      </div>
      <div className="max-w-[1400px] mx-auto relative z-10">
        <div className="grid md:grid-cols-3 gap-24 text-center">
          {[
            { value: '500+', label: 'Chuyên gia đồng hành', sub: 'Mạng lưới Top 1%' },
            { value: `${count.toLocaleString()}+`, label: 'CV được tối ưu', sub: 'Bởi trí tuệ nhân tạo' },
            { value: '93%', label: 'Học viên tự tin', sub: 'Sau khi được tư vấn' }
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              initial={{ opacity: 0, y: 20, scale: 1.05 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: i * 0.2, ease: EASING }}
              className="space-y-6 group cursor-default"
            >
              <div className="font-garamond text-6xl text-[#C9A84C] font-light group-hover:scale-110 transition-transform duration-1000">
                {stat.value}
              </div>
              <div className="space-y-2">
                <div className="font-dm-sans text-[11px] font-bold uppercase tracking-[0.4em] text-[#F5F0E8]">
                  {stat.label}
                </div>
                <div className="font-dm-sans text-[9px] uppercase tracking-[0.2em] text-[#F5F0E8]/30">
                  {stat.sub}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const CTA = () => (
  <section className="py-64 lg:py-80 bg-[#090C12] text-center px-8 relative overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(201,168,76,0.05)_0%,transparent_70%)]" />
    <div className="max-w-4xl mx-auto space-y-24 relative z-10">
      <motion.div
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        initial={{ opacity: 0, y: 40, scale: 1.02 }}
        viewport={{ once: true }}
        transition={{ duration: 1.4, ease: EASING }}
        className="space-y-12"
      >
        <div className="section-eyebrow justify-center text-[#C9A84C]">
          <span className="section-eyebrow-line bg-[#C9A84C]/40" />
          KẾT THÚC — THE ASCENSION
        </div>
        <h2 className="font-garamond text-6xl md:text-9xl text-[#F5F0E8] font-light leading-none tracking-tight">
          Sẵn sàng trở nên <br /> <span className="italic text-[#C9A84C]">Vô giá?</span>
        </h2>
        <p className="font-dm-sans text-base text-[#F5F0E8]/40 max-w-xl mx-auto leading-loose tracking-wide">
          Đừng để bản sắc của bạn bị hòa lẫn. Hãy để VOCA đồng hành kiến tạo nên một chương mới huy hoàng trong sự nghiệp của bạn.
        </p>
      </motion.div>

      <motion.div
        whileInView={{ opacity: 1, scale: 1 }}
        initial={{ opacity: 0, scale: 0.98 }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: EASING }}
      >
        <Link href="/register" className="inline-block px-20 py-8 bg-[#C9A84C] text-[#0A1018] font-dm-sans text-[11px] font-bold tracking-[0.6em] uppercase hover:bg-[#F5F0E8] transition-all duration-700 shadow-[0_20px_60px_rgba(201,168,76,0.15)]">
          GIA NHẬP HỆ SINH THÁI
        </Link>
      </motion.div>

      <div className="pt-24 flex flex-col items-center gap-8">
        <div className="w-px h-24 bg-gradient-to-b from-[#C9A84C]/40 to-transparent" />
        <p className="font-dm-sans text-[#F5F0E8]/10 text-[9px] tracking-[0.5em] uppercase">
          Reserved for those who value standard and precision.
        </p>
      </div>
    </div>
  </section>
);

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0A1018] selection:bg-[#C9A84C] selection:text-[#0A1018]">
      <GoldProgress />
      <Hero />
      <Problem />
      <Story />
      <Services />
      <Proof />
      <CTA />
      <FloatingContactMenu />
    </div>
  );
}
