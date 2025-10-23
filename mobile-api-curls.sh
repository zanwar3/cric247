#!/bin/bash

# ============================================
# CRIC247 MOBILE API - CURL TEST COMMANDS
# Live Server: https://cric247-pi.vercel.app
# ============================================

BASE_URL="https://cric247-pi.vercel.app"

echo "=========================================="
echo "1. REGISTER A NEW USER"
echo "=========================================="
curl -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mobile Test User",
    "email": "mobiletest@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }' | jq .

echo -e "\n\n=========================================="
echo "2. MOBILE LOGIN (Get JWT Token)"
echo "=========================================="
RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/mobile/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mobiletest@example.com",
    "password": "password123"
  }')

echo $RESPONSE | jq .

# Extract token from response
TOKEN=$(echo $RESPONSE | jq -r '.token // empty')

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed or token not found"
  exit 1
fi

echo -e "\n✅ Token obtained: ${TOKEN:0:50}..."

echo -e "\n\n=========================================="
echo "3. GET ALL MATCHES"
echo "=========================================="
curl -s -X GET $BASE_URL/api/matches \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq .

echo -e "\n\n=========================================="
echo "4. REFRESH TOKEN"
echo "=========================================="
REFRESH_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/mobile/refresh \
  -H "Authorization: Bearer $TOKEN")

echo $REFRESH_RESPONSE | jq .

# Update token if refresh was successful
NEW_TOKEN=$(echo $REFRESH_RESPONSE | jq -r '.token // empty')
if [ ! -z "$NEW_TOKEN" ]; then
  TOKEN=$NEW_TOKEN
  echo -e "\n✅ Token refreshed: ${TOKEN:0:50}..."
fi

echo -e "\n\n=========================================="
echo "5. GET ALL TEAMS"
echo "=========================================="
curl -s -X GET $BASE_URL/api/teams \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq .

echo -e "\n\n=========================================="
echo "6. GET ALL PROFILES"
echo "=========================================="
curl -s -X GET $BASE_URL/api/profiles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq .

echo -e "\n\n=========================================="
echo "7. GET ALL TOURNAMENTS"
echo "=========================================="
curl -s -X GET $BASE_URL/api/tournaments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq .

echo -e "\n\n=========================================="
echo "8. CREATE A TEAM"
echo "=========================================="
curl -s -X POST $BASE_URL/api/teams \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mobile Test Team",
    "slug": "mobile-test-team",
    "city": "Test City",
    "captain": null,
    "coach": "Test Coach",
    "description": "Created via mobile API"
  }' | jq .

echo -e "\n\n=========================================="
echo "✅ All tests completed!"
echo "=========================================="

