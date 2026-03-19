#!/bin/bash
set -e

BASE_URL="http://127.0.0.1:8000/api/v1"
MOCK_TOKEN="mock_google_test_user_$(date +%s)@gmail.com"

echo "Testing Google Login with Token: $MOCK_TOKEN"

# 1. Login/Register via Google
RES=$(curl -s -X POST "$BASE_URL/auth/google" \
  -H "Content-Type: application/json" \
  -d "{\"id_token\": \"$MOCK_TOKEN\"}")

TOKEN=$(echo $RES | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "Login Failed: $RES"
    exit 1
fi

echo "Login Success: got access token"

# 2. Verify User Created
USER_RES=$(curl -s -X GET "$BASE_URL/users/me" -H "Authorization: Bearer $TOKEN")
EMAIL=$(echo $USER_RES | grep -o '"email":"[^"]*' | cut -d'"' -f4)

echo "Logged in as: $EMAIL"

if [[ "$MOCK_TOKEN" == *"$EMAIL"* ]]; then
    echo "Google Login Test Passed!"
else
    echo "Email mismatch!"
    exit 1
fi
