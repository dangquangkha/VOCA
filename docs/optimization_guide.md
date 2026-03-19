# 📊 Hướng Dẫn Tối Ưu Hóa Dung Lượng Dự Án CareerPath_AI

## 🔍 Phân Tích Tình Trạng Hiện Tại

Từ việc phân tích dự án của bạn, các thư mục đang chiếm dung lượng lớn trên ổ C:

| Thư mục/File | Dung lượng | Mô tả |
|--------------|------------|-------|
| `frontend/node_modules/` | **603 MB** | Thư viện JavaScript/Node.js |
| `venv/` | **160 MB** | Python Virtual Environment (root) |
| `backend/venv/` | **135 MB** | Python Virtual Environment (backend) |
| `backend/` | **136 MB** | Code backend (bao gồm cả venv) |
| `frontend/` | **~1 GB** | Code frontend (bao gồm cả node_modules) |
| `__pycache__/` | Nhiều thư mục | Cache của Python (489 thư mục) |
| `backend.log` | 1.5 MB | File log |

**Tổng dung lượng có thể loại bỏ an toàn: ~900 MB - 1 GB**

---

## 📚 Kiến Thức Cần Biết

### 1. **node_modules** - Thư viện Node.js (603 MB)

**Là gì?**
- Chứa tất cả các thư viện JavaScript mà dự án frontend cần
- Được cài đặt khi chạy `npm install` hoặc `yarn install`
- Được tạo ra từ file `package.json`

**Có thể xóa không?**
- ✅ **CÓ** - Bạn có thể xóa và cài lại bất cứ lúc nào
- Không ảnh hưởng đến source code của bạn
- Có thể tái tạo lại 100%

---

### 2. **venv** - Python Virtual Environment (295 MB)

**Là gì?**
- Môi trường Python ảo, chứa các thư viện Python cho dự án
- Được tạo ra từ `requirements.txt` hoặc `pyproject.toml`
- Giúp cô lập dependencies giữa các dự án

**Có thể xóa không?**
- ✅ **CÓ** - Có thể xóa và tạo lại
- Không chứa code của bạn
- Có thể tái tạo từ `requirements.txt`

**Tại sao có 2 venv?**
- Có vẻ bạn đã tạo nhầm 2 virtual environment
- Chỉ nên giữ 1 (trong thư mục backend)

---

### 3. **__pycache__** - Python Cache (489 thư mục)

**Là gì?**
- File `.pyc` được Python tạo tự động để tăng tốc độ load
- Được tạo lại mỗi khi chạy code Python

**Có thể xóa không?**
- ✅ **CÓ** - Xóa hoàn toàn an toàn
- Python sẽ tự động tạo lại khi cần

---

### 4. **Log Files** - File nhật ký (1.5 MB+)

**Là gì?**
- `backend.log`, `server.log`, `frontend.log` - Ghi lại hoạt động của ứng dụng
- Tăng dần theo thời gian

**Có thể xóa không?**
- ✅ **CÓ** - Nếu không cần xem log cũ
- ⚠️ **CẨNTHẬN** - Có thể cần để debug

---

## 🛠️ Cách Khắc Phục

### **Phương Án 1: Xóa Tạm Thời (Giải phóng ngay ~900 MB)**

> [!WARNING]
> Sau khi xóa, bạn cần cài lại dependencies trước khi chạy dự án.

```bash
# Di chuyển vào thư mục dự án
cd /home/hat_n/projects/CareerPath_AI_Project

# 1. Xóa node_modules (603 MB)
rm -rf frontend/node_modules

# 2. Xóa virtual environments (295 MB)
rm -rf venv
rm -rf backend/venv

# 3. Xóa tất cả __pycache__ (~10-50 MB)
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null

# 4. Xóa file log (nếu không cần)
rm -f *.log backend/*.log frontend/*.log

# 5. Kiểm tra dung lượng đã giải phóng
du -sh .
```

**Khi nào cần cài lại?**

```bash
# Frontend - Cài lại node_modules
cd frontend
npm install  # Hoặc: yarn install

# Backend - Tạo lại virtual environment
cd ../backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt  # Nếu có file này
```

---

### **Phương Án 2: Di Chuyển Sang Ổ Khác (Giữ nguyên, không mất gì)**

> [!TIP]
> Di chuyển toàn bộ dự án sang ổ D:/ hoặc E:/ để tiết kiệm dung lượng ổ C.

#### **Bước 1: Kiểm Tra Các Ổ Đĩa Có Sẵn**

Vì bạn đang dùng **WSL2** (Windows Subsystem for Linux), các ổ đĩa Windows được mount tại:
- **Ổ C:** `/mnt/c`
- **Ổ D:** `/mnt/d`
- **Ổ E:** `/mnt/e`

Kiểm tra dung lượng các ổ đĩa:

```bash
df -h | grep mnt
```

Kết quả mẫu:
```
C:\    214G  123G   92G  58% /mnt/c
D:\    101G   46G   55G  46% /mnt/d
E:\    162G   77G   85G  48% /mnt/e
```

#### **Bước 2: Di Chuyển Dự Án**

**Ví dụ: Di chuyển sang ổ D:**

```bash
# 1. Tạo thư mục projects trên ổ D (nếu chưa có)
mkdir -p /mnt/d/projects

# 2. Copy toàn bộ dự án sang ổ D
cp -r /home/hat_n/projects/CareerPath_AI_Project /mnt/d/projects/

# 3. Kiểm tra đã copy thành công
ls -la /mnt/d/projects/CareerPath_AI_Project

# 4. Xóa bản cũ ở ổ C (sau khi chắc chắn đã copy xong)
rm -rf /home/hat_n/projects/CareerPath_AI_Project

# 5. Tạo symbolic link để truy cập dễ dàng (khuyến nghị)
ln -s /mnt/d/projects/CareerPath_AI_Project /home/hat_n/projects/CareerPath_AI_Project
```

**Hoặc di chuyển sang ổ E:**

```bash
# Thay /mnt/d bằng /mnt/e
mkdir -p /mnt/e/projects
cp -r /home/hat_n/projects/CareerPath_AI_Project /mnt/e/projects/
rm -rf /home/hat_n/projects/CareerPath_AI_Project
ln -s /mnt/e/projects/CareerPath_AI_Project /home/hat_n/projects/CareerPath_AI_Project
```

#### **So Sánh Ưu/Nhược Điểm: Chạy Dự Án Ở Ổ C vs Ổ D/E**

| Tiêu Chí | Ổ C (WSL2 /home) | Ổ D/E (/mnt/d hoặc /mnt/e) |
|----------|------------------|----------------------------|
| **Tốc độ I/O** | ⚡ Rất nhanh (~5-10x) | 🐢 Chậm hơn đáng kể |
| **Hiệu năng build** | ⚡ Nhanh (~5-10x) | 🐢 Chậm, đặc biệt npm install |
| **Hot reload** | ⚡ Tức thì | 🐢 Có độ trễ rõ rệt |
| **Dung lượng** | ⚠️ Chiếm ổ C | ✅ Tiết kiệm ổ C |
| **Phù hợp cho** | Development, coding | Lưu trữ, backup |
| **File watching** | ✅ Hoạt động tốt | ⚠️ Có thể gặp vấn đề |

#### **⚠️ KHUYẾN NGHỊ QUAN TRỌNG**

> [!WARNING]
> **KHÔNG NÊN** chạy dự án development ở `/mnt/c`, `/mnt/d`, `/mnt/e` vì:
> 
> 1. **Chậm hơn 5-10 lần** khi build, install packages
> 2. **Hot reload** (Next.js, React) có độ trễ cao
> 3. **File watching** không hoạt động tốt, dẫn đến phải restart server thường xuyên
> 4. **npm install** hoặc **pip install** có thể mất gấp nhiều lần thời gian

> [!IMPORTANT]
> **NÊN LÀM:**
> - ✅ Giữ dự án đang phát triển ở `/home/hat_n/projects/` (ổ C WSL2)
> - ✅ Dùng **Phương Án 1** (Xóa node_modules, venv) để tiết kiệm dung lượng
> - ✅ Chỉ di chuyển sang `/mnt/d` hoặc `/mnt/e` để **backup** hoặc **lưu trữ lâu dài**
> - ✅ Dùng `.gitignore` để tránh commit folder lớn

#### **Giải Pháp Thay Thế Tốt Hơn**

Thay vì di chuyển toàn bộ dự án, hãy:

1. **Backup dự án sang ổ D/E:**
   ```bash
   # Tạo bản backup đầy đủ
   cp -r /home/hat_n/projects/CareerPath_AI_Project /mnt/d/backup/CareerPath_AI_Project_$(date +%Y%m%d)
   ```

2. **Giữ dự án phát triển ở ổ C, nhưng xóa thư mục lớn:**
   ```bash
   # Xóa các thư mục có thể tái tạo
   rm -rf frontend/node_modules
   rm -rf venv backend/venv
   find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null
   ```

3. **Khi cần chạy, cài lại nhanh:**
   ```bash
   cd frontend && npm install  # 1-3 phút
   cd ../backend && python3 -m venv venv && pip install -r requirements.txt  # 1-2 phút
   ```

---

### **Phương Án 3: Tạo .gitignore (Ngăn chặn trong tương lai)**

> [!IMPORTANT]
> File `.gitignore` giúp Git bỏ qua các thư mục không cần thiết, giảm dung lượng khi commit.

Tạo file `.gitignore` trong thư mục gốc dự án:

```gitignore
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
env/
ENV/
backend/venv/
*.egg-info/
.pytest_cache/
.coverage

# Node.js
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*
frontend/node_modules/
frontend/.next/
frontend/out/
frontend/build/

# Logs
*.log
logs/
*.log.*

# IDE
.vscode/
.idea/
*.swp
*.swo
.DS_Store

# Environment
.env
.env.local
.env.*.local

# Database
*.db
*.sqlite
*.sqlite3

# Temporary files
*.tmp
*.temp
.cache/
```

**Lệnh tạo file:**

```bash
cd /home/hat_n/projects/CareerPath_AI_Project

cat > .gitignore << 'EOF'
# Python
__pycache__/
*.py[cod]
venv/
backend/venv/
*.egg-info/

# Node.js
node_modules/
frontend/node_modules/
frontend/.next/

# Logs
*.log

# Environment
.env
.env.local
EOF
```

---

## 🤖 Script Tự Động Dọn Dẹp

Tạo script để dọn dẹp tự động:

```bash
#!/bin/bash
# File: cleanup.sh

echo "🧹 Bắt đầu dọn dẹp dự án CareerPath_AI..."

# Lưu dung lượng hiện tại
BEFORE=$(du -sh . | cut -f1)
echo "📊 Dung lượng trước khi dọn: $BEFORE"

# Xóa __pycache__
echo "🗑️  Xóa Python cache..."
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null
find . -type f -name "*.pyc" -delete 2>/dev/null

# Xóa log files cũ (giữ lại 3 ngày gần nhất)
echo "📝 Xóa log files cũ..."
find . -name "*.log" -type f -mtime +3 -delete 2>/dev/null

# Xóa .next build cache (nếu có)
echo "🔨 Xóa Next.js build cache..."
rm -rf frontend/.next 2>/dev/null
rm -rf frontend/out 2>/dev/null

# Hiển thị kết quả
AFTER=$(du -sh . | cut -f1)
echo "✅ Hoàn thành!"
echo "📊 Dung lượng sau khi dọn: $AFTER"
echo "💾 Đã giải phóng dung lượng!"
```

**Cách sử dụng:**

```bash
# Tạo file script
cd /home/hat_n/projects/CareerPath_AI_Project
nano cleanup.sh  # Paste nội dung script vào

# Cho phép thực thi
chmod +x cleanup.sh

# Chạy script
./cleanup.sh
```

---

## 📋 Checklist Hành Động Khuyến Nghị

### Ngay lập tức (Giải phóng ~900 MB):
- [ ] Xóa `__pycache__`: `find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null`
- [ ] Xóa `frontend/node_modules`: `rm -rf frontend/node_modules`
- [ ] Xóa `venv` thừa: `rm -rf venv` (giữ `backend/venv`)

### Khi cần chạy lại dự án:
- [ ] Frontend: `cd frontend && npm install`
- [ ] Backend: `cd backend && source venv/bin/activate && pip install -r requirements.txt`

### Dài hạn:
- [ ] Tạo file `.gitignore` để tránh commit thư mục lớn
- [ ] Tạo script `cleanup.sh` để dọn dẹp định kỳ
- [ ] Cân nhắc di chuyển dự án sang ổ đĩa lớn hơn

---

## ❓ FAQ - Câu Hỏi Thường Gặp

**Q: Xóa node_modules có làm mất code của tôi không?**
> A: Không. `node_modules` chỉ chứa thư viện của bên thứ 3. Code của bạn ở `src/`, `pages/`, `components/`... hoàn toàn an toàn.

**Q: Tại sao mỗi lần chạy lại phải cài node_modules?**
> A: Đó là cách hoạt động của Node.js. File `package.json` chứa danh sách thư viện, `npm install` sẽ tải về và cài đặt.

**Q: Có cách nào giữ nguyên nhưng không chiếm ổ C?**
> A: Có, di chuyển toàn bộ dự án sang ổ khác hoặc dùng symbolic link.

**Q: File .gitignore có tự động xóa file không?**
> A: Không. `.gitignore` chỉ nói với Git không theo dõi các file đó. Bạn vẫn phải tự xóa.

**Q: Xóa venv có ảnh hưởng gì không?**
> A: Không ảnh hưởng code. Nhưng bạn cần tạo lại và cài dependencies trước khi chạy backend.

---

## 🎯 Tóm Tắt

| File/Folder | Có thể xóa? | Cài lại như thế nào? | Dung lượng |
|-------------|-------------|----------------------|------------|
| `frontend/node_modules/` | ✅ Có | `npm install` | 603 MB |
| `venv/` | ✅ Có | `python3 -m venv venv` | 160 MB |
| `backend/venv/` | ✅ Có | `python3 -m venv venv && pip install -r requirements.txt` | 135 MB |
| `__pycache__/` | ✅ Có | Tự động tạo lại | ~50 MB |
| `*.log` | ⚠️ Cẩn thận | Không cần cài lại | 1.5+ MB |

**💡 Khuyến nghị:**
1. Xóa ngay `node_modules`, `venv`, `__pycache__` → Giải phóng ~900 MB
2. Tạo `.gitignore` → Tránh commit nhầm
3. Tạo script `cleanup.sh` → Dọn dẹp định kỳ
4. Hoặc di chuyển toàn bộ dự án sang ổ đĩa khác
