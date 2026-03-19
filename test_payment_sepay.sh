#!/bin/bash

BASE_URL="http://localhost:8000/api/v1"
EMAIL="student_payment_test@example.com"
PASSWORD="password123"

# 1. Register/Login User
echo "1. Authenticating..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\", \"full_name\": \"Payment Tester\", \"role\": \"STUDENT\"}")

TOKEN=$(curl -s -X POST "$BASE_URL/auth/login/access-token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$EMAIL&password=$PASSWORD" | jq -r '.access_token')

if [ "$TOKEN" == "null" ]; then
  echo "Login failed. Trying login directly if user exists..."
  TOKEN=$(curl -s -X POST "$BASE_URL/auth/login/access-token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$EMAIL&password=$PASSWORD" | jq -r '.access_token')
fi

echo "Token: $TOKEN"

# 2. Get Initial Balance
INITIAL_CREDITS=$(curl -s -X GET "$BASE_URL/users/me" -H "Authorization: Bearer $TOKEN" | jq '.credits')
echo "Initial Credits: $INITIAL_CREDITS"

# 3. Request Top Up (10 Credits = 10,000 VND)
echo "--------------------------------"
echo "2. Requesting Top Up (10 Credits)..."
TOPUP_RESPONSE=$(curl -s -X POST "$BASE_URL/payments/topup" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 10}')

echo "Response: $TOPUP_RESPONSE"
TRANS_ID=$(echo $TOPUP_RESPONSE | jq -r '.transaction_id')
CONTENT=$(echo $TOPUP_RESPONSE | jq -r '.content')
QR_URL=$(echo $TOPUP_RESPONSE | jq -r '.qr_url')

echo "Transaction ID: $TRANS_ID"
echo "Transfer Content: $CONTENT"
echo "QR URL: $QR_URL"

# 4. Simulate Webhook
echo "--------------------------------"
echo "3. Simulating SePay Webhook..."
# SePay payload structure (simplified based on Service assumption)
# content must match exactly or contain the ID
WEBHOOK_PAYLOAD=$(cat <<EOF
{
  "id": 99999,
  "gateway": "MB",
  "transactionDate": "2024-01-01 12:00:00",
  "accountNumber": "placeholder_account",
  "subAccount": null,
  "amount": 10000, 
  "content": "$CONTENT",
  "transferType": "in",
  "transferAmount": 10000
}
EOF
)

WEBHOOK_RESPONSE=$(curl -s -X POST "$BASE_URL/payments/webhook/sepay" \
  -H "Content-Type: application/json" \
  -d "$WEBHOOK_PAYLOAD")

echo "Webhook Response: $WEBHOOK_RESPONSE"

# 5. Verify Transaction Status
echo "--------------------------------"
echo "4. Verifying Transaction Status..."
STATUS_RESPONSE=$(curl -s -X GET "$BASE_URL/payments/$TRANS_ID" \
  -H "Authorization: Bearer $TOKEN")
STATUS=$(echo $STATUS_RESPONSE | jq -r '.status')
echo "Transaction Status: $STATUS"

# 6. Verify Final Balance
echo "--------------------------------"
echo "5. Verifying Final Balance..."
FINAL_CREDITS=$(curl -s -X GET "$BASE_URL/users/me" -H "Authorization: Bearer $TOKEN" | jq '.credits')
echo "Final Credits: $FINAL_CREDITS"

EXPECTED_CREDITS=$((INITIAL_CREDITS + 10))

if [ "$FINAL_CREDITS" -eq "$EXPECTED_CREDITS" ]; then
    echo "SUCCESS: Credits updated correctly."
else
    echo "FAILURE: Credits mismatch. Expected $EXPECTED_CREDITS, got $FINAL_CREDITS"
    exit 1
fi
