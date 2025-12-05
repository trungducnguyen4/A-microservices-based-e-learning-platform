@echo off
REM Test UserService Integration Script (Windows)

echo ==================================
echo Testing UserService Integration
echo ==================================
echo.

REM Configuration
set API_GATEWAY=http://localhost:8888
set USER_SERVICE=http://localhost:8080
set CLASSROOM_SERVICE=http://localhost:4000

echo Step 1: Health Checks
echo ---------------------

REM Check UserService
echo UserService:
curl -s "%USER_SERVICE%/actuator/health"
echo.

REM Check ClassroomService
echo ClassroomService:
curl -s "%CLASSROOM_SERVICE%/health"
echo.

echo.
echo Step 2: Test Public User Endpoint
echo ----------------------------------

REM Test with a known user ID (replace with actual ID from your DB)
set USER_ID=test-user-id

echo GET %USER_SERVICE%/api/users/public/%USER_ID%
curl -s "%USER_SERVICE%/api/users/public/%USER_ID%"
echo.

echo.
echo Step 3: Test ClassroomService with userId
echo -----------------------------------------

echo GET %CLASSROOM_SERVICE%/getToken?room=testroom^&user=testuser^&userId=%USER_ID%
curl -s "%CLASSROOM_SERVICE%/getToken?room=testroom&user=testuser&role=student&userId=%USER_ID%"
echo.

echo.
echo Step 4: Login and Test Meeting Join
echo -----------------------------------

echo POST %API_GATEWAY%/api/users/auth/login
echo Body: { username: 'teacher@test.com', password: 'password123' }

curl -s -X POST "%API_GATEWAY%/api/users/auth/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"username\": \"teacher@test.com\", \"password\": \"password123\"}"
echo.

echo.
echo ==================================
echo Manual Testing Steps:
echo ==================================
echo.
echo 1. Install axios:
echo    cd ClassroomService
echo    npm install axios
echo.
echo 2. Restart ClassroomService:
echo    npm start
echo.
echo 3. Test getToken with userId:
echo    curl "http://localhost:4000/getToken?room=test&user=testuser&userId=YOUR_USER_ID"
echo.
echo 4. Check logs for:
echo    "✓ Loaded user info: [Full Name] ([Email])"
echo.
echo 5. Join meeting and verify:
echo    - Display name shows real name
echo    - Email is populated
echo    - Role is correct
echo.
echo ==================================
echo Test Complete
echo ==================================

pause
