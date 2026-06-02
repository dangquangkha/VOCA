'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { FloatingContactMenu } from "@/components/support/ContactSupport";
import HeroVisual from "@/components/special/HeroVisual";

// ── Design Tokens ──────────────────────────────────
const EASING = [0.22, 1, 0.36, 1] as any;

const GoldProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] bg-[#00A4FD] z-[100] origin-left"
      style={{ scaleX }}
    />
  );
};

const Hero = () => {
  const containerRef = useRef(null);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, 280]);

  return (
    <section ref={containerRef} className="hero min-h-screen relative overflow-hidden bg-white dark:bg-[#0A0E1A] font-dm-sans">
      <div className="hero-bg absolute inset-0 z-0">
        <HeroVisual />
        {/* Shinkai Style Ambient Glow - Added pointer-events-none */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2)_0%,transparent_70%)] pointer-events-none z-10" />
      </div>

      <div className="hero-content relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-8">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 1.05 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.6, ease: EASING, delay: 0.4 }}
          className="flex flex-col items-center"
        >
          <div className="flex items-center gap-6 mb-12">
            <div className="w-12 h-px bg-[#00A4FD]" />
            <span className="text-xs text-[#00A4FD] font-black tracking-[0.5em] uppercase">Chương 01 — Khởi nguyên bản sắc</span>
          </div>

          <h1 className="text-[clamp(48px,8vw,110px)] font-garamond italic font-bold text-[#0046EA] tracking-tighter leading-[0.95] mb-12 drop-shadow-xl">
            Bạn không cô đơn <br />
            <span className="text-[#00A4FD]">Trong sự vô định.</span>
          </h1>

          <p className="max-w-2xl text-[18px] md:text-[20px] font-garamond italic text-[#171716] dark:text-white/60 leading-relaxed mb-20">
            CareerPath AI — Nơi khoa học trắc nghiệm và trí tuệ nhân tạo hội tụ để thắp sáng bản sắc riêng biệt của bạn.
          </p>

          <div className="flex flex-col md:flex-row items-center gap-12">
            <Link href="/pricing" className="px-20 py-8 bg-[#0046EA] text-white font-dm-sans text-[11px] font-black tracking-[0.5em] uppercase hover:bg-[#00A4FD] transition-all duration-700 shadow-2xl rounded-full">
              Khám phá giải pháp
            </Link>
            <Link href="/dashboard" className="text-[#0046EA]/40 hover:text-[#00A4FD] text-xs font-black uppercase tracking-[0.5em] transition-all duration-500">
              Bắt đầu ngay
            </Link>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-6 opacity-30">
        <div className="w-[1px] h-20 bg-gradient-to-b from-white to-transparent" />
        <span className="text-[11px] font-black uppercase tracking-[0.6em] text-white">Scroll Down</span>
      </div>
    </section>
  );
};

const Problem = () => (
  <section className="py-48 md:py-64 bg-white dark:bg-[#0A0E1A] relative px-8 overflow-hidden font-dm-sans">
    <div className="max-w-[1400px] mx-auto relative z-10">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="flex items-center gap-8 mb-16"
      >
        <div className="w-16 h-[1.5px] bg-[#0046EA]" />
        <span className="text-xs font-black text-[#0046EA] uppercase tracking-[0.4em]">Bối cảnh — The Void</span>
      </motion.div>

      <motion.h2
        whileInView={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 30 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: EASING }}
        className="text-[clamp(48px,6vw,84px)] font-garamond italic font-bold text-[#171716] dark:text-white tracking-tight leading-[1.1] mb-20"
      >
        Khi tương lai là một <br />
        <span className="text-[#0046EA] opacity-40">Vùng trời mờ mịt.</span>
      </motion.h2>

      <motion.p
        whileInView={{ opacity: 1 }}
        initial={{ opacity: 0 }}
        viewport={{ once: true }}
        className="max-w-3xl text-[20px] md:text-[24px] font-garamond italic text-black/40 dark:text-white/40 leading-relaxed mb-32"
      >
        Bạn đang đứng trước ngưỡng cửa quan trọng nhất, nhưng lại thấy mình loay hoay, vô định.
        Có phải vì bạn đang thiếu đi một chiếc la bàn định danh chính xác?
      </motion.p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {[
          { label: "Áp lực gia đình", value: "70.7%", desc: "Học sinh lớp 12 chịu kỳ vọng nặng nề từ người thân." },
          { label: "Nỗi sợ sai lầm", value: "77.6%", desc: "Tâm lý lo lắng cực độ khi đứng trước việc chọn sai ngành." },
          { label: "Mất kết nối", value: "81%", desc: "Học sinh thừa nhận không hiểu rõ điểm mạnh bản thân." }
        ].map((item, i) => (
          <motion.div
            key={i}
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 40 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 1 }}
            className="p-16 bg-[#F5F8FF] dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-[64px] hover:shadow-3xl hover:shadow-blue-500/10 transition-all duration-700 group"
          >
            <span className="text-6xl font-garamond italic font-bold text-[#0046EA] block mb-10 group-hover:scale-110 transition-transform duration-700">{item.value}</span>
            <p className="text-xs text-black dark:text-white font-black uppercase tracking-[0.4em] mb-6">{item.label}</p>
            <p className="text-sm text-black/40 dark:text-white/40 leading-relaxed font-dm-sans font-medium">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const Story = () => (
  <section className="py-48 lg:py-72 bg-[#0046EA] relative px-8 overflow-hidden font-dm-sans">
    <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-white/10 blur-[200px] rounded-full -mr-96 -mt-96" />
    <div className="max-w-[1400px] mx-auto grid lg:grid-cols-2 gap-32 items-center relative z-10">
      <motion.div
        whileInView={{ opacity: 1, x: 0 }}
        initial={{ opacity: 0, x: -40 }}
        viewport={{ once: true }}
      >
        <div className="flex items-center gap-8 mb-16">
          <div className="w-16 h-px bg-[#FFE900]" />
          <span className="text-xs font-black text-[#FFE900] uppercase tracking-[0.5em]">Triết lý — The Mirror</span>
        </div>
        <h2 className="text-[clamp(48px,6vw,84px)] font-garamond italic font-bold text-white tracking-tight leading-[1.1] mb-16">
          Gương soi <br />
          <span className="text-[#00A4FD]">Bản sắc thực thụ.</span>
        </h2>
        <div className="space-y-12 text-[18px] text-white/60 font-garamond italic leading-relaxed">
          <p>
            CareerPath không chỉ là một công cụ. Chúng tôi là tấm gương phản chiếu phiên bản rực rỡ nhất mà bạn khát khao trở thành.
          </p>
          <p>
            Khi bạn nhìn vào CareerPath, bạn không thấy một hệ thống máy móc. Bạn thấy sự thấu hiểu, tôn trọng và một lộ trình vinh quang được may đo riêng cho chính tâm hồn bạn.
          </p>
        </div>
      </motion.div>

      <motion.div
        whileInView={{ opacity: 1, scale: 1 }}
        initial={{ opacity: 0, scale: 0.95 }}
        viewport={{ once: true }}
        className="relative aspect-square border border-white/10 p-16 flex flex-col justify-center rounded-[80px] bg-white/5 backdrop-blur-3xl shadow-3xl"
      >
        <div className="absolute top-12 left-12 w-3 h-3 bg-[#FFE900] rounded-full animate-pulse shadow-[0_0_15px_#FFE900]" />
        <div className="space-y-16 relative z-10">
          <div className="w-16 h-16 border-2 border-[#00A4FD]/40 flex items-center justify-center text-[#00A4FD] rounded-2xl">
            <span className="font-garamond text-3xl italic font-bold">C</span>
          </div>
          <p className="font-garamond text-[32px] italic text-white/90 leading-snug">
            "Thương hiệu tốt nhất không nói về họ — họ làm gương cho người dùng. Chúng tôi ở đây để bạn thấy được tầm vóc thực sự của chính mình."
          </p>
          <div className="pt-12 border-t border-white/10">
            <span className="font-dm-sans text-xs text-[#FFE900] tracking-[0.5em] font-black uppercase">CareerPath Manifesto</span>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

const Services = () => (
  <section className="py-48 lg:py-72 bg-white dark:bg-[#0A0E1A] px-8 font-dm-sans">
    <div className="max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-baseline mb-40 gap-12 border-b border-black/5 dark:border-white/10 pb-20">
        <div className="space-y-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-[1.5px] bg-[#0046EA]" />
            <span className="text-xs font-black text-[#0046EA] uppercase tracking-[0.4em]">Giải pháp — The Compass</span>
          </div>
          <motion.h2
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 30 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: EASING }}
            className="text-[clamp(48px,6vw,84px)] font-garamond italic font-bold text-[#171716] dark:text-white tracking-tight leading-[1.1]"
          >
            Định Nghĩa Lại <br /> <span className="text-[#00A4FD] opacity-60">Sự Chuẩn Mực.</span>
          </motion.h2>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
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
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 40 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: EASING, delay: i * 0.2 }}
            className={`p-20 h-[700px] flex flex-col justify-between group rounded-[64px] transition-all duration-700 shadow-2xl hover:shadow-blue-500/10 ${service.dark ? 'bg-[#0046EA] border-[#0046EA]' : 'bg-white dark:bg-[#0A0E1A] border border-black/5 dark:border-white/10'
              }`}
          >
            <div className="space-y-16">
              <span className={`text-[64px] font-garamond italic font-bold block ${service.dark ? 'text-white/10' : 'text-[#0046EA]/10'}`}>
                {service.id}
              </span>
              <div className="space-y-6">
                <span className={`text-xs font-black uppercase tracking-[0.5em] ${service.dark ? 'text-[#FFE900]' : 'text-[#00A4FD]'}`}>
                  {service.eyebrow}
                </span>
                <h3 className={`text-5xl font-garamond italic font-bold ${service.dark ? 'text-white' : 'text-[#171716] dark:text-white'}`}>{service.title}</h3>
              </div>
              <p className={`text-[17px] font-dm-sans font-medium leading-[2.1] tracking-wide ${service.dark ? 'text-white/60' : 'text-black/40 dark:text-white/40'}`}>
                {service.desc}
              </p>
            </div>
            <Link href={service.link} className={`inline-flex items-center gap-8 text-xs font-black tracking-[0.5em] uppercase group/link ${service.dark ? 'text-[#FFE900]' : 'text-[#0046EA]'
              }`}>
              BẮT ĐẦU NGAY <div className={`h-[1.5px] w-16 group-hover/link:w-28 transition-all duration-700 ${service.dark ? 'bg-[#FFE900]' : 'bg-[#0046EA]'}`} />
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
  const sectionRef = React.useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef });
  const hasAnimated = React.useRef(false);

  React.useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (v) => {
      // Trigger khi section đã bắt đầu vào viewport (scrollYProgress > 0)
      if (v > 0 && !hasAnimated.current) {
        hasAnimated.current = true;
        let start = 0;
        const duration = 2500;
        const step = (timestamp: number) => {
          if (!start) start = timestamp;
          const progress = Math.min((timestamp - start) / duration, 1);
          setCount(Math.floor(progress * target));
          if (progress < 1) window.requestAnimationFrame(step);
        };
        window.requestAnimationFrame(step);
      }
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  return (
    <section ref={sectionRef} className="py-48 bg-[#0046EA] px-8 relative overflow-hidden font-dm-sans">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-white to-transparent" />
        <div className="absolute top-0 left-2/4 w-px h-full bg-gradient-to-b from-transparent via-white to-transparent" />
        <div className="absolute top-0 left-3/4 w-px h-full bg-gradient-to-b from-transparent via-white to-transparent" />
      </div>
      <div className="max-w-[1400px] mx-auto relative z-10">
        <div className="grid md:grid-cols-3 gap-24 text-center">
          {[
            { value: '500+', label: 'Chuyên gia đồng hành', sub: 'MẠNG LƯỚI TINH HOA' },
            { value: `${count.toLocaleString()}+`, label: 'CV được tối ưu', sub: 'TRÍ TUỆ NHÂN TẠO PHÂN TÍCH' },
            { value: '93%', label: 'Học viên tự tin', sub: 'KHỞI TẠO LỘ TRÌNH CHUẨN XÁC' }
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: i * 0.2, ease: EASING }}
              className="space-y-10 group cursor-default"
            >
              <div className="text-7xl font-garamond italic font-bold text-[#00A4FD] group-hover:scale-110 transition-transform duration-1000">
                {stat.value}
              </div>
              <div className="space-y-4">
                <div className="text-[12px] font-black uppercase tracking-[0.4em] text-white">
                  {stat.label}
                </div>
                <div className="text-[11px] font-black uppercase tracking-[0.3em] text-white/30">
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
  <section className="py-64 lg:py-80 bg-[#0046EA] text-center px-8 relative overflow-hidden font-dm-sans">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,164,253,0.1)_0%,transparent_70%)]" />
    <div className="max-w-4xl mx-auto space-y-32 relative z-10">
      <motion.div
        whileInView={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 40 }}
        viewport={{ once: true }}
        transition={{ duration: 1.4, ease: EASING }}
        className="space-y-16"
      >
        <div className="flex items-center justify-center gap-8">
          <div className="w-16 h-px bg-[#FFE900]" />
          <span className="text-xs font-black text-[#FFE900] uppercase tracking-[0.6em]">The Ascension — Chương Cuối</span>
        </div>
        <h2 className="text-[clamp(48px,7vw,110px)] font-garamond italic font-bold text-white tracking-tight leading-[0.95]">
          Sẵn sàng trở nên <br /> <span className="text-[#00A4FD]">Vô giá?</span>
        </h2>
        <p className="text-[18px] font-garamond italic text-white/50 max-w-xl mx-auto leading-relaxed">
          Đừng để bản sắc của bạn bị hòa lẫn. Hãy để CareerPath đồng hành kiến tạo nên một chương mới huy hoàng trong sự nghiệp của bạn.
        </p>
      </motion.div>

      <motion.div
        whileInView={{ opacity: 1, scale: 1 }}
        initial={{ opacity: 0, scale: 0.98 }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: EASING }}
      >
        <Link href="/register" className="inline-block px-24 py-10 bg-[#FFE900] text-[#171716] dark:text-white text-[11px] font-black tracking-[0.6em] uppercase hover:bg-white dark:bg-[#0A0E1A] hover:text-[#0046EA] transition-all duration-700 shadow-3xl rounded-full">
          Gia nhập hệ sinh thái
        </Link>
      </motion.div>

      <div className="pt-32 flex flex-col items-center gap-12">
        <div className="w-px h-32 bg-gradient-to-b from-white/20 to-transparent" />
        <p className="text-xs text-white/40 font-black tracking-[.3em] uppercase italic">Kiến tạo lộ trình chuyên gia, định hình tương lai số.</p>
        <p className="font-dm-sans text-white/10 text-[11px] font-black tracking-[0.6em] uppercase">
          Reserved for those who value standard and precision.
        </p>
      </div>
    </div>
  </section>
);
export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0E1A] selection:bg-[#0046EA] selection:text-white">
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
