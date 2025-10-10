# JWT Authentication Centralization Summary

## Kiến trúc xác thực mới (New Authentication Architecture)

### Trước đây (Before)
- Mỗi service tự handle JWT authentication
- Duplicate Spring Security configuration trong tất cả services
- JWT parsing và validation ở nhiều nơi
- Code phức tạp và khó maintain

### Bây giờ (Now)
- **API Gateway** là điểm duy nhất handle JWT authentication
- Các service chỉ cần đọc user context từ headers
- Clean architecture, dễ maintain
- Centralized security policies

## Luồng xác thực mới (New Authentication Flow)

```
Client Request with JWT
       ↓
  API Gateway (port 8888)
  ├── Validate JWT token
  ├── Extract user info (id, username, role)
  ├── Add headers: X-User-Id, X-User-Role, X-User-Username
  └── Forward to service
       ↓
  Individual Service
  └── Read user context from headers (AuthContextUtil)
```

## Những thay đổi đã thực hiện (Changes Made)

### 1. Removed Security Dependencies
Đã loại bỏ các dependencies không cần thiết từ:
- **HomeworkService**: `spring-boot-starter-security`, `nimbus-jose-jwt`
- **UserService**: `spring-boot-starter-oauth2-client`, `spring-boot-starter-oauth2-resource-server`, `spring-boot-starter-security`
- **ScheduleService**: `spring-boot-starter-security`

### 2. Added AuthContextUtil
Tạo utility class trong mỗi service để đọc user context:
```java
@Component
public class AuthContextUtil {
    public Long getCurrentUserId()     // From X-User-Id header
    public String getCurrentUserRole() // From X-User-Role header  
    public String getCurrentUsername() // From X-User-Username header
    
    public boolean isTeacher()
    public boolean isStudent()
    public boolean isAdmin()
}
```

### 3. Updated Controllers
Example trong HomeworkController:
```java
@PostMapping
public ApiResponse<HomeworkResponse> createHomework(@RequestBody @Valid HomeworkCreationRequest request) {
    // Get user context from API Gateway headers
    Long currentUserId = authContextUtil.getCurrentUserId();
    
    // Check permissions
    if (!authContextUtil.isTeacher()) {
        return ApiResponse.<HomeworkResponse>builder()
            .code(HttpStatus.FORBIDDEN.value())
            .message("Only teachers can create homework assignments")
            .build();
    }
    
    // Continue with business logic...
}
```

## Headers được API Gateway thêm vào (Headers added by API Gateway)

| Header | Description | Example |
|--------|-------------|---------|
| `X-User-Id` | User ID from JWT | `123` |
| `X-User-Role` | User role from JWT | `TEACHER` |
| `X-User-Username` | Username from JWT | `john.doe` |

## Lợi ích (Benefits)

### 🔒 Security
- Centralized JWT validation
- Consistent security policies
- Reduced attack surface

### 🧹 Clean Code
- No duplicate security configurations
- Simpler service code
- Single source of truth for authentication

### 🚀 Performance
- JWT parsed only once at gateway
- Services just read headers (faster)
- Reduced memory usage

### 🛠 Maintainability
- Easy to update JWT logic
- Consistent authentication across services
- Better separation of concerns

## Cách sử dụng trong Controllers (How to use in Controllers)

```java
@RestController
@RequiredArgsConstructor
public class YourController {
    
    private final AuthContextUtil authContextUtil;
    
    @PostMapping("/create")
    public ResponseEntity<?> create(@RequestBody CreateRequest request) {
        // Get current user info
        Long userId = authContextUtil.getCurrentUserId();
        String role = authContextUtil.getCurrentUserRole();
        
        // Check permissions
        if (!authContextUtil.isTeacher()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("Access denied");
        }
        
        // Your business logic here...
        return ResponseEntity.ok().build();
    }
}
```

## Testing

Khi test API endpoints:
1. **Qua API Gateway** (Recommended): `http://localhost:8888/api/homework`
2. Headers sẽ được API Gateway tự động thêm vào
3. Services sẽ nhận được user context một cách trong suốt

## Security Notes

⚠️ **Important**: 
- Các services không còn validate JWT nữa
- Services tin tưởng headers từ API Gateway
- Đảm bảo network security giữa Gateway và Services
- Trong production, sử dụng private network cho internal communication

## Next Steps

1. **Remove old security configurations** từ các services khác (nếu còn)
2. **Update all controllers** để sử dụng AuthContextUtil
3. **Add integration tests** cho authentication flow
4. **Review security policies** tại API Gateway level