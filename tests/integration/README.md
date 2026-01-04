# Integration Tests

## Mô tả

Integration tests kiểm tra tương tác giữa các services:
- UserService ↔ ClassroomService
- UserService ↔ HomeworkService
- HomeworkService ↔ FileService
- ClassroomService ↔ Analytics (khi có)

## Chạy Integration Tests

### Java Services
```bash
cd UserService
./mvnw test -Dtest=*IntegrationTest

cd ../HomeworkService
./mvnw test -Dtest=*IntegrationTest
```

### Node.js Services
```bash
cd ClassroomService
npm run test:integration

cd ../FileService
npm test
```

## Test Scenarios

### User → Classroom Flow
1. User đăng nhập
2. Tạo classroom
3. Mời participants
4. Bắt đầu meeting

### Homework Flow
1. Teacher tạo homework
2. Upload file đính kèm
3. Student submit bài
4. Teacher chấm điểm

### File Upload Flow
1. Validate file type & size
2. Upload to storage
3. Generate download URL
4. Track in database
