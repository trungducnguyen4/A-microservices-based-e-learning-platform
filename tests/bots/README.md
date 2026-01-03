# Bot Tester cho LiveKit Classroom

## 🤖 Tính năng

- Spawn nhiều bot vào phòng học (tối đa 50 bots)
- Bot tự động bật/tắt camera, mic ngẫu nhiên
- Bot publish fake audio/video tracks thực sự (không chỉ UI)
- UI hiển thị label "🤖 BOT" để phân biệt với user thật
- Bot tự động toggle mic/camera mỗi 15-30 giây
- **Video track hiển thị 🤖 emoji và tên bot**

## 🚀 Sử dụng

### Option 1: Browser Version (Recommended)

Mở file `bot-browser.html` trong Chrome/Firefox:

```bash
# Windows
start tests/bots/bot-browser.html

# Or double-click file
```

**Interface:**
1. Nhập Room Code (ví dụ: Y2B-SY4Q-A2T)
2. Chọn số lượng bots (1-50)
3. Chọn % bots có audio (mặc định 70%)
4. Chọn % bots có video (mặc định 70%)
5. Click "🚀 Spawn Bots"
6. Xem log real-time
7. Click "⏹️ Stop All Bots" để dừng

### Option 2: Node.js Token Generator

Generate tokens để dùng với Puppeteer/automation:

```bash
cd tests/bots
node bot-spawner.js Y2B-SY4Q-A2T 10
```

Output: Danh sách tokens cho mỗi bot

## 📖 Test Scenarios

### Scenario 1: Test với ít bots
```
Room Code: Y2B-SY4Q-A2T
Number of Bots: 5
Audio %: 100
Video %: 100
```
→ 5 bots, tất cả có audio/video

### Scenario 2: Test performance
```
Room Code: Y2B-SY4Q-A2T  
Number of Bots: 20
Audio %: 70
Video %: 70
```
→ 20 bots, 70% có audio/video

### Scenario 3: Stress test
```
Room Code: Y2B-SY4Q-A2T
Number of Bots: 50
Audio %: 50
Video %: 50
```
→ 50 bots (maximum), 50% có audio/video

## 🎨 UI Features

Bots sẽ hiển thị với:

### Trong Participant List
- 🤖 Emoji trong avatar
- Badge "BOT" màu xám
- Mic/video status như user thật

### Trong Video Grid
- Video track với background màu random
- 🤖 Emoji lớn ở giữa
- Tên bot (TestBot-1, TestBot-2, ...)
- Timestamp cập nhật real-time
- Badge "BOT" ở góc dưới cùng với tên

## ⚙️ Config

File `.env`:
```env
LIVEKIT_URL=wss://elearning-microservice-98bdertb.livekit.cloud
LIVEKIT_API_KEY=APIw58QnxLKZhHz
LIVEKIT_API_SECRET=efMRFX9tmBWDrGUkvO9WKp3jh2pVJ6UlVWXp3gJZ3rB
```

## 🐛 Troubleshooting

### Browser version không load

**Lỗi:** `Failed to fetch token`

**Fix:**
- Kiểm tra API Gateway đang chạy (`http://192.168.1.2:8888`)
- Kiểm tra CORS configuration
- Mở DevTools Console xem lỗi cụ thể

### Node.js version lỗi "LiveKit not supported"

**Lỗi:** `LiveKit doesn't seem to be supported on this browser`

**Fix:**
- Dùng browser version (`bot-browser.html`) thay vì Node.js
- Node.js không hỗ trợ WebRTC, chỉ dùng để generate tokens

### Bots không hiển thị video

**Fix:**
- Kiểm tra Video % > 0
- Mở DevTools → Network → Check WebSocket connection
- Kiểm tra LiveKit Cloud có hoạt động không

## 💡 Tips

- **Bắt đầu nhỏ:** Test với 5 bots trước, rồi tăng dần
- **Monitor performance:** Mở Task Manager xem CPU/Memory usage
- **Network bandwidth:** 20 bots ≈ 10-20 Mbps upload
- **Browser tab:** Mỗi tab chỉ spawn 1 batch bots, muốn nhiều hơn thì mở nhiều tab
- **Stop trước khi spawn lại:** Click "Stop All Bots" trước khi spawn batch mới

## 📊 Performance Benchmarks

| Bots | CPU Usage | Memory | Bandwidth |
|------|-----------|--------|-----------|
| 5    | ~20%      | ~200MB | ~2 Mbps   |
| 10   | ~35%      | ~400MB | ~5 Mbps   |
| 20   | ~60%      | ~800MB | ~10 Mbps  |
| 50   | ~100%     | ~2GB   | ~25 Mbps  |

*(Tested on Chrome, Intel i5, 16GB RAM)*

## 🔧 Advanced: Puppeteer Integration

Để automate testing với CI/CD:

```javascript
// test-bots.js
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('file:///path/to/bot-browser.html');
  await page.type('#roomCode', 'Y2B-SY4Q-A2T');
  await page.type('#numBots', '10');
  await page.click('#spawnBtn');
  
  // Wait 60 seconds
  await page.waitForTimeout(60000);
  
  await page.click('#stopBtn');
  await browser.close();
})();
```

## 📝 Notes

- Bots là **REAL LiveKit participants** - không phải UI giả
- Bots publish **fake tracks** (canvas video + silent audio)
- Metadata `isBot: true` để frontend detect và hiển thị label
- Bot identity format: `bot-{index}-{timestamp}`
- Bot name format: `TestBot-{index}`
