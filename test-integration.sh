#!/bin/bash

# Test UserService Integration Script

echo "=================================="
echo "Testing UserService Integration"
echo "=================================="
echo ""

# Configuration
API_GATEWAY="http://localhost:8888"
USER_SERVICE="http://localhost:8080"
CLASSROOM_SERVICE="http://localhost:4000"

echo "Step 1: Health Checks"
echo "---------------------"

# Check UserService
echo -n "UserService: "
curl -s "${USER_SERVICE}/actuator/health" > /dev/null && echo "✓ Running" || echo "✗ Not running"

# Check ClassroomService
echo -n "ClassroomService: "
curl -s "${CLASSROOM_SERVICE}/health" > /dev/null && echo "✓ Running" || echo "✗ Not running"

echo ""
echo "Step 2: Test Public User Endpoint"
echo "----------------------------------"

# Test with a known user ID (replace with actual ID from your DB)
USER_ID="test-user-id"

echo "GET ${USER_SERVICE}/api/users/public/${USER_ID}"
curl -s "${USER_SERVICE}/api/users/public/${USER_ID}" | jq '.'

echo ""
echo "Step 3: Test ClassroomService with userId"
echo "-----------------------------------------"

echo "GET ${CLASSROOM_SERVICE}/getToken?room=testroom&user=testuser&userId=${USER_ID}"
curl -s "${CLASSROOM_SERVICE}/getToken?room=testroom&user=testuser&role=student&userId=${USER_ID}" | jq '{
  displayName: .displayName,
  email: .email,
  role: .role,
  userInfo: .userInfo
}'

echo ""
echo "Step 4: Login and Test Meeting Join"
echo "-----------------------------------"

echo "POST ${API_GATEWAY}/api/users/auth/login"
echo "Body: { username: 'teacher@test.com', password: 'password123' }"

# Store login response
LOGIN_RESPONSE=$(curl -s -X POST "${API_GATEWAY}/api/users/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "teacher@test.com",
    "password": "password123"
  }')

echo "$LOGIN_RESPONSE" | jq '.'

# Extract JWT token
JWT_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.result.token')

if [ "$JWT_TOKEN" != "null" ] && [ -n "$JWT_TOKEN" ]; then
  echo ""
  echo "✓ Login successful"
  echo "Token: ${JWT_TOKEN:0:20}..."
  
  echo ""
  echo "Step 5: Create Meeting"
  echo "---------------------"
  
  CREATE_MEETING_RESPONSE=$(curl -s -X POST "${API_GATEWAY}/api/meetings" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${JWT_TOKEN}" \
    -d '{
      "title": "Integration Test Meeting",
      "description": "Testing UserService integration"
    }')
  
  echo "$CREATE_MEETING_RESPONSE" | jq '.'
  
  ROOM_CODE=$(echo "$CREATE_MEETING_RESPONSE" | jq -r '.result.roomCode')
  
  if [ "$ROOM_CODE" != "null" ] && [ -n "$ROOM_CODE" ]; then
    echo ""
    echo "✓ Meeting created with code: ${ROOM_CODE}"
    
    echo ""
    echo "Step 6: Join Meeting"
    echo "-------------------"
    
    JOIN_RESPONSE=$(curl -s -X POST "${API_GATEWAY}/api/meetings/${ROOM_CODE}/join" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer ${JWT_TOKEN}" \
      -d '{
        "displayName": "Test User",
        "requestedRole": "STUDENT"
      }')
    
    echo "$JOIN_RESPONSE" | jq '{
      displayName: .result.displayName,
      email: .result.email,
      role: .result.role,
      isHost: .result.isHost,
      roomCode: .result.roomCode
    }'
    
    echo ""
    echo "✓ Integration test complete!"
    echo ""
    echo "Expected behavior:"
    echo "- displayName should show real name from UserService"
    echo "- email should be populated from user profile"
    echo "- role should be auto-determined (TEACHER for teacher accounts)"
    
  else
    echo "✗ Failed to create meeting"
  fi
else
  echo "✗ Login failed"
fi

echo ""
echo "=================================="
echo "Test Complete"
echo "=================================="
