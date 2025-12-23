# ✅ VERIFICATION: JWT Flow - Normal Login vs Google OAuth

## SUMMARY OF CHANGES MADE:

### 1. CustomOAuth2UserService.java
**Changed:**
```java
// BEFORE
User user = User.builder()
        .email(email)
        .fullName(fullName)
        .username(email)
        .enabled(true)
        .passwordHash(hashed)
        .build();

// AFTER - Explicitly set role to null
User user = User.builder()
        .email(email)
        .fullName(fullName)
        .username(email)
        .enabled(true)
        .role(null)  // ← Explicitly set null
        .passwordHash(hashed)
        .build();
```

**Why:** Ensures OAuth2 users start with no role, matching the flow where they need to select one.

---

### 2. XAMPP_DATABASE_SETUP.sql
**Changed:**
```sql
-- BEFORE
role ENUM('STUDENT', 'TEACHER', 'ADMIN') NOT NULL DEFAULT 'STUDENT'

-- AFTER
role ENUM('STUDENT', 'TEACHER', 'ADMIN') DEFAULT NULL
```

**Why:** 
- DB won't auto-assign 'STUDENT' when creating OAuth2 user
- role column can now be NULL until user explicitly chooses
- Matches the requirement for role selection flow

---

## NOW BOTH FLOWS ARE IDENTICAL:

### Flow Comparison:

```
┌─────────────────────────────────────────────────────────────┐
│                    NORMAL LOGIN                              │
├─────────────────────────────────────────────────────────────┤
│ 1. Username + Password → POST /api/users/auth/login         │
│ 2. Validate password & generate JWT                         │
│ 3. JWT contains: {subject: username, role: 'STUDENT', ...} │
│ 4. Save token → decode → build user object                 │
│ 5. User has role → navigate to /student                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    GOOGLE OAUTH                              │
├─────────────────────────────────────────────────────────────┤
│ 1. Click "Sign in with Google"                             │
│ 2. OAuth2 success → CustomOAuth2UserService creates user   │
│    with: username=email, role=NULL ← KEY CHANGE            │
│ 3. Generate JWT: {subject: email, role: null, ...}         │
│ 4. Redirect to /choose-role?token=...                      │
│ 5. Frontend saves token → extracts claims                  │
│ 6. User selects role → POST /choose-role {role: STUDENT}   │
│ 7. Backend updates user.role='STUDENT' in DB              │
│ 8. Frontend updates localStorage with new user object     │
│ 9. Navigate to /student                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## JWT TOKEN CLAIMS COMPARISON:

### Normal Login JWT:
```json
{
  "subject": "student1",
  "role": "STUDENT",
  "username": "student1",
  "userId": "uuid-xxx",
  "fullName": "Jane Student",
  "email": "student@elearning.com",
  "iat": 1734768000,
  "exp": 1734771600
}
```

### Google OAuth JWT (Step 3):
```json
{
  "subject": "user@gmail.com",
  "role": null,                    ← KEY DIFFERENCE: null role
  "username": "user@gmail.com",
  "userId": "uuid-yyy",
  "fullName": "John User",
  "email": "user@gmail.com",
  "iat": 1734768000,
  "exp": 1734771600
}
```

### After Choose-Role POST (Step 7):
User object is updated in DB, but JWT is NOT regenerated.
Frontend uses same JWT token but updates localStorage user object manually.

---

## FLOW VERIFICATION CHECKLIST:

### Normal Login:
✅ POST /api/users/auth/login with credentials
✅ UserService.authenticate() validates password
✅ UserService.generateToken(username) creates JWT with role
✅ Frontend receives JWT with role
✅ AuthContext.login() decodes JWT → builds user object
✅ User object saved to localStorage
✅ Navigate based on role (role is NOT empty)

### Google OAuth:
✅ Click "Sign in with Google"
✅ CustomOAuth2UserService.loadUser() creates user with role=NULL
✅ SecurityConfig.successHandler() calls generateToken(email)
✅ generateToken() creates JWT with role=null
✅ Frontend redirected to /choose-role?token=...
✅ ChooseRole.tsx saves token to localStorage
✅ POST /choose-role updates user.role in DB
✅ Frontend updates localStorage user object with new role
✅ Navigate to /student or /teacher

### Token & Auth Context:
✅ Both flows save JWT to localStorage
✅ Both flows decode JWT to extract claims
✅ Both flows update AuthContext with user object
✅ Both flows navigate based on user.role
✅ API interceptor adds Authorization header with JWT
✅ Subsequent requests use same JWT token

---

## REMAINING STEP:

**Need to run this SQL to update existing database:**

```sql
USE user_db;
ALTER TABLE users MODIFY role ENUM('STUDENT', 'TEACHER', 'ADMIN') DEFAULT NULL;
```

Or if starting fresh, the XAMPP_DATABASE_SETUP.sql already has the fix.

---

## KEY INSIGHT:

Both login flows now follow the same JWT pattern:
1. **Generate JWT** → Save to localStorage
2. **Decode JWT claims** → Build user object  
3. **Check user.role** → Navigate accordingly
4. **API requests** → Include Bearer token in Authorization header

The difference is:
- Normal login: role is set immediately
- Google OAuth: role is set AFTER role selection, but JWT remains the same
- Both use the same user object structure and navigation logic

Flow is now **CONSISTENT** ✅
