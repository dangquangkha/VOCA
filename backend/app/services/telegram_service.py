import requests
import logging
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

async def send_telegram_message(message: str):
    """
    Send a message to the configured Telegram Admin Chat.
    Uses requests (sync) but intended to be called within a background task or executor.
    """
    if not settings.TELEGRAM_BOT_TOKEN or not settings.TELEGRAM_ADMIN_CHAT_ID:
        logger.debug("Telegram notifications disabled: TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID not set.")
        return False

    url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": settings.TELEGRAM_ADMIN_CHAT_ID,
        "text": message,
        "parse_mode": "HTML"
    }

    try:
        # We use a short timeout to prevent hanging the event loop if called directly
        response = requests.post(url, json=payload, timeout=5)
        response.raise_for_status()
        return True
    except Exception as e:
        logger.error(f"Failed to send Telegram message: {e}")
        return False

def format_admin_alert(title: str, message: str, link: str = None) -> str:
    """
    Format a standard admin alert for Telegram.
    """
    msg = f"<b>🚨 ADMIN ALERT: {title}</b>\n\n"
    msg += f"{message}\n\n"
    if link:
        # Base URL for convenience (adjust as needed)
        base_url = "https://voca.vn" # Mock base url
        msg += f"🔗 <a href='{base_url}{link}'>Xử lý ngay</a>"
    
    return msg
