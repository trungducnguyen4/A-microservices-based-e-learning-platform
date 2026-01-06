#!/bin/bash
set -e

echo "=============================="
echo "🚀 START DEPLOY ELEARNING"
echo "=============================="

# -------- CONFIG --------
DOCKER_USER="trungduc14"
STACK_PREFIX="elearning"

SERVICES=(
  "AdminService:admin-service"
  "ApiGateway:api-gateway"
  "AnnouncementService:announcement-service"
  "ClassroomService:classroom-service"
  "FileService:file-service"
  "HomeworkService:homework-service"
  "NotificationService:notification-service"
  "ScheduleService:schedule-service"
  "UserService:user-service"
)
# ------------------------

echo ">>> Pull latest code"
git pull

for item in "${SERVICES[@]}"; do
  DIR_NAME=$(echo $item | cut -d: -f1)
  IMAGE_NAME=$(echo $item | cut -d: -f2)

  echo "------------------------------"
  echo "📦 Build & Push: $IMAGE_NAME"
  echo "------------------------------"

  cd $DIR_NAME

  docker build -t $DOCKER_USER/$IMAGE_NAME:latest .
  docker push $DOCKER_USER/$IMAGE_NAME:latest

  cd ..

  echo "🔄 Update Swarm Service: ${STACK_PREFIX}_${IMAGE_NAME}"
  docker service update --force --image $DOCKER_USER/$IMAGE_NAME:latest ${STACK_PREFIX}_${IMAGE_NAME}

done

echo "=============================="
echo "✅ DEPLOY FINISHED SUCCESSFULLY"
echo "=============================="
