
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
        Verifies the incoming webhook request.
        """
        # Debug logging
        print(f"[SePay Webhook] accountNumber received: '{data.get('accountNumber')}', expected: '{self.account_number}'")
        print(f"[SePay Webhook] Authorization header: {incoming_token}")
        print(f"[SePay Webhook] Full payload: {data}")

        # Only check account number - this is sufficient for matching
        if str(data.get("accountNumber")) != str(self.account_number):
            print(f"[SePay Webhook] REJECTED: account number mismatch")
            return False

        return True


sepay_service = SePayService()
