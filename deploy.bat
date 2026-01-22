@echo off
setlocal enabledelayedexpansion
REM ==============================
REM 🚀 BUILD & PUSH ALL IMAGES
REM ==============================

echo Building and pushing images...
docker build -t trungduc14/api-gateway:latest ./ApiGateway && docker push trungduc14/api-gateway:latest
if errorlevel 1 exit /b 1
docker build -t trungduc14/user-service:latest ./UserService && docker push trungduc14/user-service:latest
if errorlevel 1 exit /b 1
docker build -t trungduc14/homework-service:latest ./HomeworkService1 && docker push trungduc14/homework-service:latest
if errorlevel 1 exit /b 1
docker build -t trungduc14/schedule-service:latest ./ScheduleService1 && docker push trungduc14/schedule-service:latest
if errorlevel 1 exit /b 1
docker build -t trungduc14/admin-service:latest ./AdminService && docker push trungduc14/admin-service:latest
if errorlevel 1 exit /b 1
docker build -t trungduc14/announcement-service:latest ./AnnouncementService1 && docker push trungduc14/announcement-service:latest
if errorlevel 1 exit /b 1
docker build -t trungduc14/classroom-service:latest ./ClassroomService && docker push trungduc14/classroom-service:latest
if errorlevel 1 exit /b 1
docker build -t trungduc14/file-service:latest ./FileService && docker push trungduc14/file-service:latest
if errorlevel 1 exit /b 1
docker build -t trungduc14/notification-service:latest ./NotificationService && docker push trungduc14/notification-service:latest
if errorlevel 1 exit /b 1
docker build -t trungduc14/client:latest ./client && docker push trungduc14/client:latest
if errorlevel 1 exit /b 1

echo ==============================
echo 🧹 REMOVE OLD STACK (if exists)
echo ==============================
docker stack rm elearning

echo Waiting for stack to be removed...
timeout /t 10 >nul

echo ==============================
echo 🚀 DEPLOY NEW STACK
echo ==============================
docker stack deploy -c docker-compose-swarm.yml elearning

echo ==============================
echo ✅ DEPLOY FINISHED SUCCESSFULLY
echo ==============================
pause
