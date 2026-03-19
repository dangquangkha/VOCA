import requests
import time

email = f"expert_debug_{int(time.time())}@example.com"
password = "password123"

# 1. Register as EXPERT
print(f"Registering {email} as EXPERT...")
register_url = "http://localhost:8000/api/v1/auth/register"
res = requests.post(register_url, json={
    "email": email,
    "password": password,
    "full_name": "Debug Expert",
    "role": "EXPERT"
})
if res.status_code != 200:
    print(f"Register failed: {res.text}")
    print(f"Status: {res.status_code}")
else:
    print("Register OK")

# 2. Login
print("Logging in...")
login_url = "http://localhost:8000/api/v1/auth/login/access-token"
payload = {
    "username": email,
    "password": password
}
response = requests.post(login_url, data=payload)
if response.status_code != 200:
    print(f"Login failed: {response.text}")
    exit(1)

token = response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# 3. Test /users/me
print("Testing /users/me...")
response = requests.get("http://localhost:8000/api/v1/users/me", headers=headers)
print(f"Status: {response.status_code}")
print(f"Response: {response.text}")
