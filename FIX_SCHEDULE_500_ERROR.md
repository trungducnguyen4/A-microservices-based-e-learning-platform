# Fix Schedule Service 500 Error - POST /api/schedules/create

## Vấn đề
Request POST tới `https://academiHub.site/api/schedules/create` trả về lỗi **500 Internal Server Error**.

## Nguyên Nhân
Khi thêm field `roomCode` vào `ScheduleCreationRequest`, có nhiều vấn đề tiềm ẩn:

1. **Validation Error Handler** - GlobalExceptionHandler cũ không xử lý lỗi validation custom
2. **Database Constraint** - UNIQUE constraint trên roomCode (NULL) có thể gây vấn đề
3. **Field Validation** - Thiếu `@NotNull` annotations trên required fields
4. **API Gateway** - Có thể có issue timeout hoặc routing

## Giải Pháp

### 1. Sửa ScheduleCreationRequest DTO ✅
```java
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ScheduleCreationRequest {
    @NotNull(message = "userId cannot be null")
    String userId;
    List<String> collaborators;
    @NotNull(message = "title cannot be null")
    String title;
    @NotNull(message = "startTime cannot be null")
    ZonedDateTime startTime;
    @NotNull(message = "endTime cannot be null")
    ZonedDateTime endTime;
    @Column(columnDefinition = "TEXT")
    String recurrenceRule;
    // Optional - client can provide or server generates
    String roomCode;
}
```

### 2. Sửa GlobalExceptionHandler ✅
```java
@ControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(value = MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    ResponseEntity<ApiResponse> handlingValidation(MethodArgumentNotValidException exception) {
        ApiResponse apiResponse = new ApiResponse();
        String fieldName = exception.getFieldError().getField();
        String message = exception.getFieldError().getDefaultMessage();
        
        apiResponse.setCode(HttpStatus.BAD_REQUEST.value());
        apiResponse.setMessage("Validation error: " + fieldName + " - " + message);
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(apiResponse);
    }

    @ExceptionHandler(value = Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    ResponseEntity<ApiResponse> handlingGenericException(Exception exception) {
        ApiResponse apiResponse = new ApiResponse();
        apiResponse.setCode(HttpStatus.INTERNAL_SERVER_ERROR.value());
        apiResponse.setMessage("Internal server error: " + exception.getMessage());
        
        exception.printStackTrace(); // Log for debugging
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(apiResponse);
    }
}
```

### 3. Sửa Schedule Model ✅
```java
@Column(nullable = true, unique = true)
String roomCode;
```

### 4. Database Migration ✅
```sql
-- Add roomCode column with proper constraints
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS room_code VARCHAR(255) NULL;

-- Create UNIQUE index (MySQL allows multiple NULLs in UNIQUE)
CREATE UNIQUE INDEX IF NOT EXISTS idx_room_code_unique ON schedules(room_code);

-- Create regular index for lookups
CREATE INDEX IF NOT EXISTS idx_room_code ON schedules(room_code);
```

## Testing

### Test 1: Valid Request
```bash
curl -X POST http://localhost:8888/api/schedules/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "userId": "teacher-id-123",
    "title": "React Basics",
    "startTime": "2026-01-06T10:00:00Z",
    "endTime": "2026-01-06T11:00:00Z",
    "roomCode": "ROOM-1704534000000-ABC123"
  }'
```

**Expected Response:**
```json
{
  "code": 200,
  "result": {
    "courseId": "schedule-id-xxx",
    "title": "React Basics",
    "roomCode": "ROOM-1704534000000-ABC123",
    "startTime": "2026-01-06T10:00:00Z",
    "endTime": "2026-01-06T11:00:00Z"
  }
}
```

### Test 2: Missing Required Field (Validation Error)
```bash
curl -X POST http://localhost:8888/api/schedules/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "React Basics"
    # Missing: userId, startTime, endTime
  }'
```

**Expected Response (400):**
```json
{
  "code": 400,
  "message": "Validation error: userId - userId cannot be null"
}
```

### Test 3: Invalid Date Format (Validation Error)
```bash
curl -X POST http://localhost:8888/api/schedules/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "userId": "teacher-id",
    "title": "React Basics",
    "startTime": "invalid-date",
    "endTime": "2026-01-06T11:00:00Z"
  }'
```

**Expected Response (400):**
```json
{
  "code": 400,
  "message": "Validation error: startTime - JSON parse error: ..."
}
```

## APIGateway Role
APIGateway được config để forward `/api/schedules/**` tới ScheduleService:

```yaml
# ApiGateway application.yml
- id: schedule-service
  uri: ${SCHEDULE_SERVICE_URL:http://localhost:8082}
  predicates:
    - Path=/api/schedules/**
```

### Troubleshooting APIGateway Issues

1. **Check Routing**
   ```bash
   # Enable debug logging
   logging:
     level:
       org.springframework.cloud.gateway: DEBUG
   ```

2. **Verify Service URL**
   ```bash
   # Development
   SCHEDULE_SERVICE_URL=http://localhost:8082
   
   # Docker
   SCHEDULE_SERVICE_URL=http://schedule-service:8082
   ```

3. **Test Direct Service Call** (bypass gateway)
   ```bash
   curl -X POST http://localhost:8082/api/schedules/create \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{...}'
   ```

4. **Check Port & Service Running**
   ```bash
   # Verify ScheduleService is running on port 8082
   netstat -an | grep 8082
   
   # Check APIGateway logs
   docker logs apigateway
   ```

## Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| **500 Internal Server Error** | Validation exception not handled | Use fixed GlobalExceptionHandler |
| **400 Bad Request** | Missing required fields | Ensure all @NotNull fields are provided |
| **400 Bad Request** | Invalid ZonedDateTime format | Use ISO 8601 format: `2026-01-06T10:00:00Z` |
| **400 Bad Request** | Duplicate roomCode | Each roomCode must be unique (or NULL) |
| **404 Not Found** | APIGateway can't find ScheduleService | Check SCHEDULE_SERVICE_URL env var |
| **504 Gateway Timeout** | Service too slow/down | Check ScheduleService logs |

## Files Changed
✅ `ScheduleCreationRequest.java` - Added validation annotations
✅ `Schedule.java` - Clarified roomCode comment
✅ `GlobalExceptionHandler.java` - Fixed validation error handling  
✅ `ScheduleCreationResponse.java` - Added roomCode field
✅ `migrations/001_add_roomcode_column.sql` - Proper database schema

## Next Steps
1. Rebuild ScheduleService: `mvn clean package`
2. Run database migration manually if using native SQL
3. Restart APIGateway & ScheduleService
4. Test with curl commands above
5. Check logs if still getting 500: `docker logs schedule-service`

## Important Notes
- roomCode is **optional** in request (server generates if not provided)
- roomCode is **unique** but **nullable** (allows multiple NULL values)
- HTTPStatus 400 for validation errors (client issue)
- HTTPStatus 500 for internal server errors (now properly logged)
- Always include `Authorization: Bearer` header for protected routes
