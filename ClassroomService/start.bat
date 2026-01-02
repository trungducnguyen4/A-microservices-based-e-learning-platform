@echo off
echo ========================================
echo   ClassroomService - Quick Start
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Checking dependencies...
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
) else (
    echo Dependencies OK
)

echo.
echo [2/3] Checking .env file...
if not exist ".env" (
    echo ERROR: .env file not found!
    echo Please create .env file (copy from .env.example) with LiveKit + MySQL credentials
    pause
    exit /b 1
) else (
    echo .env file found
)

echo.
echo [3/3] Starting server...
echo.
echo ======================================
echo   Server will start on port PORT env (default 3000)
echo   Press Ctrl+C to stop
echo ======================================
echo.

node server.js

pause
