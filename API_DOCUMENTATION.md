# 🌐 E-Learning Platform - API Documentation

## 🚪 API Gateway Base URL
**Development:** `http://localhost:8888`  
**Production:** `https://your-domain.com:8888`

---

## 🔐 Authentication

### 📋 Headers Required:
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### 🆔 JWT Token Payload:
```json
{
  "sub": "user_id",
  "username": "username",
  "role": "STUDENT|TEACHER|ADMIN",
  "exp": 1698765432
}
```

---

## 👤 User Management API (`/api/users`)

### 🔓 Public Endpoints (No Auth Required):

#### POST `/api/users/register`
Đăng ký tài khoản mới
```json
// Request
{
  "username": "student123",
  "email": "student@example.com",
  "password": "password123",
  "firstName": "Nguyễn",
  "lastName": "Văn A",
  "role": "STUDENT"
}

// Response (201 Created)
{
  "message": "User registered successfully",
  "userId": 1
}
```

#### POST `/api/users/login`
Đăng nhập hệ thống
```json
// Request
{
  "username": "student123",
  "password": "password123"
}

// Response (200 OK)
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "student123",
    "email": "student@example.com",
    "firstName": "Nguyễn",
    "lastName": "Văn A",
    "role": "STUDENT"
  }
}
```

### 🔒 Protected Endpoints:

#### GET `/api/users/profile`
Lấy thông tin profile hiện tại
```json
// Response (200 OK)
{
  "id": 1,
  "username": "student123",
  "email": "student@example.com",
  "firstName": "Nguyễn",
  "lastName": "Văn A",
  "role": "STUDENT",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### PUT `/api/users/profile`
Cập nhật thông tin profile
```json
// Request
{
  "firstName": "Nguyễn",
  "lastName": "Văn B",
  "email": "newmail@example.com"
}

// Response (200 OK)
{
  "message": "Profile updated successfully"
}
```

#### GET `/api/users/{id}` 🔒 (TEACHER, ADMIN)
Lấy thông tin user theo ID

#### GET `/api/users` 🔒 (ADMIN only)
Danh sách tất cả users với pagination
```http
GET /api/users?page=0&size=10&role=STUDENT
```

#### PUT `/api/users/{id}/role` 🔒 (ADMIN only)
Thay đổi role của user
```json
// Request
{
  "role": "TEACHER"
}
```

---

## 📝 Homework Management API (`/api/homework`)

### 📋 Homework CRUD:

#### POST `/api/homework` 🔒 (TEACHER only)
Tạo bài tập mới
```json
// Request
{
  "title": "Bài tập Java cơ bản",
  "description": "Viết chương trình Java đơn giản",
  "courseId": 1,
  "dueDate": "2024-12-31T23:59:59Z",
  "maxPoints": 100,
  "instructions": "Hướng dẫn chi tiết..."
}

// Response (201 Created)
{
  "id": 1,
  "title": "Bài tập Java cơ bản",
  "courseId": 1,
  "teacherId": 2,
  "dueDate": "2024-12-31T23:59:59Z",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### GET `/api/homework`
Danh sách bài tập (theo role)
```http
GET /api/homework?courseId=1&page=0&size=10
```

#### GET `/api/homework/{id}`
Chi tiết bài tập
```json
// Response (200 OK)
{
  "id": 1,
  "title": "Bài tập Java cơ bản",
  "description": "Viết chương trình Java đơn giản",
  "courseId": 1,
  "teacherId": 2,
  "dueDate": "2024-12-31T23:59:59Z",
  "maxPoints": 100,
  "questions": [
    {
      "id": 1,
      "questionText": "Viết hàm tính giai thừa",
      "questionType": "TEXT",
      "points": 50
    }
  ]
}
```

#### PUT `/api/homework/{id}` 🔒 (TEACHER only)
Cập nhật bài tập

#### DELETE `/api/homework/{id}` 🔒 (TEACHER only)
Xóa bài tập

### 📝 Questions Management:

#### POST `/api/homework/{homeworkId}/questions` 🔒 (TEACHER only)
Thêm câu hỏi vào bài tập
```json
// Request
{
  "questionText": "Viết hàm sắp xếp mảng",
  "questionType": "TEXT",
  "points": 30,
  "questionOrder": 1,
  "options": null,
  "correctAnswer": null
}
```

#### GET `/api/homework/{homeworkId}/questions`
Lấy danh sách câu hỏi

#### PUT `/api/homework/questions/{questionId}` 🔒 (TEACHER only)
Cập nhật câu hỏi

#### DELETE `/api/homework/questions/{questionId}` 🔒 (TEACHER only)
Xóa câu hỏi

### 📄 Submissions Management:

#### POST `/api/homework/{homeworkId}/submit` 🔒 (STUDENT only)
Nộp bài tập
```json
// Request
{
  "submissionText": "Code solution here...",
  "filePath": "/uploads/submission123.zip"
}

// Response (201 Created)
{
  "id": 1,
  "homeworkId": 1,
  "studentId": 1,
  "submittedAt": "2024-01-01T10:00:00Z",
  "status": "SUBMITTED"
}
```

#### GET `/api/homework/{homeworkId}/submissions` 🔒 (TEACHER only)
Danh sách bài nộp của học sinh

#### GET `/api/homework/my-submissions` 🔒 (STUDENT only)
Bài nộp của học sinh hiện tại

#### PUT `/api/homework/submissions/{submissionId}/grade` 🔒 (TEACHER only)
Chấm điểm bài nộp
```json
// Request
{
  "grade": 85.5,
  "feedback": "Bài làm tốt, cần cải thiện phần..."
}
```

---

## 📅 Schedule Management API (`/api/schedules`)

#### POST `/api/schedules` 🔒 (TEACHER only)
Tạo lịch học mới
```json
// Request
{
  "courseId": 1,
  "title": "Bài gi강 1: Giới thiệu Java",
  "description": "Nội dung bài giảng...",
  "startTime": "2024-01-15T09:00:00Z",
  "endTime": "2024-01-15T11:00:00Z",
  "location": "Phòng 101",
  "isOnline": false,
  "meetingUrl": null
}

// Response (201 Created)
{
  "id": 1,
  "courseId": 1,
  "title": "Bài giảng 1: Giới thiệu Java",
  "startTime": "2024-01-15T09:00:00Z",
  "endTime": "2024-01-15T11:00:00Z",
  "location": "Phòng 101"
}
```

#### GET `/api/schedules`
Danh sách lịch học
```http
GET /api/schedules?courseId=1&date=2024-01-15&page=0&size=10
```

#### GET `/api/schedules/{id}`
Chi tiết lịch học

#### GET `/api/schedules/my-schedule`
Lịch học của tôi (theo role)

#### GET `/api/schedules/course/{courseId}`
Lịch học theo khóa học

#### PUT `/api/schedules/{id}` 🔒 (TEACHER only)
Cập nhật lịch học

#### DELETE `/api/schedules/{id}` 🔒 (TEACHER only)
Xóa lịch học

---

## 🏫 Classroom Management API (`/api/classrooms`)

#### POST `/api/classrooms` 🔒 (TEACHER only)
Tạo lớp học mới
```json
// Request
{
  "name": "Lớp Java Nâng Cao",
  "description": "Khóa học Java cho sinh viên năm 3",
  "courseCode": "CS301",
  "maxStudents": 30,
  "teacherId": 2
}

// Response (201 Created)
{
  "id": 1,
  "name": "Lớp Java Nâng Cao",
  "courseCode": "CS301",
  "teacherId": 2,
  "currentStudents": 0,
  "maxStudents": 30
}
```

#### GET `/api/classrooms`
Danh sách lớp học

#### GET `/api/classrooms/{id}`
Chi tiết lớp học với danh sách học sinh

#### POST `/api/classrooms/{id}/join` 🔒 (STUDENT only)
Tham gia lớp học
```json
// Response (200 OK)
{
  "message": "Joined classroom successfully",
  "enrollmentDate": "2024-01-01T00:00:00Z"
}
```

#### POST `/api/classrooms/{id}/leave` 🔒 (STUDENT only)
Rời lớp học

#### GET `/api/classrooms/my-classes`
Lớp học của tôi (Student: đã tham gia, Teacher: đang dạy)

#### PUT `/api/classrooms/{id}` 🔒 (TEACHER only)
Cập nhật thông tin lớp học

#### DELETE `/api/classrooms/{id}` 🔒 (TEACHER only)
Xóa lớp học

---

## 📁 File Management API (`/api/files`)

#### POST `/api/files/upload`
Upload file (multipart/form-data)
```http
POST /api/files/upload
Content-Type: multipart/form-data

file: [binary data]
uploadType: "HOMEWORK_SUBMISSION"
referenceId: 123
```

```json
// Response (201 Created)
{
  "id": 1,
  "originalName": "homework.zip",
  "storedName": "uuid-homework.zip",
  "filePath": "/uploads/uuid-homework.zip",
  "fileSize": 1024000,
  "mimeType": "application/zip",
  "uploadType": "HOMEWORK_SUBMISSION",
  "uploadedAt": "2024-01-01T00:00:00Z"
}
```

#### GET `/api/files/{id}`
Download file
```http
// Response: File binary data with appropriate headers
Content-Type: application/zip
Content-Disposition: attachment; filename="homework.zip"
```

#### GET `/api/files/{id}/info`
Thông tin file
```json
// Response (200 OK)
{
  "id": 1,
  "originalName": "homework.zip",
  "fileSize": 1024000,
  "mimeType": "application/zip",
  "uploadedBy": 1,
  "uploadedAt": "2024-01-01T00:00:00Z"
}
```

#### GET `/api/files/my-files`
Danh sách file của tôi

#### POST `/api/files/homework/{homeworkId}`
Upload file cho bài tập cụ thể

#### DELETE `/api/files/{id}`
Xóa file (chỉ owner hoặc admin)

---

## 📊 Response Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 422 | Unprocessable Entity | Validation errors |
| 500 | Internal Server Error | Server error |

---

## 🔍 Common Query Parameters

### Pagination:
```http
?page=0&size=10&sort=createdAt,desc
```

### Filtering:
```http
?role=STUDENT&isActive=true&courseId=1
```

### Date Range:
```http
?startDate=2024-01-01&endDate=2024-12-31
```

---

## 🚦 Rate Limiting

| Endpoint Type | Limit | Burst |
|---------------|-------|-------|
| General API | 10 req/sec | 20 req |
| File Upload | 5 req/sec | 10 req |
| Auth Endpoints | 5 req/sec | 10 req |

---

## 🧪 Testing với Postman/Curl

### 1. Login to get JWT:
```bash
curl -X POST http://localhost:8888/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"student1","password":"student123"}'
```

### 2. Use JWT for protected endpoints:
```bash
curl -X GET http://localhost:8888/api/homework \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Upload file:
```bash
curl -X POST http://localhost:8888/api/files/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/file.pdf" \
  -F "uploadType=HOMEWORK_SUBMISSION" \
  -F "referenceId=1"
```

---

**🎯 Lưu ý quan trọng:**
- Tất cả API đều đi qua API Gateway (port 8888)
- JWT token có thời hạn 24 giờ
- File upload tối đa 10MB
- Rate limiting áp dụng theo IP address
- CORS được cấu hình cho phép cross-origin requests