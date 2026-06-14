# Hướng dẫn Tích hợp Google Đăng nhập thật (Real Google Identity)

Để thay thế đăng nhập giả lập (Mock Login) bằng xác thực thực sự qua Google, bạn cần có một `GOOGLE_CLIENT_ID`. Hãy làm theo các bước chi tiết dưới đây để lấy mã này từ Google.

## Hướng dẫn lấy `GOOGLE_CLIENT_ID` từ Google Cloud Console

1. **Truy cập Google Cloud Console**: Mở trình duyệt và vào trang [Google Cloud Console](https://console.cloud.google.com/). Đăng nhập bằng tài khoản Google của bạn.
2. **Tạo Dự án mới**:
   - Nhấp vào menu thả xuống ở trên cùng bên trái (nơi có tên dự án).
   - Chọn **New Project** (Dự án mới).
   - Đặt tên dự án (ví dụ: `VOCA-App`) và nhấn **Create** (Tạo).
3. **Cấu hình Màn hình chấp thuận OAuth (OAuth consent screen)**:
   - Trong menu điều hướng bên trái, đi tới **APIs & Services (API và Dịch vụ)** > **OAuth consent screen (Màn hình chấp thuận OAuth)**.
   - Chọn loại User type là **External** (Bên ngoài) và nhấn **Create**.
   - Điền các thông tin bắt buộc:
     - *App name*: (ví dụ: VOCA)
     - *User support email*: (chọn email của bạn)
     - *Developer contact information*: (nhập email của bạn ở dưới cùng)
   - Nhấn **Save and Continue** qua các bước Scopes.
   - Ở phần Test users (Người dùng thử nghiệm), hãy thêm email của bạn và những người test vào để có thể dùng thử khi app chưa được Google duyệt. Nhấn **Save and Continue**.
4. **Tạo Thông tin xác thực (Credentials)**:
   - Chuyển sang tab **Credentials (Thông tin xác thực)** ở menu bên trái.
   - Nhấp vào nút **+ CREATE CREDENTIALS** (Tạo thông tin xác thực) ở phía trên cùng và chọn **OAuth client ID**.
   - *Application type* (Loại ứng dụng): Chọn **Web application**.
   - *Name* (Tên): Đặt tên tùy ý (ví dụ: VOCA Web Client).
   - *Authorized JavaScript origins* (Nguồn gốc JavaScript được phép): Thêm URL chạy frontend của bạn. Ví dụ nhấn Add URI và nhập: `http://localhost:3000`. Nếu bạn có tên miền thật, hãy thêm cả `https://voca.vn`.
   - *Authorized redirect URIs* (URI chuyển hướng được phép): Thêm `http://localhost:3000` và `https://voca.vn` (nếu có).
   - Nhấn **Create** (Tạo).
5. **Lấy Client ID**:
   - Một hộp thoại sẽ hiện lên chứa **Client ID** của bạn. Nó có dạng một chuỗi ký tự dài kết thúc bằng `.apps.googleusercontent.com`.
   - Hãy sao chép chuỗi ký tự này.

## Các bước triển khai (Tôi sẽ tự động code cho bạn sau khi có Client ID)

Sau khi bạn cung cấp Client ID, tôi sẽ tiến hành:

### 1. Trên Frontend:
- Cài đặt thư viện `@react-oauth/google`.
- Thêm `NEXT_PUBLIC_GOOGLE_CLIENT_ID=[Mã Client ID của bạn]` vào file `frontend/.env`.
- Cập nhật file `layout.tsx` để bọc ứng dụng với `GoogleOAuthProvider`.
- Chỉnh sửa trang `login` và `register` để loại bỏ đăng nhập giả (Mock) và dùng nút đăng nhập Google thật. Khi đăng nhập thành công, Frontend sẽ gửi `id_token` hoặc `access_token` lên Backend.

### 2. Trên Backend:
- Thêm `GOOGLE_CLIENT_ID=[Mã Client ID của bạn]` vào file `backend/.env`.
- Cập nhật cấu hình trong `backend/app/core/config.py` để đổi `ALLOW_MOCK_LOGIN` sang `False`.
- Cập nhật `backend/app/api/v1/endpoints/auth.py` để sử dụng Google API thực sự (xác minh chữ ký và thông tin người dùng từ `id_token` do Frontend gửi lên).

---

👉 **Phản hồi từ bạn:**
Khi bạn đã lấy được `GOOGLE_CLIENT_ID`, vui lòng dán mã đó vào đây để tôi bắt đầu tiến hành viết code cho dự án nhé.
