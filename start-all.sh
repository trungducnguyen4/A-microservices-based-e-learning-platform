#!/bin/bash

# Export biến RDS chung
export DB_HOST=elearningplatform.c6baaa4r2k3k.ap-southeast-2.rds.amazonaws.com
export DB_PORT=3306
export DB_USER=admin
export DB_PASSWORD='14072004Az!'
export SPRING_PROFILES_ACTIVE=docker
export UPLOAD_PATH=/app/uploads

echo "Starting all services..."

# Spring Boot Services
echo "Starting UserService..."
DB_NAME_USER=user_db java -jar UserService/target/UserService-0.0.1-SNAPSHOT.jar --spring.profiles.active=docker > logs/user.log 2>&1 &

echo "Starting HomeworkService..."
DB_NAME_HOMEWORK=homework_db java -jar HomeworkService/target/HomeworkService-0.0.1-SNAPSHOT.jar --spring.profiles.active=docker > logs/homework.log 2>&1 &

echo "Starting ScheduleService..."
DB_NAME_SCHEDULE=schedule_db java -jar ScheduleService/target/ScheduleService-0.0.1-SNAPSHOT.jar --spring.profiles.active=docker > logs/schedule.log 2>&1 &

echo "Starting AnnouncementService..."
java -jar AnnouncementService/target/AnnouncementService-0.0.1-SNAPSHOT.jar --spring.profiles.active=docker > logs/announcement.log 2>&1 &

echo "Starting AdminService..."
java -jar AdminService/target/AdminService-0.0.1-SNAPSHOT.jar --spring.profiles.active=docker > logs/admin.log 2>&1 &

echo "Starting ApiGateway..."
java -jar ApiGateway/target/ApiGateway-0.0.1-SNAPSHOT.jar --spring.profiles.active=docker > logs/gateway.log 2>&1 &

# Node.js Services
echo "Starting FileService..."
cd FileService
npm install > /dev/null 2>&1
npm start > ../logs/file.log 2>&1 &
cd ..

echo "Starting ClassroomService..."
cd ClassroomService
npm install > /dev/null 2>&1
npm start > ../logs/classroom.log 2>&1 &
cd ..

# Frontend
echo "Starting Frontend..."
cd client
npm install > /dev/null 2>&1
npm run dev -- --host 0.0.0.0 --port 5173 > ../logs/frontend.log 2>&1 &
cd ..

echo "All services started!"
echo "View logs in logs/ directory"
echo "APIs: http://localhost:8888"
echo "Frontend: http://localhost:8083"
