@echo off
REM E-Learning Platform Docker Startup Script for Windows
REM This script builds and starts the entire platform

echo 🚀 Starting E-Learning Platform with Docker...

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running. Please start Docker and try again.
    pause
    exit /b 1
)

REM Check if Docker Compose is available
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose is not installed. Please install Docker Compose and try again.
    pause
    exit /b 1
)

echo [INFO] Stopping any existing containers...
docker-compose down --remove-orphans

echo [INFO] Building Docker images...
docker-compose build --no-cache

echo [INFO] Starting services...
docker-compose up -d

echo [INFO] Waiting for services to be ready...
timeout /t 30 /nobreak >nul

echo [INFO] Checking service health...

REM Check if services are responding
echo [INFO] Checking MySQL...
netstat -an | find "3306" >nul && echo [SUCCESS] MySQL is running on port 3306 || echo [WARNING] MySQL is not responding on port 3306

echo [INFO] Checking Redis...
netstat -an | find "6379" >nul && echo [SUCCESS] Redis is running on port 6379 || echo [WARNING] Redis is not responding on port 6379

echo [INFO] Checking User Service...
netstat -an | find "8080" >nul && echo [SUCCESS] User Service is running on port 8080 || echo [WARNING] User Service is not responding on port 8080

echo [INFO] Checking Homework Service...
netstat -an | find "8081" >nul && echo [SUCCESS] Homework Service is running on port 8081 || echo [WARNING] Homework Service is not responding on port 8081

echo [INFO] Checking Schedule Service...
netstat -an | find "8082" >nul && echo [SUCCESS] Schedule Service is running on port 8082 || echo [WARNING] Schedule Service is not responding on port 8082

echo [INFO] Checking Classroom Service...
netstat -an | find "3000" >nul && echo [SUCCESS] Classroom Service is running on port 3000 || echo [WARNING] Classroom Service is not responding on port 3000

echo [INFO] Checking File Service...
netstat -an | find "3001" >nul && echo [SUCCESS] File Service is running on port 3001 || echo [WARNING] File Service is not responding on port 3001

echo [INFO] Checking Frontend...
netstat -an | find ":80 " >nul && echo [SUCCESS] Frontend is running on port 80 || echo [WARNING] Frontend is not responding on port 80

echo.
echo ✅ Services are starting up!
echo.
echo 🌐 Application URLs:
echo    Frontend: http://localhost
echo    User Service: http://localhost:8080
echo    Homework Service: http://localhost:8081
echo    Schedule Service: http://localhost:8082
echo    Classroom Service: http://localhost:3000
echo    File Service: http://localhost:3001
echo.
echo 📊 Monitoring:
echo    Logs: docker-compose logs -f
echo    Status: docker-compose ps
echo.
echo 🔑 Demo Accounts:
echo    Admin: admin / admin123
echo    Teacher: teacher1 / teacher123
echo    Student: student1 / student123
echo.
echo [SUCCESS] Startup complete!
echo.
pause