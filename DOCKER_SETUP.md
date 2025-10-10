# 🚀 Running E-Learning Platform with Docker

This guide will help you run the entire microservices-based e-learning platform using Docker and Docker Compose.

## 📋 Prerequisites

Before running the platform, make sure you have the following installed:

- **Docker Desktop** (Windows/Mac) or **Docker Engine** (Linux)
- **Docker Compose** (included with Docker Desktop)
- At least **8GB RAM** available for Docker
- **10GB** free disk space

### Windows Requirements
- Windows 10 Pro/Enterprise/Education or Windows 11
- WSL2 enabled (for better performance)
- Virtualization enabled in BIOS

### Verify Installation
```bash
# Check Docker
docker --version
docker-compose --version

# Check if Docker is running
docker info
```

## 🏗️ Architecture Overview

The platform consists of the following services:

| Service | Port | Technology | Description |
|---------|------|------------|-------------|
| **Frontend** | 80 | React + Nginx | User interface |
| **🚪 API Gateway** | 8888 | Spring Cloud Gateway | **Điểm truy cập duy nhất cho tất cả API** |
| **User Service** | 8080 | Java Spring Boot | Authentication & user management |
| **Homework Service** | 8081 | Java Spring Boot | Assignment management |
| **Schedule Service** | 8082 | Java Spring Boot | Class scheduling |
| **Classroom Service** | 3000 | Node.js | Classroom management |
| **File Service** | 3001 | Node.js | File upload/download |
| **MySQL Database** | 3306 | MySQL 8.0 | Primary database |
| **Redis Cache** | 6379 | Redis 7 | Caching & sessions |

## 🚀 Quick Start

### Option 1: One-Click Start (Recommended)

**For Windows:**
```cmd
# Double-click or run in Command Prompt
start.bat
```

**For Linux/Mac:**
```bash
# Make script executable and run
chmod +x start.sh
./start.sh
```

### Option 2: Manual Start

1. **Clone and navigate to the project:**
```bash
git clone <repository-url>
cd A-microservices-based-e-learning-platform
```

2. **Start the platform:**
```bash
# Build and start all services
docker-compose up --build -d

# Monitor logs (optional)
docker-compose logs -f
```

3. **Wait for services to be ready (2-3 minutes)**

## 🔧 Configuration

### Environment Variables

The platform uses the following configuration files:

- **`.env`** - Development configuration (default)
- **`.env.production`** - Production configuration

Key settings you can modify:

```env
# Database Settings
DB_ROOT_PASSWORD=rootpassword123
DB_NAME=e_learning
DB_USER=elearning
DB_PASSWORD=elearning123

# JWT Security
JWT_SECRET=your-super-secure-jwt-secret-key

# File Upload Limits
MAX_FILE_SIZE=10485760  # 10MB in bytes
```

### Custom Configuration

1. **Copy and modify environment file:**
```bash
cp .env .env.local
# Edit .env.local with your settings
```

2. **Use custom environment:**
```bash
docker-compose --env-file .env.local up -d
```

## 🌐 Accessing the Application

Once all services are running:

### Main Application
- **Frontend:** http://localhost
- **Admin Panel:** http://localhost/admin

### API Endpoints
- **🚪 API Gateway (TẤT CẢ API):** http://localhost:8888/api
  - User API: http://localhost:8888/api/users
  - Homework API: http://localhost:8888/api/homework
  - Schedule API: http://localhost:8888/api/schedules
  - Classroom API: http://localhost:8888/api/classrooms
  - File API: http://localhost:8888/api/files

### Direct Service Access (chỉ cho debugging)
- **User Service:** http://localhost:8080/api
- **Homework Service:** http://localhost:8081/api
- **Schedule Service:** http://localhost:8082/api
- **Classroom Service:** http://localhost:3000/api
- **File Service:** http://localhost:3001/api

### Health Checks
- **User Service:** http://localhost:8080/actuator/health
- **Homework Service:** http://localhost:8081/actuator/health
- **Schedule Service:** http://localhost:8082/actuator/health

## 👥 Demo Accounts

The system comes with pre-configured demo accounts:

| Role | Username | Password | Description |
|------|----------|----------|-------------|
| **Admin** | admin | admin123 | System administrator |
| **Teacher** | teacher1 | teacher123 | Course instructor |
| **Student** | student1 | student123 | Student account |

## 📊 Monitoring & Management

### View Service Status
```bash
# Check all services
docker-compose ps

# View resource usage
docker stats

# View logs for specific service
docker-compose logs user-service
docker-compose logs homework-service
```

### Database Access
```bash
# Connect to MySQL
docker-compose exec mysql mysql -u elearning -p e_learning

# Connect to Redis
docker-compose exec redis redis-cli
```

### File Management
```bash
# View uploaded files
docker-compose exec file-service ls -la /app/uploads

# Backup database
docker-compose exec mysql mysqldump -u root -p e_learning > backup.sql
```

## 🔄 Development Workflow

### Making Code Changes

1. **For Java services:**
```bash
# Rebuild specific service
docker-compose build user-service
docker-compose up -d user-service
```

2. **For Node.js services:**
```bash
# Rebuild and restart
docker-compose build file-service
docker-compose up -d file-service
```

3. **For React frontend:**
```bash
# Rebuild frontend
docker-compose build client
docker-compose up -d client
```

### Database Migrations

```bash
# Apply new database changes
docker-compose restart mysql

# Reset database (WARNING: Data loss!)
docker-compose down -v
docker-compose up -d mysql
```

## 🛠️ Troubleshooting

### Common Issues

**1. Port conflicts:**
```bash
# Check what's using the ports
netstat -an | findstr "8080"  # Windows
lsof -i :8080                 # Linux/Mac

# Change ports in docker-compose.yml if needed
```

**2. Out of memory:**
```bash
# Increase Docker memory limit in Docker Desktop settings
# Or stop unnecessary containers
docker stop $(docker ps -q)
```

**3. Database connection issues:**
```bash
# Check MySQL logs
docker-compose logs mysql

# Restart database service
docker-compose restart mysql
```

**4. Services not starting:**
```bash
# View detailed logs
docker-compose logs -f [service-name]

# Rebuild without cache
docker-compose build --no-cache [service-name]
```

### Reset Everything

If you encounter persistent issues:

```bash
# Stop and remove everything
docker-compose down -v

# Remove all images (optional)
docker system prune -a

# Start fresh
docker-compose up --build -d
```

## 🔒 Security Considerations

### For Production Use

1. **Change default passwords:**
   - Update `.env.production` file
   - Generate strong JWT secret
   - Use secure database passwords

2. **Enable HTTPS:**
   - Configure SSL certificates in nginx.conf
   - Update docker-compose.yml for HTTPS ports

3. **Network Security:**
   - Use Docker secrets for sensitive data
   - Implement proper firewall rules
   - Regular security updates

## 📈 Performance Optimization

### Resource Allocation

Recommended minimum resources:

- **CPU:** 4 cores
- **RAM:** 8GB
- **Storage:** 20GB SSD

### Production Settings

```yaml
# In docker-compose.yml, add resource limits:
services:
  user-service:
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

## 🛑 Stopping the Platform

### Graceful Shutdown

**Windows:**
```cmd
stop.bat
```

**Linux/Mac:**
```bash
./stop.sh
```

**Manual:**
```bash
# Stop services (preserve data)
docker-compose down

# Stop and remove all data
docker-compose down -v
```

## 📞 Support

If you encounter issues:

1. Check the logs: `docker-compose logs -f`
2. Verify system requirements
3. Ensure all ports are available
4. Check Docker Desktop settings

For additional help, please refer to the project documentation or create an issue in the repository.

---

**Happy Learning! 🎓**