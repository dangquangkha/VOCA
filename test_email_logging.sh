#!/bin/bash
set -e

BASE_URL="http://127.0.0.1:8000/api/v1"
EMAIL_USER="forgot_pass_$(date +%s)@example.com"
EMAIL_ADMIN="admin_log_$(date +%s)@example.com"
PASSWORD="password123"

# 1. Register User & Admin
echo "Registering User & Admin..."
curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL_USER\", \"password\": \"$PASSWORD\", \"full_name\": \"Mr. Forgetful\", \"role\": \"STUDENT\"}" > /dev/null

curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL_ADMIN\", \"password\": \"$PASSWORD\", \"full_name\": \"Super Admin\", \"role\": \"ADMIN\"}" > /dev/null

# 2. Login Admin & Promote
TOKEN_ADMIN=$(curl -s -X POST "$BASE_URL/auth/login/access-token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$EMAIL_ADMIN&password=$PASSWORD" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

USER_ID_ADMIN=$(curl -s -X GET "$BASE_URL/users/me" -H "Authorization: Bearer $TOKEN_ADMIN" | grep -o '"id":[^,]*' | cut -d':' -f2)

cat <<EOF > make_superuser_log.py
import asyncio
import sys
import os
sys.path.append(os.getcwd())
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from backend.app.core.config import settings

async def promote():
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.begin() as conn:
        await conn.execute(text('UPDATE "user" SET is_superuser = TRUE WHERE id = $USER_ID_ADMIN'))

if __name__ == "__main__":
    asyncio.run(promote())
EOF
/home/hat_n/projects/CareerPath_AI_Project/venv/bin/python make_superuser_log.py
rm make_superuser_log.py

# 3. Trigger Password Recovery
echo "Triggering Password Recovery..."
curl -s -X POST "$BASE_URL/auth/password-recovery" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL_USER\"}" > /dev/null

# 4. Fetch Email Logs as Admin
echo "Fetching Email Logs..."
LOGS=$(curl -s -X GET "$BASE_URL/admin/emails" -H "Authorization: Bearer $TOKEN_ADMIN")
# echo "Logs: $LOGS"

# 5. Verify Email Logged
if echo "$LOGS" | grep -q "$EMAIL_USER"; then
    echo "Email found in logs!"
    
    # Extract Token (Roughly)
    TOKEN_MSG=$(echo "$LOGS" | grep -o "Your recovery token is: [^\\\"]*")
    echo "Found Token Message: $TOKEN_MSG"
    
    echo "Email Logging Test Passed!"
else
    echo "Email NOT found in logs!"
    exit 1
fi
