# 🔄 CLIENT API ROUTING FIX

## 🚨 **Vấn đề tìm thấy:**
Client đang gọi trực tiếp tới các microservices thay vì qua API Gateway!

## ✅ **Các file đã được fix:**

### 1. **Core API Configuration**
- `client/src/lib/api.ts`
  - ❌ `HOMEWORK_API_BASE = 'http://localhost:8082/api'`
  - ❌ `FILE_API_BASE = 'http://localhost:5000/api'`
  - ✅ `API_GATEWAY_BASE = 'http://localhost:8888/api'`

### 2. **Individual Page API Calls**

#### **Profile.tsx**
- ❌ `http://localhost:8080/user/profile/${username}`
- ✅ `http://localhost:8888/api/users/profile/${username}`

#### **Register.tsx**  
- ❌ `http://localhost:8080/user/users`
- ✅ `http://localhost:8888/api/users/register`

#### **TeacherDashboard.tsx**
- ❌ `http://localhost:3636/schedule/${userId}`
- ✅ `http://localhost:8888/api/schedules/${userId}`
- ❌ `window.location.href = http://localhost:8081/course/${courseId}`
- ✅ `window.location.href = /course/${courseId}`

#### **CourseDetail.tsx**
- ❌ `http://localhost:3636/schedule/${courseId}`  
- ✅ `http://localhost:8888/api/schedules/${courseId}`

#### **StudentPortal.tsx**
- ❌ `http://localhost:8080/user/introspect`
- ✅ `http://localhost:8888/api/users/introspect`
- ❌ `http://localhost:3636/schedule/join`
- ✅ `http://localhost:8888/api/schedules/join`

#### **ChooseRole.tsx**
- ❌ `http://localhost:8080/user/users/role`
- ✅ `http://localhost:8888/api/users/role`

## 🚀 **Kết quả:**

### **Before Fix:**
```
Client → UserService:8080 ❌
Client → HomeworkService:8081 ❌ 
Client → ScheduleService:8082 ❌
Client → FileService:5000 ❌
```

### **After Fix:**
```
Client → API Gateway:8888 → Services ✅
```

## 🎯 **Benefits:**

1. **✅ Centralized Authentication** - Tất cả requests đi qua JWT validation
2. **✅ Rate Limiting** - API Gateway có thể control traffic
3. **✅ CORS Handling** - Tập trung ở một nơi
4. **✅ Request Logging** - Monitor tất cả API calls
5. **✅ Load Balancing** - Có thể scale services độc lập
6. **✅ Circuit Breaker** - Fault tolerance

## 📊 **API Routing Summary:**

| Endpoint Pattern | Old Direct Call | New Gateway Route |
|------------------|----------------|-------------------|
| User APIs | `localhost:8080/user/*` | `localhost:8888/api/users/*` |
| Homework APIs | `localhost:8082/api/*` | `localhost:8888/api/homework/*` |
| Schedule APIs | `localhost:3636/schedule/*` | `localhost:8888/api/schedules/*` |
| File APIs | `localhost:5000/api/*` | `localhost:8888/api/files/*` |

## 🔧 **Next Steps:**
1. Test với `docker-compose up` để verify routing
2. Check browser network tab để confirm API calls đi qua Gateway
3. Verify JWT authentication flow hoạt động đúng

---
*All client API calls now properly route through API Gateway! 🎉*