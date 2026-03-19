#!/bin/bash
set -e

BASE_URL="http://127.0.0.1:8000/api/v1"
EMAIL_ADMIN="admin_test_$(date +%s)@example.com"
EMAIL_EXPERT="expert_kyc_$(date +%s)@example.com"
PASSWORD="password123"

# 1. Register Admin (Hack: Register as Student then update via SQL if needed, but since we have no SQL tool, we rely on Register having ADMIN role allowed or pre-seeded. 
# For this test, let's assume register allows ADMIN for simplicity or we fail. 
# Actually, the Register endpoint force-sets role if not carefully checked. Let's try registering as ADMIN.)
echo "Registering Admin..."
RES_ADMIN=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL_ADMIN\", \"password\": \"$PASSWORD\", \"full_name\": \"Super Admin\", \"role\": \"ADMIN\"}")

# 2. Login Admin
TOKEN_ADMIN=$(curl -s -X POST "$BASE_URL/auth/login/access-token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$EMAIL_ADMIN&password=$PASSWORD" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

# Hack: Make this user Superuser via SQL injection? No. 
# Since we can't easily make them superuser without SQL access or an existing superuser, 
# we might need to skip the "superuser check" in code for DEMO purposes or use a known seed.
# FORCE: Let's assume the user we just made is NOT superuser, so the API will fail 403.
# Workaround: I will use a Python script to update the DB directly to make them superuser.

echo "Promoting Admin to Superuser via Python..."
USER_ID_ADMIN=$(curl -s -X GET "$BASE_URL/users/me" -H "Authorization: Bearer $TOKEN_ADMIN" | grep -o '"id":[^,]*' | cut -d':' -f2)

cat <<EOF > make_superuser.py
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

/home/hat_n/projects/CareerPath_AI_Project/venv/bin/python make_superuser.py
rm make_superuser.py


# 3. Register Expert (Pending)
echo "Registering Expert..."
curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL_EXPERT\", \"password\": \"$PASSWORD\", \"full_name\": \"Pending Expert\", \"role\": \"EXPERT\"}" > /dev/null

TOKEN_EXPERT=$(curl -s -X POST "$BASE_URL/auth/login/access-token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$EMAIL_EXPERT&password=$PASSWORD" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

# Create Expert Profile
curl -s -X PUT "$BASE_URL/experts/me" \
  -H "Authorization: Bearer $TOKEN_EXPERT" \
  -H "Content-Type: application/json" \
  -d "{\"bio\": \"I am new\"}" > /dev/null

EXPERT_RES=$(curl -s -X GET "$BASE_URL/experts/me" -H "Authorization: Bearer $TOKEN_EXPERT")
EXPERT_ID=$(echo $EXPERT_RES | grep -o '"id":[^,]*' | head -n 1 | cut -d':' -f2)
echo "Expert ID: $EXPERT_ID"

# 4. Admin: Get Stats
echo "Fetching Stats..."
STATS=$(curl -s -X GET "$BASE_URL/admin/stats" -H "Authorization: Bearer $TOKEN_ADMIN")
echo "Stats: $STATS"

# 5. Admin: List Experts (Verify Pending)
echo "Listing Pending Experts..."
EXPERTS=$(curl -s -X GET "$BASE_URL/admin/experts?status=PENDING" -H "Authorization: Bearer $TOKEN_ADMIN")
# echo "Experts: $EXPERTS"

# 6. Admin: Approve Expert
echo "Approving Expert..."
APPROVE_RES=$(curl -s -X PUT "$BASE_URL/admin/experts/$EXPERT_ID/kyc?status=APPROVED" \
  -H "Authorization: Bearer $TOKEN_ADMIN")
echo "Approve Result: $APPROVE_RES"

# 7. Verify Approved
CHECK_EXPERT=$(curl -s -X GET "$BASE_URL/admin/experts" -H "Authorization: Bearer $TOKEN_ADMIN")
IS_APPROVED=$(echo $CHECK_EXPERT | grep -o '"kyc_status":"APPROVED"')

if [ -n "$IS_APPROVED" ]; then
    echo "Admin Test Passed!"
else
    echo "Expert not approved!"
    exit 1
fi
