#!/bin/bash
set -e

BASE_URL="http://127.0.0.1:8000/api/v1"
EMAIL_STUDENT="student_chat_$(date +%s)@example.com"
EMAIL_EXPERT="expert_chat_$(date +%s)@example.com"
PASSWORD="password123"

# --- Registration & Setup ---
echo "Registering Student..."
curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL_STUDENT\", \"password\": \"$PASSWORD\", \"full_name\": \"Chat Student\", \"role\": \"STUDENT\"}" > /dev/null

TOKEN_STUDENT=$(curl -s -X POST "$BASE_URL/auth/login/access-token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$EMAIL_STUDENT&password=$PASSWORD" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
STUDENT_ID=$(curl -s -X GET "$BASE_URL/users/me" -H "Authorization: Bearer $TOKEN_STUDENT" | grep -o '"id":[^,]*' | cut -d':' -f2)

# Topup Student
cat <<EOF > topup_chat.py
import asyncio
import sys
import os
sys.path.append(os.getcwd())
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from backend.app.core.config import settings

async def topup():
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.begin() as conn:
        await conn.execute(text('UPDATE "user" SET credits = 500 WHERE id = $STUDENT_ID'))

if __name__ == "__main__":
    asyncio.run(topup())
EOF
/home/hat_n/projects/CareerPath_AI_Project/venv/bin/python topup_chat.py
rm topup_chat.py

echo "Registering Expert..."
curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL_EXPERT\", \"password\": \"$PASSWORD\", \"full_name\": \"Chat Expert\", \"role\": \"EXPERT\"}" > /dev/null

TOKEN_EXPERT=$(curl -s -X POST "$BASE_URL/auth/login/access-token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$EMAIL_EXPERT&password=$PASSWORD" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

curl -s -X PUT "$BASE_URL/experts/me" \
  -H "Authorization: Bearer $TOKEN_EXPERT" \
  -H "Content-Type: application/json" \
  -d "{\"hourly_rate\": 100}" > /dev/null

EXPERT_RES=$(curl -s -X GET "$BASE_URL/experts/me" -H "Authorization: Bearer $TOKEN_EXPERT")
EXPERT_PROFILE_ID=$(echo $EXPERT_RES | grep -o '"id":[^,]*' | head -n 1 | cut -d':' -f2)
EXPERT_USER_ID=$(curl -s -X GET "$BASE_URL/users/me" -H "Authorization: Bearer $TOKEN_EXPERT" | grep -o '"id":[^,]*' | cut -d':' -f2)

# --- Test 1: Booking Rejection & Refund ---
echo "--- Test 1: Booking Rejection ---"
START_TIME=$(date -d "+1 day 10:00" -u +"%Y-%m-%dT%H:%M:%SZ")
END_TIME=$(date -d "+1 day 11:00" -u +"%Y-%m-%dT%H:%M:%SZ")

BOOKING_RES=$(curl -s -X POST "$BASE_URL/bookings/" \
  -H "Authorization: Bearer $TOKEN_STUDENT" \
  -H "Content-Type: application/json" \
  -d "{\"expert_id\": $EXPERT_PROFILE_ID, \"start_time\": \"$START_TIME\", \"end_time\": \"$END_TIME\"}")
BOOKING_ID=$(echo $BOOKING_RES | grep -o '"id":[^,]*' | head -n 1 | cut -d':' -f2)

echo "Rejecting Booking $BOOKING_ID..."
REJECT_RES=$(curl -s -X PUT "$BASE_URL/bookings/$BOOKING_ID" \
  -H "Authorization: Bearer $TOKEN_EXPERT" \
  -H "Content-Type: application/json" \
  -d "{\"status\": \"REJECTED\"}")

STATUS=$(echo $REJECT_RES | grep -o '"status":"[^"]*' | cut -d'"' -f4)
if [ "$STATUS" == "REJECTED" ]; then
    echo "Booking Rejected Successfully."
else
    echo "Rejection Failed: $REJECT_RES"
    exit 1
fi

# --- Test 2: Meeting URL Validation ---
echo "--- Test 2: URL Validation ---"
# Create another booking
BOOKING_RES_2=$(curl -s -X POST "$BASE_URL/bookings/" \
  -H "Authorization: Bearer $TOKEN_STUDENT" \
  -H "Content-Type: application/json" \
  -d "{\"expert_id\": $EXPERT_PROFILE_ID, \"start_time\": \"$START_TIME\", \"end_time\": \"$END_TIME\"}")
BOOKING_ID_2=$(echo $BOOKING_RES_2 | grep -o '"id":[^,]*' | head -n 1 | cut -d':' -f2)

# Try invalid URL
INVALID_URL_RES=$(curl -s -X PUT "$BASE_URL/bookings/$BOOKING_ID_2" \
  -H "Authorization: Bearer $TOKEN_EXPERT" \
  -H "Content-Type: application/json" \
  -d "{\"status\": \"CONFIRMED\", \"meeting_url\": \"http://malicious.com\"}")

if [[ $INVALID_URL_RES == *"Invalid meeting URL domain"* ]]; then
    echo "Invalid URL blocked correctly."
else
    echo "Failed to block invalid URL: $INVALID_URL_RES"
    exit 1
fi

# Valid URL
VALID_URL_RES=$(curl -s -X PUT "$BASE_URL/bookings/$BOOKING_ID_2" \
  -H "Authorization: Bearer $TOKEN_EXPERT" \
  -H "Content-Type: application/json" \
  -d "{\"status\": \"CONFIRMED\", \"meeting_url\": \"https://meet.google.com/abc-defg-hij\"}")

if [[ $VALID_URL_RES == *"meet.google.com"* ]]; then
    echo "Valid URL accepted."
else
     echo "Failed to accept valid URL: $VALID_URL_RES"
     exit 1
fi

# --- Test 3: Chat System & Content Filter ---
echo "--- Test 3: Chat ---"
# Student sends message to Expert
CHAT_Res=$(curl -s -X POST "$BASE_URL/chat/" \
  -H "Authorization: Bearer $TOKEN_STUDENT" \
  -H "Content-Type: application/json" \
  -d "{\"receiver_id\": $EXPERT_USER_ID, \"content\": \"Hello Expert, can you help with Python?\"}")

if [[ $CHAT_Res == *"Hello Expert"* ]]; then
    echo "Message sent successfully."
else
    echo "Message sending failed: $CHAT_Res"
    exit 1
fi

# Test Filter (Phone Number)
BAD_MSG_RES=$(curl -s -X POST "$BASE_URL/chat/" \
  -H "Authorization: Bearer $TOKEN_STUDENT" \
  -H "Content-Type: application/json" \
  -d "{\"receiver_id\": $EXPERT_USER_ID, \"content\": \"Call me at 0901234567 for transfer\"}")

if [[ $BAD_MSG_RES == *"Message contains phone number"* ]]; then
    echo "Content Filter blocked phone number correctly."
else
    echo "Content Filter Failed: $BAD_MSG_RES"
    exit 1
fi

echo "Chat & Booking Advanced Tests Passed!"
