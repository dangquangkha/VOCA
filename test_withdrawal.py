import asyncio
import httpx

async def test_withdrawal():
    # We need a token. I'll use the one from check_sarah.py if I can find it...
    # Or just try to hit it and see if we get a 500 or 401.
    # If it's a 500, it will show in the backend terminal.
    url = "http://127.0.0.1:8001/api/v1/payments/withdrawal-request"
    payload = {"amount": 5} # Min 5
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload)
            print(f"Status: {response.status_code}")
            print(f"Body: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_withdrawal())
