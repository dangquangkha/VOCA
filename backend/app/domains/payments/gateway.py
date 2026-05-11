
import hashlib
import hmac
import json
from typing import Dict, Any, Optional
import urllib.parse
from backend.app.core.config import settings

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

        Two-layer verification:
        1. Account number must match SEPAY_ACCOUNT_NUMBER.
        2. UPDATE (SEC-01): Authorization Bearer token must match SEPAY_WEBHOOK_TOKEN
           using constant-time comparison (hmac.compare_digest) to prevent timing attacks.
           If SEPAY_WEBHOOK_TOKEN is not configured, token check is SKIPPED (dev mode).
        """
        print(f"[SePay Webhook] accountNumber received: '{data.get('accountNumber')}', expected: '{self.account_number}'")
        print(f"[SePay Webhook] Authorization header: {incoming_token}")
        print(f"[SePay Webhook] Full payload: {data}")

        # Check 1: Account number match (existing)
        if str(data.get("accountNumber")) != str(self.account_number):
            print("[SePay Webhook] REJECTED: account number mismatch")
            return False

        # UPDATE (SEC-01): Check 2 — Bearer token HMAC verification.
        if self.webhook_token:
            expected = f"Bearer {self.webhook_token}"
            if not incoming_token:
                print("[SePay Webhook] REJECTED: missing Authorization header (SEC-01)")
                return False
            # constant-time compare — immune to timing side-channel attacks
            if not hmac.compare_digest(incoming_token.strip(), expected):
                print("[SePay Webhook] REJECTED: invalid webhook token (SEC-01)")
                return False
            print("[SePay Webhook] Token verified OK (SEC-01)")
        else:
            print("[SePay Webhook] WARNING: SEPAY_WEBHOOK_TOKEN not set — token check SKIPPED (dev mode)")

        return True


sepay_service = SePayService()
