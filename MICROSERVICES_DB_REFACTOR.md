# Microservices Database Refactoring - COMPLETED ✅

## Thay đổi Architecture:
**TRƯỚC**: Shared Database Anti-Pattern
```
All Services → e_learning (single database)
```

**SAU**: Database per Service Pattern  
```
UserService      → user_db
HomeworkService  → homework_db  
ScheduleService  → schedule_db
FileService      → file_db
CourseService    → course_db (for future)
```

## Files đã được tạo/sửa:

### 1. **Database Schemas** (mỗi service 1 DB):
- `docker/mysql/init/01-user-db.sql`     → Users table
- `docker/mysql/init/02-homework-db.sql` → Homework, Questions, Submissions 
- `docker/mysql/init/03-schedule-db.sql` → Schedules table
- `docker/mysql/init/04-file-db.sql`     → File uploads table
- `docker/mysql/init/05-course-db.sql`   → Courses, Enrollments table

### 2. **Docker Configuration**:
- `docker-compose.yml` → Updated với separate DB URLs cho từng service
- `.env` → Updated với consistent passwords & multiple DB names

### 3. **Spring Boot Configurations**:
- `UserService/application.yml`     → Point to `user_db`
- `HomeworkService/application.yml` → Point to `homework_db` 
- `ScheduleService/application.yml` → Point to `schedule_db`

## Lợi ích đạt được:

✅ **Loose Coupling**: Mỗi service độc lập hoàn toàn
✅ **Data Ownership**: Rõ ràng service nào sở hữu data nào  
✅ **Independent Scaling**: Scale riêng từng service
✅ **Technology Flexibility**: Mỗi service có thể dùng DB khác nhau
✅ **Fault Isolation**: Lỗi 1 DB không ảnh hưởng services khác

## Inter-Service Communication:
- HomeworkService cần user info → Call UserService REST API
- ScheduleService cần course info → Call CourseService REST API  
- No more Foreign Key dependencies across services!

## Run the system:
```bash
docker-compose up --build
```

All services sẽ có database riêng và hoạt động độc lập! 🎯