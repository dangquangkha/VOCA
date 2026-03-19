# 📊 Phân Tích: Ưu/Nhược Điểm Chạy Dự Án Ở Các Ổ Đĩa Khác Nhau (WSL2)

## 🎯 Kết Luận Nhanh

> [!CAUTION]
> **KHÔNG NÊN di chuyển dự án development sang ổ D/E trong WSL2!**
> 
> Lý do: **Chậm hơn 5-10 lần**, hot reload có độ trễ cao, file watching không hoạt động tốt.

---

## 📍 Thông Tin Hệ Thống Của Bạn

Bạn đang dùng **WSL2** (Windows Subsystem for Linux) với các ổ đĩa:

```
Ổ C: /mnt/c - 214GB (Đã dùng 123GB, Còn 92GB)  - 58% full
Ổ D: /mnt/d - 101GB (Đã dùng 46GB, Còn 55GB)   - 46% full
Ổ E: /mnt/e - 162GB (Đã dùng 77GB, Còn 85GB)   - 48% full
```

**Dự án hiện tại:** `/home/hat_n/projects/CareerPath_AI_Project`
- Đường dẫn này nằm trong **virtual disk của WSL2** (ổ C)
- Tổng dung lượng WSL2: **1007GB** (rất lớn!)

---

## ⚖️ So Sánh Chi Tiết

### 1. **Tốc Độ I/O (Đọc/Ghi File)**

| Vị Trí | Tốc Độ | Giải Thích |
|--------|--------|------------|
| `/home/hat_n/...` (WSL2 native) | ⚡⚡⚡⚡⚡ **500-1000 MB/s** | File system native của Linux |
| `/mnt/d/...` hoặc `/mnt/e/...` | 🐢 **50-100 MB/s** | Phải qua lớp NTFS bridge |

**Kết luận:** WSL2 native nhanh hơn **5-10 lần**

---

### 2. **npm install / pip install**

| Vị Trí | Thời Gian npm install | Thời Gian pip install |
|--------|----------------------|-----------------------|
| `/home/hat_n/...` | ⚡ **1-3 phút** | ⚡ **30s - 1 phút** |
| `/mnt/d/...` | 🐢 **10-30 phút** | 🐢 **3-5 phút** |

**Kết luận:** Chậm hơn **10x**, gây mất thời gian phát triển

---

### 3. **Hot Reload (Next.js, React)**

| Vị Trí | Độ Trễ | Trải Nghiệm |
|--------|--------|-------------|
| `/home/hat_n/...` | ⚡ **< 100ms** | Tức thì, mượt mà |
| `/mnt/d/...` | 🐢 **2-5 giây** | Chậm chạp, khó chịu |

**Kết luận:** Làm việc trên `/mnt/d` rất khó chịu khi develop

---

### 4. **File Watching (nodemon, webpack)**

| Vị Trí | Hoạt Động | Vấn Đề |
|--------|-----------|--------|
| `/home/hat_n/...` | ✅ Hoàn hảo | Không có vấn đề |
| `/mnt/d/...` | ⚠️ Không ổn định | Phải restart thủ công, có thể không detect thay đổi |

**Kết luận:** Có thể gặp bug, phải restart server liên tục

---

### 5. **Build Time (npm run build)**

| Vị Trí | Thời Gian Build Frontend | Thời Gian Build Container |
|--------|-------------------------|---------------------------|
| `/home/hat_n/...` | ⚡ **30s - 2 phút** | ⚡ **2-5 phút** |
| `/mnt/d/...` | 🐢 **5-15 phút** | 🐢 **15-30 phút** |

**Kết luận:** Khiến CI/CD chậm đi đáng kể

---

## 💡 Giải Pháp Khuyến Nghị

### ✅ **NÊNN LÀM**

1. **Giữ dự án ở `/home/hat_n/projects/`** (WSL2 native)
2. **Xóa thư mục lớn** để tiết kiệm dung lượng:
   ```bash
   rm -rf frontend/node_modules  # 603 MB
   rm -rf venv backend/venv      # 295 MB
   ```
3. **Tạo backup định kỳ sang ổ D/E:**
   ```bash
   # Backup 1 lần/tuần
   cp -r /home/hat_n/projects/CareerPath_AI_Project /mnt/d/backup/CareerPath_AI_$(date +%Y%m%d)
   ```

### ❌ **KHÔNG NÊN LÀM**

1. ❌ Di chuyển dự án development sang `/mnt/d` hoặc `/mnt/e`
2. ❌ Code trực tiếp trên `/mnt/c/Users/...`
3. ❌ Cài node_modules vào `/mnt/d` rồi symlink về

---

## 📋 Quy Trình Làm Việc Tối Ưu

### **Khi Phát Triển (Hàng Ngày)**

```bash
# 1. Làm việc tại /home/hat_n/projects/
cd /home/hat_n/projects/CareerPath_AI_Project

# 2. Xóa node_modules và venv khi KHÔNG code
rm -rf frontend/node_modules venv backend/venv

# 3. Khi cần chạy, cài lại (1-3 phút)
cd frontend && npm install
cd ../backend && python3 -m venv venv && pip install -r requirements.txt
```

### **Khi Cần Tiết Kiệm Dung Lượng**

```bash
# Chạy script tự động
./cleanup.sh

# Hoặc xóa thủ công
rm -rf frontend/node_modules venv backend/venv
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null
```

### **Backup Định Kỳ (1 Tuần/Lần)**

```bash
# Backup toàn bộ dự án sang ổ D
mkdir -p /mnt/d/backup
cp -r /home/hat_n/projects/CareerPath_AI_Project /mnt/d/backup/CareerPath_AI_$(date +%Y%m%d)

# Hoặc dùng rsync (nhanh hơn)
rsync -av --exclude='node_modules' --exclude='venv' \
  /home/hat_n/projects/CareerPath_AI_Project \
  /mnt/d/backup/CareerPath_AI_$(date +%Y%m%d)
```

---

## 🔧 Tối Ưu Dung Lượng WSL2

### **Giải phóng Dung Lượng Ngay**

```bash
# Xóa Docker cache (nếu có)
docker system prune -a

# Xóa package cache
sudo apt clean
sudo apt autoclean

# Xóa log cũ
sudo journalctl --vacuum-time=7d
```

### **Nén Virtual Disk của WSL2** (Giải phóng dung lượng ổ C Windows)

```powershell
# Chạy từ PowerShell (Windows)
# 1. Tắt WSL
wsl --shutdown

# 2. Tìm file virtual disk
# Thường ở: C:\Users\<username>\AppData\Local\Packages\CanonicalGroupLimited.Ubuntu...\LocalState\ext4.vhdx

# 3. Nén disk
diskpart
# Trong diskpart:
select vdisk file="C:\Users\<username>\AppData\Local\Packages\...\ext4.vhdx"
compact vdisk
exit
```

---

## 📊 Tóm Tắt

| Tiêu Chí | WSL2 `/home` (Ổ C) | `/mnt/d` hoặc `/mnt/e` |
|----------|---------------------|------------------------|
| **Tốc độ** | ⚡⚡⚡⚡⚡ | 🐢 (chậm 5-10x) |
| **Hiệu năng** | Tối ưu cho dev | Không phù hợp dev |
| **Dung lượng** | Chiếm ổ C | Tiết kiệm ổ C |
| **Hot reload** | Rất nhanh | Chậm, khó chịu |
| **Khuyến nghị** | ✅ **Dùng cho dev** | ⚠️ Chỉ dùng backup |

**KẾT LUẬN:** Giữ dự án ở `/home/hat_n/projects/`, xóa `node_modules`/`venv` khi không dùng, backup sang ổ D/E.
