#!/bin/bash

# E-Learning Platform Docker Stop Script

echo "🛑 Stopping E-Learning Platform..."

echo "[INFO] Stopping all containers..."
docker-compose down

echo "[INFO] Removing unused volumes (optional)..."
read -p "Do you want to remove data volumes? This will delete all database data! (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "[WARNING] Removing all volumes and data..."
    docker-compose down -v
    docker system prune -f
    echo "[SUCCESS] All data has been removed!"
else
    echo "[INFO] Data volumes preserved."
fi

echo "[SUCCESS] Platform stopped successfully!"