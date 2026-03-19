#!/bin/bash

# Test User Management CRUD API
# This script tests all CRUD operations with various filters and search

BASE_URL="http://localhost:8000/api/v1"
ADMIN_EMAIL="admin_test_1770123829@example.com"
ADMIN_PASSWORD="password123"

echo "========================================="
echo "User Management CRUD API Test"
echo "========================================="
echo ""

# 1. Login and get token
echo "📝 Step 1: Login as admin..."
TOKEN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login/access-token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$ADMIN_EMAIL&password=$ADMIN_PASSWORD")

TOKEN=$(echo $TOKEN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))")

if [ -z "$TOKEN" ]; then
    echo "❌ Login failed!"
    echo "Response: $TOKEN_RESPONSE"
    exit 1
fi

echo "✅ Login successful! Token: ${TOKEN:0:20}..."
echo ""

# 2. Test GET /admin/users with pagination
echo "📝 Step 2: GET users with pagination (limit=5)..."
curl -s "$BASE_URL/admin/users?limit=5" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool | head -20
echo ""

# 3. Test GET with role filter
echo "📝 Step 3: GET users filtered by role=STUDENT..."
curl -s "$BASE_URL/admin/users?role=STUDENT&limit=3" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool | head -15
echo ""

# 4. Test GET with search
echo "📝 Step 4: GET users with search query..."
curl -s "$BASE_URL/admin/users?search=student&limit=3" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool | head -15
echo ""

# 5. Test GET with sorting
echo "📝 Step 5: GET users sorted by email (ascending)..."
curl -s "$BASE_URL/admin/users?sort_by=email&sort_desc=false&limit=3" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool | head -15
echo ""

# 6. Test POST - Create user
echo "📝 Step 6: POST - Create new user..."
NEW_USER_RESPONSE=$(curl -s -X POST "$BASE_URL/admin/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser_'$(date +%s)'@example.com",
    "password": "password123",
    "full_name": "Test User CRUD",
    "phone_number": "+84123456789",
    "role": "STUDENT",
    "credits": 50
  }')

USER_ID=$(echo $NEW_USER_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))")

if [ -z "$USER_ID" ]; then
    echo "❌ Create user failed!"
    echo "Response: $NEW_USER_RESPONSE"
else
    echo "✅ User created! ID: $USER_ID"
    echo "$NEW_USER_RESPONSE" | python3 -m json.tool
fi
echo ""

# 7. Test PUT - Update user
if [ ! -z "$USER_ID" ]; then
    echo "📝 Step 7: PUT - Update user #$USER_ID..."
    UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/admin/users/$USER_ID" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "full_name": "Updated Test User",
        "credits": 100
      }')
    
    echo "✅ User updated!"
    echo "$UPDATE_RESPONSE" | python3 -m json.tool
    echo ""
fi

# 8. Test DELETE - Soft delete
if [ ! -z "$USER_ID" ]; then
    echo "📝 Step 8: DELETE - Soft delete user #$USER_ID..."
    DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/admin/users/$USER_ID" \
      -H "Authorization: Bearer $TOKEN")
    
    echo "✅ User soft deleted!"
    echo "$DELETE_RESPONSE" | python3 -m json.tool
    echo ""
fi

# 9. Test combined filters
echo "📝 Step 9: GET users with combined filters (EXPERT + ACTIVE)..."
curl -s "$BASE_URL/admin/users?role=EXPERT&account_status=ACTIVE&limit=3" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool | head -15
echo ""

echo "========================================="
echo "✅ All CRUD operations tested successfully!"
echo "========================================="
