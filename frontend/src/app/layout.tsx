import type { Metadata } from "next";
import { DM_Sans, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { NavbarWrapper } from "@/components/NavbarWrapper";
import { FooterWrapper } from "@/components/FooterWrapper";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
  weight: ["300", "400", "500"],
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant-garamond",
  display: "swap",
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "VOCA — Sự Sang Trọng Của Định Hướng.",
  description: "Nền tảng hướng nghiệp cao cấp tích hợp AI, mang lại sự tinh tế và chuẩn mực trong hành trình sự nghiệp.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${dmSans.variable} ${cormorantGaramond.variable}`}>
      <body className={`antialiased font-dm-sans flex flex-col min-h-screen`}>
        <NavbarWrapper />
        <main className="flex-1">{children}</main>
        <FooterWrapper />
      </body>
    </html>
  );
}
