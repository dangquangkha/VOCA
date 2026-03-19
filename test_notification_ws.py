
import asyncio
import websockets
import requests
import json
import sys

BASE_URL = "http://localhost:8000/api/v1"
WS_URL = "ws://localhost:8000/api/v1/notifications/ws"

EMAIL = "ws_test@example.com"
PASSWORD = "password123"

def get_token():
    # Login
    resp = requests.post(f"{BASE_URL}/auth/login/access-token", data={
        "username": EMAIL,
        "password": PASSWORD
    })
    if resp.status_code != 200:
        print(f"Login failed: {resp.status_code} {resp.text}")
        sys.exit(1)
    return resp.json().get("access_token")

async def test_websocket():
    print("1. Authenticating User...")
    token = get_token()
    print(f"Token acquired. Length: {len(token)}")

    # Connect to WS
    print(f"2. Connecting to WebSocket: {WS_URL}...")
    try:
        async with websockets.connect(f"{WS_URL}?token={token}") as ws:
            print("Successfully connected to Notification WebSocket.")
            # Keep it open for a bit
            await asyncio.sleep(2)
            print("Connection test successful.")
    except Exception as e:
        print(f"FAILED to connect to WebSocket: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(test_websocket())
