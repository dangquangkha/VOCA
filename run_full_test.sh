#!/bin/bash

echo "🚀 Bắt đầu quy trình kiểm tra toàn diện..."

# 1. Khởi động Backend trong background
echo "1. Đang khởi động Backend..."
PYTHONPATH=. venv/bin/python backend/main.py > backend_test.log 2>&1 &
BACKEND_PID=$!

# Đợi backend khởi động
sleep 5

# 2. Chạy Seed dữ liệu (để đảm bảo có chuyên gia)
echo "2. Đang nạp dữ liệu mẫu (Seed)..."
PYTHONPATH=. venv/bin/python backend/seed_experts.py

# 3. Chạy file test API
echo "3. Đang chạy file test hiển thị danh sách..."
venv/bin/python test_experts_api.py

# Dọn dẹp: Tắt backend sau khi test xong
echo "🧹 Đang dọn dẹp..."
kill $BACKEND_PID
echo "✅ Hoàn tất."
