#!/bin/bash
# Test login after fixing AccountAction model

echo "Testing login endpoint..."
echo "=========================="

# Test 1: Student login
echo -e "\n1. Testing student login..."
RESPONSE=$(curl -s -X POST "http://localhost:8000/api/v1/auth/login/access-token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=student_1769773252@example.com&password=test123")

if echo "$RESPONSE" | grep -q "access_token"; then
    echo "✅ Student login SUCCESS!"
    echo "$RESPONSE" | python3 -m json.tool | head -10
else
    echo "❌ Student login FAILED!"
    echo "Response: $RESPONSE"
fi

# Test 2: Expert login
echo -e "\n2. Testing expert login..."
RESPONSE=$(curl -s -X POST "http://localhost:8000/api/v1/auth/login/access-token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=expert_1769773252@example.com&password=test123")

if echo "$RESPONSE" | grep -q "access_token"; then
    echo "✅ Expert login SUCCESS!"
else
    echo "❌ Expert login FAILED!"
    echo "Response: $RESPONSE"
fi

# Test 3: Wrong password
echo -e "\n3. Testing wrong password (should fail)..."
RESPONSE=$(curl -s -X POST "http://localhost:8000/api/v1/auth/login/access-token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=student_1769773252@example.com&password=wrongpassword")

if echo "$RESPONSE" | grep -q "Incorrect"; then
    echo "✅ Wrong password correctly rejected!"
else
    echo "❌ Unexpected response for wrong password"
    echo "Response: $RESPONSE"
fi

echo -e "\n=========================="
echo "Test complete!"
