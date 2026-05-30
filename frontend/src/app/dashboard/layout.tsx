import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | VOCA",
  description: "Trang tổng quan cá nhân hóa của bạn tại VOCA. Xem lộ trình, đặt lịch hẹn và quản lý sự nghiệp.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
