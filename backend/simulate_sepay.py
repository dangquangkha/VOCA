import requests
import sys

# Usage: python backend/simulate_sepay.py <transaction_id> [amount_vnd]
# Example: python backend/simulate_sepay.py 32 10000

BASE_URL = "http://localhost:8000/api/v1"
ACCOUNT_NUMBER = "0379262302"
API_TOKEN = "S2LTS07IHIK2BALCUM5MYTGZ3KDOYGXK1NEFP6JCYBU0MFEMXVDXJTVECZG84UPV"

def simulate(transaction_id, amount_vnd=10000):
    content = f"CP{transaction_id}"
    
    print(f"Simulating SePay webhook for Transaction ID={transaction_id}, Amount={amount_vnd} VND...")
    
    payload = {
        "id": 99999,
        "gateway": "MB",
        "transactionDate": "2026-02-28 16:30:00",
        "accountNumber": ACCOUNT_NUMBER,
        "subAccount": None,
        "amount": amount_vnd,
        "content": content,
        "transferType": "in",
        "transferAmount": amount_vnd
    }
    
    headers = {
        "Authorization": f"Bearer {API_TOKEN}",
        "Content-Type": "application/json"
    }
    
    try:
        resp = requests.post(
            f"{BASE_URL}/payments/webhook/sepay",
            json=payload,
            headers=headers
        )
        print(f"Status Code: {resp.status_code}")
        print(f"Response: {resp.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python backend/simulate_sepay.py <transaction_id> [amount_vnd]")
        print("Example: python backend/simulate_sepay.py 32 10000")
        sys.exit(1)
        
    t_id = sys.argv[1]
    amount = int(sys.argv[2]) if len(sys.argv) > 2 else 10000
    
    simulate(t_id, amount)
