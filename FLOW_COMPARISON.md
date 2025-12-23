# So Sánh JWT Flow: Đăng Nhập Bình Thường vs Google OAuth

## 1. ĐĂNG NHẬP BÌNH THƯỜNG (Username/Password)

### Frontend Flow:
```
1. User enters username & password → Login.tsx
2. Calls: POST /api/users/auth/login {username, password}
3. Backend returns: {result: {token: "eyJhbGci..."}}
4. Frontend saves token to localStorage: localStorage.setItem('token', token)
5. Frontend decodes JWT to extract: userId, email, fullName, role
6. Frontend builds User object and saves to localStorage
7. If role is empty → navigate to '/choose-role'
   Else → navigate to role-specific page (/student, /teacher, /admin)
```

### Backend Flow:
```
1. POST /api/users/auth/login receives {username, password}
2. UserService.authenticate() validates password
3. Calls: userService.generateToken(user.getUsername())
4. generateToken() creates JWT with claims:
   - subject: username
   - role: user.getRole()
   - userId: user.getId()
   - fullName: user.getFullName()
   - email: user.getEmail()
5. Returns JWT token in response
```

### Key Point:
- User already has a role in DB from registration
- JWT contains role from the start
- No role selection needed

---

## 2. GOOGLE OAUTH2 (Đăng Nhập Bằng Google)

### Frontend Flow:
```
1. User clicks "Sign in with Google" → Login.tsx
2. Window redirects to: window.location.href = "/oauth2/authorization/google"
3. This goes to API Gateway/UserService OAuth2 endpoint
4. Browser redirects to Google consent screen
5. User grants permission → redirects back to:
   /login/oauth2/code/google?code=... (UserService handles this)
6. Backend validates code, creates/updates user, generates JWT
7. Backend redirects to: /choose-role?token=eyJhbGci...
8. ChooseRole.tsx:
   - Extracts token from URL: searchParams.get('token')
   - Saves to localStorage: localStorage.setItem('token', token)
   - Shows role selection UI
   - User selects role (STUDENT/TEACHER)
   - Calls: POST /api/users/choose-role {role: "STUDENT"}
   - Backend updates user.role in DB
   - Frontend updates localStorage with new user data
   - Navigates to /student or /teacher
```

### Backend Flow (SecurityConfig):
```
1. GET /oauth2/authorization/google
   - Triggered by Spring Security oauth2Login
   - Redirects to Google
   
2. GET /login/oauth2/code/google?code=...
   - Spring Security intercepts
   - Calls CustomOAuth2UserService to load user profile
   - CustomOAuth2UserService.loadUser():
     * Gets email from OAuth2 principal
     * Loads or creates User in DB
     * Role is NOT set (null) so user can choose later
   
3. SuccessHandler (AuthenticationSuccessHandler):
   - Gets email from OAuth2User
   - Calls: userService.generateToken(email)
   - generateToken():
     * Finds user by email
     * If not found, creates new user with role=null
     * Creates JWT with claims:
       - subject: username
       - role: null (or empty)
       - userId: user.getId()
       - fullName: user.getFullName()
       - email: user.getEmail()
   - Redirects to: /choose-role?token=eyJhbGci...
```

### Backend Flow (chooseRole endpoint):
```
1. POST /api/users/choose-role {role: "STUDENT"}
2. JWT is passed in Authorization header: Bearer eyJhbGci...
3. UserService.chooseRole():
   - Parses JWT token
   - Extracts username from token.subject
   - Loads user from DB
   - Validates role is one of: STUDENT, TEACHER, ADMIN
   - Updates user.role = "STUDENT"
   - Saves to DB
   - Returns UserResponse with updated user data
4. Frontend:
   - Receives updated user data
   - Updates localStorage with user data including role
   - Updates AuthContext via updateUser()
   - Navigates to /student
```

---

## 3. ĐIỂM KHÁC BIỆT CHI TIẾT

| Bước | Đăng Nhập Thường | Google OAuth |
|------|------------------|--------------|
| **JWT tạo lần 1** | Sau khi validate password | Sau khi OAuth code được validate |
| **JWT chứa role lần 1** | ✅ Có role (user có role từ lúc register) | ❌ Không có role (role=null) |
| **Sau khi tạo JWT** | Redirect theo role | Redirect đến /choose-role |
| **Step tiếp theo** | Vào dashboard/student/teacher | Chọn role rồi gọi chooseRole endpoint |
| **JWT tạo lần 2** | Không có | Không có (JWT cũ vẫn được dùng) |
| **Token update** | Một lần duy nhất sau login | Một lần duy nhất sau role selection |

---

## 4. VẤNS ĐỀ CỤ THỂ CẦN KIỂM TRA

### ✅ ĐÚNG:
- JWT token từ OAuth2 được lưu vào localStorage
- Frontend decode JWT được
- Frontend call POST /choose-role với Authorization header chứa JWT
- Backend nhận JWT, parse, update role
- Frontend update localStorage + AuthContext

### ⚠️ CẦN KIỂM TRA:

**1. Claims trong JWT từ OAuth2:**
```java
// SecurityConfig.java successHandler()
String username = email != null ? email.toString() : authentication.getName();
String token = userService.generateToken(username);
```
- Gọi generateToken(email) → tìm user by email
- JWT được tạo với username=email
- Nhưng JWT subject là username, role là null

**2. Trong chooseRole():**
```java
String username = signedJWT.getJWTClaimsSet().getSubject();
// username = email (vì OAuth2 gọi generateToken(email))
User user = userRepository.findByUsername(username)
// Tìm user by username=email
```
- ✅ Nếu email được save as username trong DB → OK
- ❌ Nếu không → USER_NOT_FOUND error

**3. CustomOAuth2UserService - kiểm tra tạo user:**
```java
// Cần đảm bảo user được tạo với:
// - username = email
// - email = email
// - role = null
```

---

## 5. KẾT LUẬN

**Flow JWT giữa đăng nhập thường và Google OAuth:**
- ✅ CẢ HAI đều save token vào localStorage
- ✅ CẢ HAI đều decode JWT từ token
- ✅ CẢ HAI đều build user object từ JWT claims
- ✅ CẢ HAI đều navigate theo role

**Khác biệt chính:**
1. **Normal login**: role có ngay từ JWT đầu tiên
2. **Google OAuth**: role được set sau step 2 (POST /choose-role)

**Cần verify:**
- CustomOAuth2UserService tạo user với `username = email`
- generateToken(email) tìm thấy user (vì username=email)
- chooseRole() tìm thấy user từ JWT subject (vì subject=username=email)
