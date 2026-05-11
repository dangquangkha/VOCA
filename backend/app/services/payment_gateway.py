
import hashlib
import hmac
import json
from typing import Dict, Any, Optional
import logging
import urllib.parse
from datetime import datetime
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

class SePayService:
    def __init__(self):
        self.api_url = "https://qr.sepay.vn"
        self.account_number = settings.SEPAY_ACCOUNT_NUMBER
        self.bank_code = settings.SEPAY_BANK_CODE
        # UPDATE (SEC-01): Shared secret for webhook Bearer token verification.
        # Set SEPAY_WEBHOOK_TOKEN in .env. If unset, token check is SKIPPED
        # (permissive mode — only for local dev, never leave unset in production).
        self.webhook_token: str | None = getattr(settings, "SEPAY_WEBHOOK_TOKEN", None)

    def generate_qr_url(self, amount: int, content: str) -> str:
        """
        Generates a VietQR image URL.
        Format: https://img.vietqr.io/image/{BankCode}-{AccountNumber}-qr_only.jpg?amount={Amount}&addInfo={Content}
        """
        if amount <= 0:
            raise ValueError("Amount must be greater than 0")

        encoded_content = urllib.parse.quote(content)
        return (
            f"https://img.vietqr.io/image/{self.bank_code}-{self.account_number}-qr_only.jpg"
            f"?amount={amount}&addInfo={encoded_content}"
        )

    def verify_webhook_data(self, data: Dict[str, Any], incoming_token: Optional[str] = None) -> bool:
        """
        Verifies the incoming SePay webhook request.
        """
        # logging for audit
        log_msg = f"[SePay Webhook] {datetime.now().isoformat()} - payload: {data}\n"
        with open("backend/webhook_log.txt", "a") as f:
            f.write(log_msg)

        # Check 1: Account number match
        if str(data.get("accountNumber")) != str(self.account_number):
            logger.warning(f"SePay Webhook Rejected: Account number mismatch. Got {data.get('accountNumber')}")
            return False

        # SEC-01: Strict HMAC/Token Verification
        # In Production, SEPAY_WEBHOOK_TOKEN MUST be set.
        if self.webhook_token:
            expected = f"Bearer {self.webhook_token}"
            if not incoming_token:
                logger.error("SePay Webhook Rejected: Missing Authorization header")
                return False
            
            # Constant-time comparison to prevent timing attacks
            if not hmac.compare_digest(incoming_token.strip(), expected):
                logger.error("SePay Webhook Rejected: Invalid Authorization token")
                return False
            logger.info("SePay Webhook: Token verified OK")
        else:
            # Allow skipping ONLY if ALLOW_MOCK_LOGIN is true (development)
            allow_mock = getattr(settings, "ALLOW_MOCK_LOGIN", False)
            if not allow_mock:
                logger.critical("SePay Webhook Rejected: SEPAY_WEBHOOK_TOKEN not configured in PRODUCTION!")
                return False
            logger.warning("SePay Webhook: Token check SKIPPED (Allowing due to MOCK_LOGIN=True)")

        return True


sepay_service = SePayService()
