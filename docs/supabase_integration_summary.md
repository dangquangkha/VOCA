# Hướng dẫn & Tổng hợp Luồng Tích hợp Supabase (VOCA Project)

Tài liệu này tổng hợp toàn bộ thông tin cấu hình, các khóa bảo mật (Keys), và luồng hoạt động của hệ thống khi tích hợp ba dịch vụ chính của **Supabase** (Database, Auth, và Storage) vào dự án.

---

## 1. Các Khóa Cấu Hình (Keys & Environment Variables)

Hệ thống sử dụng các khóa sau để giao tiếp giữa Frontend (Next.js), Backend (FastAPI) và Supabase.

### 1.1 Cấu hình Backend (`backend/.env`)
```env
# Kết nối Database PostgreSQL trực tiếp tới Supabase
DATABASE_URL=postgresql://postgres:[YOUR_DB_PASSWORD]@db.[YOUR_PROJECT_REF].supabase.co:5432/postgres

# Kết nối API & Storage của Supabase
SUPABASE_URL=https://[YOUR_PROJECT_REF].supabase.co
SUPABASE_ANON_KEY=sb_publishable_[YOUR_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=sb_secret_[YOUR_SERVICE_ROLE_KEY]
SUPABASE_JWT_SECRET=
```
*Lưu ý:* `SUPABASE_JWT_SECRET` được để trống để hệ thống tự động fallback kiểm tra token từ xa (remote verification) qua API của Supabase Auth, tăng độ bảo mật và đồng bộ.

### 1.2 Cấu hình Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=[YOUR_GOOGLE_CLIENT_ID]

# Supabase Client Credentials
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_[YOUR_ANON_KEY]
```

---

## 2. Luồng Code Tích Hợp (Architecture & Code Flow)

Sự tích hợp được tổ chức thành 3 phần chính: **Authentication (Xác thực)**, **JIT User Provisioning (Tự động đồng bộ tài khoản)**, và **Storage (Lưu trữ ảnh/tệp tin)**.

### 2.1 Luồng Xác Thực (Authentication Flow)

1. **Khởi tạo Client Supabase ở Frontend**:
   File [supabase.ts](file:///wsl.localhost/Ubuntu/home/hat_n/projects/CareerPath_AI_Project/frontend/src/lib/supabase.ts) đóng vai trò khởi tạo kết nối:
   ```typescript
   import { createClient } from '@supabase/supabase-js';
   export const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
   );
   ```

2. **Lắng nghe trạng thái Auth (Zustand Sync)**:
   Tại [useAuthStore.ts](file:///wsl.localhost/Ubuntu/home/hat_n/projects/CareerPath_AI_Project/frontend/src/store/useAuthStore.ts), hệ thống lắng nghe sự kiện thay đổi trạng thái đăng nhập từ Supabase SDK. Khi có token, store sẽ tự động gửi request tới Backend để lấy thông tin profile chi tiết:
   ```typescript
   supabase.auth.onAuthStateChange(async (event, session) => {
       const token = session?.access_token || null;
       if (token) {
           useAuthStore.getState().setToken(token);
           try {
               const { data } = await api.get('users/me', {
                   headers: { Authorization: `Bearer {token}` } // Note: template literal
               });
               useAuthStore.getState().updateUser(data);
           } catch (err) {
               console.error("Failed to sync user profile:", err);
           }
       } else {
           useAuthStore.getState().logout();
       }
   });
   ```

3. **Giao diện Đăng nhập / Đăng ký**:
   Các trang đăng nhập ([login/page.tsx](file:///wsl.localhost/Ubuntu/home/hat_n/projects/CareerPath_AI_Project/frontend/src/app/(auth)/login/page.tsx)), đăng ký ([register/page.tsx](file:///wsl.localhost/Ubuntu/home/hat_n/projects/CareerPath_AI_Project/frontend/src/app/(auth)/register/page.tsx)), quên mật khẩu ([forgot-password/page.tsx](file:///wsl.localhost/Ubuntu/home/hat_n/projects/CareerPath_AI_Project/frontend/src/app/(auth)/forgot-password/page.tsx)) đều gọi API trực tiếp của Supabase Auth thay vì gọi qua API custom cũ của backend.
   - Ví dụ đăng nhập bằng Email/Password:
     ```typescript
     const { data, error } = await supabase.auth.signInWithPassword({ email, password });
     ```
   - Đăng nhập qua Google OAuth:
     ```typescript
     await supabase.auth.signInWithOAuth({
         provider: 'google',
         options: { redirectTo: `${window.location.origin}/auth/callback` }
       });
     ```

---

### 2.2 Luồng JIT User Provisioning (Đồng bộ tài khoản tự động)

Khi Frontend gửi Bearer Token lên API `/users/me` (hoặc bất kỳ API nào cần quyền đăng nhập), Backend sẽ thực hiện xác thực và đồng bộ:

1. **Giải mã & Kiểm tra Token**:
   Trong [deps.py](file:///wsl.localhost/Ubuntu/home/hat_n/projects/CareerPath_AI_Project/backend/app/api/deps.py#L29), hàm `verify_supabase_token` sẽ gửi request tới endpoint `/auth/v1/user` của Supabase Auth để xác thực token hợp lệ và nhận về thông tin định danh của người dùng (email, user_metadata).

2. **JIT Provisioning (Khởi tạo tài khoản local)**:
   Hàm [get_or_create_user_from_payload](file:///wsl.localhost/Ubuntu/home/hat_n/projects/CareerPath_AI_Project/backend/app/api/deps.py#L82) nhận payload đã giải mã:
   - Kiểm tra xem email đã tồn tại trong bảng `user` của PostgreSQL chưa.
   - Nếu chưa, tiến hành thêm mới một bản ghi User vào database local với các thông tin đồng bộ (`email`, `full_name`, `avatar_url`, `phone_number`, `role`).
   - Cột `hashed_password` được lưu là `None` (Null) để chấp nhận tài khoản đăng nhập từ bên thứ ba.
   - **Tự động kích hoạt Expert Profile**: Nếu Role của user là `EXPERT` hoặc `MENTOR`, hệ thống tự động khởi tạo thêm một bản ghi trống bên bảng `expert_profiles` (với trạng thái KYC tương ứng) để đảm bảo không bị lỗi giao diện Dashboard của chuyên gia.

---

### 2.3 Luồng Lưu Trữ File (Storage Integration)

Dự án không cài đặt bộ SDK nặng nề của Supabase lên Backend Python, thay vào đó sử dụng các kết nối HTTP REST API cực kỳ gọn nhẹ qua thư viện `httpx`.

1. **Hàm upload Core helper**:
   Được triển khai trong [supabase_storage.py](file:///wsl.localhost/Ubuntu/home/hat_n/projects/CareerPath_AI_Project/backend/app/core/supabase_storage.py):
   ```python
   async def upload_file_to_supabase(bucket: str, file_path: str, file_content: bytes, content_type: str) -> str:
       # Gửi PUT request trực tiếp đến Supabase Storage API
       url = f"{settings.SUPABASE_URL}/storage/v1/object/{bucket}/{file_path}"
       headers = {
           "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
           "apikey": settings.SUPABASE_ANON_KEY,
           "Content-Type": content_type
       }
       async with httpx.AsyncClient() as client:
           response = await client.put(url, content=file_content, headers=headers)
           # Trả về URL public của file sau khi upload thành công
           return f"{settings.SUPABASE_URL}/storage/v1/object/public/{bucket}/{file_path}"
   ```

2. **Tích hợp tải Avatar**:
   Tại [users_router.py](file:///wsl.localhost/Ubuntu/home/hat_n/projects/CareerPath_AI_Project/backend/app/domains/identity/users_router.py#L93), API `/upload-avatar` nhận file từ người dùng, crop vuông và resize về kích thước 500x500 JPEG, sau đó gọi hàm upload lên bucket `avatars` trên Supabase, cuối cùng cập nhật liên kết hình ảnh vào cột `avatar_url` của User.

3. **Tích hợp tải Portfolio**:
   Tại [portfolio_router.py](file:///wsl.localhost/Ubuntu/home/hat_n/projects/CareerPath_AI_Project/backend/app/domains/marketplace/portfolio_router.py), các file tài liệu và hình ảnh giới thiệu năng lực của Chuyên gia được tải trực tiếp lên bucket `portfolio` của Supabase bằng cơ chế tương tự.

---

## 3. Các File Code Liên Quan

Dưới đây là danh sách toàn bộ các file chịu trách nhiệm xử lý luồng tích hợp này:

| File path | Vai trò |
| :--- | :--- |
| **Backend** | |
| [backend/.env](file:///wsl.localhost/Ubuntu/home/hat_n/projects/CareerPath_AI_Project/backend/.env) | File cấu hình các biến môi trường phía Server (Db Url, keys, host...). |
| [config.py](file:///wsl.localhost/Ubuntu/home/hat_n/projects/CareerPath_AI_Project/backend/app/core/config.py) | Định nghĩa và parse các cấu hình Supabase vào object `settings`. |
| [deps.py](file:///wsl.localhost/Ubuntu/home/hat_n/projects/CareerPath_AI_Project/backend/app/api/deps.py) | Chứa middleware xác thực token Supabase từ xa và xử lý JIT User Provisioning. |
| [models.py](file:///wsl.localhost/Ubuntu/home/hat_n/projects/CareerPath_AI_Project/backend/app/domains/identity/models.py) | Định nghĩa cấu trúc bảng User (Đã đưa `hashed_password` về `nullable=True`). |
| [supabase_storage.py](file:///wsl.localhost/Ubuntu/home/hat_n/projects/CareerPath_AI_Project/backend/app/core/supabase_storage.py) | Helper upload file REST API tới Supabase Storage (dùng `httpx`). |
| [users_router.py](file:///wsl.localhost/Ubuntu/home/hat_n/projects/CareerPath_AI_Project/backend/app/domains/identity/users_router.py) | API tải ảnh đại diện và quản lý profile cá nhân. |
| **Frontend** | |
| [frontend/.env.local](file:///wsl.localhost/Ubuntu/home/hat_n/projects/CareerPath_AI_Project/frontend/.env.local) | File cấu hình các biến môi trường công khai phía Client. |
| [supabase.ts](file:///wsl.localhost/Ubuntu/home/hat_n/projects/CareerPath_AI_Project/frontend/src/lib/supabase.ts) | Khởi tạo Supabase JS client. |
| [useAuthStore.ts](file:///wsl.localhost/Ubuntu/home/hat_n/projects/CareerPath_AI_Project/frontend/src/store/useAuthStore.ts) | Quản lý state đăng nhập của hệ thống và đồng bộ phiên làm việc của người dùng. |
| [login/page.tsx](file:///wsl.localhost/Ubuntu/home/hat_n/projects/CareerPath_AI_Project/frontend/src/app/(auth)/login/page.tsx) | Trang đăng nhập tích hợp Supabase Auth. |
| [register/page.tsx](file:///wsl.localhost/Ubuntu/home/hat_n/projects/CareerPath_AI_Project/frontend/src/app/(auth)/register/page.tsx) | Trang đăng ký tích hợp Supabase Auth. |
