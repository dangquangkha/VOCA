
import requests
import json
import sys

BASE_URL = "http://localhost:8000/api/v1"
EMAIL = "student_payment_test@example.com"
PASSWORD = "password123"

def run_test():
    print("1. Authenticating...")
    # Register (ignoring error if exists)
    requests.post(f"{BASE_URL}/auth/register", json={
        "email": EMAIL,
        "password": PASSWORD,
        "full_name": "Payment Tester",
        "role": "STUDENT"
    })

    # Login
    auth_resp = requests.post(f"{BASE_URL}/auth/login/access-token", data={
        "username": EMAIL,
        "password": PASSWORD
    })
    
    if auth_resp.status_code != 200:
        print("Login failed:", auth_resp.text)
        return

    token = auth_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Token obtained.")

    # Get Initial Balance
    user_resp = requests.get(f"{BASE_URL}/users/me", headers=headers)
    initial_credits = user_resp.json()["credits"]
    print(f"Initial Credits: {initial_credits}")

    # Request Top Up
    print("--------------------------------")
    print("2. Requesting Top Up (10 Credits)...")
    topup_resp = requests.post(f"{BASE_URL}/payments/topup", headers=headers, json={"amount": 10})
    
    if topup_resp.status_code != 200:
        print("Topup request failed:", topup_resp.text)
        return

    topup_data = topup_resp.json()
    trans_id = topup_data["transaction_id"]
    content = topup_data["content"]
    qr_url = topup_data["qr_url"]

    print(f"Transaction ID: {trans_id}")
    print(f"Transfer Content: {content}")
    print(f"QR URL: {qr_url}")

    # Simulate Webhook
    print("--------------------------------")
    print("3. Simulating SePay Webhook...")
    webhook_payload = {
        "id": 99999,
        "gateway": "MB",
        "transactionDate": "2024-01-01 12:00:00",
        "accountNumber": "placeholder_account",
        "subAccount": None,
        "amount": 10000,
        "content": content,
        "transferType": "in",
        "transferAmount": 10000
    }
    
    webhook_resp = requests.post(f"{BASE_URL}/payments/webhook/sepay", json=webhook_payload)
    print("Webhook Response:", webhook_resp.text)

    # Verify Transaction Status
    print("--------------------------------")
    print("4. Verifying Transaction Status...")
    status_resp = requests.get(f"{BASE_URL}/payments/{trans_id}", headers=headers)
    status_data = status_resp.json()
    print(f"Transaction Status: {status_data['status']}")

    # Verify Final Balance
    print("--------------------------------")
    print("5. Verifying Final Balance...")
    final_user_resp = requests.get(f"{BASE_URL}/users/me", headers=headers)
    final_credits = final_user_resp.json()["credits"]
    print(f"Final Credits: {final_credits}")

    if final_credits == initial_credits + 10:
        print("SUCCESS: Credits updated correctly.")
    else:
        print(f"FAILURE: Credits mismatch. Expected {initial_credits + 10}, got {final_credits}")

if __name__ == "__main__":
    run_test()
