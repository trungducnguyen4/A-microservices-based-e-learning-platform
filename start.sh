#!/bin/bash

# E-Learning Platform Docker Startup Script
# This script builds and starts the entire platform

set -e

echo "🚀 Starting E-Learning Platform with Docker..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose > /dev/null 2>&1; then
    print_error "Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

print_status "Stopping any existing containers..."
docker-compose down --remove-orphans

print_status "Building Docker images..."
docker-compose build --no-cache

print_status "Starting services..."
docker-compose up -d

print_status "Waiting for services to be ready..."
sleep 30

# Check service health
print_status "Checking service health..."

services=(
    "mysql:3306"
    "redis:6379"
    "user-service:8080"
    "homework-service:8081"
    "schedule-service:8082"
    "classroom-service:3000"
    "file-service:3001"
    "client:80"
)

all_healthy=true

for service in "${services[@]}"; do
    IFS=':' read -r name port <<< "$service"
    if nc -z localhost "$port" 2>/dev/null; then
        print_success "$name is running on port $port"
    else
        print_warning "$name is not responding on port $port"
        all_healthy=false
    fi
done

if [ "$all_healthy" = true ]; then
    print_success "All services are running!"
    echo ""
    echo "🌐 Application URLs:"
    echo "   Frontend: http://localhost"
    echo "   User Service: http://localhost:8080"
    echo "   Homework Service: http://localhost:8081"
    echo "   Schedule Service: http://localhost:8082"
    echo "   Classroom Service: http://localhost:3000"
    echo "   File Service: http://localhost:3001"
    echo ""
    echo "📊 Monitoring:"
    echo "   Logs: docker-compose logs -f"
    echo "   Status: docker-compose ps"
    echo ""
    echo "🔑 Demo Accounts:"
    echo "   Admin: admin / admin123"
    echo "   Teacher: teacher1 / teacher123"
    echo "   Student: student1 / student123"
else
    print_warning "Some services are not ready yet. Please check logs:"
    echo "   docker-compose logs"
fi

print_status "Startup complete!"