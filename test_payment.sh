#!/bin/bash
set -e

BASE_URL="http://127.0.0.1:8000/api/v1"
EMAIL="payment_test_$(date +%s)@example.com"
PASSWORD="password123"

# 1. Register User
echo "Registering..."
curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\", \"full_name\": \"Richie Rich\", \"role\": \"STUDENT\"}" > /dev/null

# 2. Login
echo "Logging in..."
TOKEN=$(curl -s -X POST "$BASE_URL/auth/login/access-token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$EMAIL&password=$PASSWORD" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "Login failed"
    exit 1
fi

# 3. Check Initial Balance
echo "Checking initial balance..."
INITIAL_RES=$(curl -s -X GET "$BASE_URL/users/me" -H "Authorization: Bearer $TOKEN")
CREDITS=$(echo $INITIAL_RES | grep -o '"credits":[0-9]*' | cut -d':' -f2)
echo "Initial Credits: $CREDITS"

if [ "$CREDITS" != "0" ]; then
    echo "Error: Initial credits should be 0"
    exit 1
fi

# 4. Top Up 500 Credits
echo "Topping up 500 Credits..."
TOPUP_RES=$(curl -s -X POST "$BASE_URL/payments/topup" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"amount\": 500}")

echo "Top Up Response: $TOPUP_RES"

# 5. Verify Balance Updated
echo "Verifying new balance..."
UPDATED_RES=$(curl -s -X GET "$BASE_URL/users/me" -H "Authorization: Bearer $TOKEN")
NEW_CREDITS=$(echo $UPDATED_RES | grep -o '"credits":[0-9]*' | cut -d':' -f2)
echo "New Credits: $NEW_CREDITS"

if [ "$NEW_CREDITS" != "500" ]; then
    echo "Error: Credits should be 500"
    exit 1
fi

# 6. Check History
echo "Checking Transaction History..."
HISTORY_RES=$(curl -s -X GET "$BASE_URL/payments/history" -H "Authorization: Bearer $TOKEN")
FIRST_TX_AMOUNT=$(echo $HISTORY_RES | grep -o '"amount":500' | head -n 1)

if [ -z "$FIRST_TX_AMOUNT" ]; then
    echo "Error: Transaction history missing"
    echo $HISTORY_RES
    exit 1
fi

echo "Payment Test Passed!"
