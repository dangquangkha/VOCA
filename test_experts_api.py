import httpx
import asyncio
import json

BASE_URL = "http://127.0.0.1:8001/api/v1"

async def test_experts_list():
    print("\n🔍 Đang kiểm tra danh sách Chuyên gia & Cố vấn từ API...\n")
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            # 1. Kiểm tra tất cả
            print("--- [TẤT CẢ] ---")
            response = await client.get(f"{BASE_URL}/experts")
            if response.status_code == 200:
                data = response.json()
                items = data.get("items", [])
                total = data.get("total", 0)
                print(f"Tổng số bản ghi: {total}")
                for i, item in enumerate(items, 1):
                    role = item.get("user", {}).get("role", "UNKNOWN")
                    name = item.get("user", {}).get("full_name", "N/A")
                    kyc = item.get("kyc_status", "N/A")
                    print(f"  {i}. [{role}] {name} (KYC: {kyc})")
                if not items:
                    print("  (Trống)")
            else:
                print(f"❌ Lỗi: API trả về status {response.status_code}")
                print(response.text)

            # 2. Kiểm tra chỉ MENTOR
            print("\n--- [CHỈ CỐ VẤN - MENTOR] ---")
            response = await client.get(f"{BASE_URL}/experts", params={"role": "MENTOR"})
            if response.status_code == 200:
                data = response.json()
                items = data.get("items", [])
                print(f"Số lượng Mentor: {len(items)}")
                for i, item in enumerate(items, 1):
                    name = item.get("user", {}).get("full_name", "N/A")
                    print(f"  {i}. {name}")
            
            # 3. Kiểm tra chỉ EXPERT
            print("\n--- [CHỈ CHUYÊN GIA - EXPERT] ---")
            response = await client.get(f"{BASE_URL}/experts", params={"role": "EXPERT"})
            if response.status_code == 200:
                data = response.json()
                items = data.get("items", [])
                print(f"Số lượng Expert: {len(items)}")
                for i, item in enumerate(items, 1):
                    name = item.get("user", {}).get("full_name", "N/A")
                    kyc = item.get("kyc_status", "N/A")
                    print(f"  {i}. {name} (KYC: {kyc})")

        except httpx.ConnectError:
            print("❌ Lỗi: Không thể kết nối tới Backend tại http://127.0.0.1:8001")
            print("👉 Hãy chắc chắn bạn đã chạy lệnh: PYTHONPATH=. venv/bin/python backend/main.py")
        except Exception as e:
            print(f"❌ Đã xảy ra lỗi không xác định: {e}")

if __name__ == "__main__":
    asyncio.run(test_experts_list())
