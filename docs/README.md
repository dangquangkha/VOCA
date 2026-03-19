# 📚 Tài Liệu Dự Án CareerPath_AI

Chào mừng bạn đến với thư mục tài liệu của dự án CareerPath_AI!

## 📋 Danh Sách Tài Liệu

### 1. **Tối Ưu Hóa Dung Lượng**

- **[optimization_guide.md](./optimization_guide.md)** - Hướng dẫn chi tiết về cách tối ưu hóa dung lượng dự án
  - Phân tích các thư mục chiếm dung lượng lớn
  - 3 phương án giải quyết
  - Script tự động dọn dẹp
  - FAQ và câu hỏi thường gặp

- **[performance_analysis.md](./performance_analysis.md)** - Phân tích hiệu năng khi chạy dự án trên các ổ đĩa khác nhau
  - So sánh tốc độ I/O giữa WSL2 native và /mnt/d, /mnt/e
  - Ưu/nhược điểm chi tiết
  - Khuyến nghị cách làm việc tối ưu
  - Hướng dẫn backup và tối ưu WSL2

## 🛠️ Scripts Hữu Ích

### Dọn Dẹp Dự Án

```bash
# Chạy script tự động dọn dẹp cache và log
./cleanup.sh
```

### Xóa Dependencies Để Tiết Kiệm Dung Lượng

```bash
# Xóa node_modules (603 MB)
rm -rf frontend/node_modules

# Xóa virtual environments (295 MB)
rm -rf venv backend/venv

# Xóa tất cả __pycache__
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null
```

### Cài Lại Dependencies

```bash
# Frontend
cd frontend
npm install

# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## 💾 Backup Dự Án

Tạo bản backup sang ổ D:

```bash
# Backup đầy đủ
cp -r /home/hat_n/projects/CareerPath_AI_Project /mnt/d/backup/CareerPath_AI_$(date +%Y%m%d)

# Backup chỉ source code (không bao gồm node_modules, venv)
rsync -av --exclude='node_modules' --exclude='venv' --exclude='__pycache__' \
  /home/hat_n/projects/CareerPath_AI_Project \
  /mnt/d/backup/CareerPath_AI_$(date +%Y%m%d)
```

## 📊 Thống Kê Dung Lượng

Kiểm tra dung lượng dự án:

```bash
# Tổng dung lượng
du -sh .

# Dung lượng từng thư mục
du -sh */ | sort -h

# Tìm thư mục lớn nhất
du -h --max-depth=2 | sort -h | tail -20
```

## ⚠️ Lưu Ý Quan Trọng

1. **Luôn làm việc trong `/home/hat_n/projects/`** (WSL2 native) để có hiệu năng tốt nhất
2. **Không nên** chạy dự án development trên `/mnt/d` hoặc `/mnt/e` vì chậm hơn 5-10 lần
3. **Xóa `node_modules` và `venv`** khi không làm việc để tiết kiệm dung lượng
4. **Backup định kỳ** sang ổ D/E để đảm bảo an toàn

## 🔗 Liên Kết Hữu Ích

- [Script dọn dẹp](../cleanup.sh)
- [File .gitignore](../.gitignore)
- [Requirements.txt](../requirements.txt)

---

📅 Cập nhật lần cuối: 2026-02-05
