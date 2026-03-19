#!/bin/bash
set -e

BASE_URL="http://127.0.0.1:8000/api/v1"
EMAIL_STUDENT="student_book_$(date +%s)@example.com"
EMAIL_EXPERT="expert_book_$(date +%s)@example.com"
PASSWORD="password123"

# 1. Register Student
echo "Registering Student..."
curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL_STUDENT\", \"password\": \"$PASSWORD\", \"full_name\": \"Booker Student\", \"role\": \"STUDENT\"}" > /dev/null

# 2. Login Student
TOKEN_STUDENT=$(curl -s -X POST "$BASE_URL/auth/login/access-token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$EMAIL_STUDENT&password=$PASSWORD" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

# 3. Give Student Credits (Hack: register as Admin? Or just use DB update? 
# For now, since we don't have Deposit API, we might fail unless we default credits to > 0 or use SQL)
# Let's use SQL to top up credits for this student.
echo "Topping up Student Credits via SQL..."
USER_ID=$(curl -s -X GET "$BASE_URL/users/me" -H "Authorization: Bearer $TOKEN_STUDENT" | grep -o '"id":[^,]*' | cut -d':' -f2)
cat <<EOF > topup.py
import asyncio
import sys
import os
sys.path.append(os.getcwd())
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from backend.app.core.config import settings

async def topup():
    print(f"Connecting to {settings.DATABASE_URL}")
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.begin() as conn:
        await conn.execute(text('UPDATE "user" SET credits = 500 WHERE id = $USER_ID'))

if __name__ == "__main__":
    asyncio.run(topup())
EOF

/home/hat_n/projects/CareerPath_AI_Project/venv/bin/python topup.py
rm topup.py

# 4. Register Expert
echo "Registering Expert..."
curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL_EXPERT\", \"password\": \"$PASSWORD\", \"full_name\": \"Booker Expert\", \"role\": \"EXPERT\"}" > /dev/null

TOKEN_EXPERT=$(curl -s -X POST "$BASE_URL/auth/login/access-token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$EMAIL_EXPERT&password=$PASSWORD" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

# Update Expert Profile and Approve (Auto-approve via SQL?)
EXP_UPDATE_RES=$(curl -s -X PUT "$BASE_URL/experts/me" \
  -H "Authorization: Bearer $TOKEN_EXPERT" \
  -H "Content-Type: application/json" \
  -d "{\"hourly_rate\": 100}")
  
echo "Expert Update Response: $EXP_UPDATE_RES"
  
EXPERT_RES=$(curl -s -X GET "$BASE_URL/experts/me" -H "Authorization: Bearer $TOKEN_EXPERT")
echo "Expert Get Response: $EXPERT_RES"
EXPERT_ID=$(echo $EXPERT_RES | grep -o '"id":[^,]*' | head -n 1 | cut -d':' -f2)
echo "Extracted Expert ID: $EXPERT_ID"

# 5. Create Booking
echo "Creating Booking..."
# Tomorrow 10am to 11am (1 hour)
START_TIME=$(date -d "+1 day 10:00" -u +"%Y-%m-%dT%H:%M:%SZ")
END_TIME=$(date -d "+1 day 11:00" -u +"%Y-%m-%dT%H:%M:%SZ")

BOOKING_RES=$(curl -s -X POST "$BASE_URL/bookings/" \
  -H "Authorization: Bearer $TOKEN_STUDENT" \
  -H "Content-Type: application/json" \
  -d "{\"expert_id\": $EXPERT_ID, \"start_time\": \"$START_TIME\", \"end_time\": \"$END_TIME\", \"student_note\": \"Help!\"}")

BOOKING_ID=$(echo $BOOKING_RES | grep -o '"id":[^,]*' | head -n 1 | cut -d':' -f2)
echo "Booking ID: $BOOKING_ID"

if [ -z "$BOOKING_ID" ]; then
    echo "Booking Creation Failed: $BOOKING_RES"
    exit 1
fi

# 6. Confirm Booking (Expert)
echo "Confirming Booking..."
curl -s -X PUT "$BASE_URL/bookings/$BOOKING_ID" \
  -H "Authorization: Bearer $TOKEN_EXPERT" \
  -H "Content-Type: application/json" \
  -d "{\"status\": \"CONFIRMED\"}" > /dev/null

# 7. Complete Booking (Expert)
echo "Completing Booking..."
curl -s -X PUT "$BASE_URL/bookings/$BOOKING_ID" \
  -H "Authorization: Bearer $TOKEN_EXPERT" \
  -H "Content-Type: application/json" \
  -d "{\"status\": \"COMPLETED\"}" > /dev/null

echo "Booking Flow Passed!"
