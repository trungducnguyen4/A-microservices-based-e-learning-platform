# Cấu hình Google Calendar API

Để sử dụng tính năng đồng bộ lịch tự động với Google Calendar, bạn cần:

## 1. Tạo Google Cloud Project

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. Ghi nhớ Project ID

## 2. Bật Google Calendar API

1. Trong Google Cloud Console, vào **APIs & Services** > **Library**
2. Tìm kiếm "Google Calendar API"
3. Click vào và nhấn **Enable**

## 3. Tạo OAuth 2.0 Client ID

1. Vào **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Chọn loại **Web application**
4. Đặt tên cho client (ví dụ: "E-Learning Platform")
5. Thêm **Authorized JavaScript origins**:
   ```
   http://localhost:5173
   http://localhost:8083
   https://yourdomain.com
   ```
6. Click **Create**
7. Sao chép **Client ID** (dạng: `xxxxx.apps.googleusercontent.com`)

## 4. Cấu hình OAuth Consent Screen

1. Vào **APIs & Services** > **OAuth consent screen**
2. Chọn **External** (hoặc Internal nếu trong tổ chức)
3. Điền thông tin ứng dụng:
   - App name: E-Learning Platform
   - User support email: your-email@gmail.com
   - Developer contact: your-email@gmail.com
4. Trong **Scopes**, thêm:
   - `https://www.googleapis.com/auth/calendar.events`
5. Thêm Test users (nếu app chưa publish):
   - Thêm email của các giáo viên/học sinh test

## 5. Cấu hình Environment Variables

Tạo file `.env` trong thư mục `client/`:

```env
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

## 6. Publish App (Production)

Để dùng cho tất cả user, cần publish app:

1. Vào **OAuth consent screen**
2. Click **Publish App**
3. Submit for verification (nếu cần nhiều quyền)

## 7. Kiểm tra

1. Chạy frontend:
   ```powershell
   cd client
   npm run dev
   ```

2. Vào trang khóa học: `http://localhost:5173/course/{id}`

3. Click nút **"Đồng bộ Google Calendar"**

4. Đăng nhập Google và cho phép truy cập Calendar

5. Tất cả lịch dạy/học sẽ được tự động thêm vào Google Calendar

## Lưu ý quan trọng

- **Token expiration**: Token OAuth sẽ hết hạn sau 1 giờ. User cần đăng nhập lại.
- **Quotas**: Google Calendar API có giới hạn 1 triệu requests/ngày (Free tier).
- **Batch operations**: Hiện tại sync từng event một (có thể tối ưu bằng batch API).
- **Domain verification**: Nếu deploy production, cần verify domain trong Google Cloud Console.

## Tối ưu cho Production

Để tối ưu hơn, bạn có thể:

1. **Lưu refresh token trên backend**:
   - User grant permission một lần
   - Backend tự động sync mỗi khi có lịch mới
   - Không cần user click "Đồng bộ" mỗi lần

2. **Webhook notifications**:
   - Dùng Google Calendar Push Notifications
   - Tự động cập nhật khi user thay đổi trên Calendar

3. **iCalendar feed**:
   - Tạo `.ics` endpoint
   - User subscribe một lần, tự động sync

Bạn muốn implement giải pháp nào?
