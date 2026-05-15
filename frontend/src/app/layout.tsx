import type { Metadata } from "next";
import { DM_Sans, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { NavbarWrapper } from "@/components/NavbarWrapper";
import { FooterWrapper } from "@/components/FooterWrapper";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "900"],
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant-garamond",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "VOCA — Sự Sang Trọng Của Định Hướng.",
  description: "Nền tảng hướng nghiệp cao cấp tích hợp AI, mang lại sự tinh tế và chuẩn mực trong hành trình sự nghiệp.",
};


import { ToastContainer } from "@/components/ui/ToastContainer";
import WaterRipple from "@/components/special/WaterRipple";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${dmSans.variable} ${cormorantGaramond.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning className={`antialiased font-sans flex flex-col min-h-screen text-white relative selection:bg-[var(--neon-magenta)] selection:text-black`}>
        {/* Interactive Water Ripple Effect */}
        {/* <WaterRipple /> */}

        {/* Ambient Bloom: Subtle Gold/Navy glows (Z-index -10) */}
        <div className="fixed inset-0 pointer-events-none z-[-10] overflow-hidden">
          <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-[#C5A039] blur-[160px] opacity-[0.03]" />
          <div className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-[#4F46E5] blur-[160px] opacity-[0.03]" />
        </div>

        {/* Ambient Texture: Soft Grid */}
        <div className="fixed inset-0 pointer-events-none z-[-10] opacity-[0.15] ambient-grid" />

        <div className="relative z-10 flex flex-col min-h-screen">
          <NavbarWrapper />
          <main className="flex-1">{children}</main>
          <FooterWrapper />
        </div>
        <ToastContainer />

      </body>
    </html>
  );
}
