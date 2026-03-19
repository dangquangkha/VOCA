# 🚀 CareerPath AI - Nền Tảng Kết Nối Chuyên Gia & Học Viên

Platform kết nối học viên với các chuyên gia trong lĩnh vực công nghệ, hỗ trợ đặt lịch tư vấn, thanh toán, và quản lý roadmap học tập.

## 📁 Cấu Trúc Dự Án

```
CareerPath_AI_Project/
├── backend/          # FastAPI backend
├── frontend/         # Next.js frontend
├── docs/            # Tài liệu dự án
├── alembic/         # Database migrations
├── cleanup.sh       # Script dọn dẹp tự động
└── .gitignore       # Git ignore file
```

## 🛠️ Công Nghệ Sử Dụng

### Backend
- **FastAPI** - Python web framework
- **PostgreSQL** - Database
- **SQLAlchemy** - ORM
- **Alembic** - Database migration
- **JWT** - Authentication

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Zustand** - State management
- **Tailwind CSS** - Styling

## 🚀 Hướng Dẫn Cài Đặt

### Prerequisites
- Python 3.12+
- Node.js 18+
- PostgreSQL

### Backend Setup

```bash
# Di chuyển vào thư mục backend
cd backend

# Tạo virtual environment
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# hoặc: venv\Scripts\activate  # Windows

# Cài đặt dependencies
pip install -r requirements.txt

# Chạy migrations
alembic upgrade head

# Chạy server
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
# Di chuyển vào thư mục frontend
cd frontend

# Cài đặt dependencies
npm install

# Chạy development server
npm run dev
```

## 📚 Tài Liệu

Xem thêm tài liệu chi tiết trong thư mục [`docs/`](./docs/):

- **[Tối ưu hóa dung lượng](./docs/optimization_guide.md)** - Hướng dẫn giảm dung lượng dự án
- **[Phân tích hiệu năng](./docs/performance_analysis.md)** - So sánh hiệu năng trên các ổ đĩa

## 🧹 Bảo Trì & Tối Ưu

### Dọn Dẹp Tự Động

```bash
# Chạy script dọn dẹp cache và log
./cleanup.sh
```

### Tiết Kiệm Dung Lượng

Khi không làm việc với dự án, bạn có thể xóa các thư mục lớn:

```bash
# Xóa dependencies (có thể cài lại bất cứ lúc nào)
rm -rf frontend/node_modules  # 603 MB
rm -rf venv backend/venv      # 295 MB
```

Khi cần làm việc lại, chỉ cần cài lại:

```bash
cd frontend && npm install
cd ../backend && python3 -m venv venv && pip install -r requirements.txt
```

### Backup

```bash
# Backup sang ổ D (khuyến nghị 1 tuần/lần)
cp -r /home/hat_n/projects/CareerPath_AI_Project /mnt/d/backup/CareerPath_AI_$(date +%Y%m%d)
```

## ⚙️ Scripts Hữu Ích

Dự án bao gồm các scripts test và quản lý:

```bash
./test_api.sh           # Test API endpoints
./test_booking.sh       # Test booking system
./test_chat.sh          # Test chat functionality
./test_payment.sh       # Test payment integration
./test_moderation.sh    # Test moderation features
./cleanup.sh            # Clean cache and logs
```

## 📊 Quản Lý Database

```bash
# Tạo migration mới
alembic revision --autogenerate -m "description"

# Chạy migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1

# Xem lịch sử migrations
alembic history
```

## 🔐 Environment Variables

Tạo file `.env` trong thư mục backend:

```env
DATABASE_URL=postgresql://user:password@localhost/dbname
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## 🌐 Ports

- **Backend API:** http://localhost:8000
- **Frontend:** http://localhost:3000
- **API Docs:** http://localhost:8000/docs

## 📝 Git Best Practices

File `.gitignore` đã được cấu hình để loại trừ:
- `node_modules/`
- `venv/`
- `__pycache__/`
- `.env`
- Log files

## ⚠️ Lưu Ý Quan Trọng

### Hiệu Năng WSL2

> **Luôn làm việc trong `/home/hat_n/projects/`** để có hiệu năng tốt nhất.
> 
> ❌ **KHÔNG NÊN** chạy dự án trên `/mnt/c`, `/mnt/d`, `/mnt/e` vì chậm hơn 5-10 lần.
> 
> ✅ **NÊN** giữ dự án trong WSL2 filesystem và backup sang ổ Windows khi cần.

Chi tiết xem: [docs/performance_analysis.md](./docs/performance_analysis.md)

## 🤝 Giúp Đỡ & Cộng Tác

Dự án này hoan nghênh mọi sự đóng góp! Để bắt đầu cộng tác:

1.  **Liên hệ với Trưởng dự án**: Để được thêm vào làm cộng tác viên trên GitHub.
2.  **Đọc hướng dẫn đóng góp**: Xem chi tiết tại [CONTRIBUTING.md](./CONTRIBUTING.md).

### Quy trình làm việc cơ bản:
- Luôn tạo nhánh (branch) mới cho mỗi tính năng: `git checkout -b feature/ten-tinh-nang`.
- Viết commit message rõ ràng.
- Gửi Pull Request (PR) để được review trước khi merge vào nhánh `main`.

## 📄 License

[Thêm license information nếu cần]

## 📞 Contact

[Thêm contact information nếu cần]

---

📅 Cập nhật lần cuối: 2026-02-05
