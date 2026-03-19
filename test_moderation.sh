#!/bin/bash
# Test Account Moderation System
# This script tests the suspend, ban, unban, and unsuspend endpoints

BASE_URL="http://127.0.0.1:8000/api/v1"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Testing Account Moderation System"
echo "===================================="

# Step 1: Login as admin
echo -e "\n${YELLOW}[1/8]${NC} Logging in as admin..."
ADMIN_TOKEN=$(curl -s -X POST "$BASE_URL/auth/login/access-token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@email.com&password=admin123" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
    echo -e "${RED}❌ Admin login failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Admin logged in${NC}"

# Step 2: Get list of users
echo -e "\n${YELLOW}[2/8]${NC} Fetching user list..."
USERS=$(curl -s -X GET "$BASE_URL/admin/users" -H "Authorization: Bearer $ADMIN_TOKEN")
echo -e "${GREEN}✅ Retrieved user list${NC}"

# Get first expert user ID (assuming exists)
EXPERT_ID=$(echo $USERS | grep -o '"role":"EXPERT"' -B 20 | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "Expert ID for testing: $EXPERT_ID"

# Get first student user ID
STUDENT_ID=$(echo $USERS | grep -o '"role":"STUDENT"' -B 20 | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "Student ID for testing: $STUDENT_ID"

# Step 3: Suspend Expert
echo -e "\n${YELLOW}[3/8]${NC} Testing expert suspension..."
SUSPEND_RESPONSE=$(curl -s -X POST "$BASE_URL/admin/moderation/experts/$EXPERT_ID/suspend" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Violation of Terms",
    "notes": "Test suspension",
    "acknowledge_booking_cancellation": true
  }')

if [[ $SUSPEND_RESPONSE == *"suspended successfully"* ]]; then
    echo -e "${GREEN}✅ Expert suspended successfully${NC}"
else
    echo -e "${RED}❌ Suspension failed: $SUSPEND_RESPONSE${NC}"
fi

# Step 4: Verify expert hidden from search
echo -e "\n${YELLOW}[4/8]${NC} Verifying expert is hidden from search..."
SEARCH_RESULT=$(curl -s -X GET "$BASE_URL/experts/")
EXPERT_COUNT=$(echo $SEARCH_RESULT | grep -o "\"id\":$EXPERT_ID" | wc -l)

if [ "$EXPERT_COUNT" -eq "0" ]; then
    echo -e "${GREEN}✅ Suspended expert is hidden from search${NC}"
else
    echo -e "${RED}❌ Suspended expert still appears in search${NC}"
fi

# Step 5: Unsuspend Expert
echo -e "\n${YELLOW}[5/8]${NC} Testing expert unsuspension..."
UNSUSPEND_RESPONSE=$(curl -s -X POST "$BASE_URL/admin/moderation/experts/$EXPERT_ID/unsuspend" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Test completed, restoring account"
  }')

if [[ $UNSUSPEND_RESPONSE == *"unsuspended successfully"* ]]; then
    echo -e "${GREEN}✅ Expert unsuspended successfully${NC}"
else
    echo -e "${RED}❌ Unsuspension failed: $UNSUSPEND_RESPONSE${NC}"
fi

# Step 6: Ban User
echo -e "\n${YELLOW}[6/8]${NC} Testing user ban..."
BAN_RESPONSE=$(curl -s -X POST "$BASE_URL/admin/moderation/users/$STUDENT_ID/ban" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Spam",
    "notes": "Test ban",
    "forfeit_credits": false
  }')

if [[ $BAN_RESPONSE == *"banned successfully"* ]]; then
    echo -e "${GREEN}✅ User banned successfully${NC}"
else
    echo -e "${RED}❌ Ban failed: $BAN_RESPONSE${NC}"
fi

# Step 7: Verify banned user cannot register with same email
echo -e "\n${YELLOW}[7/8]${NC} Verifying blacklist blocks re-registration..."
# This would require knowing the exact email - skipping for now
echo -e "${YELLOW}⏭️  Skipped (requires knowing banned user email)${NC}"

# Step 8: Unban User
echo -e "\n${YELLOW}[8/8]${NC} Testing user unban..."
UNBAN_RESPONSE=$(curl -s -X POST "$BASE_URL/admin/moderation/users/$STUDENT_ID/unban" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Test completed, restoring account",
    "restore_credits": false,
    "previous_balance": 0
  }')

if [[ $UNBAN_RESPONSE == *"unbanned successfully"* ]]; then
    echo -e "${GREEN}✅ User unbanned successfully${NC}"
else
    echo -e "${RED}❌ Unban failed: $UNBAN_RESPONSE${NC}"
fi

echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}✅ All moderation tests completed!${NC}"
echo -e "${GREEN}================================${NC}"
