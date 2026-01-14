#!/bin/bash
set -e

STACK_NAME="elearning"
COMPOSE_FILE="docker-compose-swarm.yml"

# 1. Build & push all images (chỉnh sửa lại tag và context cho đúng nếu cần)
echo "=============================="
echo "🚀 BUILD & PUSH ALL IMAGES"
echo "=============================="

docker build -t trungduc14/api-gateway:latest ./ApiGateway && docker push trungduc14/api-gateway:latest
docker build -t trungduc14/user-service:latest ./UserService && docker push trungduc14/user-service:latest
docker build -t trungduc14/homework-service:latest ./HomeworkService1 && docker push trungduc14/homework-service:latest
docker build -t trungduc14/schedule-service:latest ./ScheduleService1 && docker push trungduc14/schedule-service:latest
docker build -t trungduc14/admin-service:latest ./AdminService && docker push trungduc14/admin-service:latest
docker build -t trungduc14/announcement-service:latest ./AnnouncementService1 && docker push trungduc14/announcement-service:latest
docker build -t trungduc14/classroom-service:latest ./ClassroomService && docker push trungduc14/classroom-service:latest
docker build -t trungduc14/file-service:latest ./FileService && docker push trungduc14/file-service:latest
docker build -t trungduc14/notification-service:latest ./NotificationService && docker push trungduc14/notification-service:latest
docker build -t trungduc14/client:latest ./client && docker push trungduc14/client:latest

echo "=============================="
echo "🧹 REMOVE OLD STACK (if exists)"
echo "=============================="
docker stack rm $STACK_NAME || true

echo "⏳ Waiting for stack to be removed..."
while docker stack ls | grep -q $STACK_NAME; do
  sleep 2
done

echo "=============================="
echo "🚀 DEPLOY NEW STACK"
echo "=============================="
docker stack deploy -c $COMPOSE_FILE $STACK_NAME

echo "=============================="
echo "✅ DEPLOY FINISHED SUCCESSFULLY"
echo "=============================="
