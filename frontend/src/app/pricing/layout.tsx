import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | VOCA",
  description: "Các gói giải pháp và dịch vụ của VOCA. Đầu tư vào tương lai sự nghiệp của bạn ngay hôm nay.",
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
