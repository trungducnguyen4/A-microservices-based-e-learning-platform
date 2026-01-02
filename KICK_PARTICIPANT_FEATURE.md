# Chức năng Kick Participant

## 📋 Tổng quan

Chức năng cho phép **Host** (giáo viên/người tạo phòng) kick (đuổi) participant (học sinh) khỏi phòng meeting.

## 🔐 Quyền hạn

- ✅ **CHỈ HOST** mới có quyền kick participants
- ❌ Không thể kick chính host
- ❌ Participants thường không thể kick ai

## 🏗️ Kiến trúc Implementation

### Backend (ClassroomService)

#### 1. **Service Layer** (`room.service.js`)

**Method:** `kickParticipant(roomCode, hostUserId, targetIdentity)`

**Logic:**
```javascript
1. Kiểm tra room tồn tại
2. Xác thực hostUserId === room.host_user_id
3. Lấy thông tin participant bị kick
4. Không cho phép kick host
5. Đánh dấu participant left_at = NOW() trong database
6. Log event PARTICIPANT_KICKED
7. Gọi LiveKit API để disconnect participant
8. Trả về kết quả
```

**Tính năng:**
- ✅ Kiểm tra quyền host nghiêm ngặt
- ✅ Bảo vệ host khỏi bị kick
- ✅ Sử dụng LiveKit RoomServiceClient.removeParticipant()
- ✅ Fallback: Nếu LiveKit API fail, vẫn remove từ database
- ✅ Log đầy đủ vào room_events

#### 2. **Controller Layer** (`meeting.controller.js`)

**Endpoint:** `POST /api/meeting/kick-participant`

**Request Body:**
```json
{
  "roomCode": "ABC-DEFG-HIJ",
  "hostUserId": "123",
  "targetIdentity": "John Doe"
}
```

**Response Success (200):**
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

**Error Responses:**
- `400` - Missing required fields
- `403` - Only host can kick participants
- `404` - Room not found / Participant not found
- `400` - Cannot kick the host
- `500` - Server error

#### 3. **Routes** (`meeting.routes.js`)

```javascript
router.post('/kick-participant', (req, res) => 
  meetingController.kickParticipant(req, res)
);
```

### Frontend (Client)

#### 1. **API Service** (`classroomApi.ts`)

```typescript
kickParticipant: async (
  roomCode: string, 
  hostUserId: string, 
  targetIdentity: string
) => {
  const response = await classroomApi.post('/api/meeting/kick-participant', {
    roomCode,
    hostUserId,
    targetIdentity,
  });
  return response.data;
}
```

#### 2. **useClassroom Hook**

**Method:** `kickParticipant(targetIdentity: string)`

**Logic:**
```typescript
1. Kiểm tra isLocalUserHost
2. Kiểm tra params.userId tồn tại
3. Gọi API kickParticipant
4. Cập nhật participants list (remove kicked participant)
5. Unpin nếu đang pin participant bị kick
6. Hiển thị error nếu có
```

#### 3. **UI Components** (trong `renderRemoteParticipants`)

**Nút Kick:**
- 🎨 Icon: Exit/logout icon (đỏ)
- 📍 Vị trí: Top-right, bên trái nút Pin
- 👀 Hiển thị: Chỉ khi hover và user là host
- 🚫 Không hiển thị: Khi xem video của host
- ✅ Confirm: Alert "Kick {name} from the room?"

**Code:**
```javascript
// Chỉ hiển thị cho host, không cho kick host
const isLocalHost = params.userId === currentHostUserId;
if (isLocalHost && !isHost) {
  // Render kick button
  kickButton.onclick = async (e) => {
    if (confirm(`Kick ${participant.identity} from the room?`)) {
      await classroomService.kickParticipant(...);
    }
  };
}
```

#### 4. **Disconnect Event Handler**

Khi participant bị kick, họ nhận LiveKit disconnect event:

```typescript
r.on(RoomEvent.Disconnected, (reason?: any) => {
  const reasonStr = String(reason || '');
  if (reasonStr.includes('PARTICIPANT_REMOVED') || reasonStr.includes('removed')) {
    setError("You have been removed from the room by the host");
    clearRoomSession(params.roomName);
    navigate('/meet', { replace: true });
  }
});
```

## 📊 Database Schema

**Table: room_events**

Mỗi lần kick được log:
```sql
event_type: 'PARTICIPANT_KICKED'
actor_user_id: hostUserId
payload: {
  kickedIdentity: "John Doe",
  kickedDisplayName: "John Doe", 
  kickedUserId: "456",
  kickedBy: "123"
}
```

## 🔄 Flow hoàn chỉnh

### 1️⃣ Host kick participant:

```
1. Host hover vào participant video
2. Thấy nút kick (đỏ) + nút pin
3. Click kick → Confirm dialog
4. Frontend gọi POST /api/meeting/kick-participant
5. Backend:
   - Kiểm tra quyền host ✅
   - Remove khỏi database
   - Log event
   - Gọi LiveKit API disconnect
6. LiveKit disconnect participant khỏi room
7. Frontend cập nhật UI (remove khỏi participants list)
```

### 2️⃣ Participant bị kick nhận:

```
1. LiveKit gửi RoomEvent.Disconnected
2. Frontend check reason contains 'PARTICIPANT_REMOVED'
3. Hiển thị message "You have been removed by the host"
4. Clear session data
5. Navigate về /meet sau 2 giây
```

## 🛡️ Security & Validation

### Backend:
- ✅ Kiểm tra host_user_id trong database (source of truth)
- ✅ Không cho kick host
- ✅ Xác thực room tồn tại
- ✅ Xác thực participant tồn tại trong room

### Frontend:
- ✅ Chỉ hiển thị nút kick cho host
- ✅ Confirm trước khi kick
- ✅ Handle errors gracefully
- ✅ Update UI optimistically

## 🧪 Testing

### Manual Test:

1. **Setup:**
   - User A: Tạo room (host)
   - User B: Join room (participant)

2. **Test Kick:**
   ```
   ✅ User A hover vào video của User B → thấy nút kick
   ✅ User A click kick → confirm → User B bị disconnect
   ✅ User B thấy message "You have been removed..."
   ✅ User B redirect về /meet
   ```

3. **Test Permission:**
   ```
   ✅ User B không thấy nút kick khi hover vào video
   ❌ User B gọi API kick trực tiếp → 403 Forbidden
   ❌ User A không thể kick chính mình
   ```

### API Test (curl):

```bash
# Success case
curl -X POST http://localhost:8888/api/classrooms/api/meeting/kick-participant \
  -H "Content-Type: application/json" \
  -d '{
    "roomCode": "ABC-DEFG-HIJ",
    "hostUserId": "1",
    "targetIdentity": "Student 1"
  }'

# Error case: Non-host trying to kick
curl -X POST http://localhost:8888/api/classrooms/api/meeting/kick-participant \
  -H "Content-Type: application/json" \
  -d '{
    "roomCode": "ABC-DEFG-HIJ",
    "hostUserId": "2",
    "targetIdentity": "Student 1"
  }'
# Expected: 403 Forbidden
```

## 📝 Notes

1. **LiveKit API:**
   - Sử dụng `RoomServiceClient.removeParticipant(roomCode, identity)`
   - Cần LIVEKIT_API_KEY và LIVEKIT_API_SECRET

2. **Fallback:**
   - Nếu LiveKit API fail, participant vẫn bị remove khỏi database
   - Client sẽ thấy họ không còn trong participants list
   - Có thể cần refresh để hoàn toàn disconnect

3. **Event Logging:**
   - Tất cả kick actions được log vào `room_events`
   - Có thể audit history sau này

## 🎯 Future Enhancements

- [ ] Ban participant (không cho join lại)
- [ ] Kick with reason/message
- [ ] Bulk kick multiple participants
- [ ] Temporary kick (timed ban)
- [ ] Admin dashboard to view kick history
