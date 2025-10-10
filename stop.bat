@echo off
REM E-Learning Platform Docker Stop Script for Windows

echo 🛑 Stopping E-Learning Platform...

echo [INFO] Stopping all containers...
docker-compose down

echo [INFO] Removing unused volumes (optional)...
set /p cleanup="Do you want to remove data volumes? This will delete all database data! (y/N): "
if /i "%cleanup%"=="y" (
    echo [WARNING] Removing all volumes and data...
    docker-compose down -v
    docker system prune -f
    echo [SUCCESS] All data has been removed!
) else (
    echo [INFO] Data volumes preserved.
)

echo [SUCCESS] Platform stopped successfully!
pause