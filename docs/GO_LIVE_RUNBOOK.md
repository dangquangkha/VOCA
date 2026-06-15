# GO LIVE RUNBOOK - VOCA

Sau khi chạy xong kịch bản `deploy.sh` và code đã lên Vercel / Render thành công.
Đây là những thao tác bằng tay bắt buộc để hệ thống của bạn thực sự "live" và an toàn.

## 1. Cấu hình biến môi trường trên Vercel và Render

Mặc dù `deploy.sh` đã tạo file `.env` ở máy tính của bạn, nhưng trên máy chủ Vercel và Render, bạn vẫn phải tự thêm các biến đó vào Dashboard bảo mật của họ.

**Trên Render (Backend):**
- Trong lúc tạo Blueprint (hoặc Web Service), Render sẽ tự đọc file `render.yaml`.
- Tại mục **Environment** của Render, hãy lấy các biến trong file `backend/.env` (vừa được sinh ra) và điền tay vào, đặc biệt là `DATABASE_URL`, `REDIS_URL`, và `RESEND_KEY`.

**Trên Vercel (Frontend):**
- Đi tới Project Settings > Environment Variables.
- Thêm `NEXT_PUBLIC_SUPABASE_URL` (ví dụ: `https://[SB_REF].supabase.co`).
- Thêm `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Lấy trong Supabase Dashboard > Project Settings > API Keys).

## 2. Bảo mật Supabase (Cực kỳ quan trọng)

Bạn bắt buộc phải bật Row-Level Security (RLS) để không ai có thể can thiệp thẳng vào database của bạn từ Frontend.

Vào Supabase Dashboard:
1. Mở mục **SQL Editor**.
2. Tạo New Query và dán toàn bộ đoạn code dưới đây vào, sau đó nhấn **Run**:

```sql
-- Bật RLS cho tất cả các bảng
-- (Chú ý: Đảm bảo bạn đã có các bảng này trong Database trước khi chạy)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- Thêm các bảng khác tương tự: ALTER TABLE ten_bang ENABLE ROW LEVEL SECURITY;

-- Tạo chính sách: Chỉ có Backend (dùng Service Role Key) mới được phép toàn quyền (CRUD)
CREATE POLICY "Service Role Full Access" ON users
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
```

## 3. Tạo thư mục Uploads (Nếu chưa làm)

1. Vào Supabase > Storage.
2. Bấm New bucket > Đặt tên là `uploads` (viết thường).
3. Nhớ đánh dấu bật Public bucket (tích xanh).
