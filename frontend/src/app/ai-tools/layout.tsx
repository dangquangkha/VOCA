import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Tools | VOCA",
  description: "Công cụ AI phân tích CV, mô phỏng phỏng vấn và tối ưu hóa hồ sơ năng lực dành riêng cho bạn.",
};

export default function AIToolsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
