# 🚪 E-Learning API Gateway

API Gateway cho hệ thống E-Learning Platform sử dụng Spring Cloud Gateway.

## 🎯 Tính năng chính

### ✅ Đã triển khai:
- **🔐 JWT Authentication** - Xác thực tất cả request
- **🛡️ Authorization** - Phân quyền dựa trên role
- **🚦 Rate Limiting** - Giới hạn số request per user
- **📊 Request Logging** - Log tất cả request/response
- **🔄 Load Balancing** - Cân bằng tải giữa các service
- **🌐 CORS Support** - Hỗ trợ Cross-Origin requests
- **❤️ Health Checks** - Monitoring sức khỏe services

### 🎯 Route Configuration:

| Route | Service | Port | Rate Limit | Auth Required |
|-------|---------|------|------------|---------------|
| `/api/users/**` | User Service | 8080 | 10/sec | ❌ Login/Register |
| `/api/homework/**` | Homework Service | 8081 | 10/sec | ✅ Required |
| `/api/schedules/**` | Schedule Service | 8082 | 10/sec | ✅ Required |
| `/api/classrooms/**` | Classroom Service | 3000 | 10/sec | ✅ Required |
| `/api/files/**` | File Service | 3001 | 5/sec | ✅ Required |

## 🔧 Cấu hình

### Environment Variables:
```bash
SPRING_PROFILES_ACTIVE=docker
SPRING_REDIS_HOST=redis
JWT_SECRET=your-jwt-secret
SERVER_PORT=8888
```

### Public Endpoints (Không cần Auth):
- `POST /api/users/login`
- `POST /api/users/register`
- `GET /actuator/health`
- `GET /api/public/**`

## 🚀 Usage

### 1. Từ Frontend:
```javascript
// Tất cả API calls đều thông qua Gateway
const API_BASE = 'http://localhost:8888';

// Login (không cần token)
fetch(`${API_BASE}/api/users/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});

// Các API khác (cần JWT token)
fetch(`${API_BASE}/api/homework`, {
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json' 
  }
});
```

### 2. Request Headers được Gateway thêm vào:
```
X-User-Id: 123
X-User-Role: STUDENT
X-User-Username: student1
X-Request-ID: uuid
X-Request-Time: timestamp
```

## 🔒 Security Features

### JWT Authentication:
- Validate JWT token từ Authorization header
- Extract user info và add vào request headers
- Reject invalid/expired tokens

### Rate Limiting:
- **API thường**: 10 requests/second
- **File uploads**: 5 requests/second
- Sử dụng Redis để track limits

### CORS Policy:
- Allow origins: `http://localhost`, `http://localhost:3000`
- Allow methods: GET, POST, PUT, DELETE, OPTIONS
- Allow credentials: true

## 📊 Monitoring

### Health Check:
```bash
curl http://localhost:8888/actuator/health
```

### Gateway Routes:
```bash
curl http://localhost:8888/actuator/gateway/routes
```

### Metrics:
```bash
curl http://localhost:8888/actuator/metrics
```

## 🐛 Troubleshooting

### Common Issues:

1. **401 Unauthorized:**
   - Check JWT token trong Authorization header
   - Verify JWT secret khớp với User Service

2. **429 Too Many Requests:**
   - Rate limit exceeded
   - Wait hoặc tăng rate limit config

3. **504 Gateway Timeout:**
   - Service backend không phản hồi
   - Check service health: `docker-compose ps`

### Debug Commands:
```bash
# View Gateway logs
docker-compose logs api-gateway

# Check Redis connection
docker-compose exec redis redis-cli ping

# Test route manually
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:8888/api/users/profile
```

## 🔧 Development

### Local Development:
```bash
# Run gateway với profile development
mvn spring-boot:run -Dspring-boot.run.profiles=development
```

### Docker Build:
```bash
# Build image
docker build -t e-learning-gateway .

# Run container
docker run -p 8888:8888 \
  -e SPRING_PROFILES_ACTIVE=docker \
  -e SPRING_REDIS_HOST=redis \
  e-learning-gateway
```

---

**🎯 API Gateway là điểm truy cập duy nhất cho tất cả API calls!**