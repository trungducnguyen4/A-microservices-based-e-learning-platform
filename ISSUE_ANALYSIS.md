# ⚠️ PHÁT HIỆN VẤN ĐỀ TRONG FLOW GOOGLE OAUTH

## VẤNS ĐỀ:
User không có role được set trong CustomOAuth2UserService, nhưng **role field có thể có default value trong DB**.

### CustomOAuth2UserService.java:
```java
User user = User.builder()
        .email(email)
        .fullName(fullName)
        .username(email)
        .enabled(true)
        .passwordHash(hashed)
        .build();
// ❌ KHÔNG set role ở đây
```

### User.java Model - CẦN CHECK:
```java
@Entity
@Table(name = "users")
public class User {
    // ...
    @Column(name = "role")
    private String role;  // ← CÓ DEFAULT VALUE NÀO KHÔNG?
    // ...
}
```

### Khả năng 1: role có @Column(columnDefinition = "VARCHAR(50) DEFAULT 'STUDENT'")
```
→ User tạo từ OAuth2 sẽ tự động có role='STUDENT'
→ chooseRole() sẽ gặp lỗi vì role không phải null
→ Dù chúng ta đã fix logic để cho phép update, nhưng flow không giống
```

### Khả năng 2: role = null (như mong muốn)
```
→ chooseRole() hoạt động bình thường
→ Flow Google OAuth giống normal login ✅
```

## CẦN KIỂM TRA:

1. **Xem User.java Model**:
   - role field có @Column columnDefinition nào không?
   - Có @JoinColumn hoặc relationship nào không?
   - Default value trong DB schema là gì?

2. **Xem Liquibase/Flyway migration**:
   - Bảng users được tạo với gì?
   - role column definition là gì?

3. **Xem XAMPP_DATABASE_SETUP.sql**:
   - CREATE TABLE users statement
   - role column definition

## SOLUTION:

Nếu role có default value (e.g., 'STUDENT'):
→ Cần fix CustomOAuth2UserService để **explicitly set role = null**

```java
User user = User.builder()
        .email(email)
        .fullName(fullName)
        .username(email)
        .enabled(true)
        .role(null)  // ← THÊM DÒNG NÀY
        .passwordHash(hashed)
        .build();
```

Nếu role đã là null:
→ Flow là đúng ✅
