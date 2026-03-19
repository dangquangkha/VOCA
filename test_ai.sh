#!/bin/bash
set -e

BASE_URL="http://127.0.0.1:8000/api/v1"
EMAIL="ai_user_$(date +%s)@example.com"
PASSWORD="password123"

# 1. Register User
echo "Registering User..."
curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\", \"full_name\": \"AI User\", \"role\": \"STUDENT\"}" > /dev/null

TOKEN=$(curl -s -X POST "$BASE_URL/auth/login/access-token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$EMAIL&password=$PASSWORD" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

# 2. CV Analysis
echo "Uploading CV..."
# Create dummy CV file
echo "My Resume content" > dummy_cv.txt

CV_RES=$(curl -s -X POST "$BASE_URL/ai/cv-analyze" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@dummy_cv.txt" \
  -F "job_description=Python Backend Developer")

echo "CV Response: $CV_RES"
SCORE=$(echo $CV_RES | grep -o '"score":[^,]*' | cut -d':' -f2)

if [[ ! -z "$SCORE" ]]; then
    echo "CV Analysis Successful. Score: $SCORE"
else
    echo "CV Analysis Failed"
    exit 1
fi
rm dummy_cv.txt

# 3. Mock Interview Start
echo "Starting Interview..."
INT_RES=$(curl -s -X POST "$BASE_URL/ai/interview-simulate?job_description=Software%20Engineer" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

INT_ID=$(echo $INT_RES | grep -o '"id":[^,]*' | head -n 1 | cut -d':' -f2)
echo "Interview ID: $INT_ID"

if [ -z "$INT_ID" ]; then
    print "Interview Start Failed"
    exit 1
fi

# 4. Mock Interview Submit
echo "Submitting Interview..."
SUBMIT_RES=$(curl -s -X POST "$BASE_URL/ai/interview-submit/$INT_ID?transcript=I%20am%20great%20at%20coding" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

FEEDBACK=$(echo $SUBMIT_RES | grep -o '"feedback":{[^}]*}')
echo "Feedback Received."

echo "AI Flow Passed!"
