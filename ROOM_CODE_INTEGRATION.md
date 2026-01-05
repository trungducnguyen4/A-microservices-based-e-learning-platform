# Room Code Integration Flow

## Mục đích
Khi giáo viên tạo một course (schedule), hệ thống sẽ tự động tạo một room code duy nhất cho phòng học trực tuyến. Phòng chỉ hoạt động khi có sinh viên join vào (không mở tự động từ sáng tới tối).

## Luồng hoạt động

### 1. Tạo Course (CreateCourse.tsx)
```
Giáo viên nhấn "Create Course"
  ↓
Client tạo room code: ROOM-{timestamp}-{randomString}
  ↓
Gửi schedule creation request với roomCode
```

**Code:**
```typescript
const generateRoomCode = () => {
  return `ROOM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};
const roomCode = generateRoomCode();

const payload = {
  title,
  collaborators,
  startTime,
  endTime,
  recurrenceRule,
  roomCode: roomCode  // Thêm room code vào payload
};
```

### 2. Backend ScheduleService (Java)
```
API: POST /schedules/create
  ↓
ScheduleService.createSchedule() 
  ├─ Tạo schedule với roomCode từ request
  ├─ Nếu không có roomCode, tạo mới: ROOM-{timestamp}-{joinCode}
  └─ Lưu vào database
  ↓
Trả về response với roomCode
```

**Changes:**
- `Schedule.java`: Thêm `String roomCode` field
- `ScheduleCreationRequest.java`: Thêm `String roomCode` field  
- `ScheduleCreationResponse.java`: Thêm `String roomCode` field
- `ScheduleService.java`: Logic tạo room code

### 3. Classroom Service - Room Creation (Node.js)
Phòng **KHÔNG** được tạo ngay khi schedule tạo. Nó sẽ tạo khi:

```
Sinh viên join vào room bằng room code
  ↓
ClassroomService nhận request /token (create token)
  ├─ roomCode từ student
  ├─ TokenService.createAccessToken()
  └─ TokenService.createTokenAndTrackParticipant()
    └─ RoomService.addParticipant()
      ├─ Kiểm tra room tồn tại?
      └─ Nếu không → tạo room mới với createRoom(roomCode, creatorUserId)
```

**Code (token.service.js):**
```javascript
async createTokenAndTrackParticipant(roomCode, userId, userName = null) {
  const tokenData = await this.createAccessToken(roomCode, userId, userName);
  
  // Room sẽ tự tạo trong addParticipant nếu chưa tồn tại
  await roomService.addParticipant(roomCode, {
    identity: tokenData.identity,
    name: tokenData.name,
    userId: tokenData.userId || userId,
    joinedAt: new Date(),
  });
  
  return tokenData;
}
```

**Code (room.service.js):**
```javascript
async addParticipant(roomCode, participant) {
  let roomRow = await this._getRoomRowByCode(roomCode);
  
  if (!roomRow) {
    // Nếu room chưa tồn tại, tạo mới
    const creatorId = participant.userId || participant.identity;
    await this.createRoom(roomCode, creatorId);
    roomRow = await this._getRoomRowByCode(roomCode);
  }
  
  // Thêm participant vào room
  // ...
}
```

## Các trạng thái của Room

| Trạng thái | Mô tả |
|-----------|--------|
| **Chưa tạo** | Phòng được khai báo trong schedule nhưng chưa tạo trong ClassroomService |
| **Active** | Có ít nhất 1 sinh viên đã join vào (phòng hoạt động) |
| **Empty** | Tất cả sinh viên đã rời khỏi phòng |
| **Closed** | Giáo viên hoặc hệ thống đóng phòng |

## Luồng Join Phòng

```
Sinh viên truy cập /prejoin?roomCode=ROOM-xxx
  ↓
Chọn camera/microphone, nhấn "Join"
  ↓
Frontend gọi API: POST /api/token
  ├─ Body: { roomCode, userId, userName }
  └─ Response: { token, identity, roomCode }
    ↓
Frontend dùng token connect tới LiveKit
  ├─ RoomService nhận participant
  ├─ Kiểm tra: room tồn tại?
  └─ Nếu không → tạo room
    ↓
Sinh viên thấy giáo viên (nếu đã join)
Giáo viên thấy sinh viên (nếu đã join)
```

## Database Schema

### schedules table (ScheduleService)
```sql
ALTER TABLE schedules ADD COLUMN room_code VARCHAR(255) UNIQUE NULL;
CREATE INDEX idx_room_code ON schedules(room_code);
```

### rooms table (ClassroomService) - Đã tồn tại
```sql
-- Đã có sẵn, không cần thay đổi
CREATE TABLE rooms (
  id VARCHAR(36) PRIMARY KEY,
  room_code VARCHAR(255) UNIQUE NOT NULL,
  host_user_id VARCHAR(255) NOT NULL,
  status ENUM('active', 'closed') DEFAULT 'active',
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ...
);
```

## Lợi ích của Cách Thiết Kế Này

1. **Lazy Creation**: Phòng chỉ được tạo khi cần (khi sinh viên join)
2. **Resource Efficient**: Không tạo phòng trống trên server LiveKit
3. **Unique Room Codes**: Mỗi schedule có room code duy nhất
4. **Permanent Room Code**: Sinh viên có thể join bất kỳ lúc nào trong ngày bằng room code
5. **Teacher Control**: Giáo viên là host của room (có quyền kick, close phòng)

## Testing

### 1. Tạo Course
```bash
curl -X POST http://localhost:8080/api/schedules/create \
  -H "Content-Type: application/json" \
  -d '{
    "title": "React Basics",
    "startTime": "2026-01-06T10:00:00Z",
    "endTime": "2026-01-06T11:00:00Z",
    "userId": "teacher123",
    "roomCode": "ROOM-1234567890-ABC123DEF"
  }'
```

**Response:**
```json
{
  "code": 200,
  "result": {
    "courseId": "schedule-id-xxx",
    "title": "React Basics",
    "roomCode": "ROOM-1234567890-ABC123DEF",
    "startTime": "2026-01-06T10:00:00Z",
    "endTime": "2026-01-06T11:00:00Z"
  }
}
```

### 2. Join Room (Sinh viên)
```bash
curl -X POST http://localhost:3000/api/token \
  -H "Content-Type: application/json" \
  -d '{
    "roomCode": "ROOM-1234567890-ABC123DEF",
    "userId": "student456",
    "userName": "Nguyễn Văn A"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGc...",
  "identity": "Nguyễn Văn A",
  "roomCode": "ROOM-1234567890-ABC123DEF",
  "userId": "student456"
}
```

Room sẽ được tạo tự động trong ClassroomService nếu chưa tồn tại.

## Notes
- ✅ Room Code được tạo ở Frontend (CreateCourse.tsx)
- ✅ Room Code được lưu trong Schedule (ScheduleService)
- ✅ Room được tạo lazy khi sinh viên join (ClassroomService)
- ✅ Host của room là người join đầu tiên (hoặc có thể config là teacher)
- ✅ Room tồn tại miễn là có người trong (hoặc tới khi bị close)
