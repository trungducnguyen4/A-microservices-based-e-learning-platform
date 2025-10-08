@echo off
echo Starting FileService for E-Learning Platform...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if we're in the right directory
if not exist package.json (
    echo ERROR: package.json not found
    echo Please run this script from the FileService directory
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist node_modules (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo.
)

REM Create uploads directory if it doesn't exist
if not exist uploads (
    echo Creating uploads directory...
    mkdir uploads
    mkdir uploads\assignments
    mkdir uploads\course-materials
    mkdir uploads\profile-images
    mkdir uploads\videos
    mkdir uploads\documents
    mkdir uploads\thumbnails
    mkdir uploads\temp
    echo Uploads directory structure created.
    echo.
)

echo Starting FileService server...
echo Server will be available at: http://localhost:5000
echo Test interface available at: http://localhost:5000/test
echo Health check: http://localhost:5000/health
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the server
npm start