# 📋 E-Learning Platform - Tổng Quan Dự Án

## 🏗️ Cấu Trúc Thư Mục Tổng Quan

```
📂 A-microservices-based-e-learning-platform/
├── 🚪 ApiGateway/                    # API Gateway - Điểm truy cập duy nhất
├── 👤 UserService/                   # Quản lý người dùng & Authentication
├── 📝 HomeworkService/               # Quản lý bài tập
├── 📅 ScheduleService/               # Quản lý lịch học
├── 🏫 ClassroomService/              # Quản lý lớp học
├── 📁 FileService/                   # Quản lý file upload/download
├── 🖥️ client/                       # Frontend React Application
├── 🐳 docker/                       # Docker configurations
├── 📄 Documentation Files           # README, setup guides
└── 🔧 Configuration Files           # Docker Compose, Environment
```

---

## 🚪 API Gateway (Port: 8888) - **CENTRALIZED AUTHENTICATION**
**Công nghệ:** Spring Cloud Gateway + JWT Authentication  
**Spring Boot:** 3.5.6 ✅

### 📍 Routing Configuration:
| Path Pattern | Target Service | Port | Mô tả |
|--------------|----------------|------|-------|
| `/api/users/**` | UserService | 8080 | Quản lý người dùng |
| `/api/homework/**` | HomeworkService | 8081 | Quản lý bài tập |
| `/api/schedules/**` | ScheduleService | 8082 | Quản lý lịch học |
| `/api/classrooms/**` | ClassroomService | 3000 | Quản lý lớp học |
| `/api/files/**` | FileService | 3001 | Quản lý file |

### 🔒 Security Features (**SINGLE POINT OF AUTHENTICATION**):
- **JWT Authentication** - Chỉ validate JWT ở Gateway
- **User Context Headers** - Forward `X-User-Id`, `X-User-Role`, `X-User-Username` 
- **Rate Limiting**: 10 req/sec (API), 5 req/sec (files)
- **CORS Configuration** cho cross-origin requests
- **Request Logging** và monitoring

### 📂 Cấu Trúc ApiGateway/:
```
ApiGateway/
├── 📄 pom.xml                           # Maven dependencies
├── 🐳 Dockerfile                        # Container configuration
├── 📁 src/main/java/com/elearning/gateway/
│   ├── 🚀 ApiGatewayApplication.java    # Main application
│   └── 📁 filter/
│       ├── 🔐 JwtAuthenticationFilter.java  # JWT validation
│       └── 📝 LoggingFilter.java            # Request logging
└── 📁 src/main/resources/
    └── ⚙️ application.yml               # Gateway configuration
```

---

## 👤 UserService (Port: 8080)
**Công nghệ:** Java Spring Boot + MySQL + JWT

### 🔗 API Endpoints:
```http
POST   /api/users/register              # Đăng ký tài khoản
POST   /api/users/login                 # Đăng nhập
GET    /api/users/profile               # Lấy thông tin profile
PUT    /api/users/profile               # Cập nhật profile
GET    /api/users/{id}                  # Lấy thông tin user theo ID
GET    /api/users                       # Danh sách users (Admin)
PUT    /api/users/{id}/role             # Thay đổi role (Admin)
DELETE /api/users/{id}                  # Xóa user (Admin)
```

### 👥 User Roles:
- **STUDENT**: Học sinh
- **TEACHER**: Giáo viên  
- **ADMIN**: Quản trị viên

### 📂 Cấu Trúc UserService/ (**CLEANED**):
```
UserService/
├── 📄 pom.xml                          # Maven dependencies (NO spring-security ✅)
├── 🐳 Dockerfile                       # Container configuration
├── 📁 src/main/java/org/tduc/userservice/
│   ├── 🚀 UserServiceApplication.java  # Main application
│   ├── 📁 controller/                  # REST Controllers
│   ├── 📁 service/                     # Business logic
│   ├── 📁 repository/                  # Data access
│   ├── 📁 model/                       # Entity models
│   ├── 📁 dto/                         # Data transfer objects
│   ├── 📁 config/                      # Configuration classes (NO SecurityConfig ✅)
│   └── � util/AuthContextUtil.java    # Read user context from headers
└── 📁 src/main/resources/
    └── ⚙️ application.yml              # Service config (NO JWT config ✅)
```

---

## 📝 HomeworkService (Port: 8081) (**CLEAN STRUCTURE**)
**Công nghệ:** Java Spring Boot + MySQL  
**Spring Boot:** 3.5.6 ✅  
**Authentication:** Headers từ API Gateway

### 🔗 API Endpoints:
```http
# Homework Management
POST   /api/homework                    # Tạo bài tập mới (Teacher)
GET    /api/homework                    # Danh sách bài tập
GET    /api/homework/{id}               # Chi tiết bài tập
PUT    /api/homework/{id}               # Cập nhật bài tập (Teacher)
DELETE /api/homework/{id}               # Xóa bài tập (Teacher)

# Homework Questions
POST   /api/homework/{id}/questions     # Thêm câu hỏi
GET    /api/homework/{id}/questions     # Danh sách câu hỏi
PUT    /api/homework/questions/{id}     # Cập nhật câu hỏi
DELETE /api/homework/questions/{id}     # Xóa câu hỏi

# Student Submissions
POST   /api/homework/{id}/submit        # Nộp bài (Student)
GET    /api/homework/{id}/submissions   # Danh sách bài nộp (Teacher)
GET    /api/homework/my-submissions     # Bài nộp của tôi (Student)
PUT    /api/homework/submissions/{id}/grade # Chấm điểm (Teacher)
```

### 📊 Question Types:
- **MULTIPLE_CHOICE**: Trắc nghiệm
- **TEXT**: Tự luận
- **FILE_UPLOAD**: Upload file

### 📂 Cấu Trúc HomeworkService/:
```
HomeworkService/HomeworkService/
├── 📄 pom.xml                          # Maven dependencies
├── 🐳 Dockerfile                       # Container configuration
├── 📁 src/main/java/com/elearning/homework/
│   ├── 🚀 HomeworkServiceApplication.java
│   ├── 📁 controller/                  # REST Controllers
│   ├── 📁 service/                     # Business logic
│   ├── 📁 repository/                  # Data access
│   ├── 📁 model/                       # Entity models
│   ├── 📁 dto/                         # Data transfer objects
│   └── 📁 mapper/                      # MapStruct mappers
└── 📁 src/main/resources/
    └── ⚙️ application.yml              # Service configuration
```

---

## 📅 ScheduleService (Port: 8082)
**Công nghệ:** Java Spring Boot + MySQL

### 🔗 API Endpoints:
```http
POST   /api/schedules                   # Tạo lịch học mới
GET    /api/schedules                   # Danh sách lịch học
GET    /api/schedules/{id}              # Chi tiết lịch học
PUT    /api/schedules/{id}              # Cập nhật lịch học
DELETE /api/schedules/{id}              # Xóa lịch học
GET    /api/schedules/my-schedule       # Lịch học của tôi
GET    /api/schedules/course/{courseId} # Lịch học theo khóa học
```

### 📂 Cấu Trúc ScheduleService/:
```
ScheduleService/
├── 📄 pom.xml                          # Maven dependencies
├── 🐳 Dockerfile                       # Container configuration
├── 📁 src/main/java/com/elearning/schedule/
│   ├── 🚀 ScheduleServiceApplication.java
│   ├── 📁 controller/                  # REST Controllers
│   ├── 📁 service/                     # Business logic
│   ├── 📁 repository/                  # Data access
│   └── 📁 model/                       # Entity models
└── 📁 src/main/resources/
    └── ⚙️ application.yml              # Service configuration
```

---

## 🏫 ClassroomService (Port: 3000)
**Công nghệ:** Node.js + Express + MySQL

### 🔗 API Endpoints:
```http
POST   /api/classrooms                  # Tạo lớp học mới
GET    /api/classrooms                  # Danh sách lớp học
GET    /api/classrooms/{id}             # Chi tiết lớp học
PUT    /api/classrooms/{id}             # Cập nhật lớp học
DELETE /api/classrooms/{id}             # Xóa lớp học
POST   /api/classrooms/{id}/join        # Tham gia lớp học
POST   /api/classrooms/{id}/leave       # Rời lớp học
GET    /api/classrooms/my-classes       # Lớp học của tôi
```

### 📂 Cấu Trúc ClassroomService/:
```
ClassroomService/
├── 📄 package.json                     # NPM dependencies
├── 🐳 Dockerfile                       # Container configuration
├── 🚀 server.js                        # Main application
├── 📁 routes/                          # API routes
├── 📁 controllers/                     # Business logic
├── 📁 models/                          # Data models
├── 📁 middleware/                      # Authentication middleware
└── 📁 config/                          # Database configuration
```

---

## 📁 FileService (Port: 3001)
**Công nghệ:** Node.js + Express + Multer

### 🔗 API Endpoints:
```http
POST   /api/files/upload                # Upload file
GET    /api/files/{id}                  # Download file
GET    /api/files/{id}/info             # Thông tin file
DELETE /api/files/{id}                  # Xóa file
GET    /api/files/my-files              # File của tôi
POST   /api/files/homework/{id}         # Upload cho bài tập
```

### 📎 Supported File Types:
- **Documents**: PDF, DOC, DOCX, TXT
- **Images**: JPG, JPEG, PNG, GIF
- **Archives**: ZIP, RAR
- **Max Size**: 10MB

### 📂 Cấu Trúc FileService/:
```
FileService/
├── 📄 package.json                     # NPM dependencies
├── 🐳 Dockerfile                       # Container configuration
├── 🚀 server.js                        # Main application
├── 📁 routes/                          # API routes
├── 📁 controllers/                     # Business logic
├── 📁 middleware/                      # Authentication & validation
├── 📁 utils/                           # File processing utilities
├── 📁 config/                          # Configuration
└── 📁 uploads/                         # File storage (volume)
```

---

## 🖥️ Client (Port: 80)
**Công nghệ:** React + TypeScript + Vite + Tailwind CSS

### 🔗 Frontend Routes:
```http
/                                       # Trang chủ
/login                                  # Đăng nhập
/register                               # Đăng ký
/dashboard                              # Dashboard theo role
/profile                                # Thông tin cá nhân

# Student Routes
/student/assignments                    # Bài tập của học sinh
/student/grades                         # Điểm số
/student/schedule                       # Lịch học

# Teacher Routes
/teacher/courses                        # Khóa học quản lý
/teacher/assignments                    # Tạo & quản lý bài tập
/teacher/grading                        # Chấm điểm
/teacher/students                       # Quản lý học sinh

# Admin Routes
/admin/users                            # Quản lý người dùng
/admin/courses                          # Quản lý khóa học
/admin/reports                          # Báo cáo thống kê
```

### 📂 Cấu Trúc client/:
```
client/
├── 📄 package.json                     # NPM dependencies
├── 🐳 Dockerfile                       # Container configuration
├── 📄 nginx.conf                       # Nginx configuration
├── 📁 src/
│   ├── 🚀 main.tsx                     # Application entry
│   ├── 📱 App.tsx                      # Main App component
│   ├── 📁 components/                  # Reusable UI components
│   ├── 📁 pages/                       # Page components
│   ├── 📁 contexts/                    # React contexts (Auth)
│   ├── 📁 hooks/                       # Custom React hooks
│   ├── 📁 lib/                         # Utilities & API calls
│   └── 📁 styles/                      # CSS & styling
└── 📁 public/                          # Static assets
```

---

## 🐳 Docker Configuration

### 📂 Cấu Trúc docker/:
```
docker/
├── 📁 mysql/
│   └── 📁 init/
│       └── 01-schema.sql               # Database initialization
└── 📁 redis/
    └── redis.conf                      # Redis configuration
```

### 🔧 Docker Compose Services:
```yaml
services:
  api-gateway     # API Gateway (8888)
  user-service    # User Service (8080)
  homework-service # Homework Service (8081)
  schedule-service # Schedule Service (8082)
  classroom-service # Classroom Service (3000)
  file-service    # File Service (3001)
  client          # React Frontend (80)
  mysql           # MySQL Database (3306)
  redis           # Redis Cache (6379)
```

---

## 🔑 Demo Accounts

| Role | Username | Password | Mô tả |
|------|----------|----------|-------|
| **Admin** | admin | admin123 | Quản trị viên hệ thống |
| **Teacher** | teacher1 | teacher123 | Giáo viên mẫu |
| **Student** | student1 | student123 | Học sinh mẫu |

---

## 🚀 Cách Chạy Dự Án

### 1. Chạy với Docker (Khuyến nghị):
```cmd
cd "d:\phat\A-microservices-based-e-learning-platform"
docker-compose up --build -d
```

### 2. Truy cập ứng dụng:
- **Frontend**: http://localhost
- **API Gateway**: http://localhost:8888
- **Tất cả API**: http://localhost:8888/api/...

### 3. Kiểm tra trạng thái:
```cmd
docker-compose ps
docker-compose logs -f
```

---

## 📊 Database Schema

### 👤 Users Table:
- `id`, `username`, `email`, `password_hash`
- `first_name`, `last_name`, `role`
- `is_active`, `created_at`, `updated_at`

### 📚 Courses Table:
- `id`, `title`, `description`, `teacher_id`
- `course_code`, `credits`, `max_students`

### 📝 Homework Table:
- `id`, `title`, `description`, `course_id`
- `due_date`, `max_points`, `instructions`

### 📋 Homework_Questions Table:
- `id`, `homework_id`, `question_text`
- `question_type`, `points`, `options`

### 📄 Homework_Submissions Table:
- `id`, `homework_id`, `student_id`
- `submission_text`, `file_path`, `grade`

---

## 🔧 Configuration Files

### Environment Files:
- `.env` - Development configuration
- `.env.production` - Production configuration

### Service Configurations:
- `application.yml` - Spring Boot services
- `package.json` - Node.js services
- `docker-compose.yml` - Docker orchestration

---

Đây là tổng quan đầy đủ về cấu trúc dự án E-Learning Platform của bạn! 🎓