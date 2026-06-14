# Đặc tả Kỹ thuật: Tính năng Group Sessions / Webinars

Tài liệu này cung cấp mô tả chi tiết về luồng nghiệp vụ, kiến trúc phần mềm, use case và thiết kế cơ sở dữ liệu cho tính năng **Group Sessions** (Hội thảo nhóm / Lớp học chuyên đề) trong dự án CareerPath AI (VOCA). 
Bạn có thể sử dụng file này làm **Prompt Reference** cho các AI Agent (như Antigravity) để tiến hành code.

---

## 1. Luồng Nghiệp Vụ (Business Flow)

Tính năng này mở rộng khả năng của chuyên gia (Expert) thay vì chỉ tư vấn 1-1 (One-on-One) thành tư vấn 1-nhiều.
Luồng hoạt động chính bao gồm:

1. **Tạo lớp học (Expert):** Chuyên gia có thể lên lịch một Group Session (Workshop/Webinar), thiết lập chủ đề, mô tả chi tiết, giá tiền (tính bằng Credits), thời gian bắt đầu, thời lượng dự kiến, và số lượng slot (số học viên tối đa).
2. **Xem & Tìm kiếm (Student/Guest):** Học viên xem danh sách các Group Session sắp diễn ra, lọc theo chuyên gia hoặc theo trạng thái (SCHEDULED).
3. **Đăng ký tham gia (Student):** 
   - Học viên chọn một session và nhấn tham gia. 
   - **Transaction Logic:** Hệ thống (Service) mở một Database Transaction, kiểm tra số lượng slot (có còn trống không) và kiểm tra số dư Credits của học viên.
   - Hệ thống tiến hành trừ Credits, ghi nhận lịch sử giao dịch (PaymentTransaction), và tạo bản ghi vào bảng `group_session_participants`.
4. **Hủy & Hoàn tiền (Expert/System):** Nếu chuyên gia hủy lớp (CANCEL), hệ thống sẽ quét tất cả các học viên đã đăng ký trong bảng `group_session_participants` và tự động cộng lại (Refund) số Credits đã bị trừ cho từng người thông qua một Transaction an toàn.
5. **Thông báo (System/Cronjob):** Hệ thống có thể gửi email/WebSocket/Notification nhắc nhở trước 24h và 1h khi sự kiện bắt đầu.
6. **Tham gia (Meeting/Webinar Link):** Học viên có thể thấy URL tham gia (Google Meet / Zoom) khi xem chi tiết (chỉ hiển thị URL nếu họ đã mua vé thành công).

---

## 2. Kiến trúc Phần Mềm (Software Architecture)

Dự án áp dụng mô hình phân lớp (Layered Architecture) kết hợp thiết kế hướng miền (Domain-Driven Design - DDD) cơ bản:

*   **Presentation Layer (API Routers):** `backend/app/api/v1/endpoints/group_sessions.py`. Chịu trách nhiệm định nghĩa route, xác thực người dùng (Authentication via `deps.get_current_active_user`), parse các Pydantic Schemas request/response.
*   **Business Logic Layer (Services):** `backend/app/services/business/group_session_service.py`. Chứa toàn bộ nghiệp vụ cốt lõi: kiểm tra quyền lợi (Authorization), xử lý trừ/cộng tiền thông qua `credit_service`, đảm bảo tính toàn vẹn dữ liệu bằng Database Transactions (`db.commit()`, `db.rollback()`).
*   **Data Access Layer (Models & Schemas):** 
    *   Models: `backend/app/domains/booking/group_session_models.py` (Khai báo SQLAlchemy classes).
    *   Schemas: `backend/app/schemas/group_session.py` (Khai báo Pydantic BaseModels dùng cho Validate Input / Output).

---

## 3. Các Ca Sử Dụng (Use Cases)

### Đối với Chuyên gia (Expert)
*   **[UC-GS-01]** Tạo mới Group Session (Bắt buộc điền Title, Description, Date, Duration, Price, Max Participants).
*   **[UC-GS-02]** Xem danh sách các Session do chính mình tạo (Quản lý trạng thái: SCHEDULED, COMPLETED, CANCELLED).
*   **[UC-GS-03]** Cập nhật thông tin Session (Lưu ý: Nếu đã có học viên đăng ký, hạn chế sửa đổi thời gian/giá tiền, chỉ cho phép sửa mô tả và meeting link).
*   **[UC-GS-04]** Hủy Session: Hệ thống đổi trạng thái thành CANCELLED và kích hoạt Refund Logic.
*   **[UC-GS-05]** Xem danh sách học viên: Lấy danh sách các User đã thanh toán và đăng ký thành công vào một Session cụ thể.

### Đối với Học viên (Student)
*   **[UC-GS-06]** Xem danh sách các Group Session công khai trên thị trường (Có phân trang, lọc).
*   **[UC-GS-07]** Xem chi tiết Group Session (Hiển thị thông tin chuyên gia, số slot còn lại).
*   **[UC-GS-08]** Join Session: Học viên click đăng ký, hệ thống tự động trừ tiền trong ví (Credits).
*   **[UC-GS-09]** My Registrations: Học viên xem các buổi mình đã đăng ký và lấy Meeting Link khi gần đến giờ.

---

## 4. Thiết Kế Cơ Sở Dữ Liệu (Database Schema)

Yêu cầu tạo thêm 2 bảng (Tables) sử dụng SQLAlchemy Models.

### Bảng 1: `group_sessions`
Lưu trữ thông tin về lớp học.
*   `id` (Integer, Primary Key)
*   `expert_id` (Integer, ForeignKey -> `expert_profiles.id` hoặc `users.id` tùy logic hiện tại)
*   `title` (String 255)
*   `description` (Text)
*   `price` (Float/Integer) - Số lượng Credits cần để tham gia. (Ví dụ: 0 là miễn phí, 50 là mất 50 điểm)
*   `max_participants` (Integer) - Số lượng tối đa.
*   `start_time` (DateTime, timezone=True)
*   `duration_minutes` (Integer) - Tính bằng phút (Ví dụ: 60, 90).
*   `meeting_link` (String 500, nullable=True) - URL Google Meet/Zoom.
*   `status` (Enum/String) - Giá trị: `SCHEDULED`, `ONGOING`, `COMPLETED`, `CANCELLED`.
*   `created_at`, `updated_at` (DateTime)

### Bảng 2: `group_session_participants`
Lưu trữ danh sách học viên tham gia. (Mapping N-N giữa users và group_sessions)
*   `id` (Integer, Primary Key)
*   `session_id` (Integer, ForeignKey -> `group_sessions.id`)
*   `student_id` (Integer, ForeignKey -> `users.id`)
*   `joined_at` (DateTime, default=now)
*   `status` (Enum/String) - `REGISTERED`, `REFUNDED`
*   `student_note` (Text, nullable=True) - Lời nhắn gửi cho chuyên gia.

*(Hai bảng trên cần thiết lập `relationship` trong SQLAlchemy để khi truy xuất Session có thể lấy được số lượng Participants hiện tại bằng hàm `len(session.participants)`)*

---

## 5. Danh Sách API Endpoints Cần Có

Dưới đây là các endpoints được định nghĩa trong `backend/app/api/v1/endpoints/group_sessions.py`:

*   **Public/Student:**
    *   `GET /api/v1/group-sessions/` (List all scheduled sessions, có filter, pagination)
    *   `GET /api/v1/group-sessions/{session_id}` (Get details)
    *   `GET /api/v1/group-sessions/my-registrations` (List user's registered sessions)
    *   `POST /api/v1/group-sessions/{session_id}/join` (Student registers and pays credits)
*   **Expert:**
    *   `GET /api/v1/group-sessions/my-sessions` (List expert's own sessions)
    *   `POST /api/v1/group-sessions/` (Create new session)
    *   `PUT /api/v1/group-sessions/{session_id}` (Update session details)
    *   `POST /api/v1/group-sessions/{session_id}/cancel` (Cancel & trigger refund)
    *   `GET /api/v1/group-sessions/expert/my-students` (List students in expert's sessions)

---
*Ghi chú cho AI Agent: Khi implement, hãy tuân thủ chặt chẽ cấu trúc Layered Architecture (Models -> Schemas -> Services -> Endpoints) đang có sẵn trong project. Đặc biệt lưu ý việc trừ tiền phải sử dụng `credit_service` và gói gọn trong `AsyncSession` transaction để tránh lỗi.*
