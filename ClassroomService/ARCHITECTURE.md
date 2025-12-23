# ClassroomService - Architecture Overview

## 📊 Directory Structure

```
ClassroomService/
│
├── 📄 server.js                    # Main entry point
├── 📄 server.old.js                # Backup of old implementation
├── 📄 package.json
├── 📄 .env
├── 📘 README.md
│
└── 📁 src/
    │
    ├── 📁 config/                  # Configuration Layer
    │   ├── app.config.js           # App settings (port, env, URLs)
    │   └── livekit.config.js       # LiveKit credentials
    │
    ├── 📁 services/                # Business Logic Layer
    │   ├── room.service.js         # Room CRUD & participant tracking
    │   ├── token.service.js        # LiveKit token generation
    │   └── user.service.js         # UserService integration
    │
    ├── 📁 controllers/             # Request Handler Layer
    │   └── meeting.controller.js   # Meeting endpoints handler
    │
    ├── 📁 routes/                  # API Route Layer
    │   └── meeting.routes.js       # Route definitions
    │
    ├── 📁 middlewares/             # Middleware Layer
    │   ├── errorHandler.js         # Global error handling
    │   └── requestLogger.js        # Request logging
    │
    └── 📁 utils/                   # Utility Layer
        ├── roomCode.js             # Room code generator/validator
        └── response.js             # Response formatters
```

## 🔄 Request Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                          Client Request                          │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Express Application                         │
│                         (server.js)                              │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Request Logger                              │
│                  (middlewares/requestLogger.js)                  │
│                  Logs: [METHOD] URL - STATUS - TIME              │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Router Layer                             │
│                   (routes/meeting.routes.js)                     │
│            Maps URLs to Controller Methods                       │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Controller Layer                            │
│                (controllers/meeting.controller.js)               │
│          • Validate request data                                 │
│          • Call service methods                                  │
│          • Format responses                                      │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Service Layer                              │
│                     (services/*.js)                              │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Room Service │  │Token Service │  │ User Service │          │
│  │              │  │              │  │              │          │
│  │ • Create     │  │ • Generate   │  │ • Get user   │          │
│  │ • Get        │  │   token      │  │   info       │          │
│  │ • Delete     │  │ • Track      │  │ • Display    │          │
│  │ • Track      │  │   participant│  │   name       │          │
│  │ • Cleanup    │  │              │  │              │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
└─────────┼─────────────────┼─────────────────┼───────────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────┐  ┌──────────────┐  ┌──────────────┐
│   In-Memory     │  │   LiveKit    │  │ UserService  │
│   Room Store    │  │     API      │  │     API      │
│     (Map)       │  │              │  │              │
└─────────────────┘  └──────────────┘  └──────────────┘
```

## 🎯 Component Responsibilities

### 1️⃣ Config Layer
```javascript
// app.config.js
{
  port: 4000,
  userServiceUrl: "http://localhost:8080",
  nodeEnv: "development"
}

// livekit.config.js
{
  apiKey: "...",
  apiSecret: "...",
  url: "ws://localhost:7880",
  validateConfig() { ... }
}
```

### 2️⃣ Service Layer

**room.service.js** (RoomStore Class)
- `createRoom(roomCode, userId)` → Create new room
- `getRoom(roomCode)` → Get room data
- `hasRoom(roomCode)` → Check existence
- `addParticipant(roomCode, participant)` → Add participant
- `removeParticipant(roomCode, identity)` → Remove participant
- `deleteRoom(roomCode)` → Delete room
- `getAllRooms()` → Get all rooms
- `cleanupOldRooms(maxAge)` → Cleanup inactive rooms

**token.service.js**
- `createAccessToken(roomCode, userId, userName)` → Generate LiveKit JWT
- `createTokenAndTrackParticipant(...)` → Generate token + track participant

**user.service.js**
- `getUserInfo(userId)` → Fetch from UserService API
- `getDisplayName(userInfo, defaultName)` → Extract display name

### 3️⃣ Controller Layer

**meeting.controller.js**
- `createRoom(req, res)` → POST /api/meeting/create
- `checkRoom(req, res)` → GET /api/meeting/check/:roomCode
- `getAllRooms(req, res)` → GET /api/meeting/rooms
- `deleteRoom(req, res)` → DELETE /api/meeting/room/:roomCode
- `getToken(req, res)` → POST /api/meeting/token

### 4️⃣ Route Layer

**meeting.routes.js**
```javascript
POST   /api/meeting/create           → createRoom
GET    /api/meeting/check/:roomCode  → checkRoom
GET    /api/meeting/rooms            → getAllRooms
DELETE /api/meeting/room/:roomCode   → deleteRoom
POST   /api/meeting/token            → getToken
```

### 5️⃣ Middleware Layer

**requestLogger.js**
- Logs: `[METHOD] URL - STATUS_CODE - DURATION_MS`

**errorHandler.js**
- Catches all errors
- Formats error response
- Shows stack trace in development mode

### 6️⃣ Utility Layer

**roomCode.js**
- `generateRoomCode()` → Generate xxx-yyyy-zzz format
- `isValidRoomCode(code)` → Validate format
- `sanitizeRoomCode(code)` → Lowercase & trim

**response.js**
- `successResponse(data, message)`
- `errorResponse(message, error)`
- `paginatedResponse(data, page, limit, total)`

## 🔐 Data Models

### Room Model
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

### Token Response Model
```javascript
{
  token: "eyJhbGciOiJIUzI1NiIs...",
  identity: "user123",
  name: "John Doe",
  roomCode: "abc-defg-hij"
}
```

## 📡 API Response Format

### Success Response
```javascript
{
  success: true,
  message: "Operation successful",
  data: { ... }
}
```

### Error Response
```javascript
{
  success: false,
  message: "Error description",
  error: "Detailed error (dev only)"
}
```

## 🧹 Cleanup Mechanism

```javascript
// Every 5 minutes
setInterval(() => {
  roomService.cleanupOldRooms(1 hour);
}, 5 minutes);
```

**Cleanup Rules:**
- Remove rooms older than 1 hour
- Remove rooms with 0 participants
- Log cleanup actions

## 🔄 Backward Compatibility

Old endpoints still work:
- `GET /getToken` → Redirects to new token service
- `GET /checkRoom` → Redirects to new room service

## 🎨 Design Patterns Used

1. **Singleton Pattern** - All services are singleton instances
2. **MVC Pattern** - Separation of concerns (Model-View-Controller)
3. **Factory Pattern** - Token creation in TokenService
4. **Repository Pattern** - RoomStore acts as repository
5. **Middleware Pattern** - Express middleware chain

## 🚀 Benefits of Refactoring

### Before (server.js - monolithic)
- ❌ All logic in one file (261 lines)
- ❌ Mixed concerns
- ❌ Hard to test
- ❌ Difficult to maintain
- ❌ No clear structure

### After (modular structure)
- ✅ Clear separation of concerns
- ✅ Easy to test individual modules
- ✅ Maintainable and scalable
- ✅ Standard Node.js structure
- ✅ Reusable services
- ✅ Better error handling
- ✅ Request logging
- ✅ Configuration management

## 📈 Performance Considerations

- **In-memory Map**: Fast O(1) lookups for rooms
- **Singleton Services**: No repeated instantiation
- **Cleanup Task**: Prevents memory leaks from old rooms
- **Middleware**: Minimal overhead for logging

## 🔮 Future Improvements

1. **Database Integration** - Replace Map with Redis/MongoDB
2. **Authentication Middleware** - JWT validation
3. **Rate Limiting** - Prevent abuse
4. **WebSocket Support** - Real-time updates
5. **Unit Tests** - Jest/Mocha test suite
6. **API Documentation** - Swagger/OpenAPI
7. **Docker Support** - Containerization
8. **Monitoring** - Prometheus metrics
