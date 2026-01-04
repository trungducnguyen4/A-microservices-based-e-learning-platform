# HƯỚNG DẪN SETUP HTTPS CHO EC2 + HOSTINGER DOMAIN

## ✅ BƯỚC 1: MỞ PORT TRÊN EC2 SECURITY GROUP

### Thông tin Security Group của bạn:
- **Security Group Name**: launch-wizard-1
- **Security Group ID**: `sg-07a82d8d8608bb9b4`
- **VPC ID**: `vpc-0fe2892f7cd502582`
- **Owner**: 783627368960

### Port hiện đã mở:
| Type | Protocol | Port | Source |
|------|----------|------|--------|
| SSH | TCP | 22 | 0.0.0.0/0 |
| HTTP | TCP | 80 | 0.0.0.0/0 ✅ |
| HTTP | TCP | 80 | ::/0 ✅ |
| HTTPS | TCP | 443 | 0.0.0.0/0 ✅ |
| HTTPS | TCP | 443 | ::/0 ✅ |
| Custom TCP | TCP | 8888 | 0.0.0.0/0 ✅ |

✅ **Tốt rồi! Port 80 & 443 đã mở, có thể tiếp tục bước 2**

### Nếu cần thêm/sửa rule:
1. AWS Console → EC2 → Security Groups
2. Tìm `launch-wizard-1` (sg-07a82d8d8608bb9b4)
3. Tab **Inbound rules** → **Edit inbound rules**
4. Thêm/sửa theo nhu cầu → **Save rules**

### Hoặc dùng AWS CLI:
```bash
# Mở port 80 (nếu chưa có)
aws ec2 authorize-security-group-ingress \
  --group-id sg-07a82d8d8608bb9b4 \
  --protocol tcp --port 80 --cidr 0.0.0.0/0 \
  --region us-east-1

# Mở port 443 (nếu chưa có)
aws ec2 authorize-security-group-ingress \
  --group-id sg-07a82d8d8608bb9b4 \
  --protocol tcp --port 443 --cidr 0.0.0.0/0 \
  --region us-east-1
```

---

## ✅ BƯỚC 2: KIỂM TRA DNS ĐÃ TRỎ ĐÚNG

Trong **Hostinger DNS Settings**, đảm bảo:

```
academihub.site         A    <EC2_ELASTIC_IP>
www.academihub.site     A    <EC2_ELASTIC_IP>
```

### Kiểm tra DNS:
```bash
# Trên máy local hoặc EC2
ping academihub.site
nslookup academihub.site
```

Đợi **5-30 phút** để DNS propagate.

---

## ✅ BƯỚC 3: CÀI NGINX TRÊN EC2

SSH vào EC2:
```bash
ssh -i your-key.pem ec2-user@<EC2_IP>
```

Cài Nginx:
```bash
# Amazon Linux 2023/2
sudo yum update -y
sudo yum install nginx -y

# Hoặc Ubuntu
# sudo apt update
# sudo apt install nginx -y

# Enable & Start
sudo systemctl enable nginx
sudo systemctl start nginx
sudo systemctl status nginx
```

### Kiểm tra:
Mở trình duyệt: `http://<EC2_IP>` → phải thấy trang **Welcome to nginx**

---

## ✅ BƯỚC 4: CÀI CERTBOT (LET'S ENCRYPT)

```bash
# Amazon Linux 2023
sudo yum install certbot python3-certbot-nginx -y

# Ubuntu
# sudo apt install certbot python3-certbot-nginx -y
```

---

## ✅ BƯỚC 5: CẤU HÌNH NGINX CHO ỨNG DỤNG

Tạo file config cho domain:

```bash
sudo nano /etc/nginx/conf.d/academihub.conf
```

Paste nội dung sau:

```nginx
# HTTP - Redirect to HTTPS (sẽ tự động sau khi chạy certbot)
server {
    listen 80;
    server_name academihub.site www.academihub.site;
    
    # Certbot cần path này để verify domain
    location /.well-known/acme-challenge/ {
        root /usr/share/nginx/html;
    }
    
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS - Main Configuration
server {
    listen 443 ssl http2;
    server_name academihub.site www.academihub.site;

    # SSL certificates (Certbot sẽ tự thêm)
    # ssl_certificate /etc/letsencrypt/live/academihub.site/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/academihub.site/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # API Gateway - Backend
    location /api/ {
        proxy_pass http://127.0.0.1:8888;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # WebSocket support
        proxy_read_timeout 86400;
    }

    # Client - Frontend (Vite React)
    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # File uploads
    client_max_body_size 100M;
}
```

**Kiểm tra config:**
```bash
sudo nginx -t
```

**Reload Nginx:**
```bash
sudo systemctl reload nginx
```

---

## ✅ BƯỚC 6: CẤP SSL CERTIFICATE

```bash
sudo certbot --nginx -d academihub.site -d www.academihub.site
```

Certbot sẽ hỏi:
1. **Email**: Nhập email của bạn
2. **Terms of Service**: Chọn `Y` (Yes)
3. **Share email**: Chọn `N` (No)
4. **Redirect HTTP to HTTPS**: Chọn **`2`** (Redirect)

### Certbot sẽ:
- Tự động verify domain qua port 80
- Lấy SSL certificate từ Let's Encrypt
- Tự động sửa file `/etc/nginx/conf.d/academihub.conf` để thêm SSL
- Reload Nginx

---

## ✅ BƯỚC 7: KIỂM TRA HTTPS

### Test trên trình duyệt:
```
https://academihub.site
```

Phải thấy:
- 🔒 **Secure** trong address bar
- Certificate từ **Let's Encrypt**

### Test SSL grade:
```
https://www.ssllabs.com/ssltest/analyze.html?d=academihub.site
```

---

## ✅ BƯỚC 8: TỰ ĐỘNG GIA HẠN SSL

Let's Encrypt SSL chỉ valid **90 ngày**. Certbot đã tự động tạo cronjob để renew.

### Kiểm tra auto-renewal:
```bash
sudo certbot renew --dry-run
```

Nếu OK → SSL sẽ tự động renew trước khi hết hạn.

### Kiểm tra cronjob:
```bash
sudo systemctl list-timers | grep certbot
```

---

## ✅ BƯỚC 9: CẬP NHẬT ỨNG DỤNG ĐỂ SỬ DỤNG HTTPS

### 1. Client (Vite React) - Update API URL

File: `client/src/config/api.ts` hoặc `.env`:

```env
VITE_API_BASE_URL=https://academihub.site/api
```

### 2. ApiGateway - Update CORS

File: `ApiGateway/src/main/resources/application.yml`:

```yaml
# Đã có rồi, chỉ cần đảm bảo có HTTPS origins
```

File: `ApiGateway/src/main/java/org/tduc/apigateway/config/CorsConfig.java`:

```java
// Đã có rồi:
"https://academihub.site",
"https://academihub.site:*",
```

### 3. Rebuild & Restart Docker Containers

```bash
# Rebuild images
docker-compose build

# Restart containers
docker-compose down
docker-compose up -d
```

---

## 🔥 LỖI THƯỜNG GẶP & CÁCH FIX

### ❌ Lỗi: `Connection refused` khi truy cập HTTPS

**Nguyên nhân**: Port 443 chưa mở hoặc Nginx chưa chạy

**Fix**:
```bash
sudo systemctl status nginx
sudo netstat -tlnp | grep :443
```

### ❌ Lỗi: `502 Bad Gateway`

**Nguyên nhân**: Docker containers chưa chạy hoặc port sai

**Fix**:
```bash
docker ps
# Kiểm tra ApiGateway có chạy port 8888 không
```

### ❌ Lỗi: Certbot failed to authenticate

**Nguyên nhân**: 
- Port 80 chưa mở
- DNS chưa trỏ đúng
- Nginx chặn `/.well-known/acme-challenge/`

**Fix**:
```bash
# Test port 80
curl http://academihub.site

# Test DNS
nslookup academihub.site
```

### ❌ Lỗi: SSL certificate not valid

**Nguyên nhân**: Certbot chưa chạy thành công

**Fix**:
```bash
# Xóa cert cũ và thử lại
sudo certbot delete --cert-name academihub.site
sudo certbot --nginx -d academihub.site -d www.academihub.site
```

---

## 📋 CHECKLIST HOÀN CHỈNH

- [ ] Elastic IP đã gắn vào EC2
- [ ] DNS đã trỏ đúng (ping OK)
- [ ] Security Group mở port 80, 443
- [ ] Nginx đã cài và chạy
- [ ] Certbot đã cài
- [ ] File config Nginx đã tạo
- [ ] Docker containers đã chạy
- [ ] Certbot đã chạy thành công
- [ ] HTTPS truy cập được
- [ ] Auto-renewal test OK

---

## 🎯 LỆNH NHANH

```bash
# Check DNS
nslookup academihub.site

# Check Nginx
sudo systemctl status nginx
sudo nginx -t

# Check SSL
sudo certbot certificates

# Check Docker
docker ps

# Renew SSL manually
sudo certbot renew

# View Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

---

**Bước tiếp theo của bạn**: Chạy lệnh Certbot ở BƯỚC 6 👆
