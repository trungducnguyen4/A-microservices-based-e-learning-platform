# API Gateway Integration - Quick Start

## 🚀 Khởi động các service

### 1. API Gateway (Port 8888)
```bash
cd ApiGateway
mvn spring-boot:run
```

### 2. ClassroomService (Port 4000)
```bash
cd ClassroomService
npm install
npm start
```

### 3. React Client (Port 8081)
```bash
cd client
npm install
npm run dev
```

## 🔗 API Endpoints

Tất cả request từ React client sẽ đi qua API Gateway:

### Classroom Service (via API Gateway)
- `GET http://localhost:8888/api/classrooms/getToken` - Get LiveKit token
- `GET http://localhost:8888/api/classrooms/checkRoom` - Check if room exists
- `POST http://localhost:8888/api/classrooms/rooms` - Create new room
- `GET http://localhost:8888/api/classrooms/rooms/:roomName` - Get room info
- `GET http://localhost:8888/api/classrooms/health` - Health check

### Direct Access (không khuyến khích, dùng cho debug)
- `http://localhost:4000/getToken`
- `http://localhost:4000/checkRoom`

## 📝 Environment Variables

### Client (.env)
```
VITE_API_BASE=http://localhost:8888/api
VITE_ENV=development
```

### ClassroomService (.env)
```
PORT=4000
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
LIVEKIT_URL=wss://your-livekit-url
USER_SERVICE_URL=http://localhost:8080
```

## ✅ Kiểm tra kết nối

1. **API Gateway**: http://localhost:8888/actuator/health
2. **ClassroomService**: http://localhost:4000/health
3. **React Client**: http://localhost:8081

## 🔧 Troubleshooting

### Lỗi CORS
- Kiểm tra `corsOptions` trong `ClassroomService/server.js`
- Đảm bảo API Gateway URL được thêm vào `origin` array

### Lỗi 404 Not Found
- Kiểm tra routes trong `ApiGateway/src/main/resources/application.yml`
- Đảm bảo ClassroomService đang chạy trên port 4000

### Lỗi Authentication
- Kiểm tra JWT token trong localStorage
- Kiểm tra header `Authorization` trong request
