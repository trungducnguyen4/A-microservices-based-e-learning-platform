# NotificationService

Email notification và Google Calendar integration service cho nền tảng E-Learning.

## Tính năng

### 📧 Email Notifications
- Gửi email tự động với templates đẹp mắt
- Queue system với Bull để xử lý async
- Retry mechanism cho email thất bại
- Hỗ trợ attachments

### 📅 Google Calendar Integration
- Tự động tạo calendar events khi có lịch học
- Sync schedule với Google Calendar cá nhân
- Gửi calendar invites cho participants
- Update/Delete events tự động

### 🔔 Notification Types
- **Homework Reminder**: Nhắc hạn nộp bài (24h trước)
- **Class Reminder**: Nhắc lớp sắp bắt đầu (10 phút trước)
- **Grade Notification**: Thông báo khi có điểm mới
- **Custom Notifications**: Tùy chỉnh theo nhu cầu

## Cài đặt

```bash
npm install
```

## Cấu hình

Copy file `.env.example` thành `.env` và điền thông tin:

### Email (Gmail)
1. Bật 2-Factor Authentication
2. Tạo App Password tại: https://myaccount.google.com/apppasswords
3. Điền vào `EMAIL_PASSWORD`

### Google Calendar API
1. Follow hướng dẫn trong `GOOGLE_CALENDAR_SETUP.md`
2. Lấy Client ID và Client Secret
3. Điền vào `.env`

## Chạy service

```bash
# Development
npm run dev

# Production
npm start

# Test
npm test
```

## API Endpoints

### Notifications

**Send Notification**
```http
POST /api/notifications/send
Content-Type: application/json

{
  "userId": "user_123",
  "type": "info",
  "title": "New Announcement",
  "message": "Class will start at 2PM"
}
```

**Get User Notifications**
```http
GET /api/notifications/user/:userId?limit=20&offset=0
```

**Send Email**
```http
POST /api/notifications/email
Content-Type: application/json

{
  "to": "student@example.com",
  "subject": "Homework Reminder",
  "template": "homework-reminder",
  "data": {
    "studentName": "John Doe",
    "title": "Math Assignment",
    "dueDate": "2026-01-10"
  }
}
```

**Homework Reminder**
```http
POST /api/notifications/homework/reminder
Content-Type: application/json

{
  "homeworkId": "hw_123",
  "studentIds": ["user_1", "user_2"]
}
```

**Class Reminder**
```http
POST /api/notifications/class/reminder
Content-Type: application/json

{
  "scheduleId": "sch_123",
  "participantIds": ["user_1", "user_2"],
  "minutesBefore": 10
}
```

### Calendar

**Create Event**
```http
POST /api/calendar/events
Content-Type: application/json

{
  "userId": "user_123",
  "summary": "Math Class",
  "description": "Introduction to Calculus",
  "startTime": "2026-01-10T14:00:00+07:00",
  "endTime": "2026-01-10T15:30:00+07:00",
  "attendees": ["student1@example.com", "student2@example.com"]
}
```

**Get OAuth URL**
```http
GET /api/calendar/auth/url?userId=user_123
```

**Handle OAuth Callback**
```http
POST /api/calendar/auth/callback
Content-Type: application/json

{
  "code": "oauth_code_from_google",
  "userId": "user_123"
}
```

**Sync Schedule to Calendar**
```http
POST /api/calendar/sync/schedule
Content-Type: application/json

{
  "userId": "user_123",
  "scheduleId": "sch_456",
  "classInfo": {
    "title": "Math Class",
    "subject": "Mathematics",
    "room": "Room 101",
    "teacherName": "Mr. Smith",
    "startTime": "2026-01-10T14:00:00+07:00",
    "endTime": "2026-01-10T15:30:00+07:00",
    "attendees": ["student@example.com"]
  }
}
```

## Database Schema

```sql
CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255),
  message TEXT NOT NULL,
  metadata JSON,
  is_read BOOLEAN DEFAULT FALSE,
  read_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);

CREATE TABLE user_calendar_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(255) UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expiry_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE schedule_calendar_mapping (
  id INT PRIMARY KEY AUTO_INCREMENT,
  schedule_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  calendar_event_id VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_schedule_user (schedule_id, user_id)
);
```

## Email Templates

Templates sử dụng Handlebars, nằm trong `src/templates/`:
- `homework-reminder.hbs`
- `class-reminder.hbs`
- `grade-notification.hbs`

## Integration với services khác

- **UserService**: Lấy thông tin user (email, name)
- **ScheduleService**: Lấy lịch học để tạo calendar events
- **HomeworkService**: Lấy thông tin bài tập để gửi reminder

## Docker

```bash
docker build -t notification-service .
docker run -p 5001:5001 --env-file .env notification-service
```

## Troubleshooting

**Email không gửi được:**
- Kiểm tra App Password đã đúng chưa
- Kiểm tra Gmail có bật 2FA chưa

**Google Calendar lỗi:**
- Kiểm tra user đã authorize chưa
- Verify OAuth credentials
- Kiểm tra scope permissions
