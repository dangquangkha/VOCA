
import asyncio
import websockets
import requests
import json
import sys

BASE_URL = "http://localhost:8000/api/v1"
WS_URL = "ws://localhost:8000/api/v1/chat/ws"

EMAIL_STUDENT = "student_chat_test@example.com"
EMAIL_EXPERT = "expert_chat_test@example.com"
PASSWORD = "password123"

def get_token(email):
    # Register (ignoring error)
    requests.post(f"{BASE_URL}/auth/register", json={
        "email": email,
        "password": PASSWORD,
        "full_name": "Chat Tester",
        "role": "STUDENT"
    })
    # Login
    resp = requests.post(f"{BASE_URL}/auth/login/access-token", data={
        "username": email,
        "password": PASSWORD
    })
    return resp.json().get("access_token")

def get_user_id(token):
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}/users/me", headers=headers)
    return resp.json()["id"]

async def test_websocket():
    print("1. Authenticating Users...")
    token_student = get_token(EMAIL_STUDENT)
    token_expert = get_token(EMAIL_EXPERT)
    
    id_student = get_user_id(token_student)
    id_expert = get_user_id(token_expert)
    
    print(f"Student ID: {id_student}, Expert ID: {id_expert}")

    # Connect Expert to WS
    print("2. Expert connecting to WebSocket...")
    async with websockets.connect(f"{WS_URL}?token={token_expert}") as ws_expert:
        print("Expert Connected.")
        
        # Student sends message via API
        print("3. Student sending message via API...")
        msg_content = "Hello via WebSocket https://meet.google.com/abc"
        requests.post(f"{BASE_URL}/chat/", headers={"Authorization": f"Bearer {token_student}"}, json={
            "receiver_id": id_expert,
            "content": msg_content
        })
        
        # Expert should receive it
        print("4. Expert waiting for message...")
        try:
            message = await asyncio.wait_for(ws_expert.recv(), timeout=5.0)
            data = json.loads(message)
            print("Received:", data)
            
            if data["content"] == msg_content and data["sender_id"] == id_student:
                print("SUCCESS: Message received correctly.")
            else:
                print("FAILURE: Message content mismatch.")
                sys.exit(1)
                
        except asyncio.TimeoutError:
            print("FAILURE: Timeout waiting for message.")
            sys.exit(1)

if __name__ == "__main__":
    asyncio.run(test_websocket())
