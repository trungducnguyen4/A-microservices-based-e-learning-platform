# 🔧 Cập nhật cấu hình cho IP mới và Domain

## 📋 Các thay đổi đã thực hiện

### 1. **API Gateway CORS Configuration** 
   - **File:** `ApiGateway/src/main/java/org/tduc/apigateway/config/CorsConfig.java`
   - **Thay đổi:** Thêm IP mới `3.26.171.51` và domain `academihub.site` vào danh sách allowed origins
   - **Chi tiết:** 
     ```
     - http://3.26.171.51
     - http://3.26.171.51:*
     - http://academihub.site
     - http://academihub.site:*
     - https://academihub.site
     - https://academihub.site:*
     ```

### 2. **API Gateway YAML Config**
   - **File:** `ApiGateway/src/main/resources/application.yml`
   - **Thay đổi:** Cập nhật `allowedOrigins` trong global CORS configuration

### 3. **Nginx Configuration**
   - **File:** `client/nginx.conf`
   - **Thay đổi:** Thêm server names
     ```
     server_name localhost academihub.site www.academihub.site 3.26.171.51;
     ```

### 4. **Frontend Environment Files**
   - **File:** `client/.env.production`
   - **Thay đổi:** Cập nhật API base URL từ localhost thành academihub.site
     ```
     VITE_API_BASE=http://academihub.site/api
     ```

### 5. **Vite Configuration**
   - **File:** `client/vite.config.ts`
   - **Thay đổi:** Thêm proxy configuration cho API calls trong development mode

---

## 🚀 Các bước tiếp theo

### **1. Rebuild Docker Images**
```bash
docker-compose down
docker-compose build --no-cache
```

### **2. Cập nhật environment variables**
Nếu bạn có `.env` file, hãy cập nhật:
```env
DB_HOST=your-rds-endpoint.amazonaws.com
DB_USER=admin
DB_PASSWORD=your_password
JWT_SECRET=your-very-secure-jwt-secret-key-here
```

### **3. Deploy với domain mới**
```bash
docker-compose up -d
```

---

## 🔒 SSL Certificate Issue

Lỗi `ERR_CERT_COMMON_NAME_INVALID` xảy ra vì:
- Bạn đang gọi `http://localhost:8888` từ domain `academihub.site`
- Browser không tin certificate của localhost
- **Giải pháp:** 
  - Sử dụng `http://` (không HTTPS) hoặc
  - **Cấp SSL certificate hợp lệ** cho domain `academihub.site`:
    ```bash
    # Dùng Let's Encrypt + Certbot
    sudo certbot certonly --standalone -d academihub.site -d www.academihub.site
    ```
  - Cập nhật Nginx config để sử dụng SSL certificate

---

## 📝 Nginx SSL Configuration (Optional - for HTTPS)

```nginx
server {
    listen 443 ssl http2;
    server_name academihub.site www.academihub.site 3.26.171.51;
    
    ssl_certificate /etc/letsencrypt/live/academihub.site/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/academihub.site/privkey.pem;
    
    # ... rest of config
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name academihub.site www.academihub.site 3.26.171.51;
    return 301 https://$host$request_uri;
}
```

---

## ✅ Kiểm tra

1. **Test CORS:**
   ```bash
   curl -H "Origin: http://academihub.site" \
        -H "Access-Control-Request-Method: GET" \
        http://3.26.171.51:8888/api/users/auth/verify
   ```

2. **Kiểm tra gateway health:**
   ```bash
   curl http://3.26.171.51:8888/actuator/health
   ```

3. **Trực tiếp truy cập:** 
   - `http://academihub.site` - Frontend
   - `http://academihub.site/api/users/auth/login` - API Gateway

---

## ⚠️ Important Notes

- **HTTP vs HTTPS:** Hiện tại cấu hình là HTTP. Nếu muốn HTTPS, cần SSL certificate hợp lệ
- **Docker Network:** Services giao tiếp qua internal Docker network, không bị ảnh hưởng bởi domain change
- **Vite Proxy:** Chỉ hoạt động khi chạy `npm run dev`. Build production sẽ sử dụng `VITE_API_BASE` từ `.env.production`
