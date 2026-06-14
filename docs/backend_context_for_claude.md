# Tài Liệu Chuyên Sâu Backend: CareerPath AI

Tài liệu này cung cấp toàn bộ bối cảnh (context) về Backend cho các LLMs (như Claude) để có thể hiểu kiến trúc và tự động code tiếp các tính năng một cách liền mạch mà không cần yêu cầu cung cấp thêm cấu hình hay keys.

---

## 1. Toàn Bộ Biến Môi Trường (`.env`)

Dưới đây là toàn bộ các keys thật đang được dùng trên Backend (được trích xuất từ file `backend/.env`):

```env
PROJECT_NAME=CareerPath AI

# ── Cơ Sở Dữ Liệu (PostgreSQL trên Supabase) ──
DATABASE_URL=postgresql://postgres:[YOUR_DB_PASSWORD]@db.[YOUR_PROJECT_REF].supabase.co:5432/postgres

# ── Cấu hình JWT Backend (Dùng cho nội bộ) ──
SECRET_KEY=thay_doi_chuoi_nay_bang_mat_khau_ngau_nhien_dai_va_kho
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# ── Cấu hình Thanh toán (SePay) ──
SEPAY_ACCOUNT_NUMBER=0379262302
SEPAY_BANK_CODE=MB
SEPAY_API_TOKEN=[YOUR_SEPAY_API_TOKEN]
SEPAY_WEBHOOK_TOKEN=[YOUR_SEPAY_WEBHOOK_TOKEN]

# ── Cấu hình Hệ thống khác ──
REDIS_URL=redis://localhost:6379
GOOGLE_CLIENT_ID=[YOUR_GOOGLE_CLIENT_ID]
ALLOW_MOCK_LOGIN=false

# ── Cấu hình Gửi Email (SMTP Gmail) ──
EMAILS_ENABLED=true
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="[YOUR_EMAIL]@gmail.com"
EMAILS_FROM_EMAIL="[YOUR_EMAIL]@gmail.com"
EMAILS_FROM_NAME="Hệ thống CareerPath"
SMTP_PASSWORD=[YOUR_APP_PASSWORD]

# ── Cấu hình Supabase (Auth, Storage) ──
SUPABASE_URL=https://[YOUR_PROJECT_REF].supabase.co
SUPABASE_ANON_KEY=sb_publishable_[YOUR_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=sb_secret_[YOUR_SERVICE_ROLE_KEY]
SUPABASE_JWT_SECRET=
```
*(Lưu ý: `SUPABASE_JWT_SECRET` được để trống vì hệ thống thực hiện Remote Verification qua REST API của Supabase thay vì verify local JWT)*.

---

## 2. Luồng Xác Thực (Authentication Flow)

Hệ thống ủy quyền hoàn toàn việc quản lý Đăng ký / Đăng nhập / OAuth (Google) cho SDK của Supabase ở phía Frontend (Next.js). Backend chỉ đóng vai trò **nhận token** và **cấp quyền**.

**Luồng hoạt động:**
1. Frontend dùng `@supabase/supabase-js` gọi `signInWithPassword` hoặc `signInWithOAuth`.
2. Supabase trả về Session (chứa `access_token` - dạng JWT).
3. Zustand Store trên Frontend lưu `access_token` này và tự động gắn vào Header `Authorization: Bearer <token>` cho mọi request tới Backend.
4. Tại Backend (FastAPI), dependency `get_current_user` trong `app/api/deps.py` sẽ chặn request, lấy token từ header.
5. **Remote Verification**: Backend dùng thư viện `httpx` gọi GET tới `https://[SUPABASE_URL]/auth/v1/user`, truyền token vào header. Nếu Supabase Auth trả về thông tin user (HTTP 200), chứng tỏ token hợp lệ. Nếu trả về lỗi, Backend văng `401 Unauthorized`.

---

## 3. Tự Động Tạo Tài Khoản Local (JIT User Provisioning)

Dự án có sự tách biệt: **Supabase Auth** quản lý Identity (Email, mật khẩu), còn **PostgreSQL (Local DB)** quản lý Logic nghiệp vụ. Do đó, cần có bước đồng bộ tự động.

1. Ngay khi bước Xác Thực (phần 2) thành công, Backend nhận được payload User từ Supabase (gồm `email`, `user_metadata`).
2. Hàm `get_or_create_user_from_payload` trong `deps.py` sẽ thực thi:
   - Query DB PostgreSQL xem `email` này đã có trong bảng `user` chưa.
   - **Nếu CÓ**: Trả về instance `User`.
   - **Nếu CHƯA**: Hệ thống sẽ tự động tạo một bản ghi `User` mới:
     - Dữ liệu map từ Supabase metadata (`full_name`, `avatar_url`, v.v.).
     - `hashed_password` = `NULL` (Chấp nhận tài khoản sinh ra từ OAuth/Supabase mà không cần password truyền thống).
     - **Tự động kích hoạt KYC**: Nếu metadata báo role là `EXPERT` hoặc `MENTOR`, hệ thống tự động khởi tạo thêm bảng liên kết `ExpertProfile` (bảng mở rộng của user) với trạng thái KYC ban đầu.

---

## 4. Xử lý Opaque Token trên API Keys v2 của Supabase

Supabase gần đây đã ra mắt cấu trúc API Keys v2 (các token bắt đầu bằng cụm `sb_secret_...` hoặc `sb_publishable_...`) thay vì các mã JWT dài (`eyJ...`) cũ. Đây được gọi là Opaque Tokens.

Vấn đề là API Storage REST thuần của Supabase sẽ trả về lỗi **`403 Invalid Compact JWS`** nếu bạn chỉ gửi token `sb_secret_` này vào header `Authorization: Bearer`. 

**Cách hệ thống giải quyết (Workaround rất quan trọng):**
Trong file `backend/app/core/supabase_storage.py`, chúng ta truyền đồng thời **CẢ 2 HEADERS** với cùng nội dung Service Role Key:
```python
headers = {
    "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
    "apikey": settings.SUPABASE_SERVICE_ROLE_KEY, # BẮT BUỘC để Supabase nhận diện Opaque Token
    "Content-Type": content_type,
    "x-upsert": "true"
}
```
Nhờ truyền thêm `apikey`, API Storage của Supabase hiểu được quyền Service Role và bỏ qua yêu cầu kiểm tra định dạng JWT, cho phép tải tệp tin lên thành công.

---

## 5. Lưu Trữ Tệp Tin (Storage) & Upload Hình Ảnh

Hệ thống cung cấp API `/api/v1/users/upload-avatar` (trong file `users_router.py`) để cho phép người dùng cập nhật ảnh đại diện.

**Luồng xử lý Upload Ảnh:**
1. **Tiếp nhận File**: Frontend gửi file ảnh qua form-data (`UploadFile`).
2. **Tiền xử lý (Image Processing)**:
   - Backend sử dụng thư viện **Pillow (`PIL`)** (đã được cài đặt bằng `pip install Pillow`).
   - Mở luồng I/O từ `bytes`, check hệ màu `RGB`.
   - **Crop vuông**: Tính toán `width` và `height`, tìm ra cạnh ngắn nhất để cắt ảnh vào chính giữa tâm (Center Crop).
   - **Resize**: Thu nhỏ ảnh về độ phân giải chuẩn `500x500` pixels bằng thuật toán `LANCZOS` để giảm dung lượng mạng.
   - **Lưu bộ nhớ tạm**: Xuất ra định dạng `JPEG` với quality 85 xuống một buffer `io.BytesIO()`. Toàn bộ quá trình này chạy trong threadpool để tránh chặn vòng lặp bất đồng bộ của FastAPI.
3. **Upload lên Supabase**:
   - Gọi hàm `upload_file_to_supabase` (truyền bytes đã xử lý, content_type là `image/jpeg`).
   - Hàm sử dụng `httpx.AsyncClient` PUT nội dung này lên bucket `avatars` trên Supabase, sử dụng kỹ thuật Opaque Tokens đã đề cập ở phần 4.
4. **Lưu Database**:
   - Hàm trả về đường dẫn `public_url` của Supabase Storage.
   - Ghi đè `public_url` này vào cột `avatar_url` của `User` trong CSDL PostgreSQL. Trả về cho Frontend.

> **Lưu ý cho Claude (LLM):** Khi phát triển tính năng cần lưu trữ file mới (Ví dụ tải CV, tải bài viết blog), hãy tái sử dụng hàm `upload_file_to_supabase` trong `backend/app/core/supabase_storage.py`, và nhớ giữ nguyên bộ headers `Authorization` + `apikey` để tránh lỗi JWS. Đừng sử dụng thư viện `supabase-py` SDK vì dự án đang ưu tiên code thuần gọn nhẹ.

---

## 6. Frontend Tương Tác (Nhận Dữ Liệu) Bằng Cách Nào?

Sau khi Backend xử lý xong và tải file lên Supabase Storage, Frontend sẽ nhận dữ liệu và tự động cập nhật lên giao diện theo luồng như sau:

1. **Gọi API bằng Axios**:
   Frontend tạo `FormData` chứa file ảnh và gửi request POST bằng instance `api` (instance Axios này đã được cấu hình tự động đính kèm `Authorization: Bearer <token>` vào header nhờ thư viện interceptor).
   ```typescript
   // Trong frontend/src/app/dashboard/profile/page.tsx
   const formData = new FormData();
   formData.append('file', selectedFile);
   
   const { data } = await api.post('users/upload-avatar', formData);
   ```

2. **Backend trả về JSON kết quả**:
   Hàm API ở phần 5 sẽ trả về chuỗi JSON chứa đường dẫn tới ảnh:
   ```json
   {
       "avatar_url": "https://jjbicqwwnwtjnhucessm.supabase.co/storage/v1/object/public/avatars/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.jpg"
   }
   ```

3. **Cập nhật State (Zustand)**:
   Tại dòng code tiếp theo ở Frontend, dữ liệu từ `data.avatar_url` được gán vào thông tin profile hiện hành và gọi hàm `setUser` của **Zustand Store** (`useAuthStore`).
   ```typescript
   const updatedProfile = user ? { ...user, avatar_url: data.avatar_url } : null;
   if (updatedProfile) {
       setUser(updatedProfile); // Cập nhật biến global 'user'
   }
   ```
   **Kết quả:** Do Zustand đóng vai trò là Global State Manager, ngay lập tức mọi component (như Navigation Bar, Profile Sidebar, hay Avatar Thumbnail) đang trỏ tới `user.avatar_url` sẽ tự động re-render và hiển thị ảnh mới nhất mà người dùng vừa tải lên. Không cần reload trang.

---

## 7. Tham Khảo Code Gốc (Source Code Reference)

Dưới đây là một số đoạn code mẫu gốc trong Backend mà Claude có thể đối chiếu.

### 7.1. Logic JIT Provisioning (`backend/app/api/deps.py`)

```python
async def get_or_create_user_from_payload(payload: dict, db: AsyncSession) -> User:
    email = payload.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token does not contain email claim",
        )
        
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(User).where(User.email == email)
        .options(selectinload(User.expert_profile))
    )
    user = result.scalars().first()
    
    if user is None:
        user_metadata = payload.get("user_metadata", {}) or {}
        full_name = user_metadata.get("full_name") or email.split("@")[0]
        avatar_url = user_metadata.get("avatar_url")
        phone_number = user_metadata.get("phone_number")
        
        from backend.app.domains.identity.models import UserRole, UserStatus
        role_str = str(user_metadata.get("role", "STUDENT")).upper()
        if role_str not in UserRole.__members__:
            role = UserRole.STUDENT
        else:
            role = UserRole[role_str]
            
        user = User(
            email=email,
            full_name=full_name,
            avatar_url=avatar_url,
            phone_number=phone_number,
            role=role,
            account_status=UserStatus.ACTIVE,
            credits=0,
            is_active=True,
            is_superuser=False,
            hashed_password=None # JIT users from OAuth don't need a password initially
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
        # Auto-create Expert Profile if role is EXPERT or MENTOR
        if user.role in [UserRole.EXPERT, UserRole.MENTOR]:
            from backend.app.domains.marketplace.models import ExpertProfile, KYCStatus
            expert_profile = ExpertProfile(
                user_id=user.id,
                kyc_status=KYCStatus.APPROVED if user.role == UserRole.MENTOR else KYCStatus.PENDING
            )
            db.add(expert_profile)
            await db.commit()
            
            result = await db.execute(
                select(User).where(User.id == user.id)
                .options(selectinload(User.expert_profile))
            )
            user = result.scalars().first()
        
    return user
```

### 7.2. Logic Upload Avatar (`backend/app/domains/identity/users_router.py`)

```python
@router.post("/upload-avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    import uuid
    import os

    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    upload_dir = os.path.join(os.getcwd(), "backend", "uploads", "avatars")
    os.makedirs(upload_dir, exist_ok=True)

    extension = os.path.splitext(file.filename)[1] or ".jpg"
    filename = f"{uuid.uuid4()}{extension}"

    try:
        from PIL import Image
        import io
        from starlette.concurrency import run_in_threadpool

        content = await file.read()

        def process_image(img_content: bytes) -> bytes:
            img = Image.open(io.BytesIO(img_content))
            if img.mode != "RGB":
                img = img.convert("RGB")
            width, height = img.size
            min_dim = min(width, height)
            left  = (width  - min_dim) / 2
            top   = (height - min_dim) / 2
            right = (width  + min_dim) / 2
            bottom= (height + min_dim) / 2
            img = img.crop((left, top, right, bottom))
            img = img.resize((500, 500), Image.Resampling.LANCZOS)
            output = io.BytesIO()
            img.save(output, format="JPEG", quality=85)
            return output.getvalue()

        # Execute CPU bound operations in threadpool
        final_content = await run_in_threadpool(process_image, content)

        from backend.app.core.supabase_storage import upload_file_to_supabase
        avatar_url = await upload_file_to_supabase(
            bucket="avatars",
            file_path=filename,
            file_content=final_content,
            content_type="image/jpeg"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save avatar: {str(e)}")

    current_user.avatar_url = avatar_url
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)

    return {"avatar_url": avatar_url}
```
