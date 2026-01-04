# HTTPS Setup với mkcert - Tự động detect IP

## 🎯 Tính năng

Script tự động:
- ✅ Detect IP mạng hiện tại (192.168.x.x)
- ✅ Generate SSL certificate cho localhost + IP hiện tại
- ✅ Tự động cài mkcert nếu chưa có (qua Chocolatey)
- ✅ Vite auto-load certificate nếu có sẵn
- ✅ Không cần cài lại khi IP thay đổi - chỉ chạy lại script

---

## 📦 Cài đặt lần đầu

### Bước 1: Chạy script setup HTTPS

```powershell
# Trong thư mục client/
.\setup-https.ps1
```

Script sẽ tự động:
1. Kiểm tra và cài mkcert (nếu chưa có)
2. Detect IP hiện tại của bạn
3. Generate certificate cho: localhost, 127.0.0.1, và IP hiện tại
4. Lưu IP vào file `.current-ip.txt`

### Bước 2: Start dev server

```powershell
npm run dev
```

Truy cập tại:
- **HTTPS**: `https://192.168.1.2:5173` (hoặc IP hiện tại của bạn)
- **HTTP**: `http://localhost:5173` (fallback)

---

## 🔄 Khi IP thay đổi

**KHÔNG cần cài lại mkcert!** Chỉ cần:

```powershell
# 1. Re-generate certificate với IP mới
.\setup-https.ps1

# 2. Restart dev server
npm run dev
```

Script sẽ tự động:
- Detect IP mới
- Xóa cert cũ
- Generate cert mới với IP mới
- Update `.current-ip.txt`

---

## 🔧 Cấu hình nâng cao

### Override API Gateway URL

```powershell
# Nếu API Gateway không phải localhost:8888
$env:VITE_API_GATEWAY="http://192.168.1.5:8888"
npm run dev
```

### Override Port

```powershell
# Nếu muốn dùng port khác
$env:VITE_PORT=3000
npm run dev
```

### Tắt HTTPS (dùng HTTP)

```powershell
# Xóa certificate files
Remove-Item dev-cert*.pem

# Vite sẽ tự động fallback về HTTP
npm run dev
```

---

## 📁 Files được tạo

```
client/
├── setup-https.ps1          # Script setup tự động
├── dev-cert.pem             # SSL certificate (auto-generated)
├── dev-cert-key.pem         # Private key (auto-generated)
└── .current-ip.txt          # IP hiện tại (auto-generated)
```

**Lưu ý**: Các file `*.pem` và `.current-ip.txt` đã được add vào `.gitignore`

---

## 🐛 Troubleshooting

### 1. Lỗi "mkcert command not found" sau khi cài

**Nguyên nhân**: PATH chưa được refresh

**Giải pháp**:
```powershell
# Đóng và mở lại PowerShell
# Hoặc refresh PATH:
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
```

### 2. Browser báo "Not Secure" dù đã có HTTPS

**Nguyên nhân**: Root CA chưa được tin tưởng

**Giải pháp**:
```powershell
mkcert -install
```

Restart browser sau đó.

### 3. Không detect được IP 192.168.x.x

**Nguyên nhân**: Đang dùng Ethernet hoặc WiFi không phải 192.168.x.x

**Giải pháp**: Script sẽ fallback về localhost. Hoặc sửa script để detect IP range khác:
```powershell
# Trong setup-https.ps1, sửa dòng:
$networkIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.InterfaceAlias -notlike "*Loopback*" -and 
    $_.IPAddress -like "10.0.*"  # Thay đổi pattern ở đây
} | Select-Object -First 1).IPAddress
```

### 4. API Gateway connection refused

**Kiểm tra**:
- API Gateway có đang chạy ở `localhost:8888`?
- Nếu Gateway ở IP khác, set: `$env:VITE_API_GATEWAY="http://192.168.1.5:8888"`

---

## 🏗️ Architecture

```
Browser (https://192.168.1.2:5173)
    ↓ HTTPS (mkcert cert)
Vite Dev Server (port 5173)
    ↓ Proxy /api/* → http://localhost:8888/api/*
API Gateway (port 8888)
    ↓ Route requests
[UserService, ClassroomService, FileService, etc.]
    ↓ Connect to
MySQL Database (port 3306)
```

**Lưu ý về kết nối**:
- Frontend ↔ API Gateway: Qua Vite proxy (HTTP/HTTPS)
- API Gateway ↔ Services: HTTP nội bộ
- Services ↔ Database: JDBC connection (không cần HTTPS cho local dev)

---

## ✅ Checklist

- [ ] Đã cài mkcert (chạy `.\setup-https.ps1`)
- [ ] Đã có file `dev-cert.pem` và `dev-cert-key.pem`
- [ ] Vite dev server chạy thành công với HTTPS
- [ ] Có thể truy cập `https://192.168.1.2:5173` (hoặc IP của bạn)
- [ ] Browser không báo "Not Secure"
- [ ] API calls đến `/api/*` được proxy đến Gateway thành công

---

## 📚 Tài liệu tham khảo

- [mkcert GitHub](https://github.com/FiloSottile/mkcert)
- [Vite Server Options](https://vitejs.dev/config/server-options.html)
- [Vite Proxy Guide](https://vitejs.dev/config/server-options.html#server-proxy)
