# 🎓 E-Learning Platform - Microservices Architecture

## 📋 Tổng Quan Dự Án

Hệ thống E-Learning được xây dựng theo kiến trúc microservices với các công nghệ hiện đại:

- **🚪 API Gateway**: Spring Cloud Gateway (Port: 8888)
- **👤 User Service**: Java Spring Boot (Port: 8080)  
- **📝 Homework Service**: Java Spring Boot (Port: 8081)
- **📅 Schedule Service**: Java Spring Boot (Port: 8082)
- **🏫 Classroom Service**: Node.js (Port: 3000)
- **📁 File Service**: Node.js (Port: 3001)
- **🖥️ Frontend**: React + TypeScript (Port: 80)
- **🗄️ Database**: MySQL 8.0 (Port: 3306)
- **⚡ Cache**: Redis 7 (Port: 6379)

## 🚀 Quick Start

### 1. Khởi động với Docker (Khuyến nghị):
```cmd
cd "d:\phat\A-microservices-based-e-learning-platform"
docker-compose up --build -d
```

### 2. Truy cập ứng dụng:
- **🌐 Frontend**: http://localhost
- **🚪 API Gateway**: http://localhost:8888
- **📡 All APIs**: http://localhost:8888/api/...

### 3. Demo Accounts:
| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Teacher | teacher1 | teacher123 |
| Student | student1 | student123 |

## 📚 Tài Liệu Chi Tiết

### 📖 Documentation Files:
- **[PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)** - Tổng quan toàn bộ dự án
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Chi tiết tất cả API endpoints  
- **[DOCKER_SETUP.md](./DOCKER_SETUP.md)** - Hướng dẫn chạy với Docker

### 🔗 API Endpoints Summary:
```http
# Authentication
POST   /api/users/login                 # Đăng nhập
POST   /api/users/register              # Đăng ký

# User Management  
GET    /api/users/profile               # Profile người dùng
PUT    /api/users/profile               # Cập nhật profile

# Homework Management
POST   /api/homework                    # Tạo bài tập (Teacher)
GET    /api/homework                    # Danh sách bài tập
POST   /api/homework/{id}/submit        # Nộp bài (Student)
PUT    /api/homework/submissions/{id}/grade # Chấm điểm (Teacher)

# Schedule Management
POST   /api/schedules                   # Tạo lịch học (Teacher)
GET    /api/schedules/my-schedule       # Lịch học của tôi

# Classroom Management
POST   /api/classrooms                  # Tạo lớp học (Teacher)
POST   /api/classrooms/{id}/join        # Tham gia lớp (Student)

# File Management
POST   /api/files/upload                # Upload file
GET    /api/files/{id}                  # Download file
```

## 🏗️ Kiến Trúc Hệ Thống

```
🌐 Client (React) → 🚪 API Gateway → 🔀 Microservices
                                    ├── 👤 User Service
                                    ├── 📝 Homework Service  
                                    ├── 📅 Schedule Service
                                    ├── 🏫 Classroom Service
                                    └── 📁 File Service
                                         ↓
                              🗄️ MySQL + ⚡ Redis
```

## 🔧 Công Nghệ Sử Dụng

### Backend:
- **Java 17** + Spring Boot 3.2
- **Node.js 20** + Express
- **Spring Security** + JWT Authentication
- **Spring Cloud Gateway** + Rate Limiting
- **MySQL 8.0** + JPA/Hibernate
- **Redis 7** + Caching
- **MapStruct** + Lombok

### Frontend:
- **React 18** + TypeScript
- **Vite** + Tailwind CSS
- **React Router** + Context API
- **Axios** + React Query
- **shadcn/ui** components

### DevOps:
- **Docker** + Docker Compose
- **GitHub Actions** CI/CD
- **Nginx** reverse proxy
- **Multi-stage builds**

## 📊 Database Schema

### Core Tables:
- **users** - Quản lý người dùng (Student/Teacher/Admin)
- **courses** - Khóa học
- **homework** - Bài tập
- **homework_questions** - Câu hỏi bài tập
- **homework_submissions** - Bài nộp của học sinh
- **schedules** - Lịch học
- **file_uploads** - Quản lý file

## 🔒 Security Features

- **JWT Authentication** với refresh token
- **Role-based Access Control** (RBAC)
- **API Rate Limiting** (10 req/sec)
- **CORS Configuration**
- **Input Validation** và sanitization
- **File Upload Security** (type, size limits)

## 🧪 Testing & Development

### Chạy Tests:
```cmd
# Java Services
./mvnw test

# Node.js Services  
npm test

# Frontend
npm run test
```

### Development Mode:
```cmd
# Start services individually
docker-compose up mysql redis -d
# Then run each service in IDE/terminal
```

## 📈 Monitoring & Observability

- **Spring Boot Actuator** cho health checks
- **Centralized Logging** qua API Gateway
- **Request/Response Tracking** với correlation ID
- **Performance Metrics** và monitoring

## 🔄 CI/CD Pipeline

- **GitHub Actions** workflows
- **Automated Testing** (Unit, Integration, E2E)
- **Security Scanning** (OWASP, dependency check)
- **Docker Image Building** + Registry push
- **Multi-environment Deployment**

## 🚦 Status & Health Checks

### Check Service Health:
```cmd
# Overall system status
docker-compose ps

# Individual service health
curl http://localhost:8888/actuator/health  # API Gateway
curl http://localhost:8080/actuator/health  # User Service
curl http://localhost:8081/actuator/health  # Homework Service
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Documentation**: Xem các file .md trong thư mục gốc
- **Issues**: Tạo issue trên GitHub repository
- **Email**: your-email@example.com

---

**🎯 Happy Learning! Chúc bạn học tập hiệu quả với hệ thống E-Learning này!** 🚀