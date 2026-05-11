# 🚀 VOCA Platform — Kế Hoạch Đại Tu Toàn Diện

**Dựa trên:** [Project Context Document](./project_context.md)  
**Ngày lập:** 2026-04-21  
**Vai trò phân tích:** Senior System Architect + UI/UX Expert  
**Phạm vi:** Backend Architecture · Feature Placement · UI/UX Redesign

---

## Phần 1 — Tối Ưu Kiến Trúc Phần Mềm & Backend

### 1.1 Tái Cấu Trúc Module Theo Domain-Driven Design (DDD)

#### ❌ BEFORE — Cấu trúc phẳng theo loại file (hiện tại)

```
backend/app/
├── api/v1/endpoints/     # 16 files, tất cả ngang hàng nhau
│   ├── auth.py
│   ├── bookings.py       # Chứa CẢ business logic, DB query, notification
│   ├── payments.py       # Chứa CẢ escrow logic, webhook, withdrawal
│   └── ...
├── models/               # 14 models, không phân nhóm domain
├── schemas/              # 15 schemas, không phân nhóm domain
├── services/             # Hỗn hợp: payment_gateway, chat_socket, notification
└── ai_core/              # Trống
```

**Vấn đề:**  
- `bookings.py` (452 lines) chứa: validation, credit deduction, notification, chat message, transaction creation — vi phạm Single Responsibility Principle.  
- Không có ranh giới rõ ràng giữa các domain (booking, payment, identity).  
- Thêm tính năng mới vào `payments.py` (500 lines) là rủi ro regression cao.

---

#### ✅ AFTER — Cấu trúc Domain-Driven

```
backend/
├── app/
│   ├── main.py                  # FastAPI app factory, middleware only
│   ├── core/
│   │   ├── config.py            # Settings
│   │   ├── security.py          # JWT, bcrypt
│   │   ├── dependencies.py      # get_db, get_current_user (deps.py → đổi tên)
│   │   ├── exceptions.py        # Custom HTTPException classes
│   │   └── rate_limiter.py      # [MỚI] SlowAPI rate limiting
│   │
│   ├── domains/                 # ⭐ Tổ chức theo BUSINESS DOMAIN
│   │   ├── identity/            # Auth, User, Admin, Blacklist
│   │   │   ├── models.py        # User + Blacklist + AccountAction
│   │   │   ├── schemas.py
│   │   │   ├── service.py       # UserService: logic tạo user, ban, suspend
│   │   │   └── router.py        # /auth, /users, /admin/users
│   │   │
│   │   ├── marketplace/         # Expert, Availability, Review, KYC
│   │   │   ├── models.py        # ExpertProfile + ExpertAvailability
│   │   │   ├── schemas.py
│   │   │   ├── service.py       # ExpertService: search, KYC, slot logic
│   │   │   └── router.py        # /experts, /admin/experts, /reviews
│   │   │
│   │   ├── booking/             # Booking state machine — DOMAIN CỐT LÕI
│   │   │   ├── models.py        # Booking
│   │   │   ├── schemas.py
│   │   │   ├── service.py       # BookingService: escrow, transitions, checkin
│   │   │   ├── state_machine.py # [MỚI] Explicit FSM: PENDING→CONFIRMED→...
│   │   │   └── router.py        # /bookings
│   │   │
│   │   ├── payments/            # Credits, Transactions, SePay
│   │   │   ├── models.py        # PaymentTransaction
│   │   │   ├── schemas.py
│   │   │   ├── service.py       # CreditService: atomic debit/credit
│   │   │   ├── gateway.py       # SePayService (tách khỏi service)
│   │   │   └── router.py        # /payments
│   │   │
│   │   ├── messaging/           # Chat + Notifications
│   │   │   ├── models.py        # Message + Notification
│   │   │   ├── schemas.py
│   │   │   ├── content_filter.py  # [TÁCH RA] BR-29 filter logic
│   │   │   ├── websocket_mgr.py   # ConnectionManager (Redis-backed)
│   │   │   └── router.py        # /chat, /notifications
│   │   │
│   │   ├── ai_engine/           # AI Tools, Assessments, Roadmap
│   │   │   ├── models.py        # CVAnalysis + MockInterview + Roadmap
│   │   │   ├── schemas.py
│   │   │   ├── chains/          # LangChain chains
│   │   │   │   ├── cv_analyzer.py
│   │   │   │   └── interview_simulator.py
│   │   │   ├── prompts/         # Jinja2/LangChain prompt templates
│   │   │   │   ├── cv_analysis.j2
│   │   │   │   └── interview.j2
│   │   │   └── router.py        # /ai, /assessments, /roadmap
│   │   │
│   │   └── moderation/          # Dispute, Account Actions
│   │       ├── models.py        # (references booking + user)
│   │       ├── schemas.py
│   │       ├── service.py
│   │       └── router.py        # /admin/moderation, /admin/account-actions
│   │
│   ├── infrastructure/          # External adapters
│   │   ├── storage.py           # [MỚI] S3/Cloudinary adapter
│   │   ├── email_service.py     # Email sending + logging
│   │   └── task_queue.py        # [MỚI] ARQ/Celery task definitions
│   │
│   └── db/
│       ├── base_class.py
│       ├── session.py
│       └── base.py
│
├── workers/                     # [MỚI] Background workers
│   ├── booking_worker.py        # Auto resolve no-show, auto-complete
│   └── notification_worker.py   # Async email, push notifications
│
└── tests/
    ├── unit/                    # Unit tests per domain
    └── integration/             # API integration tests
```

**Lý do thay đổi:**  
Mỗi domain tự chứa models + schemas + service + router. Thêm tính năng mới chỉ cần tạo file trong domain tương ứng, không ảnh hưởng domain khác.

---

### 1.2 Các Cải Tiến Backend Cụ Thể

#### A. Booking State Machine — Finite State Machine Tường Minh

**❌ BEFORE:** Logic transition nằm rải rác trong `if/elif` 100 dòng trong `bookings.py`

**✅ AFTER:** `booking/state_machine.py`

```python
# Explicit FSM — dễ đọc, dễ test, dễ audit
ALLOWED_TRANSITIONS = {
    BookingStatus.PENDING: {
        "expert": [BookingStatus.CONFIRMED, BookingStatus.REJECTED],
        "student": [BookingStatus.CANCELLED],
        "admin": [BookingStatus.CANCELLED, BookingStatus.REFUNDED],
    },
    BookingStatus.CONFIRMED: {
        "student": [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
        "expert": [],          # Expert KHÔNG thể hủy sau khi confirm (fix BL-06)
        "admin": [BookingStatus.REFUNDED, BookingStatus.DISPUTED],
    },
    BookingStatus.IN_PROGRESS: {
        "student": [BookingStatus.COMPLETED, BookingStatus.DISPUTED],
        "admin": [BookingStatus.REFUNDED],
    },
    # ...
}

def can_transition(booking, actor_role, new_status) -> bool:
    allowed = ALLOWED_TRANSITIONS.get(booking.status, {}).get(actor_role, [])
    return new_status in allowed
```

#### B. Atomic Credit Operations — Chống Race Condition (BL-01 + BL-02)

**❌ BEFORE:** Cập nhật `user.credits` trực tiếp + không có lock

```python
# bookings.py — Dễ bị race condition
if current_user.credits < total_cost:
    raise HTTPException(...)
current_user.credits -= total_cost  # Không atomic!
```

**✅ AFTER:** Dùng `SELECT FOR UPDATE` + Dedicated CreditService

```python
# payments/service.py — CreditService
async def deduct_credits(db: AsyncSession, user_id: int, amount: int, 
                         booking_id: int, txn_type: TransactionType) -> PaymentTransaction:
    """Atomic deduct with row-level lock. Raises InsufficientCreditsError if balance low."""
    # Row-level lock prevents race condition
    result = await db.execute(
        select(User).where(User.id == user_id).with_for_update()
    )
    user = result.scalars().first()
    if user.credits < amount:
        raise InsufficientCreditsError(balance=user.credits, required=amount)
    
    user.credits -= amount
    txn = PaymentTransaction(user_id=user_id, amount=amount, 
                              type=txn_type, booking_id=booking_id,
                              status=TransactionStatus.COMPLETED)
    db.add(user); db.add(txn)
    return txn
```

#### C. Background Worker — Giải Quyết ARCH-06, BL-04, BL-05

**Sử dụng ARQ (async Redis Queue) — nhẹ, async-native, không cần Celery:**

```python
# workers/booking_worker.py
import arq

async def resolve_expired_bookings(ctx):
    """Chạy mỗi 5 phút: auto-resolve no-show và auto-complete sau 24h"""
    db = ctx['db']
    now = datetime.now(timezone.utc)
    
    # 1. No-show: CONFIRMED bookings quá T+10min mà chưa resolve
    expired_confirmed = await db.execute(
        select(Booking).where(
            Booking.status == BookingStatus.CONFIRMED,
            Booking.start_time < now - timedelta(minutes=10)
        )
    )
    for booking in expired_confirmed.scalars():
        await resolve_noshow_logic(db, booking)
    
    # 2. Auto-complete: COMPLETED bookings sau 24h không có dispute
    auto_complete = await db.execute(
        select(Booking).where(
            Booking.status == BookingStatus.COMPLETED,
            Booking.updated_at < now - timedelta(hours=24)
        )
    )
    for booking in auto_complete.scalars():
        await release_payment_to_expert(db, booking)  # với 80% commission

class WorkerSettings:
    functions = [resolve_expired_bookings]
    cron_jobs = [arq.cron(resolve_expired_bookings, minute={0, 5, 10, ...})]
```

#### D. SePay Webhook HMAC Security (SEC-01)

**❌ BEFORE:** Chỉ check accountNumber

**✅ AFTER:** Thêm HMAC-SHA256 signature verification

```python
def verify_webhook_data(self, data: dict, incoming_token: str | None) -> bool:
    # Check 1: Account number match
    if str(data.get("accountNumber")) != str(self.account_number):
        return False
    
    # Check 2: HMAC-SHA256 Bearer token (SEC-01 fix)
    if not incoming_token:
        return False
    expected_token = f"Bearer {self.webhook_secret}"
    if not hmac.compare_digest(incoming_token, expected_token):
        return False
    
    return True
```

#### E. Rate Limiting (ARCH-04)

```python
# core/rate_limiter.py — dùng slowapi
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

# Áp dụng:
@router.post("/login/access-token")
@limiter.limit("10/minute")  # Chống brute-force
async def login(...): ...

@router.post("/payments/topup")
@limiter.limit("5/minute")   # Chống spam topup
async def topup(...): ...

@router.post("/ai/cv-analyze")
@limiter.limit("3/minute")   # Chống lạm dụng AI (cost control)
async def analyze_cv(...): ...
```

#### F. WebSocket Scale với Redis Pub/Sub (ARCH-07)

**❌ BEFORE:** In-memory dict → chỉ chạy được 1 process

**✅ AFTER:** Redis Pub/Sub → horizontal scale

```python
# messaging/websocket_mgr.py
import redis.asyncio as redis

class RedisConnectionManager:
    def __init__(self):
        self.local_connections: dict[int, WebSocket] = {}
        self.redis = redis.from_url(settings.REDIS_URL)
    
    async def send_personal_message(self, data: dict, user_id: int):
        # Thử local trước (nếu user kết nối tới instance này)
        if user_id in self.local_connections:
            await self.local_connections[user_id].send_json(data)
        else:
            # Publish lên Redis → instance khác sẽ nhận và gửi tới user
            await self.redis.publish(f"user:{user_id}", json.dumps(data))
```

---

## Phần 2 — Tái Cấu Trúc Chức Năng (Feature Placement)

### 2.1 Đánh Giá Vị Trí Chức Năng Hiện Tại

| Chức năng | Vị trí hiện tại | Vấn đề | Đề xuất vị trí mới |
|---|---|---|---|
| **Assessment** | `/dashboard/assessment` (ẩn sau login) | Rào cản đầu tiên quá cao, user chưa tin tưởng đã phải đăng ký | **Landing page (public)** — dùng assessment như acquisition funnel |
| **Danh sách expert** | `/dashboard/experts` (sau login) | User không thể "dùng thử trước khi mua" | **`/experts` (public)** — không cần login để xem danh sách |
| **AI Tools** | `/ai-tools` (page riêng, link từ nav) | Tính năng bán (upsell) bị giấu — user không tự tìm thấy | Tích hợp vào **Student Dashboard** như CTA nổi bật |
| **Pricing** | `/pricing` (page riêng) | Tách rời khỏi luồng mua — user phải tự đi tìm | **Inline trong expert profile page** và **checkout flow** |
| **Wallet** | `/dashboard/wallet` (chỉ student) | Expert wallet ở path khác gây nhầm lẫn | Thống nhất thành `/dashboard/wallet` cho cả 2 role, content khác nhau |
| **KYC Flow** | Điền form trong dashboard | Không có hướng dẫn bước-by-bước → expert bỏ cuộc giữa chừng | **Onboarding wizard 5 bước** (profile → KYC → bank → availability → preview) |

### 2.2 Luồng Điều Hướng Đề Xuất

#### Luồng Học Viên — Tối ưu Conversion Funnel

```
❌ BEFORE (có friction cao):
Landing → Đăng ký → Login → Dashboard → Assessment → Kết quả
→ Experts page → Expert detail → Booking (gần 6 bước trước khi thấy giá trị)

✅ AFTER (value first):
Landing (có Assessment widget public)
  → Làm assessment 5 câu (không cần đăng ký)
  → Xem kết quả sơ bộ + danh sách expert phù hợp (public)
  → Click "Đặt lịch ngay" → Popup đăng ký/login (chỉ khi cần action)
  → Expert profile + Booking (với pricing inline)
  → Payment → Xác nhận
  → Dashboard (chỉ vào dashboard SAU KHI đã có booking đầu tiên)
```

**Kết quả kỳ vọng:** Giảm friction từ 6 bước → 3 bước trước khi user thấy giá trị cốt lõi. Tăng conversion 30-50%.

#### Luồng Chuyên Gia — 5-Step Onboarding Wizard

```
❌ BEFORE:
Đăng ký → Dashboard (trống) → Tự tìm menu Profile → Điền KYC → 
Tự tìm menu Availability → Tự tìm bank info → Chờ admin (không rõ trạng thái)

✅ AFTER — Wizard 5 bước có progress bar:
Đăng ký → 
  Bước 1/5: Thông tin cơ bản (bio, LinkedIn, kinh nghiệm, tags) ──────── ●○○○○
  Bước 2/5: Upload chứng chỉ / KYC documents ────────────────────────── ●●○○○
  Bước 3/5: Thiết lập giá và lịch trống ─────────────────────────────── ●●●○○
  Bước 4/5: Thông tin ngân hàng (optional, có thể sau) ───────────────── ●●●●○
  Bước 5/5: Preview profile + Submit KYC ─────────────────────────────── ●●●●●
→ Trang "Chờ duyệt" với estimated time + email notification
→ Dashboard expert (sau khi KYC approved)
```

### 2.3 Cấu Trúc Route Frontend Đề Xuất

```
/                                 # Landing — Assessment widget + Expert spotlight
/about                            # [MỚI] Về VOCA — trust building
/experts                          # [PUBLIC] Danh sách expert, filter, search
/experts/[id]                     # [PUBLIC] Expert profile + booking form
/pricing                          # Giữ nguyên, thêm credit calculator

/(auth)/
  login
  register                        # → Redirect sang onboarding theo role

/onboarding/                      # [MỚI] Role-specific wizards
  student/                        # Bước: assessment → tìm expert → nạp tiền
  expert/                         # Wizard 5 bước KYC

/(student)/                       # Route group — Student authenticated
  dashboard                       # Overview: upcoming bookings, credits, AI tools CTA
  bookings                        # Lịch hẹn (replace /dashboard/manage/bookings)
  wallet                          # Ví + lịch sử giao dịch + nạp tiền
  assessment                      # Làm bài test (đầy đủ, có lịch sử)
  roadmap                         # Lộ trình AI
  ai-tools                        # CV analyze + Mock interview
  chat                            # [CHUNG với expert]

/(expert)/                        # Route group — Expert authenticated
  dashboard                       # Overview: earnings, upcoming, rating, pending bookings
  schedule                        # Quản lý lịch trống (replace dashboard/expert)
  wallet                          # Ví expert: balance, escrow, withdrawal
  profile                         # Chỉnh sửa profile (đang hoạt động)
  chat                            # [CHUNG với student]

/(admin)/                         # Route group — Admin only (is_superuser)
  dashboard                       # Stats thực + revenue chart
  users                           # User management
  experts                         # KYC queue + expert management
  bookings                        # All bookings + dispute management
  payments                        # Withdrawal + refund approvals
  notifications                   # Broadcast system notifications
  moderation                      # Content moderation

/profile                          # [CHUNG] Edit profile cho mọi role
/chat/[userId]                    # [CHUNG] Direct message
/banned, /suspended               # Giữ nguyên
```

**Lý do thay đổi route groups:**  
Next.js route groups `(student)`, `(expert)`, `(admin)` dùng layout riêng nhưng không ảnh hưởng URL. Điều này cho phép mỗi role có sidebar/navigation khác nhau mà không cần logic phức tạp trong component.

---

## Phần 3 — Nâng Cấp UI/UX

### 3.1 Design Philosophy — "Neon Noir · Dopamine Dark"

> **Concept:** Bóng tối tuyệt đối là canvas. Neon là ngôn ngữ. Mỗi interaction là một khoảnh khắc dopamine.

#### Bảng Màu Mới — "Neon Noir"

```css
:root {
  /* === VOID — Nền tảng === */
  --void-100: #000000;     /* Background tuyệt đối */
  --void-90:  #0A0A0F;     /* Surface chính */
  --void-80:  #10101A;     /* Card background */
  --void-70:  #1A1A2E;     /* Border/divider */

  /* === NEON ACCENTS — Điểm nhấn dopamine === */
  --neon-cyan:    #00F5FF; /* Primary action, links, highlights */
  --neon-magenta: #FF0080; /* Danger, CTA đặc biệt, price tags */
  --neon-violet:  #8B5CF6; /* Secondary, tags, badges */
  --neon-amber:   #FFB800; /* Warning, rating stars, expert badge */
  --neon-green:   #00FF88; /* Success, "completed", positive states */

  /* === TEXT === */
  --text-primary:   #F0F0FF; /* Gần trắng, dễ đọc trên nền đen */
  --text-secondary: #8888AA; /* Muted text */
  --text-dim:       #444466; /* Placeholder, disabled */

  /* === GLOW EFFECTS === */
  --glow-cyan:    0 0 20px rgba(0, 245, 255, 0.4);
  --glow-magenta: 0 0 20px rgba(255, 0, 128, 0.4);
  --glow-violet:  0 0 20px rgba(139, 92, 246, 0.4);
}
```

#### Typography System

```css
/* Giữ lại DM Sans (body), thay Cormorant Garamond bằng font kỹ thuật hơn */
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');

:root {
  --font-display: 'Space Grotesk', sans-serif; /* Heading, hero — modern geek */
  --font-body:    'DM Sans', sans-serif;        /* Body text — clean readable */
  --font-mono:    'DM Mono', monospace;         /* Credits, codes, prices */
}
```

---

### 3.2 Thiết Kế Lại Các Component Chính

#### A. Hero Section — Landing Page

**❌ BEFORE:** Static hero text + background image  
**✅ AFTER:** Interactive Assessment Widget trực tiếp trên hero

```
┌─────────────────────────────────────────────────────────────┐
│  [VOID BACKGROUND — animated particle field]                │
│                                                             │
│  ╔═══════════════════════════════════════════════╗          │
│  ║  VOCA                           [Logo - neon] ║          │
│  ╠═══════════════════════════════════════════════╣          │
│  ║                                               ║          │
│  ║  "Khám phá hướng đi của bạn                  ║          │
│  ║   trong 60 giây."                             ║          │
│  ║                                               ║          │
│  ║  ┌─────────────────────────────────────────┐  ║          │
│  ║  │  Bạn đang ở giai đoạn nào?              │  ║          │
│  ║  │  ○ Học sinh THPT (đang chọn ngành)      │  ║          │
│  ║  │  ○ Sinh viên (cần chuẩn bị đi làm)      │  ║          │
│  ║  │  ○ Đã đi làm (muốn chuyển ngành)        │  ║          │
│  ║  │  [──────────────────────────] BẮT ĐẦU → │  ║          │
│  ║  └─────────────────────────────────────────┘  ║          │
│  ║       Không cần đăng ký · Miễn phí           ║          │
│  ╚═══════════════════════════════════════════════╝          │
│                                                             │
│  ── Đang kết nối 1,200+ học viên với 80+ chuyên gia ──      │
└─────────────────────────────────────────────────────────────┘
```

#### B. Expert Card — Marketplace Listing

**❌ BEFORE:** Card đơn giản, thông tin cơ bản  
**✅ AFTER:** Card "holographic" với neon glow + dopamine triggers

```
┌──────────────────────────────────────────────────┐
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │ ← gradient border (neon)
│  ░                                            ░  │
│  ░  [Avatar]  Nguyễn Văn A                   ░  │
│  ░  ●─────   Senior SWE · Google (5 năm)     ░  │
│  ░                                            ░  │
│  ░  [Python] [System Design] [Leadership]     ░  │ ← glowing tags
│  ░                                            ░  │
│  ░  ★★★★★  4.9  (127 đánh giá)               ░  │ ← amber stars
│  ░                                            ░  │
│  ░  ┌────────────┐    50 ₵/giờ               ░  │
│  ░  │ ĐẶT LỊCH → │  ≈ 50,000₫               ░  │ ← cyan CTA button
│  ░  └────────────┘                            ░  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
└──────────────────────────────────────────────────┘
   ↑ Hover: card "rises" 4px + cyan glow intensifies
```

**CSS cho hover effect:**
```css
.expert-card {
  border: 1px solid rgba(0, 245, 255, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}
.expert-card:hover {
  transform: translateY(-4px);
  border-color: rgba(0, 245, 255, 0.6);
  box-shadow: 0 0 30px rgba(0, 245, 255, 0.15), 0 8px 32px rgba(0,0,0,0.4);
}
```

#### C. Booking Flow — Checkout UX

**❌ BEFORE:** Form chọn thời gian + nút submit  
**✅ AFTER:** 3-step checkout với sticky summary panel

```
BƯỚC 1: CHỌN THỜI GIAN
┌───────────────────────────┬─────────────────────┐
│  📅 Tháng 4 / 2026        │  💳 TÓM TẮT ĐẶT LỊCH│
│                           │  ─────────────────  │
│  T2  T3  T4  T5  T6       │  Nguyễn Văn A       │
│  [14][15][16][17][18]     │  Chưa chọn slot     │
│      ↑ [SELECTED]         │                     │
│                           │  Tổng: ---          │
│  08:00 ──────────────     │  Credits: 120 ₵     │
│  [09:00] 1 giờ  50₵      │                     │
│  [10:00] 1 giờ  50₵      │  [TIẾP TỤC ──────→] │
│  11:00 (đã đặt)           │                     │
└───────────────────────────┴─────────────────────┘

BƯỚC 2: GHI CHÚ + XÁC NHẬN
    → Sticky panel cập nhật real-time khi chọn slot

BƯỚC 3: THANH TOÁN
    → Nếu đủ credits: 1-click confirm với animation
    → Nếu thiếu credits: inline "Nạp thêm" widget (không redirect)
```

#### D. Dashboard — Thông Tin Hữu Dụng Trước Mắt

**❌ BEFORE:** Dashboard chung chung, nhiều link menu  
**✅ AFTER:** Dashboard theo vai trò, "Today at a glance"

```
STUDENT DASHBOARD
┌─────────────────────────────────────────────────────┐
│  Xin chào, Minh! ·  Credits: [━━━━━━━━━━] 120 ₵   │
│                                                     │
│  📅 PHIÊN TU VẤN SẮP TỚI                           │
│  ┌─────────────────────────────────────────────┐    │
│  │  Nguyễn Văn A — Ngày mai, 09:00             │    │
│  │  [CHECKIN →]  [Chat ↗]  [Thêm vào lịch ↗]  │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  🤖 CÔNG CỤ AI CỦA BẠN                             │
│  [Phân tích CV →]  [Phỏng vấn thử →]               │
│                                                     │
│  ⚡ GỢI Ý CHUYÊN GIA DỰA TRÊN KẾT QUẢ TEST        │
│  [Card 1] [Card 2] [Card 3] → Xem tất cả           │
└─────────────────────────────────────────────────────┘
```

---

### 3.3 Micro-interactions & Navigation

#### Navigation — Context-Aware Sidebar

**❌ BEFORE:** Sidebar cố định với tất cả links, không theo context  
**✅ AFTER:** Collapsible sidebar với active state glow + badge notifications

```
┌─────────────────┐
│  ⬡ VOCA        │  ← Logo với neon pulse animation
│                 │
│  ● Dashboard    │  ← Active: cyan left border + glow
│  ○ Lịch hẹn  3 │  ← Badge: neon magenta
│  ○ Chat      2  │  ← Badge: neon cyan
│  ○ Ví        ─  │
│  ○ AI Tools     │
│                 │
│  ─────────────  │
│  ○ Cài đặt      │
│  ← Đăng xuất   │
└─────────────────┘

Hover state: item background gradient nhẹ (void-70 → void-80)
Active state: left border 3px neon-cyan + background glow
```

#### Micro-interactions Quan Trọng

| Interaction | Animation |
|---|---|
| **Nút đặt lịch click** | Ripple effect neon-cyan từ điểm click + glow expand |
| **Credit deduction** | Số credits đếm ngược với âm thanh nhẹ (optional) |
| **Booking confirmed** | Full-screen particle burst + success card slide-in |
| **New message** | Sidebar badge pulse + notification toast slide từ góc dưới |
| **Checkin thành công** | Timer countdown với progress ring neon-green |
| **Rating stars** | Hover: từng sao sáng lên sequentially + glow amber |
| **Page transition** | Fade through void (opacity 0 → 1) với 150ms |

#### Toast / Notification System Chuẩn Hóa

**✅ AFTER — Global toast system (fix FE-03):**

```typescript
// Vị trí: bottom-right, stack từ dưới lên
// Variants:
toast.success("Đặt lịch thành công!")  // neon-green border + icon
toast.error("Không đủ credits")        // neon-magenta border + icon
toast.info("Chuyên gia đã xác nhận")   // neon-cyan border + icon
toast.warning("Check-in mở sau 5 phút") // neon-amber border + icon

// Auto-dismiss: 4 giây
// Manual dismiss: click hoặc swipe
// Persistent: toast.persist(...) cho actions quan trọng
```

---

## Tóm Tắt Roadmap Thực Hiện

### Phase 1 — Nền Tảng Vững Chắc (Tuần 1-2)
Ưu tiên: Sửa các lỗi critical trước khi refactor giao diện.  

- [ ] SEC-01: Thêm HMAC verification cho SePay webhook  
- [ ] SEC-02: Tích hợp Google OAuth SDK thực sự  
- [ ] BL-03: Cài đặt commission 80/20  
- [x] **BL-01: Thêm `SELECT FOR UPDATE` cho credit operations** ✅ *2026-04-21 — `deduct_credits_atomic()` applied vào `bookings.py`*  
- [ ] ARCH-11: Thêm `created_at` vào `User` model  

### Phase 2 — Kiến Trúc Backend (Tuần 3-4)
- [ ] Tái cấu trúc thư mục theo Domain-Driven Design  
- [ ] Tách `BookingService`, `CreditService` ra khỏi endpoint files  
- [ ] Implement `BookingStateMachine` (fix BL-06)  
- [ ] Setup ARQ worker cho auto no-show resolve (fix BL-04, BL-05)  
- [ ] Fix BL-07: Expert search chỉ trả APPROVED  

### Phase 3 — Frontend & UX (Tuần 5-6)
- [ ] Implement design system "Neon Noir" trong `globals.css`  
- [ ] Tạo route groups `(student)`, `(expert)`, `(admin)`  
- [ ] Chuyển Assessment + Expert listing sang public routes  
- [ ] Implement Expert Onboarding Wizard (5 bước)  
- [ ] Global toast system + error boundary  
- [ ] Redesign Expert Card và Booking Checkout Flow  

### Phase 4 — AI Integration (Tuần 7-8)
- [ ] Tích hợp OpenAI API vào `ai_engine/chains/`  
- [ ] Setup Cloud Storage (Cloudflare R2 hoặc S3) cho file uploads  
- [ ] Rate limiting cho AI endpoints  
- [ ] Real-time CV analysis với streaming response  

---

*Tài liệu này bổ sung cho [project_context.md](./project_context.md). Mỗi phase nên được review trước khi thực hiện phase tiếp theo.*
