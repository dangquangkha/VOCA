#!/bin/bash
# Script tự động dọn dẹp dự án CareerPath_AI
# Sử dụng: ./cleanup.sh

echo "🧹 Bắt đầu dọn dẹp dự án CareerPath_AI..."
echo ""

# Lưu dung lượng hiện tại
BEFORE=$(du -sh . 2>/dev/null | cut -f1)
echo "📊 Dung lượng trước khi dọn: $BEFORE"
echo ""

# Đếm số lượng __pycache__
PYCACHE_COUNT=$(find . -type d -name "__pycache__" 2>/dev/null | wc -l)
echo "🔍 Tìm thấy $PYCACHE_COUNT thư mục __pycache__"

# Xóa __pycache__
echo "🗑️  Đang xóa Python cache..."
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null
find . -type f -name "*.pyc" -delete 2>/dev/null
find . -type f -name "*.pyo" -delete 2>/dev/null
echo "✅ Đã xóa Python cache"
echo ""

# Xóa .next build cache (nếu có)
if [ -d "frontend/.next" ]; then
    echo "🔨 Đang xóa Next.js build cache..."
    rm -rf frontend/.next
    echo "✅ Đã xóa .next cache"
    echo ""
fi

if [ -d "frontend/out" ]; then
    echo "🔨 Đang xóa Next.js output..."
    rm -rf frontend/out
    echo "✅ Đã xóa output folder"
    echo ""
fi

# Xóa log files cũ hơn 7 ngày
echo "📝 Đang xóa log files cũ (>7 ngày)..."
LOG_COUNT=$(find . -name "*.log" -type f -mtime +7 2>/dev/null | wc -l)
if [ $LOG_COUNT -gt 0 ]; then
    find . -name "*.log" -type f -mtime +7 -delete 2>/dev/null
    echo "✅ Đã xóa $LOG_COUNT log files"
else
    echo "ℹ️  Không có log files cũ cần xóa"
fi
echo ""

# Hiển thị kết quả
AFTER=$(du -sh . 2>/dev/null | cut -f1)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Hoàn thành dọn dẹp!"
echo "📊 Dung lượng trước: $BEFORE"
echo "📊 Dung lượng sau:  $AFTER"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Để giải phóng thêm dung lượng lớn (~900 MB):"
echo "   - Xóa node_modules: rm -rf frontend/node_modules"
echo "   - Xóa venv: rm -rf venv backend/venv"
echo "   (Cài lại khi cần: npm install và python3 -m venv venv)"
echo ""
