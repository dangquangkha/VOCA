# HƯỚNG DẪN TRIỂN KHAI TOÀN DIỆN DỰ ÁN VOCA (CAREERPATH AI)

Tài liệu này tổng hợp toàn bộ thông tin triển khai dự án VOCA (Frontend Next.js và Backend FastAPI) lên môi trường Production. Hướng dẫn bao gồm kiến trúc hệ thống, danh sách khóa bảo mật (được ẩn bằng placeholder để bảo mật), mã nguồn cấu hình đã chạy thành công, kịch bản tự động hóa và cách thiết lập tài khoản.

> [!NOTE]
> Để xem lại các khóa bảo mật thực tế đã chạy thành công (Supabase URL, Database URL, Redis URL, Resend Key), vui lòng mở tệp **`voca_deployment_guide.md`** nằm trong thư mục Artifacts của Chat Assistant hoặc file `.env` nội bộ trên máy cá nhân của bạn. Không đẩy các khóa thực tế này lên GitHub công khai.

---

## 1. Mô hình kiến trúc & Luồng dữ liệu (Architecture & Data Flow)

Hệ thống hoạt động theo mô hình Full-stack phân tán để tối ưu hiệu năng và tận dụng tối đa các gói dịch vụ đám mây miễn phí:

```mermaid
graph TD
    User[Người dùng] -->|Truy cập giao diện| Frontend[Frontend Next.js - Vercel]
    Frontend -->|Gọi API qua HTTPS| Backend[Backend FastAPI - Render]
    Backend -->|Truy vấn dữ liệu qua Pooler cổng 6543| SupabaseDB[(Supabase PostgreSQL)]
    Backend -->|Lưu/Tải file ảnh, avatar| SupabaseStorage[Supabase Storage - uploads]
    Backend -->|Cache & Rate Limit| UpstashRedis[(Upstash Redis)]
    Backend -->|Gửi Mail qua REST API HTTPS| ResendAPI[Resend Email Service]
```

### Chi tiết luồng xử lý:
1. **Frontend (Next.js - Vercel):** Phục vụ giao diện tĩnh và Client-side. Gửi request API qua HTTPS tới Render Backend.
2. **Backend (FastAPI - Render):** Xử lý nghiệp vụ chính. 
   - Sử dụng **Upstash Redis** để lưu trữ cache và kiểm soát tần suất gửi yêu cầu (Rate Limit).
   - Sử dụng **Resend HTTP API** để gửi email (vì máy chủ Render gói Free chặn toàn bộ các cổng SMTP `25`, `465`, `587`).
3. **Database (Supabase PostgreSQL):** Kết nối thông qua **Transaction Pooler (cổng 6543)** nhằm giải quyết hai vấn đề:
   - Render Free không hỗ trợ IPv6 nên không thể kết nối trực tiếp đến cổng `5432` của Supabase.
   - Cơ chế pooling giúp tối ưu hóa số lượng kết nối đồng thời từ ứng dụng serverless.
4. **Storage (Supabase Storage):** Lưu trữ hình ảnh và avatar người dùng trong bucket `uploads` ở chế độ Public.

---

## 2. Thông tin tài khoản & Khóa cấu hình (Placeholders)

### 🔑 Supabase (Database & Storage)
*   **Project Reference ID (SB_REF):** `<your_supabase_project_ref>`
*   **Database Password (SB_PWD):** `<your_database_password>`
*   **DATABASE_URL Pooler (Dùng trên Render & Local):**
    `postgresql://postgres.<project_ref>:<password>@<pooler_host>:6543/postgres?prepared_statement_cache_size=0`
*   **Supabase Project URL:** `https://<project_ref>.supabase.co`
*   **Supabase Anon Key (Public - Frontend):** `<your_supabase_anon_key>`
*   **Supabase Service Role Key (Secret - Backend):** `<your_supabase_service_role_key>`
*   **Storage Bucket:** `uploads` (Bắt buộc bật chế độ Public)

### 🔑 Upstash (Redis Cache)
*   **REDIS_URL:** `rediss://default:<redis_password>@<redis_host>:<redis_port>`
*   **Khu vực:** Singapore (ap-southeast-1)

### 🔑 Resend (Email Service)
*   **RESEND_KEY:** `re_<resend_api_key>`
*   **Email gửi thử nghiệm (Sandbox):** `onboarding@resend.dev`

---

## 3. Mã nguồn các File cấu hình cốt lõi đã chạy thành công

### A. Cấu hình triển khai Render (`render.yaml`)
Tệp này nằm ở thư mục gốc để Render tự động nhận diện dịch vụ, phiên bản Python và khởi chạy database migration trước khi bật Web server:
```yaml
services:
  - type: web
    name: voca-backend
    env: python
    plan: free
    region: oregon
    buildCommand: "cd backend && pip install -r requirements.txt"
    startCommand: "alembic upgrade head && uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT"
    envVars:
      - key: PYTHON_VERSION
        value: 3.10.0
      - key: DATABASE_URL
        sync: false
      - key: REDIS_URL
        sync: false
      - key: SECRET_KEY
        generateValue: true
      - key: ALLOW_MOCK_LOGIN
        value: "false"
      - key: EMAILS_ENABLED
        value: "true"
      - key: RESEND_KEY
        sync: false
      - key: EMAILS_FROM_EMAIL
        sync: false
      - key: EMAILS_FROM_NAME
        value: "Hệ thống CareerPath"
```

### B. Kết nối Database SQLAlchemy (`backend/app/db/session.py`)
Bổ sung cơ chế tự động đổi tiền tố driver sang `postgresql+asyncpg://` và tắt cơ chế cache prepared statements của thư viện `asyncpg` để hoạt động tốt với PgBouncer của Supabase:
```python
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from backend.app.core.config import settings

url = settings.DATABASE_URL
if url.startswith("postgresql://"):
    url = url.replace("postgresql://", "postgresql+asyncpg://")

engine = create_async_engine(
    url, 
    echo=False,
    pool_size=20,
    max_overflow=40,
    pool_timeout=30,
    pool_recycle=1800,
    connect_args={"statement_cache_size": 0}
)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)
```

### C. Cấu hình di cư cơ sở dữ liệu (`alembic/env.py`)
Chỉ định cơ chế kết nối Async tương thích với cổng Pooler Supabase:
```python
# ... (Phần import và thiết lập mặc định của Alembic)
from backend.app.core.config import settings
from backend.app.db.base import Base

config = context.config
db_url = settings.DATABASE_URL
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://")
config.set_main_option("sqlalchemy.url", db_url.replace("%", "%%"))

target_metadata = Base.metadata

# ... (Hàm chạy offline)

async def run_async_migrations() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        connect_args={"statement_cache_size": 0},
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()
```

### D. Tiện ích gửi Email qua Resend API (`backend/app/core/email.py`)
Gửi mail thông qua Resend HTTP API để tránh bị chặn cổng trên Render Free, đồng thời hỗ trợ cơ chế fallback qua luồng Threadpool SMTP nếu Resend lỗi:
```python
import emails
from emails.template import JinjaTemplate
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.models.email_log import EmailLog
from backend.app.core.config import settings

async def send_email(
    to: str,
    subject: str,
    body: str,
    db: AsyncSession,
    html_body: str = None
) -> None:
    # 1. Ghi nhật ký email vào Database
    email_log = EmailLog(to_email=to, subject=subject, body=body)
    db.add(email_log)
    await db.commit() 
    
    if not settings.EMAILS_ENABLED:
        print(f"MOCK EMAIL SENT TO: {to}")
        return

    # 2. Gửi qua Resend API (HTTP REST) - Khuyên dùng trên Render
    if settings.RESEND_KEY:
        import httpx
        resend_url = "https://api.resend.com/emails"
        headers = {
            "Authorization": f"Bearer {settings.RESEND_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "from": f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>",
            "to": [to],
            "subject": subject,
            "text": body
        }
        if html_body:
            payload["html"] = html_body

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(resend_url, json=payload, headers=headers)
                if response.status_code in [200, 201, 250]:
                    print(f"Email sent successfully to {to} via Resend API")
                    return
        except Exception as e:
            print(f"EXCEPTION Sending Email via Resend: {e}")

    # 3. Fallback SMTP (Nếu Resend không cấu hình hoặc lỗi)
    # ... (Gửi SMTP thông qua run_in_threadpool)
```

---

## 4. Kịch bản Triển khai Tự động hóa (`scripts/deploy.sh`)

Chúng tôi đã viết một file Bash Script giúp tự động hóa 100% quá trình thiết lập môi trường cục bộ, sinh các tệp cấu hình và đồng bộ mã nguồn lên GitHub.

### 💻 Mã nguồn script (`scripts/deploy.sh`):
Vui lòng xem mã nguồn trực tiếp tại [deploy.sh](file:///wsl.localhost/Ubuntu/home/hat_n/projects/CareerPath_AI_Project/scripts/deploy.sh).

### 🚀 Hướng dẫn chạy Script:
1. Mở Terminal Linux/WSL trên máy của bạn tại thư mục gốc của dự án.
2. Cấp quyền thực thi cho script (nếu chưa):
   ```bash
   chmod +x scripts/deploy.sh
   ```
3. Chạy script:
   ```bash
   bash scripts/deploy.sh
   ```
4. Script sẽ nhắc bạn nhập từng thông tin cấu hình và tự động hoàn thành:
   - Tự động mã hóa mật khẩu có ký tự đặc biệt bằng thư viện Python.
   - Tự sinh tệp cấu hình `backend/.env` đầy đủ tham số sản xuất.
   - Tự sinh tệp cấu hình cục bộ `frontend/.env.local` phục vụ kết nối Frontend.
   - Kiểm tra xác thực đăng nhập GitHub CLI (`gh`). Nếu chưa đăng nhập, script sẽ kích hoạt luồng `gh auth login` để bạn xác thực một lần.
   - Đóng gói (Commit) và Đẩy (Push) mã nguồn lên nhánh `main` của GitHub repository.

---

## 5. Hướng dẫn chi tiết từng Click cho 3 Dịch vụ bổ trợ

### 1️⃣ Supabase (Cơ sở dữ liệu & Lưu trữ ảnh)
1. Truy cập [supabase.com](https://supabase.com) $\rightarrow$ Chọn **Start your project** $\rightarrow$ Đăng nhập bằng tài khoản GitHub.
2. Bấm **New Project** $\rightarrow$ Điền thông tin:
   - **Name:** `voca`
   - **Database Password:** Chọn **Generate a password** $\rightarrow$ **COPY VÀ LƯU LẠI** (Đây là `SB_PWD`).
   - **Region:** Chọn **Southeast Asia (Singapore) - ap-southeast-1**.
   - Bấm **Create new project** và chờ khoảng 2 phút để khởi tạo.
3. Lấy thông tin kết nối:
   - Vào mục **Project Settings** (biểu tượng bánh răng góc dưới bên trái) $\rightarrow$ **General** $\rightarrow$ Sao chép **Reference ID** (Ví dụ: `jjbicqwwnwtjnhucessm`). Đây là `SB_REF`.
   - Vào **Project Settings** $\rightarrow$ **API** $\rightarrow$ Tìm dòng **service_role** key $\rightarrow$ Bấm **Reveal** $\rightarrow$ Sao chép chuỗi mã khóa dài. Đây là `SB_SVC`.
   - Sao chép **anon** public key ở ngay phía trên. Đây là `SB_ANON`.
4. Tạo Storage Bucket lưu ảnh:
   - Chọn menu **Storage** ở thanh menu bên trái.
   - Bấm **New bucket** $\rightarrow$ Đặt tên chính xác là `uploads`.
   - Bật tùy chọn **Public bucket** (✅ Tích xanh).
   - Nhấn **Create bucket**.

### 2️⃣ Upstash (Bộ nhớ cache Redis)
1. Truy cập [upstash.com](https://upstash.com) $\rightarrow$ Chọn **Login** bằng GitHub.
2. Chọn mục **Redis** $\rightarrow$ Bấm **Create Database**:
   - **Name:** `voca-redis`
   - **Khu vực (Region):** Chọn khu vực gần Singapore nhất (ví dụ `AP-Southeast-1`).
   - **Plan:** Chọn gói **Free**.
   - Bấm **Create**.
3. Lấy link kết nối:
   - Tại trang chi tiết database mới tạo, cuộn xuống phần **Connect**.
   - Chọn tab định dạng kết nối có tiền tố **`rediss://`** (bảo mật TLS, có 2 chữ s).
   - Bấm biểu tượng con mắt để hiển thị mật khẩu và bấm **Copy toàn bộ URL kết nối**.
   - URL mẫu: `rediss://default:xxxxxxxxxxx@ample-rhino-66497.upstash.io:6379`. Đây là `REDIS_URL`.

### 3️⃣ Resend (Dịch vụ gửi Email)
1. Truy cập [resend.com](https://resend.com) $\rightarrow$ Đăng ký/Đăng nhập bằng tài khoản GitHub.
2. Tại màn hình Dashboard, chọn **API Keys** ở menu bên trái $\rightarrow$ Bấm **Create API Key**:
   - **Name:** `voca-prod`
   - **Permission:** Chọn **Full Access** hoặc **Sending Access**.
   - Bấm **Add**.
   - **Sao chép API Key ngay lập tức** (khóa dạng `re_xxxxxxxxx` chỉ xuất hiện một lần duy nhất). Đây là `RESEND_KEY`.
3. Thiết lập địa chỉ email gửi (`FROM_EMAIL`):
   - **Tùy chọn 1 (Sandbox - Chạy thử):** Dùng địa chỉ mặc định `onboarding@resend.dev` (Email gửi đi sẽ chỉ gửi được tới email đăng ký Resend của bạn).
   - **Tùy chọn 2 (Tên miền riêng):** Chọn **Domains** ở menu bên trái $\rightarrow$ **Add Domain** $\rightarrow$ Điền tên miền của bạn (ví dụ `voca.vn`) $\rightarrow$ Thêm các bản ghi DNS (SPF/DKIM/MX) vào nhà cung cấp tên miền của bạn $\rightarrow$ Chờ hệ thống xác thực trạng thái **Verified** $\rightarrow$ Sử dụng địa chỉ email gửi chính thức dạng `noreply@voca.vn`.

---

## 6. Nhật ký Khắc phục các Lỗi Triển khai thực tế

Dưới đây là tổng hợp 8 sự cố kỹ thuật chính đã gặp và xử lý thành công trong quá trình đưa ứng dụng lên mạng:

| STT | Sự cố gặp phải | Nguyên nhân | Biện pháp xử lý |
| :--- | :--- | :--- | :--- |
| **1** | Lỗi cài đặt thư viện `Error: ResolutionImpossible` trên Render | Xung đột phiên bản thư viện `cachetools` giữa yêu cầu của Google Auth (cần `< 6.0`) và chỉ định ban đầu trong requirements.txt. | Hạ phiên bản `cachetools` xuống bản ổn định `5.5.0` trong file `backend/requirements.txt`. |
| **2** | Alembic báo lỗi: `No 'script_location' key found` | Lệnh deploy của Render di chuyển thư mục `cd backend` khiến Alembic không tìm thấy tệp cấu hình `alembic.ini` ở thư mục gốc. | Đưa tệp `alembic.ini` và cấu hình chạy di cư dữ liệu ra xử lý trực tiếp từ thư mục gốc của dự án. |
| **3** | Alembic báo lỗi kết nối: `psycopg2 is not async` | URL kết nối database sử dụng giao thức đồng bộ mặc định (`postgresql://`) trong khi Alembic chạy trên môi trường không đồng bộ (Async). | Cấu hình trong `alembic/env.py` tự động đổi tiền tố kết nối từ `postgresql://` thành `postgresql+asyncpg://`. |
| **4** | Lỗi cấu hình: `pydantic.ValidationError` trên Render | Trình phân tích Pydantic yêu cầu biến môi trường `PROJECT_NAME` nhưng Render Blueprint chưa định nghĩa biến này. | Định nghĩa giá trị mặc định `"CareerPath AI"` cho biến `PROJECT_NAME` trực tiếp trong mã nguồn `config.py` để tránh lỗi dừng ứng dụng. |
| **5** | Lỗi mạng: `Network is unreachable` từ máy chủ Render | Máy chủ Render (gói Free) không hỗ trợ định tuyến IPv6, dẫn đến việc không kết nối được tới địa chỉ trực tiếp cổng 5432 của Supabase. | Thay đổi cấu hình máy chủ kết nối cơ sở dữ liệu sang địa chỉ Pooler IPv4 của Supabase thông qua cổng `6543`. |
| **6** | Lỗi tạo dữ liệu: `DuplicateObjectError` với cấu trúc người dùng | Cơ sở dữ liệu Supabase đã tồn tại các kiểu dữ liệu enum (UserRole) nhưng Alembic chưa ghi nhận lịch sử, dẫn đến lỗi trùng lặp khi chạy lại từ đầu. | Tạm thời đổi lệnh chạy trên Render thành `alembic stamp head` để đánh dấu database đã đồng bộ, sau đó chuyển lại thành `alembic upgrade head`. |
| **7** | Lỗi kết nối PgBouncer: `DuplicatePreparedStatementError` | Supabase sử dụng PgBouncer cổng `6543` ở chế độ Transaction, chế độ này không hỗ trợ cơ chế lưu cache prepared statements của Asyncpg. | Bổ sung thêm cấu hình `connect_args={"statement_cache_size": 0}` vào SQLAlchemy Engine trong `session.py` và `env.py` để vô hiệu hóa cache câu lệnh chuẩn bị sẵn. |
| **8** | Lỗi import: `ModuleNotFoundError: No module named 'backend'` | Chạy lệnh `cd backend` trên Render làm Python mất dấu thư mục gốc của dự án chứa package `backend`. | Thay đổi cấu hình chạy trên Render để uvicorn chạy trực tiếp tại thư mục gốc: `uvicorn backend.app.main:app`. |
