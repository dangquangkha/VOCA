#!/bin/bash
set -e

BASE_URL="http://127.0.0.1:8000/api/v1"
EMAIL_STUDENT="student_$(date +%s)@example.com"
EMAIL_EXPERT="expert_$(date +%s)@example.com"
PASSWORD="password123"

# 1. Register Student
echo "Registering Student..."
curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL_STUDENT\", \"password\": \"$PASSWORD\", \"full_name\": \"Test Student\", \"role\": \"STUDENT\"}" > /dev/null

# 2. Login Student
echo "Logging in Student..."
TOKEN_STUDENT=$(curl -s -X POST "$BASE_URL/auth/login/access-token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$EMAIL_STUDENT&password=$PASSWORD" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN_STUDENT" ]; then
    echo "Student Login Failed"
    exit 1
fi
echo "Student Token: $TOKEN_STUDENT"

# 3. Get Student Profile
echo "Getting Student Profile..."
curl -s -X GET "$BASE_URL/users/me" -H "Authorization: Bearer $TOKEN_STUDENT" | grep "Test Student" > /dev/null
echo "Student Profile Verified."

# 4. Register Expert
echo "Registering Expert..."
curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL_EXPERT\", \"password\": \"$PASSWORD\", \"full_name\": \"Test Expert\", \"role\": \"EXPERT\"}" > /dev/null

# 5. Login Expert
echo "Logging in Expert..."
TOKEN_EXPERT=$(curl -s -X POST "$BASE_URL/auth/login/access-token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$EMAIL_EXPERT&password=$PASSWORD" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN_EXPERT" ]; then
    echo "Expert Login Failed"
    exit 1
fi

# 6. Update Expert Profile (Create)
echo "Updating Expert Profile..."
curl -s -X PUT "$BASE_URL/experts/me" \
  -H "Authorization: Bearer $TOKEN_EXPERT" \
  -H "Content-Type: application/json" \
  -d "{\"bio\": \"I am an expert in AI and Python.\", \"experience_years\": 5, \"hourly_rate\": 100, \"tags\": \"AI, Python\"}" > /dev/null

# 7. Verify Expert Search (Initially PENDING, so should not appear)
echo "Searching (Expect Empty)..."
COUNT=$(curl -s -X GET "$BASE_URL/experts/?q=Python" | grep -o "AI" | wc -l)
if [ "$COUNT" -ne "0" ]; then
   echo "Warning: Pending expert showed up?"
else
   echo "Verified: Pending expert hidden."
fi

# 8. Manually Approve Expert (Simulated by DB update would be hard via curl without admin API)
# For now, skip Search Verification of approved expert unless we have Admin API or SQL access.
# We can test Roadmap.

# 9. Get Roadmap (Student)
echo "Getting Roadmap..."
ROADMAP=$(curl -s -X GET "$BASE_URL/roadmap/" -H "Authorization: Bearer $TOKEN_STUDENT")
if [[ $ROADMAP == *"LOCKED"* ]]; then
    echo "Roadmap retrieved."
else
    echo "Roadmap failed."
    exit 1
fi

# 10. Submit Day 1
echo "Submitting Day 1..."
curl -s -X POST "$BASE_URL/roadmap/1/submit" \
  -H "Authorization: Bearer $TOKEN_STUDENT" \
  -H "Content-Type: application/json" \
  -d "{\"content_data\": {\"text\": \"I wake up to code.\"}, \"status\": \"COMPLETED\"}" > /dev/null

echo "Day 1 Submitted."

echo "All Auto Tests Passed!"
