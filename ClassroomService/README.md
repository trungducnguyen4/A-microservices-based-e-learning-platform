# ClassroomService

ClassroomService là một microservice Node.js/Express quản lý các phòng học trực tuyến (Meeting Rooms) với tích hợp LiveKit cho video conferencing.

## 🎯 New Features (Student Project Optimization) ✅

### 1. **Chat Messages Persistence**
- Lưu tin nhắn vào MySQL `room_messages`
- Lấy lịch sử chat cho mỗi phòng
- Tự động xóa messages cũ khi cleanup

### 2. **Host-Only End Room**
- Chỉ host (giáo viên) mới được end phòng
- Kiểm tra quyền trước khi cho phép kết thúc
- Trả về 403 Forbidden nếu không phải host

### 3. **Data Cleanup & Retention**
- Admin API để dọn dẹp data cũ
- Retention policy: xóa data từ phòng đã ended > N ngày
- Stats API để monitor storage

### 📚 Documentation
- **Quick Tests:** [Test script](test-api.bat) - Chạy `.\test-api.bat`
- **Full API Guide:** [API_GUIDE.md](API_GUIDE.md) - Complete endpoint docs
- **Database Setup:** [README_DB_XAMPP.md](README_DB_XAMPP.md) - XAMPP/phpMyAdmin

---

## 📁 Cấu trúc thư mục

```
ClassroomService/
├── src/
│   ├── config/           # Configuration files
│   │   ├── app.config.js       # Application configuration
│   │   └── livekit.config.js   # LiveKit configuration
│   ├── controllers/      # Request handlers
│   │   └── meeting.controller.js
│   ├── services/         # Business logic
│   │   ├── room.service.js     # Room management
│   │   ├── token.service.js    # LiveKit token generation
│   │   └── user.service.js     # User info integration
│   ├── routes/           # API route definitions
│   │   └── meeting.routes.js
│   ├── middlewares/      # Express middlewares
│   │   ├── errorHandler.js     # Global error handler
│   │   └── requestLogger.js    # Request logging
│   └── utils/            # Utility functions
│       ├── roomCode.js         # Room code generator/validator
│       └── response.js         # Response formatters
├── server.js             # Main application entry point
├── server.old.js         # Backup của old implementation
├── package.json
└── .env
```

## 🚀 Cài đặt

1. Cài dependencies:
```bash
npm install
```

2. Tạo file `.env`:
```env
PORT=4000
NODE_ENV=development

# LiveKit Configuration
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
LIVEKIT_URL=ws://localhost:7880

# UserService Integration
USER_SERVICE_URL=http://localhost:8080
```

3. Chạy service:
```bash
npm start
```

hoặc development mode với nodemon:
```bash
npm run dev
```

## 📡 API Endpoints

### Meeting Management

#### 1. Create Room
```http
POST /api/meeting/create
Content-Type: application/json

{
  "roomCode": "abc-defg-hij",
  "userId": "user123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Room created successfully",
  "data": {
    "roomCode": "abc-defg-hij",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 2. Check Room Exists
```http
GET /api/meeting/check/:roomCode
```

**Response:**
```json
{
  "success": true,
  "exists": true,
  "data": {
    "roomCode": "abc-defg-hij",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "participantCount": 3
  }
}
```

#### 3. Get All Rooms
```http
GET /api/meeting/rooms
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "roomCode": "abc-defg-hij",
      "createdBy": "user123",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "participantCount": 3,
      "participants": [...]
    }
  ]
}
```

#### 4. Delete Room
```http
DELETE /api/meeting/room/:roomCode
```

**Response:**
```json
{
  "success": true,
  "message": "Room deleted successfully"
}
```

#### 5. Get LiveKit Token
```http
POST /api/meeting/token
Content-Type: application/json

{
  "roomCode": "abc-defg-hij",
  "userId": "user123",
  "userName": "John Doe" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "identity": "user123",
    "name": "John Doe",
    "roomCode": "abc-defg-hij"
  }
}
```

#### 6. End Room (HOST ONLY)
```http
POST /api/meeting/end/:roomCode
Content-Type: application/json

{
  "userId": "user123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Room ended successfully"
}
```

**Errors:**
- `404` - Room not found
- `403` - Only host can end the room
- `400` - Room already ended

#### 7. Kick Participant (HOST ONLY) 🆕
```http
POST /api/meeting/kick-participant
Content-Type: application/json

{
  "roomCode": "abc-defg-hij",
  "hostUserId": "user123",
  "targetIdentity": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Participant kicked successfully",
  "data": {
    "success": true,
    "kickedParticipant": {
      "identity": "John Doe",
      "displayName": "John Doe",
      "userId": "456"
    },
    "livekitDisconnected": true
  }
}
```

**Errors:**
- `400` - Missing required fields
- `403` - Only host can kick participants
- `404` - Room not found / Participant not found
- `400` - Cannot kick the host

**Features:**
- ✅ Only host can kick participants
- ✅ Cannot kick the host
- ✅ Uses LiveKit API to disconnect participant
- ✅ Logs event to database
- ✅ Participant receives disconnect notification

### Legacy Endpoints (Backward Compatibility)

#### Get Token (Legacy)
```http
GET /getToken?room=abc-defg-hij&user=user123&userName=John
```

#### Check Room (Legacy)
```http
GET /checkRoom?room=abc-defg-hij
```

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "livekitConfigured": true,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "activeRooms": 5
}
```

## 🔧 Architecture

### Config Layer (`src/config/`)
- **app.config.js**: Application settings (port, environment, service URLs)
- **livekit.config.js**: LiveKit credentials and connection info

### Service Layer (`src/services/`)
- **room.service.js**: Room CRUD operations, participant tracking
- **token.service.js**: LiveKit token generation with permissions
- **user.service.js**: Integration with UserService for user info

### Controller Layer (`src/controllers/`)
- **meeting.controller.js**: HTTP request handlers, validation, response formatting

### Route Layer (`src/routes/`)
- **meeting.routes.js**: API endpoint definitions

### Middleware Layer (`src/middlewares/`)
- **requestLogger.js**: Log all incoming requests
- **errorHandler.js**: Global error handling

### Utility Layer (`src/utils/`)
- **roomCode.js**: Room code generation/validation (format: xxx-yyyy-zzz)
- **response.js**: Standard response formatters

## 🔄 Data Flow

```
Client Request
    ↓
Express Router (routes/)
    ↓
Request Logger Middleware
    ↓
Controller (controllers/)
    ↓
Service Layer (services/)
    ↓
External APIs (LiveKit, UserService)
    ↓
Response Formatter
    ↓
Client Response
```

## 🗂️ Room Management

### Room Structure
```javascript
{
  roomCode: "abc-defg-hij",
  createdBy: "user123",
  createdAt: Date,
  participants: Map {
    "user123" => {
      identity: "user123",
      name: "John Doe",
      joinedAt: Date
    }
  }
}
```

### Room Cleanup
- Tự động xóa rooms không có participants sau 1 giờ
- Chạy cleanup mỗi 5 phút
- In-memory storage (Map)

## 🔐 LiveKit Integration

### Token Permissions
```javascript
{
  room: roomCode,
  roomJoin: true,
  canPublish: true,      // Publish audio/video
  canSubscribe: true,    // Subscribe to others
  canPublishData: true   // Send data messages
}
```

### User Integration
- Tự động lấy thông tin user từ UserService
- Fallback to userId nếu UserService không available
- Display name priority: fullName > username > email > userId

## 📝 Notes

### Room Code Format
- Format: `xxx-yyyy-zzz` (12 ký tự bao gồm dấu gạch ngang)
- Chữ thường (a-z)
- Ví dụ: `abc-defg-hij`

### Environment Variables
- `PORT`: Server port (default: 4000)
- `NODE_ENV`: Environment (development/production)
- `LIVEKIT_API_KEY`: LiveKit API key
- `LIVEKIT_API_SECRET`: LiveKit API secret
- `LIVEKIT_URL`: LiveKit server URL
- `USER_SERVICE_URL`: UserService base URL

### Error Handling
- Tất cả errors được catch và format bởi errorHandler middleware
- Development mode: Show stack trace
- Production mode: Hide sensitive information

## 🔄 Migration from Old Code

Old code trong `server.old.js` được backup. Main changes:
- ✅ Tách logic thành layers (config, service, controller, routes)
- ✅ Singleton pattern cho services
- ✅ Middleware cho logging và error handling
- ✅ Utility functions cho room code và response formatting
- ✅ Backward compatibility với old endpoints

## 🧪 Testing

Sau khi refactor, test các endpoints:
1. ✅ GET /health - Check service health
2. ✅ POST /api/meeting/create - Create room
3. ✅ GET /api/meeting/check/:roomCode - Check room exists
4. ✅ POST /api/meeting/token - Get LiveKit token
5. ✅ GET /getToken (legacy) - Backward compatibility
6. ✅ GET /checkRoom (legacy) - Backward compatibility

## 📚 Future Enhancements
- [ ] Database persistence (hiện tại dùng in-memory Map)
- [ ] Redis cache cho room data
- [ ] Room password protection
- [ ] Waiting room feature
- [ ] Recording management
- [ ] Chat history storage
- [ ] Analytics và reporting
