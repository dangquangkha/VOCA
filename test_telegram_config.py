import asyncio
import sys
import os

# Add current directory to path so we can import app
sys.path.append(os.getcwd())

from backend.app.services.telegram_service import send_telegram_message, format_admin_alert
from backend.app.core.config import settings

async def main():
    print("--- Telegram Configuration Test ---")
    
    if not settings.TELEGRAM_BOT_TOKEN or settings.TELEGRAM_BOT_TOKEN == "your_bot_token_here":
        print("❌ LỖI: TELEGRAM_BOT_TOKEN chưa được thiết lập trong backend/.env")
        return

    if not settings.TELEGRAM_ADMIN_CHAT_ID:
        print("❌ LỖI: TELEGRAM_ADMIN_CHAT_ID chưa được thiết lập trong backend/.env")
        return

    print(f"Token: {settings.TELEGRAM_BOT_TOKEN[:5]}...{settings.TELEGRAM_BOT_TOKEN[-5:]}")
    print(f"Chat ID: {settings.TELEGRAM_ADMIN_CHAT_ID}")
    print("\nĐang gửi tin nhắn thử nghiệm...")

    test_title = "Cấu hình thành công! ✅"
    test_message = "Chào Admin, đây là tin nhắn thử nghiệm từ hệ thống CareerPath AI. Hệ thống thông báo Telegram của bạn đã sẵn sàng hoạt động."
    test_link = "/dashboard/admin"
    
    formatted_msg = format_admin_alert(test_title, test_message, test_link)
    
    success = await send_telegram_message(formatted_msg)
    
    if success:
        print("\n✅ THÀNH CÔNG! Hãy kiểm tra điện thoại của bạn.")
    else:
        print("\n❌ THẤT BẠI. Vui lòng kiểm tra lại Token, Chat ID và kết nối mạng của bạn.")

if __name__ == "__main__":
    asyncio.run(main())
