import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chuyên Gia | VOCA",
  description: "Danh sách các chuyên gia và mentor xuất sắc nhất tại VOCA, sẵn sàng đồng hành cùng bạn.",
};

export default function ExpertLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
