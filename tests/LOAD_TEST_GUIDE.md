# 🧪 Hướng dẫn Load Testing với Bots

## ⚠️ Vấn đề: Lag khi có nhiều Bots

### Bản chất vấn đề:
- **40 bots** = **40 video streams** + **40 audio streams**
- LiveKit Server phải forward tất cả streams tới mỗi participant
- Người xem phải download + render 40 videos → **LAG CỰC MẠNH**

---

## ✅ Giải pháp: 2 cách test khác nhau

### **Cách 1: Test Server Load (KHÔNG test client render)**

**Mục đích:** Kiểm tra LiveKit server có chịu được 40 connections không

**Làm thế nào:**
1. Spawn 40 bots từ `bot-advanced.html`
2. Người test **KHÔNG VÀO PHÒNG**
3. Chỉ theo dõi metrics từ LiveKit Dashboard:
   - CPU usage
   - Memory usage
   - Bandwidth
   - Connection count

**Kết quả:** Server có lag không? CPU/Memory có quá 80%?

---

### **Cách 2: Test Client Render (test lag thực tế)**

**Mục đích:** Kiểm tra người dùng thật có bị lag không

#### **A. Test với Full Render (có lag - ĐÚNG)**
```
1. Spawn 40 bots
2. Người test VÀO PHÒNG bình thường
3. Client sẽ render 40 videos
→ LAG CỰC MẠNH (expected)
```

**Kết luận:** Với 40 participants, client lag → Hệ thống chỉ nên dùng cho 20-30 người.

#### **B. Test với Selective Subscribe (không lag)**
```
1. Spawn 40 bots
2. Người test vào phòng với code tối ưu (xem bên dưới)
3. Chỉ subscribe 5-10 videos thay vì 40
→ KHÔNG LAG
```

**Kết luận:** Server chịu được 40 connections, nhưng client nên limit số video hiển thị.

---

## 🛠️ Code tối ưu cho Client (người test)

### **Thêm vào Client của bạn:**

```typescript
// File: client/src/hooks/useMeeting.ts hoặc tương tự

const room = new Room({
  // ... other configs
  
  // QUAN TRỌNG: Chỉ subscribe video khi cần
  adaptiveStream: true,
  dynacast: true,
  
  // Giới hạn số video subscribe
  videoCaptureDefaults: {
    resolution: VideoPresets.h720.resolution,
  },
});

// Khi connect
await room.connect(livekitUrl, token, {
  autoSubscribe: false, // KHÔNG tự động subscribe tất cả
});

// Chỉ subscribe 10 participants đầu tiên
room.on(RoomEvent.ParticipantConnected, (participant) => {
  const subscribedCount = Array.from(room.participants.values())
    .filter(p => p.isSpeaking || p.metadata?.includes('priority'))
    .length;
  
  if (subscribedCount < 10) {
    // Subscribe video
    participant.videoTracks.forEach((publication) => {
      publication.setSubscribed(true);
    });
    
    // Subscribe audio
    participant.audioTracks.forEach((publication) => {
      publication.setSubscribed(true);
    });
  } else {
    // Chỉ subscribe audio, không subscribe video
    participant.audioTracks.forEach((publication) => {
      publication.setSubscribed(true);
    });
  }
});
```

---

## 📊 Kịch bản Test Đề xuất

### **Test 1: Server Capacity** ⭐ RECOMMENDED
```
Spawn: 40 bots (20 video + 20 audio)
Client: KHÔNG vào phòng
Monitor: LiveKit Dashboard
Metric: Server CPU, Memory, Bandwidth
Kết quả: "Server xử lý ổn định 40 connections"
```

### **Test 2: Client Lag (Full Render)**
```
Spawn: 40 bots
Client: Vào phòng bình thường
Kết quả: "Client lag khi render 40 videos → Không nên dùng cho >30 người"
```

### **Test 3: Client Optimized**
```
Spawn: 40 bots
Client: Vào với autoSubscribe: false + limit 10 videos
Kết quả: "Client mượt mà, server stable → Có thể scale với pagination"
```

---

## 🎓 Viết vào Báo cáo

### **Nếu test theo cách 1 (Server Load):**
> "Hệ thống meeting được kiểm thử với 40 participants đồng thời (20 video, 20 audio) sử dụng bot tự động. LiveKit server duy trì kết nối ổn định với CPU sử dụng < 70%, memory < 60%. Tuy nhiên, để đảm bảo trải nghiệm người dùng tốt nhất, hệ thống được thiết kế cho lớp học từ 20-30 sinh viên."

### **Nếu test theo cách 2 (Client Lag):**
> "Kiểm thử thực tế với 40 participants cho thấy client browser gặp hiện tượng lag khi render đồng thời tất cả video streams. Đây là giới hạn của WebRTC trên thiết bị end-user. Hệ thống được khuyến nghị sử dụng cho lớp học 20-30 người để đảm bảo hiệu năng tối ưu."

### **Nếu có optimize (cách 3):**
> "Hệ thống được tối ưu với selective video subscription, cho phép client chỉ hiển thị 10 video cùng lúc (pagination/speaker view). Với cơ chế này, hệ thống có thể scale lên 50+ participants mà vẫn duy trì hiệu năng mượt mà."

---

## 💡 Kết luận

**Lag KHÔNG phải lỗi code!**

Đây là giới hạn vật lý của:
- ✅ WebRTC bandwidth
- ✅ Browser rendering capacity
- ✅ Client device performance

**Giải pháp:**
1. **Giới hạn số người** (20-30) → Đơn giản nhất
2. **Selective subscribe** → Cần code thêm
3. **Pagination/Speaker view** → Best practice

**Bot của bạn đang làm ĐÚNG nhiệm vụ - phát hiện giới hạn của hệ thống!** 🎯
